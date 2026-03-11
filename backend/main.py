from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import modelos
from base_datos import motor
from rutas import cajitas, movimientos, proyeccion

# Crear tablas al iniciar
modelos.Base.metadata.create_all(bind=motor)

app = FastAPI(
    title="API Ahorros",
    description="Gestión de cajitas de ahorro con interés compuesto",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cajitas.router)
app.include_router(movimientos.router)
app.include_router(proyeccion.router)


@app.get("/")
def raiz():
    return {"mensaje": "API Ahorros funcionando ✓", "version": "1.0.0"}
