from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from base_datos import Base


class Cajita(Base):
    """Representa una meta de ahorro (cuenta/cajita)."""
    __tablename__ = "cajitas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    meta_monto = Column(Float, nullable=True)          # Meta en COP
    tasa_anual = Column(Float, default=8.75)            # % EA por defecto Nu Colombia
    banco = Column(String(100), default="Nu Colombia")
    color = Column(String(7), default="#7C3AED")        # Color hex para la UI
    icono = Column(String(50), default="piggy-bank")
    creada_en = Column(DateTime, default=datetime.utcnow)

    movimientos = relationship("Movimiento", back_populates="cajita", cascade="all, delete-orphan")
    historial_tasas = relationship(
        "HistorialTasa", back_populates="cajita",
        cascade="all, delete-orphan",
        order_by="HistorialTasa.fecha_inicio",
    )


class Movimiento(Base):
    """Registro de cada depósito o retiro en una cajita."""
    __tablename__ = "movimientos"

    id = Column(Integer, primary_key=True, index=True)
    cajita_id = Column(Integer, ForeignKey("cajitas.id"), nullable=False)
    tipo = Column(String(10), nullable=False)           # "deposito" | "retiro"
    monto = Column(Float, nullable=False)
    nota = Column(Text, nullable=True)
    fecha = Column(DateTime, default=datetime.utcnow)

    cajita = relationship("Cajita", back_populates="movimientos")


class Banco(Base):
    """Banco o entidad financiera con su tasa de rendimiento."""
    __tablename__ = "bancos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    tasa_anual = Column(Float, nullable=False)


class HistorialTasa(Base):
    """Registro de cada cambio de tasa de rendimiento en una cajita."""
    __tablename__ = "historial_tasas"

    id = Column(Integer, primary_key=True, index=True)
    cajita_id = Column(Integer, ForeignKey("cajitas.id"), nullable=False)
    tasa_anual = Column(Float, nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)   # desde cuándo aplica
    nota = Column(Text, nullable=True)
    registrada_en = Column(DateTime, default=datetime.utcnow)

    cajita = relationship("Cajita", back_populates="historial_tasas")
