from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from base_datos import obtener_db
from modelos import Cajita, Movimiento
from esquemas import (
    CajitaCrear, CajitaActualizar, CajitaRespuesta, ResumenCajita,
    MovimientoRespuesta,
)
from calculos import calcular_interes_compuesto, proyectar_meses

router = APIRouter(prefix="/cajitas", tags=["cajitas"])


def _calcular_resumen(cajita: Cajita, movimientos: list) -> ResumenCajita:
    total_depositado = sum(m.monto for m in movimientos if m.tipo == "deposito")
    total_retirado = sum(m.monto for m in movimientos if m.tipo == "retiro")
    saldo_actual = total_depositado - total_retirado

    # Interés ganado aproximado: diferencia entre saldo proyectado y depósitos netos
    # (simplificación: calculamos sobre el saldo actual por los días transcurridos)
    if cajita.creada_en and saldo_actual > 0:
        dias = (datetime.utcnow() - cajita.creada_en).days
        saldo_con_interes = calcular_interes_compuesto(saldo_actual, cajita.tasa_anual, dias)
        interes_ganado = max(0, saldo_con_interes - saldo_actual)
    else:
        interes_ganado = 0.0

    proyeccion = proyectar_meses(saldo_actual, 0, cajita.tasa_anual, 12)

    return ResumenCajita(
        saldo_actual=round(saldo_actual, 2),
        interes_ganado=round(interes_ganado, 2),
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
