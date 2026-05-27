module Services.ExerciseService
  ( listByLesson
  , getExercise
  , createExercise
  , updateExercise
  , deleteExercise
  , submitAnswer
  , SubmitResult (..)
  , decodeJson
  , encodeJson
  ) where

import App.Monad (AppM, runDb)
import Data.Aeson (Value, decode, encode)
import qualified Data.ByteString.Lazy as LBS
import Data.Text (Text)
import qualified Data.Text.Encoding as TE
import qualified Data.Text.Lazy as TL
import qualified Data.Text.Lazy.Encoding as TLE
import Database.Persist (Entity)
import Database.Schema
import Domain.Exercise (ExerciseKind, SubmitError (..), checkAnswer)
import qualified Repositories.ExerciseRepo as ExerciseRepo

data SubmitResult
  = SubmitOk Bool Text
  | SubmitMissing
  | SubmitInvalid SubmitError
  deriving (Show, Eq)

-- | JSON Value → Text (UTF-8) para persistir.
encodeJson :: Value -> Text
encodeJson = TL.toStrict . TLE.decodeUtf8 . encode

-- | Text persistido → JSON Value. Retorna Null se falhar (caso prático: payload vazio).
decodeJson :: Text -> Value
decodeJson t = case decode (LBS.fromStrict (TE.encodeUtf8 t)) of
  Just v  -> v
  Nothing -> error ("ExerciseService.decodeJson: JSON invalido: " <> show t)

listByLesson :: LessonId -> AppM [Entity Exercise]
listByLesson = runDb . ExerciseRepo.listByLesson

getExercise :: ExerciseId -> AppM (Maybe Exercise)
getExercise = runDb . ExerciseRepo.findById

createExercise
  :: LessonId
  -> ExerciseKind
  -> Text
  -> Value
  -> Value
  -> Text
  -> Int
  -> AppM ExerciseId
createExercise lid kind prompt payload answer expl idx =
  runDb (ExerciseRepo.create Exercise
    { exerciseLessonId    = lid
    , exerciseKind        = kind
    , exercisePrompt      = prompt
    , exercisePayload     = encodeJson payload
    , exerciseAnswer      = encodeJson answer
    , exerciseExplanation = expl
    , exerciseOrderIdx    = idx
    })

updateExercise
  :: ExerciseId
  -> LessonId
  -> ExerciseKind
  -> Text -> Value -> Value -> Text -> Int
  -> AppM ()
updateExercise eid lid kind prompt payload answer expl idx =
  runDb (ExerciseRepo.update eid Exercise
    { exerciseLessonId    = lid
    , exerciseKind        = kind
    , exercisePrompt      = prompt
    , exercisePayload     = encodeJson payload
    , exerciseAnswer      = encodeJson answer
    , exerciseExplanation = expl
    , exerciseOrderIdx    = idx
    })

deleteExercise :: ExerciseId -> AppM ()
deleteExercise = runDb . ExerciseRepo.delete

submitAnswer :: ExerciseId -> Value -> AppM SubmitResult
submitAnswer eid submitted = do
  mEx <- runDb (ExerciseRepo.findById eid)
  case mEx of
    Nothing -> pure SubmitMissing
    Just ex ->
      let payload = decodeJson (exercisePayload ex)
          gabarito = decodeJson (exerciseAnswer ex)
      in case checkAnswer (exerciseKind ex) payload gabarito submitted of
           Right correct -> pure (SubmitOk correct (exerciseExplanation ex))
           Left err      -> pure (SubmitInvalid err)
