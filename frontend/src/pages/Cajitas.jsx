import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { obtenerCajitas } from '../api'
import { formatearPeso } from '../utils'
import ModalCajita from '../components/ModalCajita'
import './Cajitas.css'

export default function Cajitas() {
  const [cajitas, setCajitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)

  useEffect(() => {
    obtenerCajitas().then(setCajitas).finally(() => setCargando(false))
  }, [])

  if (cargando) return <div className="cargando">Cargando...</div>

  const nav = useNavigate()

  return (
    <div className="contenedor pagina">
      <button className="btn btn-secundario btn-sm" style={{ marginBottom: '1.25rem' }} onClick={() => nav(-1)}>
        <ArrowLeft size={15} /> Volver
      </button>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="pagina-titulo">Mis Cajitas</h1>
        <button className="btn btn-primario" onClick={() => setMostrarModal(true)}>
          <Plus size={16} /> Nueva Cajita
        </button>
      </div>

      {cajitas.length === 0 ? (
        <div className="tarjeta texto-vacio" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem', padding:'3rem' }}>
          <p className="text-muted">No tienes cajitas aún.</p>
          <button className="btn btn-primario" onClick={() => setMostrarModal(true)}>
            <Plus size={16} /> Crear cajita
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {cajitas.map(c => (
            <Link key={c.id} to={`/cajitas/${c.id}`} className="cajita-card" style={{ borderTopColor: c.color }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '.75rem' }}>
                <div className="flex items-center gap-2">
                  <div style={{ width:'.7rem', height:'.7rem', borderRadius:'50%', background: c.color }} />
                  <span className="font-semibold">{c.nombre}</span>
                </div>
                <span className="badge badge-morado">{c.tasa_anual}% EA</span>
              </div>
              <p style={{ fontSize:'1.5rem', fontWeight:700 }}>{formatearPeso(c.resumen?.saldo_actual || 0)}</p>
              <div className="flex items-center justify-between mt-2 text-sm text-muted">
                <span>Intereses: <b style={{ color:'#10B981' }}>{formatearPeso(c.resumen?.interes_ganado || 0)}</b></span>
                {c.meta_monto && <span>Meta: {formatearPeso(c.meta_monto)}</span>}
              </div>
              {c.meta_monto > 0 && (
                <div style={{ height:'6px', background:'var(--borde)', borderRadius:'999px', overflow:'hidden', marginTop:'.6rem' }}>
                  <div style={{
                    height:'100%', borderRadius:'999px', background: c.color,
                    width: `${Math.min(100, ((c.resumen?.saldo_actual||0)/c.meta_monto)*100)}%`
                  }} />
                </div>
              )}
              <p className="text-xs text-muted" style={{ marginTop:'.5rem' }}>{c.banco}</p>
            </Link>
          ))}
        </div>
      )}

      {mostrarModal && (
        <ModalCajita
          onCerrar={() => setMostrarModal(false)}
          onCreada={(nueva) => setCajitas(prev => [...prev, nueva])}
        />
      )}
    </div>
  )
}
