"""Modelo del dominio: sismos reales del Servicio Geológico de EE. UU."""

from django.db import models


class Sismo(models.Model):
    """Un evento sísmico real reportado por USGS."""

    id_evento = models.CharField(max_length=40, unique=True)
    magnitud = models.DecimalField(max_digits=4, decimal_places=1)
    profundidad_km = models.DecimalField(max_digits=7, decimal_places=2)
    lugar = models.CharField(max_length=200)
    zona = models.CharField(max_length=80)
    latitud = models.FloatField()
    longitud = models.FloatField()
    fecha = models.DateTimeField()
    tipo = models.CharField(max_length=30, default='earthquake')

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'sismo'
        verbose_name_plural = 'sismos'

    def __str__(self):
        return f'M{self.magnitud} · {self.zona} · {self.fecha:%Y-%m-%d}'
