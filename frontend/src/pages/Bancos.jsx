import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { listarBancos, crearBanco, actualizarBanco, eliminarBanco } from '../api'
import './Bancos.css'

export default function Bancos() {
  const [bancos, setBancos] = useState([])
  const [modal, setModal] = useState(null)   // null | { banco: null|obj }
  const [form, setForm] = useState({ nombre: '', tasa_anual: '' })
  const [guardando, setGuardando] = useState(false)

  const nav = useNavigate()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try { setBancos(await listarBancos()) }
    catch { toast.error('Error al cargar bancos') }
  }

  const abrirCrear = () => {
    setForm({ nombre: '', tasa_anual: '' })
    setModal({ banco: null })
  }

  const abrirEditar = (banco) => {
    setForm({ nombre: banco.nombre, tasa_anual: banco.tasa_anual })
    setModal({ banco })
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    const datos = { nombre: form.nombre.trim(), tasa_anual: parseFloat(form.tasa_anual) }
    try {
      if (modal.banco) {
        await actualizarBanco(modal.banco.id, datos)
        toast.success('Banco actualizado')
      } else {
        await crearBanco(datos)
        toast.success('Banco agregado')
      }
      setModal(null)
      cargar()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (banco) => {
    if (!confirm(`¿Eliminar "${banco.nombre}"? No se puede deshacer.`)) return
    try {
      await eliminarBanco(banco.id)
      toast.success('Banco eliminado')
      cargar()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="contenedor pagina">
      <button className="btn btn-secundario btn-sm" style={{ marginBottom: '1.25rem' }} onClick={() => nav(-1)}>
        <ArrowLeft size={15} /> Volver
      </button>
      <div className="bancos-header">
        <div>
          <h1 className="pagina-titulo">Bancos y Entidades</h1>
          <p className="text-muted text-sm" style={{ marginTop: '.2rem' }}>
            Administra las entidades disponibles en el simulador de proyección
          </p>
        </div>
        <button className="btn btn-primario" onClick={abrirCrear}>
          <Plus size={16} /> Agregar
        </button>
      </div>

      <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
        {bancos.length === 0 ? (
          <p className="text-muted text-sm text-center" style={{ padding: '2.5rem' }}>
            No hay bancos registrados. Agrega uno con el botón de arriba.
          </p>
        ) : (
          <div className="tabla-bancos-wrapper">
            <table className="tabla-bancos">
              <thead>
                <tr>
                  <th>Entidad</th>
                  <th>Tasa EA</th>
                  <th style={{ width: '90px' }}></th>
                </tr>
              </thead>
              <tbody>
                {bancos.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <Building2 size={15} color="#9CA3AF" />
                        <span style={{ fontWeight: 500 }}>{b.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-verde">{b.tasa_anual}% EA</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '.35rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secundario btn-sm" onClick={() => abrirEditar(b)} title="Editar">
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-peligro btn-sm" onClick={() => eliminar(b)} title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-caja" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal.banco ? 'Editar banco' : 'Nuevo banco'}</h2>
              <button className="btn btn-secundario btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={guardar}>
              <div className="campo">
                <label>Nombre del banco / entidad</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Nu Colombia"
                  required
                />
              </div>
              <div className="campo">
                <label>Tasa anual efectiva (% EA)</label>
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={form.tasa_anual}
                  onChange={e => setForm(f => ({ ...f, tasa_anual: e.target.value }))}
                  placeholder="8.75"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secundario" onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primario" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
