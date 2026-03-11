import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, TrendingUp, Percent, Clock } from 'lucide-react'
import { obtenerCajita, obtenerMovimientos, obtenerHistorialTasas, eliminarCajita, eliminarMovimiento } from '../api'
import { formatearPeso, formatearFecha } from '../utils'
import ModalMovimiento from '../components/ModalMovimiento'
import ModalCambiarTasa from '../components/ModalCambiarTasa'
import toast from 'react-hot-toast'
import './DetalleCajita.css'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { calcularProyeccion } from '../api'

export default function DetalleCajita() {
  const { id } = useParams()
  const nav = useNavigate()
  const [cajita, setCajita] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [historialTasas, setHistorialTasas] = useState([])
  const [proyeccion, setProyeccion] = useState([])
  const [mostrarModalMov, setMostrarModalMov] = useState(false)
  const [mostrarModalTasa, setMostrarModalTasa] = useState(false)
  const [cargando, setCargando] = useState(true)

  const cargar = async () => {
    try {
      const [c, movs, tasas] = await Promise.all([
        obtenerCajita(id),
        obtenerMovimientos(id),
        obtenerHistorialTasas(id),
      ])
      setCajita(c)
      setMovimientos(movs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
      setHistorialTasas(tasas)

      if (c.resumen?.saldo_actual > 0) {
        const proy = await calcularProyeccion({
          capital_inicial: c.resumen.saldo_actual,
          aporte_mensual: 0,
          tasa_anual: c.tasa_anual,
          meses: 12,
        })
        setProyeccion(proy.puntos.map(p => ({ mes: `M${p.mes}`, saldo: p.saldo, interes: p.interes_acumulado })))
      } else {
        setProyeccion([])
      }
    } catch {
      toast.error('Error al cargar la cajita')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  const handleEliminarCajita = async () => {
    if (!confirm(`¿Eliminar la cajita "${cajita.nombre}"? Esta acción no se puede deshacer.`)) return
    await eliminarCajita(id)
    toast.success('Cajita eliminada')
    nav('/cajitas')
  }

  const handleEliminarMovimiento = async (movId) => {
    if (!confirm('¿Eliminar este movimiento?')) return
    await eliminarMovimiento(id, movId)
    toast.success('Movimiento eliminado')
    await cargar()
  }

  if (cargando) return <div className="cargando">Cargando...</div>
  if (!cajita) return <div className="cargando">Cajita no encontrada</div>

  const r = cajita.resumen

  return (
    <div className="contenedor pagina">
      <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secundario btn-sm" onClick={() => nav(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      {/* Header cajita */}
      <div className="detalle-header tarjeta" style={{ borderLeft: `6px solid ${cajita.color}` }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{cajita.nombre}</h1>
          {cajita.descripcion && <p className="text-muted text-sm">{cajita.descripcion}</p>}
          <span className="badge badge-morado" style={{ marginTop: '.4rem' }}>
            {cajita.banco} · {cajita.tasa_anual}% EA
          </span>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primario" onClick={() => setMostrarModalMov(true)}>
            <Plus size={16} /> Movimiento
          </button>
          <button className="btn btn-secundario" onClick={() => setMostrarModalTasa(true)}>
            <Percent size={16} /> Cambiar tasa
          </button>
          <button className="btn btn-peligro btn-sm" onClick={handleEliminarCajita}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ margin: '1.25rem 0' }}>
        {[
          { label: 'Saldo actual', val: formatearPeso(r.saldo_actual), color: cajita.color },
          { label: 'Intereses ganados', val: formatearPeso(r.interes_ganado), color: '#10B981' },
          { label: 'Total depositado', val: formatearPeso(r.total_depositado), color: '#3B82F6' },
          { label: 'Total retirado', val: formatearPeso(r.total_retirado), color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="tarjeta">
            <p className="text-sm text-muted">{s.label}</p>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Proyección */}
      {proyeccion.length > 0 && (
        <div className="tarjeta" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <TrendingUp size={18} color={cajita.color} />
            <h3 style={{ fontWeight: 700 }}>Proyección a 12 meses</h3>
            <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
              Tasa vigente: {cajita.tasa_anual}% EA
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={proyeccion}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cajita.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={cajita.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatearPeso(v)} />
              <Area type="monotone" dataKey="saldo" stroke={cajita.color} fill="url(#grad)"
                strokeWidth={2} name="Saldo proyectado" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="proyeccion-resumen">
            <div><span className="text-muted text-sm">1 mes</span><br/><b>{formatearPeso(r.proyeccion_1_mes)}</b></div>
            <div><span className="text-muted text-sm">6 meses</span><br/><b>{formatearPeso(r.proyeccion_6_meses)}</b></div>
            <div><span className="text-muted text-sm">12 meses</span><br/><b>{formatearPeso(r.proyeccion_1_anio)}</b></div>
          </div>
        </div>
      )}

      {/* Historial de tasas */}
      {historialTasas.length > 0 && (
        <div className="tarjeta" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '.85rem' }}>
            <Clock size={16} color="#6B7280" />
            <h3 style={{ fontWeight: 700 }}>Historial de tasas</h3>
          </div>
          <ul className="lista-tasas">
            {historialTasas.map((t, i) => (
              <li key={t.id} className="tasa-item">
                <div className={`tasa-dot ${i === 0 ? 'activa' : ''}`} />
                <div style={{ flex: 1 }}>
                  <span className="font-semibold" style={{ color: i === 0 ? '#7C3AED' : 'inherit' }}>
                    {t.tasa_anual}% EA
                  </span>
                  {i === 0 && <span className="badge badge-morado" style={{ marginLeft: '.5rem', fontSize: '.7rem' }}>vigente</span>}
                  {t.nota && <span className="text-muted text-sm"> · {t.nota}</span>}
                  <br/>
                  <span className="text-xs text-muted">Desde {formatearFecha(t.fecha_inicio)}</span>
                </div>
                {i < historialTasas.length - 1 && (
                  <span className="text-xs text-muted">
                    {(t.tasa_anual - historialTasas[i + 1].tasa_anual).toFixed(2) > 0 ? '▲' : '▼'}
                    {' '}{Math.abs(t.tasa_anual - historialTasas[i + 1].tasa_anual).toFixed(2)}%
                  </span>
                )}
              </li>
            ))}
          </ul>
          <button
            className="btn btn-secundario btn-sm"
            style={{ marginTop: '.75rem' }}
            onClick={() => setMostrarModalTasa(true)}
          >
            <Percent size={14} /> Registrar nuevo cambio de tasa
          </button>
        </div>
      )}

      {/* Historial de movimientos */}
      <div className="tarjeta">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Historial de movimientos</h3>
        {movimientos.length === 0 ? (
          <p className="text-muted text-sm text-center" style={{ padding: '2rem' }}>
            Sin movimientos aún. ¡Haz tu primer depósito!
          </p>
        ) : (
          <ul className="lista-movimientos">
            {movimientos.map(m => (
              <li key={m.id} className="movimiento-item">
                <div className={`mov-dot ${m.tipo}`} />
                <div style={{ flex: 1 }}>
                  <span className="font-semibold">{m.tipo === 'deposito' ? 'Depósito' : 'Retiro'}</span>
                  {m.nota && <span className="text-muted text-sm"> · {m.nota}</span>}
                  <br/>
                  <span className="text-xs text-muted">{formatearFecha(m.fecha)}</span>
                </div>
                <span className={`mov-monto ${m.tipo}`}>
                  {m.tipo === 'deposito' ? '+' : '-'}{formatearPeso(m.monto)}
                </span>
                <button className="btn btn-secundario btn-sm" onClick={() => handleEliminarMovimiento(m.id)}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {mostrarModalMov && (
        <ModalMovimiento
          cajita={cajita}
          onCerrar={() => setMostrarModalMov(false)}
          onRegistrado={() => cargar()}
        />
      )}

      {mostrarModalTasa && (
        <ModalCambiarTasa
          cajita={cajita}
          onCerrar={() => setMostrarModalTasa(false)}
          onCambiada={() => cargar()}
        />
      )}
    </div>
  )
}
