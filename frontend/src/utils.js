export const formatearPeso = (monto) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto)

export const formatearFecha = (fecha) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fecha))

export const formatearFechaCorta = (fecha) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(new Date(fecha))
