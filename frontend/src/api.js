import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Cajitas ──────────────────────────────────────────────────────────────────
export const obtenerCajitas = () => api.get('/cajitas/').then(r => r.data)
export const crearCajita = (datos) => api.post('/cajitas/', datos).then(r => r.data)
export const obtenerCajita = (id) => api.get(`/cajitas/${id}`).then(r => r.data)
export const actualizarCajita = (id, datos) => api.put(`/cajitas/${id}`, datos).then(r => r.data)
export const eliminarCajita = (id) => api.delete(`/cajitas/${id}`)

// ── Movimientos ───────────────────────────────────────────────────────────────
export const obtenerMovimientos = (cajitaId) => api.get(`/cajitas/${cajitaId}/movimientos`).then(r => r.data)
export const registrarMovimiento = (cajitaId, datos) => api.post(`/cajitas/${cajitaId}/movimientos`, datos).then(r => r.data)
export const eliminarMovimiento = (cajitaId, movId) => api.delete(`/cajitas/${cajitaId}/movimientos/${movId}`)

// ── Tasas ─────────────────────────────────────────────────────────────────────
export const obtenerHistorialTasas = (cajitaId) => api.get(`/cajitas/${cajitaId}/tasas`).then(r => r.data)
export const cambiarTasa = (cajitaId, datos) => api.post(`/cajitas/${cajitaId}/cambiar-tasa`, datos).then(r => r.data)

// ── Proyección ────────────────────────────────────────────────────────────────
export const calcularProyeccion = (datos) => api.post('/proyeccion/', datos).then(r => r.data)
