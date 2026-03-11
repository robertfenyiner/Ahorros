import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Inicio from './pages/Inicio'
import Cajitas from './pages/Cajitas'
import DetalleCajita from './pages/DetalleCajita'
import Proyeccion from './pages/Proyeccion'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Navbar />
      <Routes>
        <Route path="/"              element={<Inicio />} />
        <Route path="/cajitas"       element={<Cajitas />} />
        <Route path="/cajitas/:id"   element={<DetalleCajita />} />
        <Route path="/proyeccion"    element={<Proyeccion />} />
      </Routes>
    </BrowserRouter>
  )
}
