"""Registro del modelo en el Admin con columnas, buscador y filtros."""

from django.contrib import admin

from .models import Sismo


@admin.register(Sismo)
class SismoAdmin(admin.ModelAdmin):
    list_display = (
        'id_evento',
        'magnitud',
        'profundidad_km',
        'zona',
        'lugar',
        'fecha',
    )
    search_fields = ('id_evento', 'lugar', 'zona')
    list_filter = ('zona', 'tipo', 'fecha')
    ordering = ('-fecha',)
