import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, PiggyBank, TrendingUp, Building2, Menu, X } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  const [abierto, setAbierto] = useState(false)

  const enlaces = [
    { a: '/',           etiqueta: 'Inicio',      Icono: LayoutDashboard },
    { a: '/cajitas',    etiqueta: 'Mis Cajitas',  Icono: PiggyBank },
    { a: '/proyeccion', etiqueta: 'Proyección',   Icono: TrendingUp },
    { a: '/bancos',     etiqueta: 'Bancos',       Icono: Building2 },
  ]

  const cerrar = () => setAbierto(false)

  return (
    <nav className="navbar">
      <div className="contenedor navbar-inner">
        <Link to="/" className="navbar-logo" onClick={cerrar}>
          <img src="/logo.jpg" alt="logo" className="navbar-logo-img" />
          <span>RobertApp</span>
        </Link>

        <button
          className="navbar-hamburger"
          onClick={() => setAbierto(a => !a)}
          aria-label="Menú"
        >
          {abierto ? <X size={22} /> : <Menu size={22} />}
        </button>

        <ul className={`navbar-links ${abierto ? 'abierto' : ''}`}>
          {enlaces.map(({ a, etiqueta, Icono }) => (
            <li key={a}>
              <Link
                to={a}
                className={`navbar-link ${pathname === a ? 'activo' : ''}`}
                onClick={cerrar}
              >
                <Icono size={16} />
                {etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
