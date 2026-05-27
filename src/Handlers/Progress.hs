module Handlers.Progress
  ( progressServer
  ) where

import API.Routes (ProgressAPI)
import API.Types
import App.Monad (AppM)
import Data.Int (Int64)
import Database.Persist.Sql (toSqlKey)
import Database.Schema (LessonId)
import Servant
import qualified Services.PermissionService as Permission
import qualified Services.ProgressService as ProgressSvc

progressServer :: ServerT ProgressAPI AppM
progressServer = handleList :<|> handleComplete :<|> handleUnmark

handleList :: Maybe Int64 -> AppM [ProgressEntry]
handleList userId = do
  uid <- Permission.requireUserId userId
  map toProgressEntry <$> ProgressSvc.listForUser uid

handleComplete :: Maybe Int64 -> CompleteLessonRequest -> AppM NoContent
handleComplete userId CompleteLessonRequest{..} = do
  uid <- Permission.requireUserId userId
  ProgressSvc.markCompleted uid (toSqlKey clrLessonId :: LessonId)
  pure NoContent

handleUnmark :: Int64 -> Maybe Int64 -> AppM NoContent
handleUnmark rawLid userId = do
  uid <- Permission.requireUserId userId
  ProgressSvc.unmark uid (toSqlKey rawLid :: LessonId)
  pure NoContent
