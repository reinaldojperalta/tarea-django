"""Rutas raíz: monta la API de sismos y el admin."""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('sismos.urls')),
]
