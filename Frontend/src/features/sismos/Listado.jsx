import { useEffect, useState } from 'react'
import { API_URL } from '../../shared/api'

const POR_PAGINA = 50

export default function Listado({ filtros }) {
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('-fecha')
  const [listado, setListado] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    setPagina(1)
  }, [filtros.zona, filtros.magnitud_min, busqueda, orden])

  useEffect(() => {
    let vivo = true

    async function traer() {
      const parametros = new URLSearchParams({
        page: String(pagina),
        page_size: String(POR_PAGINA),
        ordering: orden,
      })
      if (filtros.zona) parametros.set('zona', filtros.zona)
      if (filtros.magnitud_min) parametros.set('magnitud_min', filtros.magnitud_min)
      if (busqueda) parametros.set('search', busqueda)

      try {
        const respuesta = await fetch(`${API_URL}/sismos/?${parametros}`)
        const datos = await respuesta.json()
        if (vivo) {
          setListado(datos.results || [])
          setTotal(datos.count || 0)
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
  }, [pagina, filtros.zona, filtros.magnitud_min, busqueda, orden])

  const paginas = Math.max(Math.ceil(total / POR_PAGINA), 1)

  return (
    <section className="tarjeta">
      <h2>Listado de sismos ({total} en la base de datos)</h2>

      <div className="controles">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por id, lugar o zona…"
        />
        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="-fecha">Más recientes</option>
          <option value="fecha">Más antiguos</option>
          <option value="-magnitud">Magnitud (mayor a menor)</option>
          <option value="magnitud">Magnitud (menor a mayor)</option>
          <option value="-profundidad_km">Profundidad (mayor a menor)</option>
        </select>
      </div>

      {error && <p className="error">Listado: {error}</p>}

      <table>
        <thead>
          <tr>
            <th>Magnitud</th>
            <th>Fecha</th>
            <th>Zona</th>
            <th>Lugar</th>
            <th>Prof.</th>
            <th>id_evento</th>
          </tr>
        </thead>
        <tbody>
          {listado.map((sismo) => (
            <tr key={sismo.id_evento}>
              <td><span className={`chip mag${sismo.magnitud >= 5 ? '5' : ''}`}>M{sismo.magnitud}</span></td>
              <td>{sismo.fecha.slice(0, 16).replace('T', ' ')}</td>
              <td>{sismo.zona}</td>
              <td className="lugar">{sismo.lugar}</td>
              <td>{sismo.profundidad_km}</td>
              <td className="codigo">{sismo.id_evento}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="paginado">
        <button type="button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
          ← Anterior
        </button>
        <span>Página {pagina} de {paginas}</span>
        <button type="button" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>
          Siguiente →
        </button>
      </div>
    </section>
  )
}
