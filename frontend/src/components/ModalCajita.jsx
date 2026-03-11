import { useState } from 'react'
import { X } from 'lucide-react'
import { crearCajita } from '../api'
import toast from 'react-hot-toast'
import './ModalCajita.css'

const COLORES = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#06B6D4']
const BANCOS = ['Nu Colombia', 'Bancolombia', 'Davivienda', 'BBVA', 'Otro']

export default function ModalCajita({ onCerrar, onCreada }) {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', meta_monto: '', tasa_anual: 8.75,
    banco: 'Nu Colombia', color: '#7C3AED', icono: 'piggy-bank',
  })
  const [cargando, setCargando] = useState(false)

  const cambiar = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const enviar = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      const datos = {
        ...form,
        tasa_anual: parseFloat(form.tasa_anual),
        meta_monto: form.meta_monto ? parseFloat(form.meta_monto) : null,
      }
      const nueva = await crearCajita(datos)
      toast.success(`Cajita "${nueva.nombre}" creada ✓`)
      onCreada(nueva)
      onCerrar()
    } catch {
      toast.error('Error al crear la cajita')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-caja" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nueva Cajita</h2>
          <button className="btn btn-secundario btn-sm" onClick={onCerrar}><X size={16} /></button>
        </div>
        <form onSubmit={enviar}>
          <div className="campo">
            <label>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={cambiar} placeholder="Ej: Viaje, Emergencia..." required />
          </div>
          <div className="campo">
            <label>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={cambiar} rows={2} placeholder="Para qué es esta cajita..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="campo">
              <label>Meta (COP)</label>
              <input name="meta_monto" type="number" min="0" value={form.meta_monto} onChange={cambiar} placeholder="0" />
            </div>
            <div className="campo">
              <label>Tasa anual (% EA)</label>
              <input name="tasa_anual" type="number" step="0.01" min="0" max="100" value={form.tasa_anual} onChange={cambiar} required />
            </div>
          </div>
          <div className="campo">
            <label>Banco</label>
            <select name="banco" value={form.banco} onChange={cambiar}>
              {BANCOS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Color</label>
            <div className="colores-grid">
              {COLORES.map(c => (
                <button key={c} type="button"
                  className={`color-opcion ${form.color === c ? 'seleccionado' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn btn-primario" disabled={cargando}>
              {cargando ? 'Creando...' : 'Crear Cajita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
