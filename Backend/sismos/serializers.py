"""Serializador del modelo Sismo para la API."""

from rest_framework import serializers

from .models import Sismo


class SismoSerializer(serializers.ModelSerializer):
    """Expone un sismo completo: sus campos y nada más."""

    class Meta:
        model = Sismo
        fields = [
            'id',
            'id_evento',
            'magnitud',
            'profundidad_km',
            'lugar',
            'zona',
            'latitud',
            'longitud',
            'fecha',
            'tipo',
        ]
        read_only_fields = ['id']
