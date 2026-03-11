from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Cajitas ──────────────────────────────────────────────────────────────────

class CajitaCrear(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    meta_monto: Optional[float] = Field(None, ge=0)
    tasa_anual: float = Field(8.75, ge=0, le=100)
    banco: str = "Nu Colombia"
    color: str = "#7C3AED"
    icono: str = "piggy-bank"

class CajitaActualizar(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = None
    meta_monto: Optional[float] = Field(None, ge=0)
    tasa_anual: Optional[float] = Field(None, ge=0, le=100)
    banco: Optional[str] = None
    color: Optional[str] = None
    icono: Optional[str] = None

class ResumenCajita(BaseModel):
    saldo_actual: float
    interes_ganado: float
    total_depositado: float
    total_retirado: float
    proyeccion_1_mes: float
    proyeccion_6_meses: float
    proyeccion_1_anio: float

class CajitaRespuesta(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    meta_monto: Optional[float]
    tasa_anual: float
    banco: str
    color: str
    icono: str
    creada_en: datetime
    resumen: Optional[ResumenCajita] = None

    class Config:
        from_attributes = True


# ── Movimientos ───────────────────────────────────────────────────────────────

class MovimientoCrear(BaseModel):
    tipo: str = Field(..., pattern="^(deposito|retiro)$")
    monto: float = Field(..., gt=0)
    nota: Optional[str] = None
    fecha: Optional[datetime] = None

class MovimientoRespuesta(BaseModel):
    id: int
    cajita_id: int
    tipo: str
    monto: float
    nota: Optional[str]
    fecha: datetime

    class Config:
        from_attributes = True


# ── Proyección ────────────────────────────────────────────────────────────────

class SolicitudProyeccion(BaseModel):
    capital_inicial: float = Field(..., ge=0)
    aporte_mensual: float = Field(0, ge=0)
    tasa_anual: float = Field(8.75, ge=0, le=100)
    meses: int = Field(..., ge=1, le=600)

class PuntoProyeccion(BaseModel):
    mes: int
    saldo: float
    interes_acumulado: float
    total_depositado: float

class RespuestaProyeccion(BaseModel):
    puntos: list[PuntoProyeccion]
    total_final: float
    interes_total: float
    total_depositado: float


# ── Proyección diaria ─────────────────────────────────────────────────────────

class SolicitudProyeccionDiaria(BaseModel):
    capital_inicial: float = Field(..., ge=0)
    aporte_mensual: float = Field(0, ge=0)
    tasa_anual: float = Field(8.75, ge=0, le=100)
    dias: int = Field(..., ge=1, le=365)

class PuntoProyeccionDiaria(BaseModel):
    dia: int
    interes_generado: float
    saldo_total: float
    interes_acumulado: float
    total_depositado: float

class RespuestaProyeccionDiaria(BaseModel):
    puntos: list[PuntoProyeccionDiaria]
    total_final: float
    interes_total: float
    total_depositado: float
    interes_hoy: float
    interes_30_dias: float


# ── Detalle diario cajita ─────────────────────────────────────────────────────

class DetalleDiaRespuesta(BaseModel):
    dia: int
    fecha: str
    interes_generado: float
    tasa_vigente: float
    saldo_total: float


# ── Historial de tasas ────────────────────────────────────────────────────────

class CambiarTasaRequest(BaseModel):
    tasa_anual: float = Field(..., ge=0.01, le=100)
    nota: Optional[str] = None

class HistorialTasaRespuesta(BaseModel):
    id: int
    cajita_id: int
    tasa_anual: float
    fecha_inicio: datetime
    nota: Optional[str]
    registrada_en: datetime

    class Config:
        from_attributes = True
