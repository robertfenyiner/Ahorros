from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from base_datos import obtener_db
from modelos import Cajita, Movimiento
from esquemas import MovimientoCrear, MovimientoRespuesta
from calculos import calcular_interes_con_historial

router = APIRouter(prefix="/cajitas", tags=["movimientos"])


@router.post("/{cajita_id}/movimientos", response_model=MovimientoRespuesta, status_code=201)
def registrar_movimiento(
    cajita_id: int,
    datos: MovimientoCrear,
    db: Session = Depends(obtener_db),
):
    cajita = db.query(Cajita).filter(Cajita.id == cajita_id).first()
    if not cajita:
        raise HTTPException(status_code=404, detail="Cajita no encontrada")

    # Validar que un retiro no supere el saldo real (incluyendo intereses)
    if datos.tipo == "retiro":
        saldo_real, _, _ = calcular_interes_con_historial(
            movimientos=cajita.movimientos,
            historial_tasas=list(cajita.historial_tasas),
            fallback_tasa=cajita.tasa_anual,
            fallback_fecha=cajita.creada_en,
            fecha_actual=datetime.utcnow(),
        )
        if datos.monto > saldo_real:
            raise HTTPException(
                status_code=400,
                detail=f"Saldo insuficiente. Disponible: ${saldo_real:,.2f}"
            )

    movimiento = Movimiento(
        cajita_id=cajita_id,
        tipo=datos.tipo,
        monto=datos.monto,
        nota=datos.nota,
        fecha=datos.fecha or datetime.utcnow(),
    )
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return movimiento


@router.delete("/{cajita_id}/movimientos/{mov_id}", status_code=204)
def eliminar_movimiento(
    cajita_id: int,
    mov_id: int,
    db: Session = Depends(obtener_db),
):
    mov = db.query(Movimiento).filter(
        Movimiento.id == mov_id,
        Movimiento.cajita_id == cajita_id,
    ).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    db.delete(mov)
    db.commit()
