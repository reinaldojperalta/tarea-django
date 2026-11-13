import { useState } from 'react'
import Estadisticas from '../features/estadisticas/Estadisticas'
import Listado from '../features/sismos/Listado'
import MapaMundial from '../features/mapa/MapaMundial'
import PanelLlave from '../features/auth/PanelLlave'

export default function App() {
  // Los filtros viven aqui para que el listado y las estadisticas
  // analicen EXACTAMENTE el mismo conjunto de datos.
  const [filtros, setFiltros] = useState({ zona: '', magnitud_min: '' })

  return (
    <main className="panel">
      <header className="panel-encabezado">
        <h1>Sismos mundiales</h1>
        <p>
          48.000+ eventos reales del <a href="https://earthquake.usgs.gov" target="_blank" rel="noreferrer">Servicio Geológico de EE. UU.</a>{' '}
          · API Django + DRF · ingesta sin duplicados
        </p>
      </header>

      <section className="panel-filtros">
        <h2>Filtros compartidos (listado y tablero analizan lo mismo)</h2>
        <label>
          Zona
          <input
            value={filtros.zona}
            onChange={(e) => setFiltros({ ...filtros, zona: e.target.value })}
            placeholder="Alaska, CA, Texas…"
          />
        </label>
        <label>
          Magnitud mínima
          <input
            type="number"
            step="0.5"
            value={filtros.magnitud_min}
            onChange={(e) => setFiltros({ ...filtros, magnitud_min: e.target.value })}
            placeholder="5"
          />
        </label>
        {(filtros.zona || filtros.magnitud_min) && (
          <button type="button" onClick={() => setFiltros({ zona: '', magnitud_min: '' })}>
            Limpiar filtros
          </button>
        )}
      </section>

      <Estadisticas filtros={filtros} />
      <MapaMundial filtros={filtros} />
      <Listado filtros={filtros} />
      <PanelLlave />

      <footer className="panel-pie">
        <p>
          <strong>Autoría:</strong> Reinaldo Peralta · Proyecto final del taller
          Django + React · Dominio: sismología (datos públicos de USGS).
        </p>
        <p className="nota">
          Funcionalidad propia: mapa mundial interactivo con react-leaflet —
          los sismos se dibujan según latitud/longitud y la burbuja crece y
          cambia de color según la magnitud.
        </p>
      </footer>
    </main>
  )
}
