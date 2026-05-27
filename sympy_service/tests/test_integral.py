import pytest

from app.sympy_ops import SymbolicError, integral


def test_integral_polinomio():
    result, _ = integral("x^2", "x")
    assert result == "x**3/3"


def test_integral_constante():
    result, _ = integral("1", "x")
    assert result == "x"


def test_integral_seno():
    result, _ = integral("sin(x)", "x")
    assert result == "-cos(x)"


def test_integral_um_sobre_x():
    result, _ = integral("1/x", "x")
    assert result == "log(x)"


def test_integral_nao_elementar_nao_quebra():
    # exp(-x^2) nao tem integral elementar; SymPy retorna erf
    result, _ = integral("exp(-x^2)", "x")
    assert "erf" in result.lower() or "sqrt(pi)" in result.lower()


def test_expressao_invalida_levanta():
    with pytest.raises(SymbolicError):
        integral("x^^2", "x")
