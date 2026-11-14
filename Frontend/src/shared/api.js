// Puerta de entrada del panel: la URL de la API y dos ayudantes de peticiones.
// Sin llave (GET publicos) y con llave (Authorization: Token ...), como el RETO 16.

export const API_URL =
  import.meta.env.VITE_API_URL || '/api'

// GET sencillo que devuelve el JSON o lanza un error legible.
export async function peticion(ruta) {
  const respuesta = await fetch(`${API_URL}${ruta}`)
  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => ({}))
    throw new Error(detalle.detalle || detalle.detail || `Error ${respuesta.status}`)
  }
  return respuesta.json()
}

// POST con cuerpo JSON, opcionalmente con la llave en el encabezado.
// Devuelve {estado, datos} sin lanzar: al panel le interesa el 401 tal cual.
export async function envio(ruta, cuerpo, token = null) {
  const encabezados = { 'Content-Type': 'application/json' }
  if (token) {
    encabezados.Authorization = `Token ${token}`
  }
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'POST',
    headers: encabezados,
    body: JSON.stringify(cuerpo),
  })
  return { estado: respuesta.status, datos: await respuesta.json() }
}
