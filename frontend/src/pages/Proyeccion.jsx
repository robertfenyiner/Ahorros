import { useState, useEffect } from 'react'
import { calcularProyeccion, calcularProyeccionDiaria, listarBancos } from '../api'
import { formatearPeso } from '../utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import toast from 'react-hot-toast'
import './Proyeccion.css'

export default function Proyeccion() {
  const [form, setForm] = useState({
    capital_inicial: '', aporte_mensual: '', tasa_anual: 8.75, meses: 12,
  })
  const [bancos, setBancos] = useState([])
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [bancoSel, setBancoSel] = useState('Nu Colombia')
  const [resultadoDiario, setResultadoDiario] = useState(null)
  const [diasDetalle, setDiasDetalle] = useState(30)
  const [cargandoDiario, setCargandoDiario] = useState(false)

  useEffect(() => {
    listarBancos().then(data => setBancos([...data, { id: 0, nombre: 'Personalizado', tasa_anual: null }])).catch(() => {})
  }, [])

  const cambiar = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const seleccionarBanco = (b) => {
    setBancoSel(b.nombre)
    if (b.tasa !== null) setForm(f => ({ ...f, tasa_anual: b.tasa }))
  }

  const fetchDiario = async (dias, formData) => {
    setCargandoDiario(true)
    try {
      const res = await calcularProyeccionDiaria({
        capital_inicial: parseFloat(formData.capital_inicial || 0),
        aporte_mensual:  parseFloat(formData.aporte_mensual || 0),
        tasa_anual:      parseFloat(formData.tasa_anual),
        dias,
      })
      setResultadoDiario(res)
    } catch {
      toast.error('Error calculando detalle diario')
    } finally {
      setCargandoDiario(false)
    }
  }

  const cambiarDiasDetalle = (d) => {
    setDiasDetalle(d)
    if (resultado) fetchDiario(d, form)
  }

  const calcular = async (e) => {
    e.preventDefault()
    if (!form.capital_inicial && !form.aporte_mensual) {
      toast.error('Ingresa al menos un capital inicial o un aporte mensual')
      return
    }
    setCargando(true)
    try {
      const res = await calcularProyeccion({
        capital_inicial: parseFloat(form.capital_inicial || 0),
        aporte_mensual:  parseFloat(form.aporte_mensual || 0),
        tasa_anual:      parseFloat(form.tasa_anual),
        meses:           parseInt(form.meses),
      })
      setResultado(res)
      fetchDiario(diasDetalle, form)
    } catch {
      toast.error('Error al calcular')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="contenedor pagina">
      <h1 className="pagina-titulo" style={{ marginBottom: '.25rem' }}>Simulador de Proyección</h1>
      <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
        Calcula cómo crecerían tus ahorros con interés compuesto
      </p>

      <div className="proy-layout">
        {/* Formulario */}
        <form className="tarjeta proy-form" onSubmit={calcular}>
          <div className="campo">
            <label>Banco / Tasa de referencia</label>
            <div className="bancos-grid">
              {bancos.map(b => (
                <button key={b.nombre} type="button"
                  className={`banco-btn ${bancoSel === b.nombre ? 'activo' : ''}`}
                  onClick={() => seleccionarBanco({ nombre: b.nombre, tasa: b.tasa_anual })}>
                  {b.nombre} {b.tasa_anual ? `${b.tasa_anual}%` : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="campo">
            <label>Capital inicial (COP)</label>
            <input name="capital_inicial" type="number" min="0" step="1000"
              value={form.capital_inicial} onChange={cambiar} placeholder="500000" />
          </div>
          <div className="campo">
            <label>Aporte mensual (COP)</label>
            <input name="aporte_mensual" type="number" min="0" step="1000"
              value={form.aporte_mensual} onChange={cambiar} placeholder="100000" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="campo">
              <label>Tasa anual (% EA)</label>
              <input name="tasa_anual" type="number" step="0.01" min="0" max="100"
                value={form.tasa_anual} onChange={cambiar} required />
            </div>
            <div className="campo">
              <label>Duración (meses)</label>
              <input name="meses" type="number" min="1" max="600"
                value={form.meses} onChange={cambiar} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primario w-full" disabled={cargando}>
            {cargando ? 'Calculando...' : 'Calcular proyección'}
          </button>
        </form>

        {/* Resultado */}
        {resultado && (
          <div className="proy-resultado">
            <div className="grid-4" style={{ marginBottom:'1.25rem' }}>
              {[
                { label:'Total final',        val: formatearPeso(resultado.total_final),     color:'#7C3AED' },
                { label:'Intereses ganados',   val: formatearPeso(resultado.interes_total),   color:'#10B981' },
                { label:'Total depositado',    val: formatearPeso(resultado.total_depositado),color:'#3B82F6' },
              ].map(s => (
                <div key={s.label} className="tarjeta">
                  <p className="text-sm text-muted">{s.label}</p>
                  <p style={{ fontSize:'1.1rem', fontWeight:700, color:s.color }}>{s.val}</p>
                </div>
              ))}
            </div>

            <div className="tarjeta">
              <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>Evolución mes a mes</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={resultado.puntos.map(p => ({
                  mes: `M${p.mes}`, saldo: p.saldo,
                  depositado: p.total_depositado, interes: p.interes_acumulado,
                }))}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                  <XAxis dataKey="mes" tick={{ fontSize:11 }}/>
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize:11 }}/>
                  <Tooltip formatter={(v) => formatearPeso(v)}/>
                  <Legend />
                  <Area type="monotone" dataKey="saldo"     stroke="#7C3AED" fill="url(#g1)" strokeWidth={2} name="Saldo total"/>
                  <Area type="monotone" dataKey="depositado" stroke="#3B82F6" fill="none"    strokeWidth={2} name="Depositado" strokeDasharray="4 4"/>
                  <Area type="monotone" dataKey="interes"   stroke="#10B981" fill="url(#g2)" strokeWidth={2} name="Intereses"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Detalle día a día ─────────────────────────────────────────────── */}
            <div className="tarjeta" style={{ marginTop: '1.25rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                <h3 style={{ fontWeight:700 }}>Detalle día a día</h3>
                <div className="filtros-dias">
                  {[7, 30, 90, 180, 365].map(d => (
                    <button key={d}
                      className={`filtro-dia-btn ${diasDetalle === d ? 'activo' : ''}`}
                      onClick={() => cambiarDiasDetalle(d)}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {cargandoDiario && <p className="text-muted text-sm">Calculando...</p>}

              {resultadoDiario && !cargandoDiario && (
                <>
                  <div className="resumen-diario" style={{ marginBottom:'1rem' }}>
                    {[
                      { label:'Hoy (día 1)',      val: formatearPeso(resultadoDiario.interes_hoy) },
                      { label:`Primeros ${diasDetalle}d`, val: formatearPeso(resultadoDiario.interes_total) },
                      { label:'Saldo final',       val: formatearPeso(resultadoDiario.total_final) },
                    ].map(s => (
                      <div key={s.label} className="resumen-diario-item">
                        <span className="text-xs text-muted">{s.label}</span>
                        <span style={{ fontWeight:700, color:'#10B981' }}>{s.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="tabla-diaria-wrapper">
                    <table className="tabla-diaria">
                      <thead>
                        <tr>
                          <th>Día</th>
                          <th>Interés generado</th>
                          <th>Interés acumulado</th>
                          <th>Saldo total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadoDiario.puntos.map((p, i) => (
                          <tr key={p.dia} className={i === 0 ? 'fila-hoy' : ''}>
                            <td>Día {p.dia}</td>
                            <td style={{ color:'#10B981', fontWeight:500 }}>+{formatearPeso(p.interes_generado)}</td>
                            <td>+{formatearPeso(p.interes_acumulado)}</td>
                            <td style={{ fontWeight:600 }}>{formatearPeso(p.saldo_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
