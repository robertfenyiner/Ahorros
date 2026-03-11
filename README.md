# RobertApp — Control de Ahorros

App full-stack para gestionar cajitas de ahorro con cálculo de interés compuesto diario.

- **Backend**: FastAPI + SQLite · puerto `8000`
- **Frontend**: React + Vite · puerto `5173`
- **Servidor**: Ubuntu 22.04 · IP `158.220.100.148`

---

## Funcionalidades

- Crear, editar y eliminar **cajitas** de ahorro con colores y metas personalizadas
- Historial de **tasas** por cajita (interés compuesto multi-tramo)
- Tabla de **interés día a día** con proyección futura (filtros 7d / 30d / 90d / 180d / 365d)
- **Proyección** mensual y diaria con selector de banco
- CRUD de **bancos** con tasas EA de referencia (Nu, Bold, Bancolombia, Davivienda, Uala, BBVA)
- Responsive · logo del gato · saludo personalizado

---

## Stack

| Capa      | Tecnología                          |
|-----------|-------------------------------------|
| Backend   | Python · FastAPI · SQLite · SQLAlchemy |
| Frontend  | React · Vite · Recharts             |
| API       | REST · JSON · CORS habilitado       |
| Deploy    | systemd services (auto-start)       |

---

## Estructura del proyecto

```
Ahorros/
├── backend/
│   ├── main.py           # FastAPI app + startup seeds
│   ├── modelos.py        # SQLAlchemy models (Cajita, Movimiento, HistorialTasa, Banco)
│   ├── esquemas.py       # Pydantic schemas
│   ├── calculos.py       # Interés compuesto, proyecciones diarias y mensuales
│   └── rutas/
│       ├── cajitas.py    # CRUD + historial tasas + detalle-diario
│       ├── movimientos.py
│       ├── proyeccion.py # Proyección mensual y diaria
│       └── bancos.py     # CRUD bancos
├── frontend/
│   ├── public/logo.jpg   # Logo del gato
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── components/Navbar.jsx
│       └── pages/        # Inicio, Cajitas, DetalleCajita, Proyeccion, Bancos
└── deploy/
    ├── robertapp-backend.service   # systemd: uvicorn puerto 8000
    └── robertapp-frontend.service  # systemd: vite puerto 5173
```

---

## Desarrollo local

```bash
# Backend (puerto 8000)
cd backend
pip3 install fastapi uvicorn sqlalchemy pydantic
uvicorn main:app --reload

# Frontend (puerto 5173)
cd frontend
npm install
npm run dev
```

---

## Deploy en producción (servidor limpio)

### 1. Clonar el repositorio

```bash
git clone https://github.com/robertfenyiner/Ahorros.git /root/Ahorros
cd /root/Ahorros
```

### 2. Instalar dependencias

```bash
# Backend
pip3 install fastapi uvicorn sqlalchemy pydantic

# Frontend
cd frontend && npm install && cd ..
```

### 3. Instalar servicios systemd (auto-inicio en boot)

```bash
cp deploy/robertapp-backend.service /etc/systemd/system/
cp deploy/robertapp-frontend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable robertapp-backend robertapp-frontend
systemctl start robertapp-backend robertapp-frontend
```

### 4. Verificar

```bash
systemctl status robertapp-backend robertapp-frontend
curl http://localhost:8000/
curl http://localhost:5173/
```

---

## Comandos de operación

```bash
# Ver logs en tiempo real
journalctl -u robertapp-backend -f
journalctl -u robertapp-frontend -f

# Reiniciar tras cambios en el código
systemctl restart robertapp-backend
systemctl restart robertapp-frontend

# Estado de los servicios
systemctl status robertapp-backend robertapp-frontend
```

---

## Acceso

- **Frontend**: http://158.220.100.148:5173
- **API docs (Swagger)**: http://158.220.100.148:8000/docs
