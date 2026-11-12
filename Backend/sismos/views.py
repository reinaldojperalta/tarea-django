"""Vistas de la API de sismos: CRUD, búsqueda, estadísticas, login e ingesta."""

from datetime import datetime, timezone

from django.contrib.auth import authenticate
from django.db.models import Avg, Count, Max, Min
from django.db.models.functions import TruncMonth
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .fuente_usgs import consultar_sismos, fila_a_sismo
from .models import Sismo
from .serializers import SismoSerializer


def queryset_filtrado(params):
    """Aplica los filtros de la petición al listado de sismos.

    La misma función alimenta el listado y las estadísticas, así que
    cualquier filtro del usuario recalcula también el análisis (los dos
    usan la base de datos, nunca Python).
    """
    sismos = Sismo.objects.all()

    zona = params.get('zona')
    if zona:
        sismos = sismos.filter(zona__iexact=zona)

    magnitud_min = params.get('magnitud_min')
    if magnitud_min:
        sismos = sismos.filter(magnitud__gte=magnitud_min)

    magnitud_max = params.get('magnitud_max')
    if magnitud_max:
        sismos = sismos.filter(magnitud__lte=magnitud_max)

    profundidad_min = params.get('profundidad_min')
    if profundidad_min:
        sismos = sismos.filter(profundidad_km__gte=profundidad_min)

    profundidad_max = params.get('profundidad_max')
    if profundidad_max:
        sismos = sismos.filter(profundidad_km__lte=profundidad_max)

    fecha_desde = params.get('fecha_desde')
    if fecha_desde:
        sismos = sismos.filter(fecha__gte=fecha_desde)

    fecha_hasta = params.get('fecha_hasta')
    if fecha_hasta:
        sismos = sismos.filter(fecha__lte=fecha_hasta)

    return sismos


class SismoViewSet(viewsets.ModelViewSet):
    """ViewSet de sismos: lista, detalle, crear, editar y borrar."""

    serializer_class = SismoSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['id_evento', 'lugar', 'zona']
    ordering_fields = ['magnitud', 'profundidad_km', 'fecha']
    ordering = ['-fecha']

    def get_queryset(self):
        """Listado con filtros: ?zona=, ?magnitud_min=, rangos y fechas."""
        return queryset_filtrado(self.request.query_params)


class EstadisticasView(APIView):
    """GET /api/sismos/estadisticas/ — análisis con aggregate y annotate.

    Recalcula todo con los mismos filtros del listado (?zona=, rangos
    de magnitud/profundidad, fechas), directo en el motor de base de
    datos: métricas globales, agrupado por zona y agrupado por mes.
    """

    def get(self, request):
        sismos = queryset_filtrado(request.query_params)

        # aggregate: una sola fila de métricas sobre TODO el conjunto.
        globales = sismos.aggregate(
            total=Count('id'),
            magnitud_promedio=Avg('magnitud'),
            magnitud_maxima=Max('magnitud'),
            magnitud_minima=Min('magnitud'),
            profundidad_promedio=Avg('profundidad_km'),
        )

        # annotate por zona: cada zona del filtro con sus propias métricas.
        por_zona = list(
            sismos.values('zona')
            .annotate(
                total=Count('id'),
                magnitud_promedio=Avg('magnitud'),
                magnitud_maxima=Max('magnitud'),
            )
            .order_by('-total')[:15]
        )

        # annotate por mes: la segunda dimensión del análisis.
        por_mes = list(
            sismos.annotate(mes=TruncMonth('fecha'))
            .values('mes')
            .annotate(
                total=Count('id'),
                magnitud_promedio=Avg('magnitud'),
                magnitud_maxima=Max('magnitud'),
            )
            .order_by('mes')
        )

        # Los Decimal de Avg se convierten a float para el JSON.
        return Response({
            'filtros': {clave: valor for clave, valor in request.query_params.items()},
            'globales': {k: float(v) if v is not None else None for k, v in globales.items()},
            'por_zona': [
                {
                    'zona': fila['zona'],
                    'total': fila['total'],
                    'magnitud_promedio': float(fila['magnitud_promedio']),
                    'magnitud_maxima': float(fila['magnitud_maxima']),
                }
                for fila in por_zona
            ],
            'por_mes': [
                {
                    'mes': fila['mes'].strftime('%Y-%m'),
                    'total': fila['total'],
                    'magnitud_promedio': float(fila['magnitud_promedio']),
                    'magnitud_maxima': float(fila['magnitud_maxima']),
                }
                for fila in por_mes
            ],
        })


class LlaveView(APIView):
    """POST /api/auth/login/ — entrega {"token", "usuario"} o 401 con detalle."""

    def post(self, request):
        usuario = authenticate(
            username=request.data.get('usuario'),
            password=request.data.get('clave'),
        )
        if usuario is None:
            return Response(
                {'detalle': 'Credenciales inválidas.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=usuario)
        return Response({'token': token.key, 'usuario': usuario.username})


class IngestaView(APIView):
    """POST /api/sismos/ingesta/ — protegida con IsAuthenticated.

    Consume USGS y guarda los sismos nuevos con bulk_create; los
    repetidos (por id_evento) se descartan, así que se puede llamar
    las veces que sea sin duplicar nada.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        dias_atras = request.data.get('dias_atras', 180)
        try:
            dias_atras = int(dias_atras)
        except (TypeError, ValueError):
            return Response(
                {'detalle': 'dias_atras debe ser un número entero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if dias_atras < 1 or dias_atras > 365:
            return Response(
                {'detalle': 'dias_atras debe estar entre 1 y 365.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filas = consultar_sismos(dias_atras)
        sismos = [sismo for sismo in map(fila_a_sismo, filas) if sismo is not None]

        # Con ignore_conflicts bulk_create no puede reportar los nuevos,
        # así que se cuentan los registros antes y después de guardar.
        total_antes = Sismo.objects.count()
        Sismo.objects.bulk_create(sismos, batch_size=2000, ignore_conflicts=True)
        guardados_nuevos = Sismo.objects.count() - total_antes

        return Response({
            'recibidos': len(filas),
            'validos': len(sismos),
            'guardados_nuevos': guardados_nuevos,
            'descartados_por_duplicado': len(sismos) - guardados_nuevos,
        })


class EstadoView(APIView):
    """GET /api/estado/ — diagnóstico público: el proyecto respira."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'proyecto': 'Sismos mundiales (USGS)',
            'total_sismos': Sismo.objects.count(),
            'ultimo_sismo': Sismo.objects.order_by('-fecha').values_list(
                'fecha', flat=True
            ).first(),
        })
