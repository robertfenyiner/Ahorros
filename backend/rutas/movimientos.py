from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from base_datos import obtener_db
from modelos import Cajita, Movimiento
from esquemas import MovimientoCrear, MovimientoRespuesta

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

    # Validar que un retiro no supere el saldo disponible
    if datos.tipo == "retiro":
        total_dep = sum(m.monto for m in cajita.movimientos if m.tipo == "deposito")
        total_ret = sum(m.monto for m in cajita.movimientos if m.tipo == "retiro")
        saldo = total_dep - total_ret
        if datos.monto > saldo:
            raise HTTPException(
                status_code=400,
                detail=f"Saldo insuficiente. Disponible: ${saldo:,.2f}"
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
