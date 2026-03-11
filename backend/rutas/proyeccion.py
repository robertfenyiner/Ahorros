from fastapi import APIRouter
from esquemas import (
    SolicitudProyeccion, RespuestaProyeccion, PuntoProyeccion,
    SolicitudProyeccionDiaria, RespuestaProyeccionDiaria, PuntoProyeccionDiaria,
)
from calculos import proyectar_meses, proyectar_dias

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


@router.post("/diaria", response_model=RespuestaProyeccionDiaria)
def calcular_proyeccion_diaria(datos: SolicitudProyeccionDiaria):
    """Proyección día a día con capitalización diaria."""
    puntos_raw = proyectar_dias(
        capital_inicial=datos.capital_inicial,
        aporte_mensual=datos.aporte_mensual,
        tasa_anual_pct=datos.tasa_anual,
        dias=datos.dias,
    )
    puntos = [PuntoProyeccionDiaria(**p) for p in puntos_raw]
    ultimo = puntos[-1] if puntos else None

    interes_hoy = puntos[0].interes_generado if puntos else 0.0
    interes_30_dias = sum(p.interes_generado for p in puntos[:30])

    return RespuestaProyeccionDiaria(
        puntos=puntos,
        total_final=ultimo.saldo_total if ultimo else datos.capital_inicial,
        interes_total=ultimo.interes_acumulado if ultimo else 0.0,
        total_depositado=ultimo.total_depositado if ultimo else datos.capital_inicial,
        interes_hoy=round(interes_hoy, 2),
        interes_30_dias=round(interes_30_dias, 2),
    )
