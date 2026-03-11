import { Link, useLocation } from 'react-router-dom'
import { PiggyBank, LayoutDashboard, TrendingUp } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()

  const enlaces = [
    { a: '/', etiqueta: 'Inicio', Icono: LayoutDashboard },
    { a: '/cajitas', etiqueta: 'Mis Cajitas', Icono: PiggyBank },
    { a: '/proyeccion', etiqueta: 'Proyección', Icono: TrendingUp },
  ]

  return (
    <nav className="navbar">
      <div className="contenedor navbar-inner">
        <Link to="/" className="navbar-logo">
          <PiggyBank size={28} color="#7C3AED" />
          <span>Mis Ahorros</span>
        </Link>
        <ul className="navbar-links">
          {enlaces.map(({ a, etiqueta, Icono }) => (
            <li key={a}>
              <Link to={a} className={`navbar-link ${pathname === a ? 'activo' : ''}`}>
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
