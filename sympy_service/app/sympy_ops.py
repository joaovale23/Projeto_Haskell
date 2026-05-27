"""Funcoes puras sobre SymPy. Sem FastAPI aqui - facilita testes diretos."""
from __future__ import annotations

import sympy
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    convert_xor,
    implicit_multiplication_application,
)

# Aceita "x^2" como "x**2", multiplicacao implicita ("2x" -> "2*x"), etc.
_TRANSFORMS = standard_transformations + (
    convert_xor,
    implicit_multiplication_application,
)


class SymbolicError(ValueError):
    """Erro de dominio: expressao invalida, variavel ausente, etc."""


def _parse(expr: str):
    try:
        return parse_expr(expr, transformations=_TRANSFORMS, evaluate=True)
    except (SyntaxError, TypeError, ValueError) as e:
        raise SymbolicError(f"Expressao invalida: {e}") from e


def _symbol(name: str) -> sympy.Symbol:
    if not name or not name.isidentifier():
        raise SymbolicError(f"Nome de variavel invalido: '{name}'")
    return sympy.Symbol(name)


def derivative(expr: str, variable: str = "x") -> tuple[str, str]:
    parsed = _parse(expr)
    var = _symbol(variable)
    try:
        result = sympy.diff(parsed, var)
    except Exception as e:  # noqa: BLE001
        raise SymbolicError(f"Nao foi possivel derivar: {e}") from e
    return str(result), sympy.latex(result)


def integral(expr: str, variable: str = "x") -> tuple[str, str]:
    parsed = _parse(expr)
    var = _symbol(variable)
    try:
        result = sympy.integrate(parsed, var)
    except Exception as e:  # noqa: BLE001
        raise SymbolicError(f"Nao foi possivel integrar: {e}") from e
    return str(result), sympy.latex(result)


def simplify(expr: str) -> tuple[str, str]:
    parsed = _parse(expr)
    try:
        result = sympy.simplify(parsed)
    except Exception as e:  # noqa: BLE001
        raise SymbolicError(f"Nao foi possivel simplificar: {e}") from e
    return str(result), sympy.latex(result)


def evaluate(expr: str, variables: dict[str, float] | None = None) -> tuple[str, float, str]:
    parsed = _parse(expr)
    bindings = {_symbol(k): v for k, v in (variables or {}).items()}
    free = parsed.free_symbols - set(bindings.keys())
    if free:
        missing = ", ".join(sorted(str(s) for s in free))
        raise SymbolicError(f"Variaveis faltando: {missing}")
    try:
        substituted = parsed.subs(bindings)
        numeric = substituted.evalf()
        value = float(numeric)
    except (TypeError, ValueError) as e:
        raise SymbolicError(f"Nao foi possivel avaliar numericamente: {e}") from e
    return str(numeric), value, sympy.latex(numeric)
