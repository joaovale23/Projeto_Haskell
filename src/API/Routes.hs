{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeOperators #-}

module API.Routes
  ( API
  , AuthAPI
  , ModuleAPI
  , LessonAPI
  , ExerciseAPI
  , ProgressAPI
  , RoadmapAPI
  , DiagnosticAPI
  , apiProxy
  ) where

import API.Types
import Data.Int (Int64)
import Data.Proxy (Proxy (..))
import Servant.API

-- Header alias para reduzir ruído.
type UserHeader = Header "X-User-Id" Int64

-- Auth ----------------------------------------------------------------
type AuthAPI =
       "auth" :> "register" :> ReqBody '[JSON] RegisterRequest :> Post '[JSON] UserResponse
  :<|> "auth" :> "login"    :> ReqBody '[JSON] LoginRequest    :> Post '[JSON] UserResponse

-- Modules: mutations exigem X-User-Id Teacher --------------------------
type ModuleAPI =
       "modules" :> Get '[JSON] [ModuleResponse]
  :<|> "modules" :> Capture "id" Int64 :> Get '[JSON] ModuleResponse
  :<|> "modules" :> UserHeader :> ReqBody '[JSON] ModuleRequest :> Post '[JSON] ModuleResponse
  :<|> "modules" :> Capture "id" Int64 :> UserHeader :> ReqBody '[JSON] ModuleRequest :> Put '[JSON] ModuleResponse
  :<|> "modules" :> Capture "id" Int64 :> UserHeader :> Delete '[JSON] NoContent
  :<|> "modules" :> Capture "id" Int64 :> "lessons" :> Get '[JSON] [LessonResponse]

-- Lessons -------------------------------------------------------------
type LessonAPI =
       "lessons" :> Capture "id" Int64 :> Get '[JSON] LessonResponse
  :<|> "lessons" :> UserHeader :> ReqBody '[JSON] LessonRequest :> Post '[JSON] LessonResponse
  :<|> "lessons" :> Capture "id" Int64 :> UserHeader :> ReqBody '[JSON] LessonRequest :> Put '[JSON] LessonResponse
  :<|> "lessons" :> Capture "id" Int64 :> UserHeader :> Delete '[JSON] NoContent
  :<|> "lessons" :> Capture "id" Int64 :> "exercises" :> Get '[JSON] [ExerciseResponse]

-- Exercises -----------------------------------------------------------
type ExerciseAPI =
       "exercises" :> Capture "id" Int64 :> Get '[JSON] ExerciseResponse
  :<|> "exercises" :> UserHeader :> ReqBody '[JSON] ExerciseRequest :> Post '[JSON] ExerciseResponse
  :<|> "exercises" :> Capture "id" Int64 :> UserHeader :> ReqBody '[JSON] ExerciseRequest :> Put '[JSON] ExerciseResponse
  :<|> "exercises" :> Capture "id" Int64 :> UserHeader :> Delete '[JSON] NoContent
  :<|> "exercises" :> Capture "id" Int64 :> "submit" :> UserHeader :> ReqBody '[JSON] SubmitExerciseRequest :> Post '[JSON] SubmitExerciseResponse

-- Progress ------------------------------------------------------------
type ProgressAPI =
       "progress" :> UserHeader :> Get '[JSON] [ProgressEntry]
  :<|> "progress" :> "complete" :> UserHeader :> ReqBody '[JSON] CompleteLessonRequest :> Post '[JSON] NoContent
  :<|> "progress" :> "lesson" :> Capture "id" Int64 :> UserHeader :> Delete '[JSON] NoContent

-- Roadmap -------------------------------------------------------------
type RoadmapAPI =
       "roadmap" :> UserHeader :> Get '[JSON] [RoadmapItemResponse]

-- Diagnostic ----------------------------------------------------------
type DiagnosticAPI =
       "diagnostic" :> "questions" :> Get '[JSON] [DiagnosticQuestionResponse]
  :<|> "diagnostic" :> "submit"    :> UserHeader :> ReqBody '[JSON] DiagnosticSubmission :> Post '[JSON] DiagnosticResultResponse
  :<|> "diagnostic" :> "result"    :> UserHeader :> Get '[JSON] DiagnosticResultResponse

-- Top-level -----------------------------------------------------------
type API =
       AuthAPI
  :<|> ModuleAPI
  :<|> LessonAPI
  :<|> ExerciseAPI
  :<|> ProgressAPI
  :<|> RoadmapAPI
  :<|> DiagnosticAPI

apiProxy :: Proxy API
apiProxy = Proxy
