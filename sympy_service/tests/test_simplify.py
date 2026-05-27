import pytest

from app.sympy_ops import SymbolicError, simplify


def test_identidade_pitagoras():
    result, _ = simplify("sin(x)^2 + cos(x)^2")
    assert result == "1"


def test_fatoracao():
    result, _ = simplify("(x^2 - 1)/(x - 1)")
    assert result == "x + 1"


def test_expressao_ja_simples_idempotente():
    result, _ = simplify("x + 1")
    assert result == "x + 1"


def test_simplifica_soma_de_termos():
    result, _ = simplify("2*x + 3*x")
    assert result == "5*x"


def test_expressao_invalida_levanta():
    with pytest.raises(SymbolicError):
        simplify("x^^2")
