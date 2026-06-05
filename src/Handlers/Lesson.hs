module Handlers.Lesson
  ( lessonServer
  ) where

import API.Routes (LessonAPI)
import API.Types
import App.Monad (AppM)
import Control.Exception (throwIO)
import Control.Monad.IO.Class (liftIO)
import Data.Int (Int64)
import Database.Persist (Entity (..))
import Database.Persist.Sql (fromSqlKey, toSqlKey)
import Database.Schema
import Domain.Types (Role (Teacher))
import Servant
import qualified Services.ExerciseService as ExerciseSvc
import qualified Services.LessonService as LessonSvc
import qualified Services.PermissionService as Permission

lessonServer :: ServerT LessonAPI AppM
lessonServer =
       handleGet
  :<|> handleCreate
  :<|> handleUpdate
  :<|> handleDelete
  :<|> handleListExercises
  :<|> handleListResponses

handleGet :: Int64 -> AppM LessonResponse
handleGet rawId = do
  let lid = toSqlKey rawId :: LessonId
  result <- LessonSvc.getLesson lid
  case result of
    Just l  -> pure (toLessonResponse (Entity lid l))
    Nothing -> liftIO (throwIO err404 { errBody = "Licao nao encontrada" })

handleCreate :: Maybe Int64 -> LessonRequest -> AppM LessonResponse
handleCreate userId LessonRequest{..} = do
  Permission.checkTeacher userId
  let mid = toSqlKey lrqModuleId :: ModuleId
  (lid, idx) <- LessonSvc.createLesson mid lrqTitle lrqContent
  pure LessonResponse
    { lrsId       = fromSqlKey lid
    , lrsModuleId = lrqModuleId
    , lrsTitle    = lrqTitle
    , lrsContent  = lrqContent
    , lrsOrderIdx = idx
    }

handleUpdate :: Int64 -> Maybe Int64 -> LessonRequest -> AppM LessonResponse
handleUpdate rawId userId LessonRequest{..} = do
  Permission.checkTeacher userId
  let lid = toSqlKey rawId :: LessonId
      mid = toSqlKey lrqModuleId :: ModuleId
  existing <- LessonSvc.getLesson lid
  case existing of
    Nothing -> liftIO (throwIO err404 { errBody = "Licao nao encontrada" })
    Just _  -> do
      LessonSvc.updateLesson lid mid lrqTitle lrqContent lrqOrderIdx
      pure LessonResponse
        { lrsId       = rawId
        , lrsModuleId = lrqModuleId
        , lrsTitle    = lrqTitle
        , lrsContent  = lrqContent
        , lrsOrderIdx = lrqOrderIdx
        }

handleDelete :: Int64 -> Maybe Int64 -> AppM NoContent
handleDelete rawId userId = do
  Permission.checkTeacher userId
  LessonSvc.deleteLesson (toSqlKey rawId :: LessonId)
  pure NoContent

handleListExercises :: Int64 -> Maybe Int64 -> AppM [ExerciseResponse]
handleListExercises rawId userId = do
  let lid = toSqlKey rawId :: LessonId
  requester <- Permission.loadUser userId
  let toResp = if (userRole <$> requester) == Just Teacher
        then toExerciseResponseFull
        else toExerciseResponse
  map toResp <$> ExerciseSvc.listByLesson lid

handleListResponses :: Int64 -> Maybe Int64 -> AppM [ExerciseResponseEntry]
handleListResponses rawId userId = do
  uid <- Permission.requireUserId userId
  let lid = toSqlKey rawId :: LessonId
  map toExerciseResponseEntry <$> ExerciseSvc.listResponsesForLesson uid lid
