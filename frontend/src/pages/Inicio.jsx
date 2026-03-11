import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PiggyBank, TrendingUp, DollarSign, Plus } from 'lucide-react'
import { obtenerCajitas } from '../api'
import { formatearPeso } from '../utils'
import ModalCajita from '../components/ModalCajita'
import './Inicio.css'

function TarjetaStat({ titulo, valor, color, Icono }) {
  return (
    <div className="tarjeta stat-card">
      <div className="stat-icono" style={{ background: color + '20', color }}>
        <Icono size={22} />
      </div>
      <div>
        <p className="text-sm text-muted">{titulo}</p>
        <p className="font-bold stat-valor">{valor}</p>
      </div>
    </div>
  )
}

export default function Inicio() {
  const [cajitas, setCajitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)

  useEffect(() => {
    obtenerCajitas().then(setCajitas).finally(() => setCargando(false))
  }, [])

  const totalAhorrado = cajitas.reduce((s, c) => s + (c.resumen?.saldo_actual || 0), 0)
  const totalInteres = cajitas.reduce((s, c) => s + (c.resumen?.interes_ganado || 0), 0)
  const totalMeta = cajitas.reduce((s, c) => s + (c.meta_monto || 0), 0)

  if (cargando) return <div className="cargando">Cargando...</div>

  return (
    <div className="contenedor pagina">
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="pagina-titulo">¡Hola, Robert! 👋</h1>
          <p className="text-muted text-sm">Aquí está el resumen de tus ahorros</p>
        </div>
        <button className="btn btn-primario" onClick={() => setMostrarModal(true)}>
          <Plus size={16} /> Nueva Cajita
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <TarjetaStat titulo="Total ahorrado" valor={formatearPeso(totalAhorrado)} color="#7C3AED" Icono={DollarSign} />
        <TarjetaStat titulo="Intereses ganados" valor={formatearPeso(totalInteres)} color="#10B981" Icono={TrendingUp} />
        <TarjetaStat titulo="Cajitas activas" valor={cajitas.length} color="#3B82F6" Icono={PiggyBank} />
        <TarjetaStat titulo="Meta total" valor={totalMeta ? formatearPeso(totalMeta) : '—'} color="#F59E0B" Icono={TrendingUp} />
      </div>

      <h2 style={{ marginBottom: '1rem', fontWeight: 700 }}>Mis Cajitas</h2>
      {cajitas.length === 0 ? (
        <div className="tarjeta texto-vacio">
          <PiggyBank size={48} color="#D1D5DB" />
          <p>Aún no tienes cajitas. ¡Crea la primera!</p>
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
                  <div className="cajita-dot" style={{ background: c.color }} />
                  <span className="font-semibold">{c.nombre}</span>
                </div>
                <span className="badge badge-morado">{c.tasa_anual}% EA</span>
              </div>
              <p className="cajita-saldo">{formatearPeso(c.resumen?.saldo_actual || 0)}</p>
              <div className="flex items-center justify-between mt-2 text-sm text-muted">
                <span>Intereses: <b style={{ color: '#10B981' }}>{formatearPeso(c.resumen?.interes_ganado || 0)}</b></span>
                {c.meta_monto && (
                  <span>Meta: {formatearPeso(c.meta_monto)}</span>
                )}
              </div>
              {c.meta_monto > 0 && (
                <div className="barra-meta" style={{ marginTop: '.6rem' }}>
                  <div className="barra-progreso"
                    style={{ width: `${Math.min(100, ((c.resumen?.saldo_actual || 0) / c.meta_monto) * 100)}%`, background: c.color }} />
                </div>
              )}
              <p className="text-xs text-muted" style={{ marginTop: '.5rem' }}>{c.banco}</p>
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
