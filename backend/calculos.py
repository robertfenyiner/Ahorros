from math import pow


def calcular_interes_compuesto(capital: float, tasa_anual_pct: float, dias: int) -> float:
    """
    Calcula el monto final usando interés compuesto diario.
    Fórmula: M = C × (1 + TEA)^(días/365)
    """
    if capital <= 0 or tasa_anual_pct <= 0 or dias <= 0:
        return capital
    tea = tasa_anual_pct / 100
    return capital * pow(1 + tea, dias / 365)


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
