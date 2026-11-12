"""Rutas de la API de sismos: las rutas nuevas van ANTES del router."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    EstadisticasView,
    EstadoView,
    IngestaView,
    LlaveView,
    SismoViewSet,
)

router = DefaultRouter()
router.register('sismos', SismoViewSet, basename='sismo')

urlpatterns = [
    path('estado/', EstadoView.as_view(), name='estado-sismos'),
    # La ruta de la llave va antes del router, como en el taller (RETO 16).
    path('auth/login/', LlaveView.as_view(), name='llave-de-acceso'),
    path('sismos/estadisticas/', EstadisticasView.as_view(), name='estadisticas-sismos'),
    path('sismos/ingesta/', IngestaView.as_view(), name='ingesta-sismos'),

    *router.urls,
]
