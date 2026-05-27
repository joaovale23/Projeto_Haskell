module Handlers.Diagnostic
  ( diagnosticServer
  ) where

import API.Routes (DiagnosticAPI)
import API.Types
import App.Monad (AppM)
import Control.Exception (throwIO)
import Control.Monad.IO.Class (liftIO)
import Data.Int (Int64)
import Database.Persist (Entity (..))
import Database.Schema
import Servant
import qualified Services.DiagnosticService as DiagSvc
import qualified Services.PermissionService as Permission

diagnosticServer :: ServerT DiagnosticAPI AppM
diagnosticServer = handleQuestions :<|> handleSubmit :<|> handleResult

handleQuestions :: AppM [DiagnosticQuestionResponse]
handleQuestions = map toDiagnosticQuestionResponse <$> DiagSvc.listQuestions

handleSubmit :: Maybe Int64 -> DiagnosticSubmission -> AppM DiagnosticResultResponse
handleSubmit userId DiagnosticSubmission{..} = do
  uid <- Permission.requireUserId userId
  let submitted = map toSvcAnswer dsAnswers
  _ <- DiagSvc.submitDiagnostic uid submitted
  -- Retorna o registro persistido para garantir createdAt consistente.
  latest <- DiagSvc.latestResultForUser uid
  case latest of
    Just entity -> pure (toResponse entity)
    Nothing     -> liftIO (throwIO err500 { errBody = "Falha ao persistir diagnostico" })
  where
    toSvcAnswer a = DiagSvc.SubmittedAnswer
      { DiagSvc.saQuestionId  = daQuestionId a
      , DiagSvc.saSelectedIdx = daSelectedIdx a
      }

handleResult :: Maybe Int64 -> AppM DiagnosticResultResponse
handleResult userId = do
  uid <- Permission.requireUserId userId
  latest <- DiagSvc.latestResultForUser uid
  case latest of
    Just entity -> pure (toResponse entity)
    Nothing     -> liftIO (throwIO err404 { errBody = "Nenhum diagnostico encontrado" })

toResponse :: Entity DiagnosticResult -> DiagnosticResultResponse
toResponse (Entity _ row) = DiagnosticResultResponse
  { drStrengths        = decodeStored (diagnosticResultStrengths row)
  , drWeaknesses       = decodeStored (diagnosticResultWeaknesses row)
  , drRecommendedSlugs = decodeStored (diagnosticResultRecommendedSlugs row)
  , drCreatedAt        = diagnosticResultCreatedAt row
  }
