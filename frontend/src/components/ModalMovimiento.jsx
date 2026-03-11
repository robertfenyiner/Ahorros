import { useState } from 'react'
import { X } from 'lucide-react'
import { registrarMovimiento } from '../api'
import toast from 'react-hot-toast'
import './ModalMovimiento.css'

export default function ModalMovimiento({ cajita, onCerrar, onRegistrado }) {
  const [form, setForm] = useState({ tipo: 'deposito', monto: '', nota: '' })
  const [cargando, setCargando] = useState(false)

  const cambiar = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const enviar = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      const mov = await registrarMovimiento(cajita.id, {
        tipo: form.tipo,
        monto: parseFloat(form.monto),
        nota: form.nota || null,
      })
      toast.success(`${form.tipo === 'deposito' ? 'Depósito' : 'Retiro'} registrado ✓`)
      onRegistrado(mov)
      onCerrar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al registrar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-caja" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo Movimiento — {cajita.nombre}</h2>
          <button className="btn btn-secundario btn-sm" onClick={onCerrar}><X size={16} /></button>
        </div>
        <form onSubmit={enviar}>
          <div className="tipo-selector">
            {['deposito', 'retiro'].map(t => (
              <button key={t} type="button"
                className={`tipo-btn ${form.tipo === t ? 'activo-' + t : ''}`}
                onClick={() => setForm(f => ({ ...f, tipo: t }))}>
                {t === 'deposito' ? '+ Depósito' : '- Retiro'}
              </button>
            ))}
          </div>
          <div className="campo mt-4">
            <label>Monto (COP) *</label>
            <input name="monto" type="number" min="1" step="1000" value={form.monto}
              onChange={cambiar} placeholder="100000" required />
          </div>
          <div className="campo">
            <label>Nota</label>
            <input name="nota" value={form.nota} onChange={cambiar} placeholder="Opcional..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
