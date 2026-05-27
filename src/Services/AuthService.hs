module Services.AuthService
  ( RegisterError (..)
  , LoginError (..)
  , validateEmail
  , validatePassword
  , register
  , login
  ) where

import App.Monad (AppM, runDb)
import Control.Monad.IO.Class (liftIO)
import Data.Text (Text)
import qualified Data.Text as T
import Data.Time (getCurrentTime)
import Database.Persist (Entity (..))
import Database.Schema
import Domain.Password (hashPassword, verifyPassword)
import Domain.Types (Role)
import qualified Repositories.UserRepo as UserRepo

data RegisterError
  = EmailAlreadyExists
  | InvalidEmail
  | PasswordTooShort
  deriving (Show, Eq)

data LoginError
  = UserNotFound
  | WrongPassword
  deriving (Show, Eq)

validateEmail :: Text -> Bool
validateEmail email =
  let t = T.strip email
      hasAt = T.any (== '@') t
      hasDot = T.any (== '.') t
  in not (T.null t) && hasAt && hasDot

validatePassword :: Text -> Bool
validatePassword pwd = T.length pwd >= 6

register
  :: Text   -- ^ email
  -> Text   -- ^ password (plain)
  -> Text   -- ^ name
  -> Role
  -> AppM (Either RegisterError (Entity User))
register email password name role
  | not (validateEmail email)    = pure (Left InvalidEmail)
  | not (validatePassword password) = pure (Left PasswordTooShort)
  | otherwise = do
      now <- liftIO getCurrentTime
      existing <- runDb (UserRepo.findByEmail email)
      case existing of
        Just _  -> pure (Left EmailAlreadyExists)
        Nothing -> do
          let user = User
                { userEmail        = email
                , userPasswordHash = hashPassword password
                , userName         = name
                , userRole         = role
                , userCreatedAt    = now
                }
          uid <- runDb (UserRepo.insertUser user)
          pure (Right (Entity uid user))

login :: Text -> Text -> AppM (Either LoginError (Entity User))
login email password = do
  result <- runDb (UserRepo.findByEmail email)
  case result of
    Nothing -> pure (Left UserNotFound)
    Just e@(Entity _ user)
      | verifyPassword password (userPasswordHash user) -> pure (Right e)
      | otherwise -> pure (Left WrongPassword)
