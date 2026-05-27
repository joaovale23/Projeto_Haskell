import pytest

from app.sympy_ops import SymbolicError, derivative


def test_derivada_polinomio():
    result, _ = derivative("x^2", "x")
    assert result == "2*x"


def test_derivada_seno():
    result, _ = derivative("sin(x)", "x")
    assert result == "cos(x)"


def test_derivada_soma():
    result, _ = derivative("x^2 + sin(x)", "x")
    assert result == "2*x + cos(x)"


def test_derivada_outra_variavel():
    result, _ = derivative("y^3", "y")
    assert result == "3*y**2"


def test_latex_nao_vazio():
    _, latex = derivative("x^2", "x")
    assert latex  # so checa que veio algo
    assert "x" in latex


def test_expressao_invalida_levanta():
    with pytest.raises(SymbolicError):
        derivative("x^^2", "x")


def test_variavel_invalida_levanta():
    with pytest.raises(SymbolicError):
        derivative("x^2", "1bad")
