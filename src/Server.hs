{-# LANGUAGE ScopedTypeVariables #-}

module Server
  ( app
  , server
  ) where

import API.Routes (API, apiProxy)
import App.Env (Env)
import App.Monad (AppM (..))
import Control.Exception (try)
import Control.Monad.IO.Class (liftIO)
import Control.Monad.Reader (runReaderT)
import Handlers.Auth (authServer)
import Handlers.Diagnostic (diagnosticServer)
import Handlers.Exercise (exerciseServer)
import Handlers.Lesson (lessonServer)
import Handlers.Module (moduleServer)
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

nt :: Env -> AppM a -> Handler a
nt env action = do
  result <- liftIO (try (runReaderT (runAppM action) env))
  case result of
    Left (err :: ServerError) -> throwError err
    Right v                   -> pure v

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
