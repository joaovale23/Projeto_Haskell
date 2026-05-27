module Services.DiagnosticService
  ( listQuestions
  , latestResultForUser
  , submitDiagnostic
  , SubmittedAnswer (..)
  ) where

import App.Monad (AppM, runDb)
import Control.Monad.IO.Class (liftIO)
import Data.Aeson (toJSON)
import Data.Int (Int64)
import Data.Text (Text)
import Data.Time (getCurrentTime)
import Database.Persist (Entity (..))
import Database.Persist.Sql (toSqlKey)
import Database.Schema
import Domain.Diagnostic (DiagnosticAnalysis (..), analyze)
import qualified Repositories.DiagnosticRepo as DiagnosticRepo
import Services.ExerciseService (encodeJson)

data SubmittedAnswer = SubmittedAnswer
  { saQuestionId  :: Int64
  , saSelectedIdx :: Int
  } deriving (Show)

listQuestions :: AppM [Entity DiagnosticQuestion]
listQuestions = runDb DiagnosticRepo.listQuestions

latestResultForUser :: UserId -> AppM (Maybe (Entity DiagnosticResult))
latestResultForUser = runDb . DiagnosticRepo.latestResultForUser

submitDiagnostic
  :: UserId
  -> [SubmittedAnswer]
  -> AppM (DiagnosticAnalysis, DiagnosticResultId)
submitDiagnostic uid submitted = do
  questions <- runDb DiagnosticRepo.listQuestions
  let answersByTopic = topicAnswers questions submitted
      result         = analyze answersByTopic
  now <- liftIO getCurrentTime
  let row = DiagnosticResult
        { diagnosticResultUserId           = uid
        , diagnosticResultStrengths        = encodeJson (toJSON (daStrengths result))
        , diagnosticResultWeaknesses       = encodeJson (toJSON (daWeaknesses result))
        , diagnosticResultRecommendedSlugs = encodeJson (toJSON (daRecommendedSlugs result))
        , diagnosticResultCreatedAt        = now
        }
  rid <- runDb (DiagnosticRepo.insertResult row)
  pure (result, rid)

topicAnswers
  :: [Entity DiagnosticQuestion]
  -> [SubmittedAnswer]
  -> [(Text, Bool)]
topicAnswers questions submitted =
  [ (diagnosticQuestionTopic q, diagnosticQuestionCorrectIdx q == saSelectedIdx ans)
  | ans <- submitted
  , Entity qid q <- questions
  , qid == toSqlKey (saQuestionId ans)
  ]
