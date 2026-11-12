import { useState } from 'react'
import { API_URL, envio } from '../../shared/api'

export default function PanelLlave() {
  const [usuario, setUsuario] = useState('admin')
  const [clave, setClave] = useState('')
  const [token, setToken] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  async function pedirLlave() {
    setOcupado(true)
    const { estado, datos } = await envio('/auth/login/', {
      usuario,
      clave,
    })
    setOcupado(false)

    if (estado === 200) {
      setToken(datos.token)
      setAviso({ tipo: 'ok', texto: `Llave recibida para ${datos.usuario}.` })
    } else {
      setToken(null)
      setAviso({ tipo: 'error', texto: `${estado} · ${datos.detalle || 'Credenciales inválidas.'}` })
    }
  }

  async function probarSinLlave() {
    setOcupado(true)
    const { estado, datos } = await envio('/sismos/ingesta/', { dias_atras: 3 })
    setOcupado(false)
    setAviso({
      tipo: estado === 401 ? 'ok' : 'error',
      texto:
        estado === 401
          ? '401: la puerta está cerrada sin llave (correcto).'
          : `${estado} · ${JSON.stringify(datos)}`,
    })
  }

  async function ingerirConLlave() {
    if (!token) return
    setOcupado(true)
    const { estado, datos } = await envio(
      '/sismos/ingesta/',
      { dias_atras: 3 },
      token,
    )
    setOcupado(false)
    setAviso({
      tipo: estado === 200 ? 'ok' : 'error',
      texto:
        estado === 200
          ? `Ingesta con llave: ${datos.validos} válidos, ${datos.guardados_nuevos} nuevos, ${datos.descartados_por_duplicado} duplicados descartados.`
          : `${estado} · ${JSON.stringify(datos)}`,
    })
  }

  return (
    <section className="tarjeta">
      <h2>La llave 🔑 (ingesta protegida)</h2>
      <p className="nota">
        La operación de ingesta exige <code>Authorization: Token …</code>: sin la llave
        responde 401, con la llave responde 200 y trae los sismos nuevos de USGS.
      </p>

      <div className="controles">
        <input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usuario" />
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="clave"
        />
        <button type="button" disabled={ocupado} onClick={pedirLlave}>Pedir la llave</button>
        <button type="button" disabled={ocupado} onClick={probarSinLlave}>Probar sin llave</button>
        <button
          type="button"
          disabled={ocupado || !token}
          onClick={ingerirConLlave}
        >
          Ingerir con la llave
        </button>
      </div>

      {token && (
        <p className="nota">
          Llave en memoria: <code>{token.slice(0, 10)}…</code>
        </p>
      )}
      {aviso && <p className={`aviso ${aviso.tipo}`}>{aviso.texto}</p>}
    </section>
  )
}
