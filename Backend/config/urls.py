"""Rutas raíz: monta la API de sismos, el admin y el panel compilado."""

from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('sismos.urls')),
    # El panel React compilado: la raiz sirve el index.html del build
    # (con whitenoise los assets salen del mismo servidor).
    path('', TemplateView.as_view(template_name='index.html'), name='panel'),
]
