from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from base_datos import obtener_db
from modelos import Banco
from esquemas import BancoCrear, BancoActualizar, BancoRespuesta

router = APIRouter(prefix="/bancos", tags=["bancos"])


@router.get("/", response_model=list[BancoRespuesta])
def listar_bancos(db: Session = Depends(obtener_db)):
    return db.query(Banco).order_by(Banco.tasa_anual.desc()).all()


@router.post("/", response_model=BancoRespuesta, status_code=201)
def crear_banco(datos: BancoCrear, db: Session = Depends(obtener_db)):
    existente = db.query(Banco).filter(Banco.nombre == datos.nombre).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un banco con ese nombre")
    banco = Banco(**datos.model_dump())
    db.add(banco)
    db.commit()
    db.refresh(banco)
    return banco


@router.put("/{banco_id}", response_model=BancoRespuesta)
def actualizar_banco(banco_id: int, datos: BancoActualizar, db: Session = Depends(obtener_db)):
    banco = db.query(Banco).filter(Banco.id == banco_id).first()
    if not banco:
        raise HTTPException(status_code=404, detail="Banco no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(banco, campo, valor)
    db.commit()
    db.refresh(banco)
    return banco


@router.delete("/{banco_id}", status_code=204)
def eliminar_banco(banco_id: int, db: Session = Depends(obtener_db)):
    banco = db.query(Banco).filter(Banco.id == banco_id).first()
    if not banco:
        raise HTTPException(status_code=404, detail="Banco no encontrado")
    db.delete(banco)
    db.commit()
