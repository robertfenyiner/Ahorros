from fastapi import APIRouter
from esquemas import SolicitudProyeccion, RespuestaProyeccion, PuntoProyeccion
from calculos import proyectar_meses

router = APIRouter(prefix="/proyeccion", tags=["proyección"])


@router.post("/", response_model=RespuestaProyeccion)
def calcular_proyeccion(datos: SolicitudProyeccion):
    puntos_raw = proyectar_meses(
        capital_inicial=datos.capital_inicial,
        aporte_mensual=datos.aporte_mensual,
        tasa_anual_pct=datos.tasa_anual,
        meses=datos.meses,
    )
    puntos = [PuntoProyeccion(**p) for p in puntos_raw]
    ultimo = puntos[-1] if puntos else None

    return RespuestaProyeccion(
        puntos=puntos,
        total_final=ultimo.saldo if ultimo else datos.capital_inicial,
        interes_total=ultimo.interes_acumulado if ultimo else 0.0,
        total_depositado=ultimo.total_depositado if ultimo else datos.capital_inicial,
    )
