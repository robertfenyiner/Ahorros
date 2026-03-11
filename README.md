# 💰 Mis Ahorros

Aplicación web para gestionar tus ahorros con interés compuesto real, pensada para Colombia.

## Características

- **Cajitas** de ahorro independientes con metas y colores personalizados
- Registro de **depósitos y retiros** con historial completo
- Cálculo de **intereses ganados** en tiempo real
- **Proyección gráfica** mes a mes por cajita
- **Simulador** de proyección con tasas de referencia (Nu Colombia, Bancolombia, etc.)
- Tasa por defecto: **8.75% EA** (Nu Colombia Cajitas)

## Stack

| Capa      | Tecnología               |
|-----------|--------------------------|
| Backend   | Python · FastAPI · SQLite |
| Frontend  | React · Vite · Recharts  |
| API       | REST · JSON              |

## Arrancar en desarrollo

```bash
# Backend (puerto 8000)
cd backend
pip3 install -r requisitos.txt
uvicorn main:app --reload

# Frontend (puerto 5173)
cd frontend
npm install
npm run dev
```

## API Docs

Disponible en `http://localhost:8000/docs` (Swagger UI automático de FastAPI).
