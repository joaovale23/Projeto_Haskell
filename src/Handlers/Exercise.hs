module Handlers.Exercise
  ( exerciseServer
  ) where

import API.Routes (ExerciseAPI)
import API.Types
import App.Monad (AppM)
import Control.Exception (throwIO)
import Control.Monad.IO.Class (liftIO)
import Data.Int (Int64)
import Database.Persist (Entity (..))
import Database.Persist.Sql (fromSqlKey, toSqlKey)
import Database.Schema
import Servant
import qualified Services.ExerciseService as ExerciseSvc
import qualified Services.PermissionService as Permission

exerciseServer :: ServerT ExerciseAPI AppM
exerciseServer =
       handleGet
  :<|> handleCreate
  :<|> handleUpdate
  :<|> handleDelete
  :<|> handleSubmit

handleGet :: Int64 -> AppM ExerciseResponse
handleGet rawId = do
  let eid = toSqlKey rawId :: ExerciseId
  result <- ExerciseSvc.getExercise eid
  case result of
    Just e  -> pure (toExerciseResponse (Entity eid e))
    Nothing -> liftIO (throwIO err404 { errBody = "Exercicio nao encontrado" })

handleCreate :: Maybe Int64 -> ExerciseRequest -> AppM ExerciseResponse
handleCreate userId ExerciseRequest{..} = do
  Permission.checkTeacher userId
  let lid = toSqlKey erqLessonId :: LessonId
  eid <- ExerciseSvc.createExercise lid erqKind erqPrompt erqPayload erqAnswer erqExplanation erqOrderIdx
  pure ExerciseResponse
    { ersId       = fromSqlKey eid
    , ersLessonId = erqLessonId
    , ersKind     = erqKind
    , ersPrompt   = erqPrompt
    , ersPayload  = erqPayload
    , ersOrderIdx = erqOrderIdx
    }

handleUpdate :: Int64 -> Maybe Int64 -> ExerciseRequest -> AppM ExerciseResponse
handleUpdate rawId userId ExerciseRequest{..} = do
  Permission.checkTeacher userId
  let eid = toSqlKey rawId :: ExerciseId
      lid = toSqlKey erqLessonId :: LessonId
  existing <- ExerciseSvc.getExercise eid
  case existing of
    Nothing -> liftIO (throwIO err404 { errBody = "Exercicio nao encontrado" })
    Just _  -> do
      ExerciseSvc.updateExercise eid lid erqKind erqPrompt erqPayload erqAnswer erqExplanation erqOrderIdx
      pure ExerciseResponse
        { ersId       = rawId
        , ersLessonId = erqLessonId
        , ersKind     = erqKind
        , ersPrompt   = erqPrompt
        , ersPayload  = erqPayload
        , ersOrderIdx = erqOrderIdx
        }

handleDelete :: Int64 -> Maybe Int64 -> AppM NoContent
handleDelete rawId userId = do
  Permission.checkTeacher userId
  ExerciseSvc.deleteExercise (toSqlKey rawId :: ExerciseId)
  pure NoContent

handleSubmit :: Int64 -> Maybe Int64 -> SubmitExerciseRequest -> AppM SubmitExerciseResponse
handleSubmit rawId userId SubmitExerciseRequest{..} = do
  _ <- Permission.requireUser userId
  let eid = toSqlKey rawId :: ExerciseId
  result <- ExerciseSvc.submitAnswer eid serAnswer
  case result of
    ExerciseSvc.SubmitOk correct expl ->
      pure SubmitExerciseResponse
        { sersCorrect     = correct
        , sersExplanation = expl
        }
    ExerciseSvc.SubmitMissing ->
      liftIO (throwIO err404 { errBody = "Exercicio nao encontrado" })
    ExerciseSvc.SubmitInvalid _ ->
      liftIO (throwIO err400 { errBody = "Resposta em formato invalido" })
