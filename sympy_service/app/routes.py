from __future__ import annotations

from fastapi import APIRouter, HTTPException

from . import sympy_ops
from .schemas import (
    EvaluateRequest,
    EvaluateResponse,
    ExprRequest,
    SimplifyRequest,
    SymbolicResponse,
)

router = APIRouter(prefix="/symbolic")


def _guard(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except sympy_ops.SymbolicError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/derivative", response_model=SymbolicResponse)
def derivative(req: ExprRequest) -> SymbolicResponse:
    result, latex = _guard(sympy_ops.derivative, req.expression, req.variable)
    return SymbolicResponse(result=result, latex=latex)


@router.post("/integral", response_model=SymbolicResponse)
def integral(req: ExprRequest) -> SymbolicResponse:
    result, latex = _guard(sympy_ops.integral, req.expression, req.variable)
    return SymbolicResponse(result=result, latex=latex)


@router.post("/simplify", response_model=SymbolicResponse)
def simplify(req: SimplifyRequest) -> SymbolicResponse:
    result, latex = _guard(sympy_ops.simplify, req.expression)
    return SymbolicResponse(result=result, latex=latex)


@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    result, value, latex = _guard(sympy_ops.evaluate, req.expression, req.variables)
    return EvaluateResponse(result=result, value=value, latex=latex)
