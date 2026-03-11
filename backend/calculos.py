from math import pow
from datetime import datetime, timedelta


def calcular_interes_compuesto(capital: float, tasa_anual_pct: float, dias: int) -> float:
    """
    Calcula el monto final usando interés compuesto diario.
    Fórmula: M = C × (1 + TEA)^(días/365)
    """
    if capital <= 0 or tasa_anual_pct <= 0 or dias <= 0:
        return capital
    tea = tasa_anual_pct / 100
    return capital * pow(1 + tea, dias / 365)


def calcular_interes_con_historial(
    movimientos: list,
    historial_tasas: list,
    fallback_tasa: float = 0.0,
    fallback_fecha=None,
    fecha_actual=None,
) -> tuple:
    """
    Calcula el saldo real con interés compuesto respetando el historial de tasas.
    Cada tramo entre eventos (depósito, retiro o cambio de tasa) usa la tasa vigente.

    Returns: (saldo_con_interes, interes_ganado, capital_neto)
    """
    from datetime import datetime

    if fecha_actual is None:
        fecha_actual = datetime.utcnow()

    # Si no hay historial de tasas, construir uno sintético con los datos del cajita
    class _TasaSint:
        def __init__(self, tasa, fecha):
            self.tasa_anual = tasa
            self.fecha_inicio = fecha

    if historial_tasas:
        tasas = sorted(historial_tasas, key=lambda t: t.fecha_inicio)
    elif fallback_fecha:
        tasas = [_TasaSint(fallback_tasa, fallback_fecha)]
    else:
        tasas = []

    if not tasas and not movimientos:
        return 0.0, 0.0, 0.0

    # Construir timeline mezclando movimientos y cambios de tasa
    # orden=0 para tasas (se aplican antes que depósitos del mismo día)
    eventos = []
    for m in movimientos:
        eventos.append({"fecha": m.fecha, "orden": 1, "tipo": "movimiento", "obj": m})
    for t in tasas:
        eventos.append({"fecha": t.fecha_inicio, "orden": 0, "tipo": "tasa", "obj": t})

    if not eventos:
        return 0.0, 0.0, 0.0

    eventos.sort(key=lambda e: (e["fecha"], e["orden"]))

    tasa_actual = tasas[0].tasa_anual
    saldo = 0.0
    capital_neto = 0.0
    ultima_fecha = eventos[0]["fecha"]

    for evento in eventos:
        dias = max(0, (evento["fecha"] - ultima_fecha).days)
        if dias > 0 and saldo > 0 and tasa_actual > 0:
            saldo = calcular_interes_compuesto(saldo, tasa_actual, dias)

        if evento["tipo"] == "movimiento":
            obj = evento["obj"]
            if obj.tipo == "deposito":
                saldo += obj.monto
                capital_neto += obj.monto
            else:
                saldo = max(0.0, saldo - obj.monto)
                capital_neto -= obj.monto
        else:
            tasa_actual = evento["obj"].tasa_anual

        ultima_fecha = evento["fecha"]

    # Interés desde el último evento hasta hoy
    dias = max(0, (fecha_actual - ultima_fecha).days)
    if dias > 0 and saldo > 0 and tasa_actual > 0:
        saldo = calcular_interes_compuesto(saldo, tasa_actual, dias)

    interes_ganado = max(0.0, saldo - capital_neto)
    return round(saldo, 2), round(interes_ganado, 2), round(capital_neto, 2)


def proyectar_meses(
    capital_inicial: float,
    aporte_mensual: float,
    tasa_anual_pct: float,
    meses: int,
) -> list[dict]:
    """
    Genera una proyección mes a mes con aportes periódicos.
    Capitalización mensual equivalente a la TEA.
    """
    tea = tasa_anual_pct / 100
    tasa_mensual = pow(1 + tea, 1 / 12) - 1

    saldo = capital_inicial
    total_depositado = capital_inicial
    puntos = []

    for mes in range(1, meses + 1):
        saldo = saldo * (1 + tasa_mensual) + aporte_mensual
        total_depositado += aporte_mensual
        puntos.append({
            "mes": mes,
            "saldo": round(saldo, 2),
            "interes_acumulado": round(saldo - total_depositado, 2),
            "total_depositado": round(total_depositado, 2),
        })

    return puntos


def proyectar_dias(
    capital_inicial: float,
    aporte_mensual: float,
    tasa_anual_pct: float,
    dias: int,
) -> list[dict]:
    """
    Proyección día a día con capitalización diaria.
    Los aportes mensuales se añaden cada 30 días.
    """
    if dias <= 0 or capital_inicial < 0:
        return []

    tasa_diaria = pow(1 + tasa_anual_pct / 100, 1 / 365) - 1
    saldo = capital_inicial
    total_depositado = capital_inicial
    puntos = []

    for dia in range(1, dias + 1):
        if dia > 1 and (dia - 1) % 30 == 0 and aporte_mensual > 0:
            saldo += aporte_mensual
            total_depositado += aporte_mensual

        interes_dia = max(0.0, saldo * tasa_diaria)
        saldo += interes_dia

        puntos.append({
            "dia": dia,
            "interes_generado": round(interes_dia, 2),
            "saldo_total": round(saldo, 2),
            "interes_acumulado": round(saldo - total_depositado, 2),
            "total_depositado": round(total_depositado, 2),
        })

    return puntos


def calcular_detalle_diario(
    movimientos: list,
    historial_tasas: list,
    fallback_tasa: float = 0.0,
    fallback_fecha=None,
    dias: int = 30,
    fecha_actual=None,
) -> list[dict]:
    """
    Calcula el interés real ganado día a día en una cajita.
    Respeta el historial de tasas y los movimientos reales.
    Devuelve los últimos `dias` días (o todos si hubo menos).
    """
    if fecha_actual is None:
        fecha_actual = datetime.utcnow()

    if not movimientos:
        return []

    class _T:
        def __init__(self, tasa, fecha):
            self.tasa_anual = tasa
            self.fecha_inicio = fecha

    tasas = sorted(
        historial_tasas if historial_tasas else [_T(fallback_tasa, fallback_fecha)],
        key=lambda t: t.fecha_inicio,
    )

    def get_tasa(fecha_d):
        vigente = tasas[0].tasa_anual
        for t in tasas:
            if t.fecha_inicio.date() <= fecha_d:
                vigente = t.tasa_anual
        return vigente

    movs_por_dia = {}
    for m in movimientos:
        d = m.fecha.date()
        movs_por_dia.setdefault(d, []).append(m)

    primer_dia = min(m.fecha for m in movimientos).date()
    ultimo_dia = fecha_actual.date()

    saldo = 0.0
    todos = []
    d = primer_dia

    while d <= ultimo_dia:
        # Aplicar movimientos al inicio del día
        for m in sorted(movs_por_dia.get(d, []), key=lambda x: x.fecha):
            if m.tipo == "deposito":
                saldo += m.monto
            else:
                saldo = max(0.0, saldo - m.monto)

        tasa = get_tasa(d)
        tasa_diaria = pow(1 + tasa / 100, 1 / 365) - 1
        interes = max(0.0, saldo * tasa_diaria)
        saldo += interes

        todos.append({
            "dia": (d - primer_dia).days + 1,
            "fecha": d.isoformat(),
            "interes_generado": round(interes, 2),
            "tasa_vigente": tasa,
            "saldo_total": round(saldo, 2),
        })

        d += timedelta(days=1)

    # Devolver los últimos `dias` días
    return todos[-dias:] if len(todos) > dias else todos
