module Handlers.Profile
  ( profileServer
  ) where

import API.Routes (ProfileAPI)
import API.Types
import App.Monad (AppM)
import Control.Exception (throwIO)
import Control.Monad.IO.Class (liftIO)
import Data.Int (Int64)
import Database.Persist (Entity (..))
import Servant
import qualified Services.PermissionService as Permission
import qualified Services.ProfileService as ProfileSvc

profileServer :: ServerT ProfileAPI AppM
profileServer =
       handleGet
  :<|> handleUpdate
  :<|> handleDelete

handleGet :: Maybe Int64 -> AppM ProfileResponse
handleGet userId = do
  uid <- Permission.requireUserId userId
  mUser <- ProfileSvc.getProfile uid
  case mUser of
    Just u  -> pure (toProfileResponse (Entity uid u))
    Nothing -> liftIO (throwIO err404 { errBody = "Usuario nao encontrado" })

handleDelete :: Maybe Int64 -> AppM NoContent
handleDelete userId = do
  uid <- Permission.requireUserId userId
  ProfileSvc.deleteProfile uid
  pure NoContent

handleUpdate :: Maybe Int64 -> ProfileRequest -> AppM ProfileResponse
handleUpdate userId ProfileRequest{..} = do
  uid <- Permission.requireUserId userId
  mUser <-
    ProfileSvc.updateProfile uid puName puCourse puEnrollment puSemester puShift puDiscipline
  case mUser of
    Just u  -> pure (toProfileResponse (Entity uid u))
    Nothing -> liftIO (throwIO err404 { errBody = "Usuario nao encontrado" })
