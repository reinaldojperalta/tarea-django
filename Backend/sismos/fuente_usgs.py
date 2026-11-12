"""Fuente pública: API del Servicio Geológico de EE. UU. (USGS).

Este módulo pide sismos reales a la API FDSN de USGS y convierte cada
evento en un objeto Sismo listo para bulk_create. La limpieza vive aquí:
sin magnitud, sin lugar o con números imposibles la fila se descarta.
"""

import json
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .models import Sismo

URL_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query'

# Rango de magnitud razonable para el análisis (USGS reporta desde -1.0).
MAGNITUD_MINIMA = Decimal('1.0')


def consultar_sismos(dias_atras=180):
    """Pide los sismos de los últimos `dias_atras` días en bloques.

    USGS rechaza con HTTP 400 cualquier consulta que supere los 20.000
    eventos, así que la ventana se trocea en bloques de 30 días
    (~8.000 eventos cada uno) y se unen los resultados.
    """
    hasta = datetime.now(timezone.utc)
    filas = []

    bloque_inicio = hasta - timedelta(days=dias_atras)
    while bloque_inicio < hasta:
        bloque_fin = min(bloque_inicio + timedelta(days=30), hasta)
        parametros = {
            'format': 'geojson',
            'starttime': bloque_inicio.strftime('%Y-%m-%d'),
            'endtime': bloque_fin.strftime('%Y-%m-%d'),
            'minmagnitude': str(MAGNITUD_MINIMA),
            'orderby': 'time',
        }
        direccion = f'{URL_API}?{urlencode(parametros)}'
        encabezados = {
            'Accept': 'application/json',
            'User-Agent': 'proyecto-final-sismos/1.0',
        }

        token = os.getenv('USGS_USER_AGENT_EXTRA')
        if token:
            encabezados['X-Extra'] = token

        solicitud = Request(direccion, headers=encabezados)
        with urlopen(solicitud, timeout=120) as respuesta:
            paquete = json.loads(respuesta.read().decode('utf-8'))

        bloque = paquete.get('features', [])
        if not isinstance(bloque, list):
            raise ValueError('La API de USGS no devolvió una lista de eventos.')
        filas.extend(bloque)

        bloque_inicio = bloque_fin

    return filas


def fila_a_sismo(fila):
    """Convierte un evento GeoJSON en Sismo; None si la fila es inválida."""
    propiedades = fila.get('properties') or {}
    geometria = fila.get('geometry') or {}
    coordenadas = geometria.get('coordinates') or []

    id_evento = str(fila.get('id') or '').strip()
    if not id_evento or len(id_evento) > 40:
        return None

    magnitud = propiedades.get('mag')
    if magnitud is None:
        return None
    try:
        magnitud = Decimal(str(magnitud)).quantize(Decimal('0.1'))
    except (InvalidOperation, TypeError, ValueError):
        return None
    if not (Decimal('-2.0') <= magnitud <= Decimal('10.5')):
        return None

    lugar = str(propiedades.get('place') or '').strip()
    if not lugar:
        return None

    if len(coordenadas) < 3:
        return None
    try:
        longitud, latitud, profundidad = (
            float(coordenadas[0]),
            float(coordenadas[1]),
            float(coordenadas[2]),
        )
    except (TypeError, ValueError):
        return None
    if not (-90 <= latitud <= 90) or not (-180 <= longitud <= 180):
        return None
    if profundidad < -50 or profundidad > 800:
        return None

    marca_ms = propiedades.get('time')
    if marca_ms is None:
        return None
    try:
        fecha = datetime.fromtimestamp(marca_ms / 1000, tz=timezone.utc)
    except (ValueError, OverflowError, OSError):
        return None

    # La zona es la última parte del lugar: "20 km SE of Honaunau, Hawaii" -> Hawaii
    partes = [parte.strip() for parte in lugar.split(',')]
    zona = partes[-1][:80] if len(partes) > 1 else lugar[:80]

    return Sismo(
        id_evento=id_evento,
        magnitud=magnitud,
        profundidad_km=Decimal(str(profundidad)).quantize(Decimal('0.01')),
        lugar=lugar[:200],
        zona=zona,
        latitud=latitud,
        longitud=longitud,
        fecha=fecha,
        tipo=str(propiedades.get('type') or 'earthquake')[:30],
    )
