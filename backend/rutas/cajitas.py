from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from base_datos import obtener_db
from modelos import Cajita, Movimiento, HistorialTasa
from esquemas import (
    CajitaCrear, CajitaActualizar, CajitaRespuesta, ResumenCajita,
    MovimientoRespuesta, CambiarTasaRequest, HistorialTasaRespuesta,
)
from calculos import calcular_interes_con_historial, proyectar_meses

router = APIRouter(prefix="/cajitas", tags=["cajitas"])


def _calcular_resumen(cajita: Cajita, movimientos: list) -> ResumenCajita:
    """Calcula el resumen financiero de una cajita usando historial de tasas."""
    historial = list(cajita.historial_tasas) if cajita.historial_tasas else []

    saldo_actual, interes_ganado, _ = calcular_interes_con_historial(
        movimientos=movimientos,
        historial_tasas=historial,
        fallback_tasa=cajita.tasa_anual,
        fallback_fecha=cajita.creada_en,
        fecha_actual=datetime.utcnow(),
    )

    total_depositado = sum(m.monto for m in movimientos if m.tipo == "deposito")
    total_retirado = sum(m.monto for m in movimientos if m.tipo == "retiro")

    proyeccion = proyectar_meses(saldo_actual, 0, cajita.tasa_anual, 12)

    return ResumenCajita(
        saldo_actual=saldo_actual,
        interes_ganado=interes_ganado,
        total_depositado=round(total_depositado, 2),
        total_retirado=round(total_retirado, 2),
        proyeccion_1_mes=proyeccion[0]["saldo"] if proyeccion else saldo_actual,
        proyeccion_6_meses=proyeccion[5]["saldo"] if len(proyeccion) >= 6 else saldo_actual,
        proyeccion_1_anio=proyeccion[11]["saldo"] if len(proyeccion) >= 12 else saldo_actual,
    )


@router.get("/", response_model=list[CajitaRespuesta])
def listar_cajitas(db: Session = Depends(obtener_db)):
    cajitas = db.query(Cajita).all()
    resultado = []
    for c in cajitas:
        resumen = _calcular_resumen(c, c.movimientos)
        resp = CajitaRespuesta.model_validate(c)
        resp.resumen = resumen
        resultado.append(resp)
    return resultado


@router.post("/", response_model=CajitaRespuesta, status_code=201)
def crear_cajita(datos: CajitaCrear, db: Session = Depends(obtener_db)):
    cajita = Cajita(**datos.model_dump())
    db.add(cajita)
    db.flush()  # obtener el id sin cerrar la transacción

    # Registrar la tasa inicial en el historial
    tasa_inicial = HistorialTasa(
        cajita_id=cajita.id,
        tasa_anual=cajita.tasa_anual,
        fecha_inicio=cajita.creada_en,
        nota="Tasa inicial",
    )
    db.add(tasa_inicial)
    db.commit()
    db.refresh(cajita)

    resp = CajitaRespuesta.model_validate(cajita)
    resp.resumen = _calcular_resumen(cajita, [])
    return resp


@router.get("/{cajita_id}", response_model=CajitaRespuesta)
def obtener_cajita(cajita_id: int, db: Session = Depends(obtener_db)):
    cajita = db.query(Cajita).filter(Cajita.id == cajita_id).first()
    if not cajita:
        raise HTTPException(status_code=404, detail="Cajita no encontrada")
    resp = CajitaRespuesta.model_validate(cajita)
    resp.resumen = _calcular_resumen(cajita, cajita.movimientos)
    return resp


@router.put("/{cajita_id}", response_model=CajitaRespuesta)
def actualizar_cajita(cajita_id: int, datos: CajitaActualizar, db: Session = Depends(obtener_db)):
    cajita = db.query(Cajita).filter(Cajita.id == cajita_id).first()
    if not cajita:
        raise HTTPException(status_code=404, detail="Cajita no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(cajita, campo, valor)
    db.commit()
    db.refresh(cajita)
    resp = CajitaRespuesta.model_validate(cajita)
    resp.resumen = _calcular_resumen(cajita, cajita.movimientos)
    return resp


@router.delete("/{cajita_id}", status_code=204)
def eliminar_cajita(cajita_id: int, db: Session = Depends(obtener_db)):
    cajita = db.query(Cajita).filter(Cajita.id == cajita_id).first()
    if not cajita:
        raise HTTPException(status_code=404, detail="Cajita no encontrada")
    db.delete(cajita)
    db.commit()


@router.get("/{cajita_id}/movimientos", response_model=list[MovimientoRespuesta])
def listar_movimientos(cajita_id: int, db: Session = Depends(obtener_db)):
    cajita = db.query(Cajita).filter(Cajita.id == cajita_id).first()
    if not cajita:
        raise HTTPException(status_code=404, detail="Cajita no encontrada")
    return cajita.movimientos


# ── Detalle diario ────────────────────────────────────────────────────────────

@router.get("/{cajita_id}/detalle-diario")
def obtener_detalle_diario(
    cajita_id: int,
    dias: int = 30,
    db: Session = Depends(obtener_db),
):
    """Proyecta el interés estimado día a día para los próximos N días desde el saldo actual."""
    cajita = db.query(Cajita).filter(Cajita.id == cajita_id).first()
    if not cajita:
        raise HTTPException(status_code=404, detail="Cajita no encontrada")

    dias = min(max(1, dias), 365)

    # Calcular el saldo real actual (incluye todos los intereses ya devengados)
    resumen = _calcular_resumen(cajita, cajita.movimientos)
    saldo_actual = resumen.saldo_actual

    if saldo_actual <= 0:
        return []

    from calculos import proyectar_dias
    from datetime import date, timedelta

    hoy = date.today()
    puntos = proyectar_dias(saldo_actual, 0, cajita.tasa_anual, dias)

    return [
        {
            "dia": p["dia"],
            "fecha": (hoy + timedelta(days=p["dia"] - 1)).isoformat(),
            "interes_generado": p["interes_generado"],
            "tasa_vigente": cajita.tasa_anual,
            "saldo_total": p["saldo_total"],
        }
        for p in puntos
    ]


# ── Historial de tasas ────────────────────────────────────────────────────────

@router.get("/{cajita_id}/tasas", response_model=list[HistorialTasaRespuesta])
def obtener_historial_tasas(cajita_id: int, db: Session = Depends(obtener_db)):
    """Devuelve el historial completo de tasas de una cajita, del más reciente al más antiguo."""
    cajita = db.query(Cajita).filter(Cajita.id == cajita_id).first()
    if not cajita:
        raise HTTPException(status_code=404, detail="Cajita no encontrada")
    return sorted(cajita.historial_tasas, key=lambda t: t.fecha_inicio, reverse=True)


@router.post("/{cajita_id}/cambiar-tasa", response_model=CajitaRespuesta)
def cambiar_tasa(cajita_id: int, datos: CambiarTasaRequest, db: Session = Depends(obtener_db)):
    """
    Registra un cambio de tasa de rendimiento desde hoy en adelante.
    El historial previo se conserva para el cálculo correcto de intereses.
    """
    cajita = db.query(Cajita).filter(Cajita.id == cajita_id).first()
    if not cajita:
        raise HTTPException(status_code=404, detail="Cajita no encontrada")

    if datos.tasa_anual == cajita.tasa_anual:
        raise HTTPException(status_code=400, detail="La nueva tasa es igual a la tasa actual")

    # Actualizar la tasa vigente del cajita
    cajita.tasa_anual = datos.tasa_anual

    # Agregar entrada al historial
    nueva_entrada = HistorialTasa(
        cajita_id=cajita_id,
        tasa_anual=datos.tasa_anual,
        fecha_inicio=datetime.utcnow(),
        nota=datos.nota,
    )
    db.add(nueva_entrada)
    db.commit()
    db.refresh(cajita)

    resp = CajitaRespuesta.model_validate(cajita)
    resp.resumen = _calcular_resumen(cajita, cajita.movimientos)
    return resp
