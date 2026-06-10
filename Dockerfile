# ---- Build stage ----
FROM haskell:9.4.8-slim-bullseye AS build

# libpq para persistent-postgresql
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Atualiza o índice de pacotes uma vez
RUN cabal update

# Copia apenas os arquivos de configuração primeiro para aproveitar o cache de
# dependências (só refaz o build de deps se .cabal/cabal.project mudarem).
COPY projetoHaskell.cabal cabal.project ./
RUN cabal build --only-dependencies -j

# Agora copia o código-fonte e compila o executável
COPY src ./src
COPY app ./app
RUN cabal install exe:projetoHaskell \
        --installdir=/dist --install-method=copy --overwrite-policy=always

# ---- Runtime stage ----
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /dist/projetoHaskell /app/projetoHaskell

# Render injeta PORT; o app lê PORT e DATABASE_URL do ambiente.
ENV PORT=8080
EXPOSE 8080

CMD ["/app/projetoHaskell"]
