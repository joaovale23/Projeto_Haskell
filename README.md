# Cálculo para Devs

Plataforma educacional para ensino de Cálculo I voltada para programadores, desenvolvida como projeto da disciplina de Tópicos Especiais em Informática (Fatec Rubens Lara — Prof. Alexandre Garcia).

**Fase 2 do MVP** (atual): plataforma educacional propriamente dita — módulos, lições, exercícios com submissão e feedback, progresso por aluno, roadmap com lógica de desbloqueio, avaliação diagnóstica e permissões Teacher vs Student.

## Stack

- **Backend**: Haskell (GHC 9.6.7) · Servant · Persistent + PostgreSQL · ReaderT Pattern · Hspec
- **Frontend**: Next.js 16 · TypeScript · Tailwind CSS · marked (markdown) · Mafs + expr-eval (visualizadores) · KaTeX
- **Microserviço**: Python 3.12 · FastAPI · SymPy (cálculo simbólico, `sympy_service/`)
- **Banco**: PostgreSQL 14+ (testado com 18 local)

## Estrutura

```
.
├── app/                # Entry point Haskell (Main.hs)
├── src/                # Biblioteca: App, Config, Database, Domain, Repositories,
│                       # Services, API, Handlers, Server
├── test/               # Suite Hspec (57 testes: regras puras de Domain + Services)
├── web/                # Frontend Next.js (16 rotas)
├── sympy_service/      # Microserviço Python/FastAPI + SymPy (24 testes pytest)
├── projetoHaskell.cabal
├── cabal.project
├── docker-compose.yml  # Postgres + Adminer (opcional)
└── .env.example
```

## Pré-requisitos

- GHC 9.6.x e Cabal 3.x (via [GHCup](https://www.haskell.org/ghcup/))
- Node.js 20+ e npm
- PostgreSQL 14+ rodando localmente (ou via Docker Compose)

## Configurando o banco

### Opção A — Postgres local

```sql
CREATE DATABASE calculo_devs;
```

Defina a `DATABASE_URL` antes de rodar o servidor:

```powershell
$env:DATABASE_URL = "postgresql://postgres:SUA_SENHA@localhost:5432/calculo_devs"
```

### Opção B — Docker Compose

```bash
docker compose up -d postgres
```

Adminer fica em `http://localhost:8081` (servidor: `postgres`, usuário: `devs`, senha: `devs`).

## Executando o backend

```bash
cabal build all
cabal run projetoHaskell
```

Na primeira execução o app roda as migrações automaticamente (8 tabelas: `user`, `module`, `lesson`, `exercise`, `progress`, `exercise_attempt`, `diagnostic_question`, `diagnostic_result`).

## Rodando os testes

```bash
cabal test --test-show-details=direct
```

**57 testes unitários** cobrem as regras puras de `Domain/` e funções puras de `Services/`:
- `canAccessModule` — desbloqueio de módulos
- `Password` — hash determinístico e verificação
- `checkAnswer` — MultipleChoice / Numeric / OpenText
- `percent` — cálculo de progresso (0..100, edge cases)
- `buildRoadmap` — cascata de desbloqueio
- `analyze` — classificação de forças e fraquezas + recomendações (diagnóstico)
- `requireTeacher` — permissões por Role
- `validateEmail` / `validatePassword` (AuthService)
- agregações do dashboard do professor (DashboardService)

## Executando o frontend

```bash
cd web
npm install   # apenas na primeira vez
npm run dev
```

Abre em `http://localhost:3000`. Rotas:

| Rota | Descrição |
|---|---|
| `/` | Landing simples |
| `/register` · `/login` | Cadastro e login |
| `/roadmap` | Árvore de módulos (Aluno) com badges Concluído / Disponível / Bloqueado |
| `/modules` · `/modules/new` | Listar e criar (Teacher) módulos |
| `/modules/[id]` · `/modules/[id]/edit` | Detalhe e edição (Teacher) do módulo + lições + "marcar concluída" |
| `/modules/[id]/lessons/new` | Criar lição (Teacher) |
| `/lessons/[id]` · `/lessons/[id]/edit` | Conteúdo (markdown + visualizadores) + exercícios com submissão e feedback |
| `/lessons/[id]/exercises/new` · `/lessons/[id]/exercises/[exId]/edit` | Criar e editar exercício (Teacher) |
| `/progress` | Histórico de lições concluídas (Aluno) |
| `/dashboard` | Painel do professor (estatísticas da turma) |
| `/profile` | Perfil do usuário |

> A avaliação diagnóstica existe no **backend** (`/diagnostic/*`), mas ainda não tem tela dedicada no frontend.

## Endpoints da API

### Auth (sem token)

```
POST /auth/register   { rrEmail, rrPassword, rrName, rrRole,
                        rrCourse?, rrEnrollment?, rrSemester?,
                        rrShift?, rrDiscipline? }                -> User
POST /auth/login      { lrEmail, lrPassword }                   -> User | 401
```

### Permissões

Endpoints de mutação exigem header **`X-User-Id`**. `checkTeacher` valida `Role = Teacher`; `requireUserId` apenas exige usuário válido.

### Modules (Teacher para mutations)

```
GET    /modules
GET    /modules/:id
GET    /modules/:id/lessons
POST   /modules                 (X-User-Id: Teacher)
PUT    /modules/:id             (X-User-Id: Teacher)
DELETE /modules/:id             (X-User-Id: Teacher)
```

### Lessons (Teacher para mutations)

```
GET    /lessons/:id
GET    /lessons/:id/exercises   (X-User-Id)  # Teacher recebe gabarito/explicação
GET    /lessons/:id/responses   (X-User-Id)  # respostas já enviadas pelo aluno
POST   /lessons                 (X-User-Id: Teacher)
PUT    /lessons/:id             (X-User-Id: Teacher)
DELETE /lessons/:id             (X-User-Id: Teacher)
```

### Exercises (Teacher para mutations; submissão para qualquer usuário)

```
GET    /exercises/:id
POST   /exercises               (X-User-Id: Teacher)
PUT    /exercises/:id           (X-User-Id: Teacher)
DELETE /exercises/:id           (X-User-Id: Teacher)
POST   /exercises/:id/submit    (X-User-Id) { serAnswer }   -> { sersCorrect, sersExplanation }
```

### Progress (qualquer usuário autenticado)

```
GET    /progress                (X-User-Id)
POST   /progress/complete       (X-User-Id) { clrLessonId }
DELETE /progress/lesson/:id     (X-User-Id)
```

### Roadmap

```
GET    /roadmap                 (X-User-Id) -> [RoadmapItem]
```

### Diagnostic

```
GET    /diagnostic/questions
POST   /diagnostic/submit       (X-User-Id) { dsAnswers: [{ daQuestionId, daSelectedIdx }] }
GET    /diagnostic/result       (X-User-Id) -> último resultado
```

### Dashboard (Teacher)

```
GET    /dashboard               (X-User-Id: Teacher) -> estatísticas da turma
```

### Profile (qualquer usuário autenticado)

```
GET    /profile                 (X-User-Id) -> dados do usuário
PUT    /profile                 (X-User-Id) { puName, puCourse?, puEnrollment?,
                                              puSemester?, puShift?, puDiscipline? }
DELETE /profile                 (X-User-Id) -> remove a própria conta
```

## Exemplo de fluxo via curl

```powershell
# 1. Registrar professor
curl.exe -X POST http://localhost:8080/auth/register -H "Content-Type: application/json" `
  -d '{\"rrEmail\":\"prof@x.com\",\"rrPassword\":\"123456\",\"rrName\":\"Prof\",\"rrRole\":\"Teacher\"}'
# Anote o "urId" retornado, ex: 1

# 2. Criar módulo (como Teacher 1)
curl.exe -X POST http://localhost:8080/modules `
  -H "Content-Type: application/json" -H "X-User-Id: 1" `
  -d '{\"mrqTitle\":\"Limites\",\"mrqSlug\":\"limites\",\"mrqDescription\":\"Intro\",\"mrqOrderIdx\":1,\"mrqPrerequisiteId\":null}'

# 3. Criar lição (Teacher)
curl.exe -X POST http://localhost:8080/lessons `
  -H "Content-Type: application/json" -H "X-User-Id: 1" `
  -d '{\"lrqModuleId\":1,\"lrqTitle\":\"O que e um limite\",\"lrqContent\":\"# Limite\\n\\nUma aproximacao...\",\"lrqOrderIdx\":1}'

# 4. Criar exercício de múltipla escolha (Teacher)
curl.exe -X POST http://localhost:8080/exercises `
  -H "Content-Type: application/json" -H "X-User-Id: 1" `
  -d '{\"erqLessonId\":1,\"erqKind\":\"MultipleChoice\",\"erqPrompt\":\"Quanto e 2+2?\",\"erqPayload\":{\"options\":[\"3\",\"4\",\"5\"]},\"erqAnswer\":1,\"erqExplanation\":\"Soma direta.\",\"erqOrderIdx\":1}'

# 5. Aluno responde (cadastrar Student primeiro, supondo urId=2)
curl.exe -X POST http://localhost:8080/exercises/1/submit `
  -H "Content-Type: application/json" -H "X-User-Id: 2" `
  -d '{\"serAnswer\":1}'
# -> { "sersCorrect": true, "sersExplanation": "Soma direta." }

# 6. Aluno marca lição concluída
curl.exe -X POST http://localhost:8080/progress/complete `
  -H "Content-Type: application/json" -H "X-User-Id: 2" `
  -d '{\"clrLessonId\":1}'

# 7. Aluno consulta roadmap
curl.exe http://localhost:8080/roadmap -H "X-User-Id: 2"
```

## Arquitetura

```
HTTP (Servant)
    ↓
Handlers  (parsing + status codes + checkTeacher/requireUserId)
    ↓
Services  (regras de negócio em AppM = ReaderT Env IO)
    ↓
Repositories  (Persistent)
    ↓
PostgreSQL
```

Toda regra pura vive em `src/Domain/`:
- `Module.canAccessModule`
- `Exercise.checkAnswer`
- `Progress.percent`
- `Roadmap.buildRoadmap` (reaproveita `canAccessModule`)
- `Diagnostic.analyze`
- `Permissions.requireTeacher`

Estas funções são totalmente independentes de IO e cobertas pelos 51 testes Hspec.

## Microserviço SymPy (Fase 4)

Serviço HTTP isolado em `sympy_service/` — Python 3.12 + FastAPI + SymPy — expõe cálculo simbólico via REST. É um serviço **independente** (Dockerfile próprio em `sympy_service/`): o backend Haskell **não** intermedia. A integração com o frontend Next.js (tela `/cas`) ainda **não** foi construída.

### Endpoints

```
GET  /health                              -> { status: "ok" }
POST /symbolic/derivative   { expression, variable } -> { result, latex }
POST /symbolic/integral     { expression, variable } -> { result, latex }
POST /symbolic/simplify     { expression }           -> { result, latex }
POST /symbolic/evaluate     { expression, variables: {x: 2, ...} }
                                                     -> { result, latex, value }
```

Erros viram `400 { detail: "..." }`. Swagger automático em `/docs`.

### Setup local (sem Docker)

```powershell
cd sympy_service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Abra `http://localhost:8001/docs` para testar visualmente.

### Setup com Docker

O serviço tem o próprio `Dockerfile` (não está no `docker-compose.yml` da raiz, que só sobe Postgres + Adminer):

```bash
cd sympy_service
docker build -t sympy-service .
docker run --rm -p 8001:8001 sympy-service
```

### Testes (pytest)

```bash
cd sympy_service
pytest
```

**24 testes** cobrem as 4 operações (derivada, integral, simplificação, avaliação) com casos clássicos + casos de erro.

### Exemplo curl

```bash
curl -X POST http://localhost:8001/symbolic/derivative \
  -H "Content-Type: application/json" \
  -d '{"expression":"x^2 + sin(x)","variable":"x"}'
# {"result":"2*x + cos(x)","latex":"2 x + \\cos{\\left(x \\right)}"}
```

### Tela `/cas` no frontend (planejada)

Calculadora simbólica consumindo este microserviço, com render do resultado em LaTeX via KaTeX. **Ainda não implementada** no frontend — hoje o serviço é exercitado apenas via REST direto (Swagger em `/docs`, curl ou pytest).

---

## Visualizadores interativos em lições

Lições podem embedar visualizadores de Cálculo via shortcodes em parágrafos isolados. Renderizados pelo `LessonContent` no client com [Mafs](https://mafs.dev) + [expr-eval](https://github.com/silentmatt/expr-eval).

### Sintaxe

```
[[viz:function f=x^2+1 xMin=-3 xMax=3]]
[[viz:limit f=sin(x)/x a=0 yMax=1.5]]
[[viz:derivative f=x^2 a=1]]
[[viz:integral f=x^2 a=0 b=2 nMin=2 nMax=40]]
```

Regras:
- Shortcode ocupa uma linha inteira (parágrafo isolado).
- Parâmetros são `chave=valor` separados por espaço, sem aspas (valor não pode conter espaço).
- Valores numéricos são convertidos para `Number`; demais ficam como `string`.
- Expressão em `f` suporta `^`, `sin`, `cos`, `exp`, `log`, `sqrt`, `abs`, etc. (sintaxe expr-eval).
- Parâmetros opcionais têm defaults; expressão inválida renderiza gráfico vazio sem quebrar a página.

### Tipos disponíveis

| `kind` | Interação | Params principais |
|---|---|---|
| `function` | slider de x → mostra (x, f(x)) | `f`, `xMin`, `xMax`, `yMin`, `yMax` |
| `limit` | slider de δ → mostra f(a−δ), f(a+δ) e limite estimado | `f`, `a`, `xMin`, `xMax`, `yMin`, `yMax` |
| `derivative` | slider de h → secante converge para tangente em `a` | `f`, `a`, `xMin`, `xMax`, `yMin`, `yMax` |
| `integral` | slider de n → soma de Riemann (esquerda) com n retângulos em `[a,b]` | `f`, `a`, `b`, `nMin`, `nMax`, `yMax` |

### Exemplo de lição completa

````markdown
# O que é um limite

Em código, um limite é uma aproximação incremental. Quando dizemos
`lim x→0 sin(x)/x`, queremos saber o que f(x) aproxima quando x se aproxima de 0.

[[viz:limit f=sin(x)/x a=0 yMax=1.5]]

Mexa no δ e observe os dois valores convergindo para o mesmo número.

## E a derivada?

A derivada de f em `a` é a inclinação da reta tangente — e ela aparece
quando você reduz `h` na fórmula `(f(a+h)-f(a))/h`:

[[viz:derivative f=x^2 a=1]]
````

## Notas sobre JSON em colunas

`Exercise.payload`/`answer`, `DiagnosticQuestion.options` e `DiagnosticResult.strengths`/`weaknesses`/`recommendedSlugs` são armazenados como `Text` (JSON serializado). A conversão para `Aeson.Value` acontece nos serviços e no `API.Types.decodeStored`. Decisão pragmática: evita depender de `JSONB` específico do Postgres, mantém o schema portável.

## Já implementado nas fases recentes

- Visualizadores interativos (Mafs + expr-eval) embutidos em lições — ver seção acima
- Microserviço Python + SymPy para cálculo simbólico (`sympy_service/`)
- Dashboard do professor com estatísticas da turma
- Perfil do usuário (visualização, edição e exclusão de conta)

## Fora de escopo (próximas fases)

- JWT, refresh tokens, sessões (hoje a autorização usa apenas o header `X-User-Id`)
- Tela `/cas` no frontend consumindo o microserviço SymPy
- Tela de avaliação diagnóstica no frontend (endpoints já existem)
- Property-based testing (QuickCheck)
- Múltiplas tentativas por exercício (hoje a primeira resposta é definitiva)
