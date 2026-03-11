import { useState } from 'react'
import { X, Percent } from 'lucide-react'
import { cambiarTasa } from '../api'
import toast from 'react-hot-toast'
import './ModalCambiarTasa.css'

export default function ModalCambiarTasa({ cajita, onCerrar, onCambiada }) {
  const [form, setForm] = useState({ tasa_anual: cajita.tasa_anual, nota: '' })
  const [cargando, setCargando] = useState(false)

  const cambiar = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const enviar = async (e) => {
    e.preventDefault()
    const nuevaTasa = parseFloat(form.tasa_anual)
    if (nuevaTasa === cajita.tasa_anual) {
      toast.error('La nueva tasa debe ser diferente a la actual')
      return
    }
    setCargando(true)
    try {
      const cajitaActualizada = await cambiarTasa(cajita.id, {
        tasa_anual: nuevaTasa,
        nota: form.nota || null,
      })
      const diff = nuevaTasa - cajita.tasa_anual
      toast.success(`Tasa actualizada a ${nuevaTasa}% EA (${diff > 0 ? '+' : ''}${diff.toFixed(2)}%)`)
      onCambiada(cajitaActualizada)
      onCerrar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cambiar la tasa')
    } finally {
      setCargando(false)
    }
  }

  const diff = parseFloat(form.tasa_anual) - cajita.tasa_anual

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-caja modal-tasa" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Percent size={18} color="#7C3AED" />
            <h2>Cambiar tasa — {cajita.nombre}</h2>
          </div>
          <button className="btn btn-secundario btn-sm" onClick={onCerrar}><X size={16} /></button>
        </div>

        <div className="tasa-info-actual">
          <span className="text-sm text-muted">Tasa actual</span>
          <span className="tasa-valor-actual">{cajita.tasa_anual}% EA</span>
          <span className="text-xs text-muted">{cajita.banco}</span>
        </div>

        <form onSubmit={enviar}>
          <div className="campo">
            <label>Nueva tasa anual (% EA) *</label>
            <input
              name="tasa_anual"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={form.tasa_anual}
              onChange={cambiar}
              required
              autoFocus
            />
            {!isNaN(diff) && diff !== 0 && (
              <span className={`tasa-diff ${diff > 0 ? 'sube' : 'baja'}`}>
                {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}% respecto a la tasa actual
              </span>
            )}
          </div>

          <div className="campo">
            <label>Motivo del cambio (opcional)</label>
            <input
              name="nota"
              value={form.nota}
              onChange={cambiar}
              placeholder="Ej: Nu Colombia bajó la tasa..."
            />
          </div>

          <div className="tasa-aviso">
            <strong>¿Cómo funciona?</strong> El historial de tasas se conserva. Los intereses
            hasta hoy se calculan con {cajita.tasa_anual}% EA. Desde hoy en adelante se
            usará la nueva tasa. El cálculo es exacto en cada tramo.
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Confirmar cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
