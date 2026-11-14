// FUNCIONALIDAD PROPIA — Mapa mundial interactivo (react-leaflet).
// Dibuja los sismos sobre el mapa según latitud/longitud, dos campos del
// modelo que el resto del panel no explota: el color y el tamaño de cada
// burbuja indican la magnitud, y el popup muestra los detalles del evento.
// Respeta los filtros compartidos (zona y magnitud mínima).
import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { API_URL } from '../../shared/api'

const LIMITE_PUNTOS = 500

// Color de la burbuja según el rango de magnitud.
function colorPorMagnitud(magnitud) {
  if (magnitud >= 6) return '#ff4d4d'
  if (magnitud >= 5) return '#ff9440'
  if (magnitud >= 3) return '#ffd23f'
  return '#3fd08a'
}

export default function MapaMundial({ filtros }) {
  const [sismos, setSismos] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let vivo = true

    async function traer() {
      const parametros = new URLSearchParams({
        page_size: String(LIMITE_PUNTOS),
        ordering: '-fecha',
      })
      if (filtros.zona) parametros.set('zona', filtros.zona)
      if (filtros.magnitud_min) parametros.set('magnitud_min', filtros.magnitud_min)

      try {
        const respuesta = await fetch(`${API_URL}/sismos/?${parametros}`)
        const datos = await respuesta.json()
        if (vivo) {
          setSismos(datos.results || [])
          setError(null)
        }
      } catch (e) {
        if (vivo) setError(String(e))
      }
    }

    traer()
    return () => {
      vivo = false
    }
  }, [filtros.zona, filtros.magnitud_min])

  return (
    <section className="tarjeta">
      <h2>Mapa mundial de sismos 🌍</h2>
      <p className="nota">
        <strong>Funcionalidad propia:</strong> los últimos {LIMITE_PUNTOS} sismos
        (respetando los filtros) dibujados según su <code>latitud</code> y{' '}
        <code>longitud</code>. El color y el tamaño de cada burbuja indican la
        magnitud: verde &lt; 3, amarillo ≥ 3, naranja ≥ 5, rojo ≥ 6. Haz clic
        en una burbuja para ver el detalle del evento.
      </p>

      {error && <p className="error">Mapa: {error}</p>}

      <div className="mapa">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          scrollWheelZoom={true}
          worldCopyJump={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
          />
          {sismos.map((sismo) => (
            <CircleMarker
              key={sismo.id_evento}
              center={[sismo.latitud, sismo.longitud]}
              radius={2.5 + sismo.magnitud * 1.4}
              pathOptions={{
                color: colorPorMagnitud(sismo.magnitud),
                fillColor: colorPorMagnitud(sismo.magnitud),
                fillOpacity: 0.55,
                weight: 1,
              }}
            >
              <Popup>
                <strong>M{sismo.magnitud}</strong> · prof. {sismo.profundidad_km} km
                <br />
                {sismo.lugar}
                <br />
                <small>{sismo.fecha.slice(0, 16).replace('T', ' ')} · {sismo.id_evento}</small>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </section>
  )
}
