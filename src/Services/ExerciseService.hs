module Services.ExerciseService
  ( listByLesson
  , getExercise
  , createExercise
  , updateExercise
  , deleteExercise
  , submitAnswer
  , listResponsesForLesson
  , SubmitResult (..)
  , decodeJson
  , encodeJson
  ) where

import App.Monad (AppM, runDb)
import Control.Monad.IO.Class (liftIO)
import Data.Aeson (Value, decode, encode)
import qualified Data.ByteString.Lazy as LBS
import Data.Text (Text)
import qualified Data.Text.Encoding as TE
import qualified Data.Text.Lazy as TL
import qualified Data.Text.Lazy.Encoding as TLE
import Data.Time (getCurrentTime)
import Database.Persist (Entity (..))
import Database.Schema
import Domain.Exercise (ExerciseKind, SubmitError (..), checkAnswer)
import qualified Repositories.ExerciseRepo as ExerciseRepo
import qualified Repositories.ExerciseResponseRepo as ExerciseResponseRepo

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

-- | Cria o exercício na próxima posição livre da lição (ordenação automática,
-- na ordem de adição) e devolve o id junto da posição atribuída.
createExercise
  :: LessonId
  -> ExerciseKind
  -> Text
  -> Value
  -> Value
  -> Text
  -> AppM (ExerciseId, Int)
createExercise lid kind prompt payload answer expl = runDb $ do
  idx <- ExerciseRepo.nextOrderIdx lid
  eid <- ExerciseRepo.create Exercise
    { exerciseLessonId    = lid
    , exerciseKind        = kind
    , exercisePrompt      = prompt
    , exercisePayload     = encodeJson payload
    , exerciseAnswer      = encodeJson answer
    , exerciseExplanation = expl
    , exerciseOrderIdx    = idx
    }
  pure (eid, idx)

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

-- | Exclui o exercício (e as respostas de alunos que o referenciam) e renumera
-- os exercícios da lição afetada.
deleteExercise :: ExerciseId -> AppM ()
deleteExercise eid = runDb $ do
  mEx <- ExerciseRepo.findById eid
  ExerciseResponseRepo.deleteByExercise eid
  ExerciseRepo.delete eid
  case mEx of
    Just e  -> ExerciseRepo.resequence (exerciseLessonId e)
    Nothing -> pure ()

-- | Submete a resposta do aluno. A primeira resposta é avaliada e persistida;
-- tentativas posteriores não alteram nada e apenas devolvem o resultado já
-- registrado (bloqueio de alteração no backend).
submitAnswer :: UserId -> ExerciseId -> Value -> AppM SubmitResult
submitAnswer uid eid submitted = do
  mEx <- runDb (ExerciseRepo.findById eid)
  case mEx of
    Nothing -> pure SubmitMissing
    Just ex -> do
      existing <- runDb (ExerciseResponseRepo.findByUserExercise uid eid)
      case existing of
        Just (Entity _ r) ->
          pure (SubmitOk (exerciseAttemptCorrect r) (exerciseExplanation ex))
        Nothing ->
          let payload  = decodeJson (exercisePayload ex)
              gabarito = decodeJson (exerciseAnswer ex)
          in case checkAnswer (exerciseKind ex) payload gabarito submitted of
               Left err      -> pure (SubmitInvalid err)
               Right correct -> do
                 now <- liftIO getCurrentTime
                 runDb (ExerciseResponseRepo.insert ExerciseAttempt
                   { exerciseAttemptUserId     = uid
                   , exerciseAttemptExerciseId = eid
                   , exerciseAttemptAnswer     = encodeJson submitted
                   , exerciseAttemptCorrect    = correct
                   , exerciseAttemptAnsweredAt = now
                   })
                 pure (SubmitOk correct (exerciseExplanation ex))

-- | Respostas já enviadas pelo aluno para os exercícios de uma lição.
listResponsesForLesson :: UserId -> LessonId -> AppM [Entity ExerciseAttempt]
listResponsesForLesson uid lid = runDb $ do
  exs <- ExerciseRepo.listByLesson lid
  ExerciseResponseRepo.listByUserAndExercises uid (map entityKey exs)
