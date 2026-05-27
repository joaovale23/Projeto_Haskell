# sympy_service

Microservico HTTP que expoe calculo simbolico (derivada, integral indefinida,
simplificacao e avaliacao numerica) via FastAPI + SymPy. Consumido diretamente
pelo frontend Next.js do projeto principal (tela `/cas`).

## Rodando sem Docker

```bash
cd sympy_service
python -m venv .venv
.venv\Scripts\Activate.ps1     # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Swagger UI automatico em `http://localhost:8001/docs`.

## Rodando com Docker

A partir da raiz do projeto:

```bash
docker compose up -d sympy
docker compose logs -f sympy
```

## Testes

```bash
pip install pytest
pytest
```
