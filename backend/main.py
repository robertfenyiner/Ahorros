from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import modelos
from base_datos import motor
from rutas import cajitas, movimientos, proyeccion, bancos

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
app.include_router(bancos.router)


@app.on_event("startup")
def sembrar_bancos():
    """Siembra bancos por defecto si la tabla está vacía."""
    from sqlalchemy.orm import Session
    with Session(motor) as db:
        if db.query(modelos.Banco).count() == 0:
            defaults = [
                modelos.Banco(nombre="Nu Colombia",   tasa_anual=8.75),
                modelos.Banco(nombre="Bold",          tasa_anual=8.50),
                modelos.Banco(nombre="Bancolombia",   tasa_anual=5.50),
                modelos.Banco(nombre="Uala",          tasa_anual=5.00),
                modelos.Banco(nombre="Davivienda",    tasa_anual=5.20),
                modelos.Banco(nombre="BBVA Colombia", tasa_anual=4.80),
            ]
            for b in defaults:
                db.add(b)
            db.commit()


@app.get("/")
def raiz():
    return {"mensaje": "API Ahorros funcionando ✓", "version": "1.0.0"}
