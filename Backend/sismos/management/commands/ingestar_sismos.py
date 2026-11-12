# -*- coding: utf-8 -*-
"""Comando: python manage.py ingestar_sismos [dias_atras]

Descarga los sismos reales de USGS de los últimos N días (180 por
defecto) y los guarda con bulk_create; los duplicados se descartan.
"""

from django.core.management.base import BaseCommand

from sismos.fuente_usgs import consultar_sismos, fila_a_sismo
from sismos.models import Sismo


class Command(BaseCommand):
    help = 'Ingiere sismos reales de USGS (limpieza incluida, sin duplicados).'

    def add_arguments(self, parser):
        parser.add_argument(
            'dias_atras',
            nargs='?',
            type=int,
            default=180,
            help='Ventana de días hacia atrás a consultar (default: 180).',
        )

    def handle(self, *args, **options):
        dias_atras = options['dias_atras']

        self.stdout.write(f'Consultando USGS (ultimos {dias_atras} dias)...')
        filas = consultar_sismos(dias_atras)
        self.stdout.write(f'Recibidos {len(filas)} eventos de la API.')

        validos = [sismo for sismo in map(fila_a_sismo, filas) if sismo is not None]
        descartados = len(filas) - len(validos)
        self.stdout.write(f'Validos tras la limpieza: {len(validos)} ({descartados} descartados).')

        total_antes = Sismo.objects.count()
        Sismo.objects.bulk_create(validos, batch_size=2000, ignore_conflicts=True)
        nuevos = Sismo.objects.count() - total_antes
        self.stdout.write(self.style.SUCCESS(
            f'Guardados {nuevos} sismos nuevos ({len(validos) - nuevos} ya existian).'
        ))
