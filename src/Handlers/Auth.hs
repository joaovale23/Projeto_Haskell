module Handlers.Auth
  ( authServer
  ) where

import API.Routes (AuthAPI)
import API.Types
import App.Monad (AppM)
import Control.Exception (throwIO)
import Control.Monad.IO.Class (liftIO)
import Servant
import qualified Services.AuthService as Auth

authServer :: ServerT AuthAPI AppM
authServer = handleRegister :<|> handleLogin

handleRegister :: RegisterRequest -> AppM UserResponse
handleRegister RegisterRequest{..} = do
  result <- Auth.register rrEmail rrPassword rrName rrRole
  case result of
    Right entity                  -> pure (toUserResponse entity)
    Left  Auth.EmailAlreadyExists -> liftIO (throwIO err409 { errBody = "Email ja cadastrado" })
    Left  Auth.InvalidEmail       -> liftIO (throwIO err400 { errBody = "Email invalido" })
    Left  Auth.PasswordTooShort   -> liftIO (throwIO err400 { errBody = "Senha deve ter ao menos 6 caracteres" })

handleLogin :: LoginRequest -> AppM UserResponse
handleLogin LoginRequest{..} = do
  result <- Auth.login lrEmail lrPassword
  case result of
    Right entity             -> pure (toUserResponse entity)
    Left  Auth.UserNotFound  -> liftIO (throwIO err401 { errBody = "Credenciais invalidas" })
    Left  Auth.WrongPassword -> liftIO (throwIO err401 { errBody = "Credenciais invalidas" })
