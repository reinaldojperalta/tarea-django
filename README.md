# Proyecto final — Sismos mundiales (USGS)

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

## Despliegue

Pendiente: Render (gunicorn + whitenoise, `DATABASE_URL`/`SECRET_KEY` como
variables de entorno, `DEBUG=False`).
