{-# LANGUAGE ScopedTypeVariables #-}

module Server
  ( app
  , server
  ) where

import API.Routes (API, apiProxy)
import App.Env (Env)
import App.Monad (AppM (..))
import Control.Exception (SomeException, fromException)
import Control.Monad.IO.Class (liftIO)
import Control.Monad.Reader (runReaderT)
import System.IO (hPutStrLn, stderr)
import UnliftIO.Exception (tryAny)
import Handlers.Auth (authServer)
import Handlers.Dashboard (dashboardServer)
import Handlers.Diagnostic (diagnosticServer)
import Handlers.Exercise (exerciseServer)
import Handlers.Lesson (lessonServer)
import Handlers.Module (moduleServer)
import Handlers.Profile (profileServer)
import Handlers.Progress (progressServer)
import Handlers.Roadmap (roadmapServer)
import Network.Wai (Middleware)
import Network.Wai.Middleware.Cors
  ( CorsResourcePolicy (..)
  , cors
  , simpleCorsResourcePolicy
  )
import Servant

server :: ServerT API AppM
server =
       authServer
  :<|> moduleServer
  :<|> lessonServer
  :<|> exerciseServer
  :<|> progressServer
  :<|> roadmapServer
  :<|> diagnosticServer
  :<|> dashboardServer
  :<|> profileServer

nt :: Env -> AppM a -> Handler a
nt env action = do
  -- tryAny captura apenas exceções síncronas (exceções assíncronas, como
  -- cancelamento/desconexão, são repassadas para o servidor tratar).
  result <- liftIO (tryAny (runReaderT (runAppM action) env))
  case result of
    Right v -> pure v
    -- ServerError lançado deliberadamente (404/403/...) é repassado como está.
    -- Qualquer outra exceção (ex.: violação de FK/constraint no banco) vira um
    -- 500 — assim a resposta passa pelo middleware de CORS e o navegador recebe
    -- um erro real em vez de "bloqueado por CORS". O detalhe vai só para o log
    -- do servidor, sem vazar internals na resposta.
    Left (e :: SomeException) -> case fromException e of
      Just (se :: ServerError) -> throwError se
      Nothing -> do
        liftIO (hPutStrLn stderr ("[500] excecao nao tratada: " <> show e))
        throwError err500 { errBody = "Erro interno do servidor" }

corsMiddleware :: Middleware
corsMiddleware = cors (const (Just policy))
  where
    policy = simpleCorsResourcePolicy
      { corsRequestHeaders = ["Content-Type", "Authorization", "X-User-Id"]
      , corsMethods        = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      }

app :: Env -> Application
app env =
  corsMiddleware $
    serve apiProxy (hoistServer apiProxy (nt env) server)
