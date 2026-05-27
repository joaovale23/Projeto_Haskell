from __future__ import annotations

from pydantic import BaseModel, Field


class ExprRequest(BaseModel):
    expression: str = Field(..., description="Expressao matematica, ex: 'x^2 + sin(x)'")
    variable: str = Field("x", description="Variavel principal")


class SimplifyRequest(BaseModel):
    expression: str


class EvaluateRequest(BaseModel):
    expression: str
    variables: dict[str, float] = Field(default_factory=dict)


class SymbolicResponse(BaseModel):
    result: str
    latex: str


class EvaluateResponse(SymbolicResponse):
    value: float


class ErrorResponse(BaseModel):
    error: str
