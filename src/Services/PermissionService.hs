module Services.PermissionService
  ( loadUser
  , checkTeacher
  , requireUser
  , requireUserId
  ) where

import App.Monad (AppM, runDb)
import Control.Exception (throwIO)
import Control.Monad.IO.Class (liftIO)
import Data.Int (Int64)
import qualified Data.ByteString.Lazy.Char8 as LBS
import Database.Persist.Sql (toSqlKey)
import Database.Schema (User, UserId, userRole)
import Domain.Permissions (PermissionError (..), requireTeacher)
import qualified Repositories.UserRepo as UserRepo
import Servant (ServerError, err401, err403, errBody)

loadUser :: Maybe Int64 -> AppM (Maybe User)
loadUser Nothing    = pure Nothing
loadUser (Just uid) = runDb (UserRepo.findById (toSqlKey uid))

checkTeacher :: Maybe Int64 -> AppM ()
checkTeacher header = do
  user <- loadUser header
  case requireTeacher (userRole <$> user) of
    Right ()         -> pure ()
    Left NotTeacher  -> denyWith err403 "Apenas professores podem realizar esta acao"
    Left UserMissing -> denyWith err401 "X-User-Id ausente ou invalido"

requireUser :: Maybe Int64 -> AppM User
requireUser header = do
  user <- loadUser header
  case user of
    Just u  -> pure u
    Nothing -> denyWith err401 "X-User-Id ausente ou invalido"

requireUserId :: Maybe Int64 -> AppM UserId
requireUserId Nothing    = denyWith err401 "X-User-Id ausente ou invalido"
requireUserId (Just uid) = do
  _ <- requireUser (Just uid)  -- valida existência no banco
  pure (toSqlKey uid)

denyWith :: ServerError -> String -> AppM a
denyWith err msg = liftIO (throwIO err { errBody = LBS.pack msg })
