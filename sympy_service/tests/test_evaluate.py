import math

import pytest

from app.sympy_ops import SymbolicError, evaluate


def test_avalia_polinomio():
    _, value, _ = evaluate("x^2 + 1", {"x": 3})
    assert value == pytest.approx(10.0)


def test_avalia_seno():
    _, value, _ = evaluate("sin(x)", {"x": math.pi})
    assert value == pytest.approx(0.0, abs=1e-10)


def test_avalia_multiplas_variaveis():
    _, value, _ = evaluate("x^2 + y", {"x": 2, "y": 3})
    assert value == pytest.approx(7.0)


def test_expressao_constante_sem_variaveis():
    _, value, _ = evaluate("2 + 3 * 4", {})
    assert value == pytest.approx(14.0)


def test_variavel_faltando_levanta():
    with pytest.raises(SymbolicError) as exc:
        evaluate("x + y", {"x": 1})
    assert "y" in str(exc.value)


def test_expressao_invalida_levanta():
    with pytest.raises(SymbolicError):
        evaluate("x^^2", {"x": 1})
