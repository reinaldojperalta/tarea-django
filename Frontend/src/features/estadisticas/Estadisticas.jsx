import { useEffect, useState } from 'react'
import { API_URL } from '../../shared/api'

// Construye los parametros de estadisticas a partir de los filtros compartidos.
export function rutaEstadisticas(filtros) {
  const parametros = new URLSearchParams()
  if (filtros.zona) parametros.set('zona', filtros.zona)
  if (filtros.magnitud_min) parametros.set('magnitud_min', filtros.magnitud_min)
  const consulta = parametros.toString()
  return consulta ? `/sismos/estadisticas/?${consulta}` : '/sismos/estadisticas/'
}

export default function Estadisticas({ filtros }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vivo = true

    async function traer() {
      try {
        const respuesta = await fetch(`${API_URL}${rutaEstadisticas(filtros)}`)
        const paquete = await respuesta.json()
        if (vivo) {
          setDatos(paquete)
          setError(null)
        }
      } catch (e) {
        if (vivo) setError(String(e))
      }
    }

    traer()
    // El tablero se refresca solo: mientras el panel esta abierto,
    // cada 30 s vuelve a preguntarle a la base de datos.
    const reloj = setInterval(traer, 30000)
    return () => {
      vivo = false
      clearInterval(reloj)
    }
  }, [filtros.zona, filtros.magnitud_min])

  if (error) return <section className="tarjeta">Tablero: {error}</section>
  if (!datos) return <section className="tarjeta">Tablero: cargando…</section>

  const { globales, por_zona, por_mes } = datos
  const maximoZona = Math.max(...por_zona.map((f) => f.total), 1)
  const maximoMes = Math.max(...por_mes.map((f) => f.total), 1)

  return (
    <section className="tarjeta">
      <h2>Tablero de estadísticas <span className="vivo">● en vivo</span></h2>

      <div className="metricas">
        <div className="metrica"><strong>{globales.total ?? 0}</strong><span>sismos</span></div>
        <div className="metrica"><strong>{(globales.magnitud_promedio ?? 0).toFixed(2)}</strong><span>magnitud prom.</span></div>
        <div className="metrica"><strong>{globales.magnitud_maxima ?? 0}</strong><span>magnitud máx.</span></div>
        <div className="metrica"><strong>{(globales.profundidad_promedio ?? 0).toFixed(1)}</strong><span>profundidad media (km)</span></div>
      </div>

      <div className="columnas">
        <div>
          <h3>Por zona (top 15)</h3>
          <ul className="barras">
            {por_zona.map((fila) => (
              <li key={fila.zona}>
                <span className="barra-etiqueta">{fila.zona}</span>
                <span className="barra" style={{ width: `${(fila.total / maximoZona) * 100}%` }}>
                  {fila.total} · M{fila.magnitud_maxima}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Por mes</h3>
          <ul className="barras">
            {por_mes.map((fila) => (
              <li key={fila.mes}>
                <span className="barra-etiqueta">{fila.mes}</span>
                <span className="barra otra" style={{ width: `${(fila.total / maximoMes) * 100}%` }}>
                  {fila.total} · prom M{fila.magnitud_promedio}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
