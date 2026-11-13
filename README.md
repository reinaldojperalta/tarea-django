# Proyecto final — Sismos mundiales (USGS)

> **Autoría:** Reinaldo Peralta · Proyecto final del taller Django + React
> · Dominio escogido: sismología (datos públicos del Servicio Geológico de
> EE. UU., sin API key).

Aplicación web full-stack para el cierre del taller Django + React: ingiere
decenas de miles de sismos **reales** de la API pública del Servicio Geológico
de EE. UU., los almacena en PostgreSQL y los expone con una API REST completa
más un panel de análisis en React.

## Estructura

```
proyecto-final/
├── Backend/          Django + Django REST Framework (app: sismos)
│   ├── config/       settings, urls raíz
│   └── sismos/       modelo, admin, fuente_usgs, vistas, urls, ingesta
└── Frontend/         Vite + React (listado, tablero, llave)
```

## Cómo correr

### Backend

```powershell
.venv\Scripts\activate
cd Backend
python manage.py migrate
python manage.py ingestar_sismos 180   # descarga ~48.000 sismos reales
python manage.py runserver 127.0.0.1:8000
```

Superusuario local: `admin / admin123` (creado con `createsuperuser`).

### Frontend

```powershell
cd Frontend
npm install
npm run dev    # http://localhost:5173
```

## API (http://127.0.0.1:8000/api/)

| Ruta | Qué hace |
|---|---|
| `GET /sismos/` | Listado paginado (50 por página, `?page_size=`), con `?search=`, `?ordering=`, `?zona=`, `?magnitud_min/max=`, `?profundidad_min/max=`, `?fecha_desde/hasta=` |
| `GET/POST/PATCH/DELETE /sismos/{id}/` | CRUD completo |
| `GET /sismos/estadisticas/` | `aggregate` global + `annotate` por zona y por mes; **recalcula con los filtros** |
| `POST /auth/login/` | Devuelve `{"token","usuario"}` o 401 con credenciales malas |
| `POST /sismos/ingesta/` | Protegida con `IsAuthenticated`: sin llave → 401; con `Authorization: Token …` ingiere USGS sin duplicados |
| `GET /estado/` | Diagnóstico público |

## Puntos clave del enunciado

- **Datos reales, sin duplicados**: `fuente_usgs.py` limpia cada fila (rango de
  magnitud, profundidad, coordenadas, campos obligatorios) y guarda con
  `bulk_create(..., ignore_conflicts=True)` sobre `id_evento` único. USGS corta
  a 20.000 eventos por consulta, así que la ventana se trocea en bloques de
  30 días.
- **Análisis en el motor de BD**: las estadísticas usan `aggregate` (métricas
  globales) y `annotate` (agrupado por zona y por mes) y aplican los mismos
  filtros del listado.
- **Seguridad**: token del taller (RETO 16 "La Llave") — login que entrega la
  llave y operación protegida (ingesta) que la exige.

## Funcionalidad propia: mapa mundial interactivo 🌍

Además de todo lo pedido en el enunciado, el proyecto integra **un mapa
mundial interactivo** (panel `Frontend/src/features/mapa/MapaMundial.jsx`,
hecho con `react-leaflet` + tiles de OpenStreetMap):

- Cada sismo se dibuja en el mapa según sus campos `latitud` y `longitud`
  (dos columnas del modelo que el resto del panel no explotaba).
- El **color y el tamaño de la burbuja** codifican la magnitud:
  verde < 3, amarillo ≥ 3, naranja ≥ 5, rojo ≥ 6.
- **Popup** al hacer clic con magnitud, profundidad, lugar, fecha e
  `id_evento` del evento.
- Respeta los **filtros compartidos** (zona y magnitud mínima): al filtrar,
  el mapa trae los últimos 500 sismos del conjunto filtrado a
  `/api/sismos/?page_size=500&...` y se redibuja.
- Zoom y desplazamiento libres; el mapa repite el mundo al arrastrarlo
  (`worldCopyJump`) para seguir eventos cerca del antimeridiano.

## Despliegue

Pendiente: Render (gunicorn + whitenoise, `DATABASE_URL`/`SECRET_KEY` como
variables de entorno, `DEBUG=False`).
