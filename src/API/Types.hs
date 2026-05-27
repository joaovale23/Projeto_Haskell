{-# LANGUAGE DeriveGeneric #-}

module API.Types
  ( -- Auth
    RegisterRequest (..)
  , LoginRequest (..)
  , UserResponse (..)
  , toUserResponse
    -- Module
  , ModuleRequest (..)
  , ModuleResponse (..)
  , toModuleResponse
    -- Lesson
  , LessonRequest (..)
  , LessonResponse (..)
  , toLessonResponse
    -- Exercise
  , ExerciseRequest (..)
  , ExerciseResponse (..)
  , toExerciseResponse
  , SubmitExerciseRequest (..)
  , SubmitExerciseResponse (..)
    -- Progress
  , ProgressEntry (..)
  , toProgressEntry
  , CompleteLessonRequest (..)
    -- Roadmap
  , RoadmapItemResponse (..)
    -- Diagnostic
  , DiagnosticQuestionResponse (..)
  , toDiagnosticQuestionResponse
  , DiagnosticAnswer (..)
  , DiagnosticSubmission (..)
  , DiagnosticResultResponse (..)
    -- Helpers
  , decodeStored
  ) where

import Data.Aeson (FromJSON, ToJSON, Value (..), decode)
import qualified Data.ByteString.Lazy as LBS
import qualified Data.Text.Encoding as TE
import Data.Int (Int64)
import Data.Text (Text)
import Data.Time (UTCTime)
import Database.Persist (Entity (..))
import Database.Persist.Sql (fromSqlKey)
import Database.Schema
import Domain.Exercise (ExerciseKind)
import Domain.Types (Role)
import GHC.Generics (Generic)

-- Auth ----------------------------------------------------------------

data RegisterRequest = RegisterRequest
  { rrEmail    :: Text
  , rrPassword :: Text
  , rrName     :: Text
  , rrRole     :: Role
  } deriving (Generic, Show)
instance FromJSON RegisterRequest
instance ToJSON RegisterRequest

data LoginRequest = LoginRequest
  { lrEmail    :: Text
  , lrPassword :: Text
  } deriving (Generic, Show)
instance FromJSON LoginRequest
instance ToJSON LoginRequest

data UserResponse = UserResponse
  { urId    :: Int64
  , urEmail :: Text
  , urName  :: Text
  , urRole  :: Role
  } deriving (Generic, Show)
instance FromJSON UserResponse
instance ToJSON UserResponse

toUserResponse :: Entity User -> UserResponse
toUserResponse (Entity uid u) = UserResponse
  { urId    = fromSqlKey uid
  , urEmail = userEmail u
  , urName  = userName u
  , urRole  = userRole u
  }

-- Module --------------------------------------------------------------

data ModuleRequest = ModuleRequest
  { mrqTitle          :: Text
  , mrqSlug           :: Text
  , mrqDescription    :: Text
  , mrqOrderIdx       :: Int
  , mrqPrerequisiteId :: Maybe Int64
  } deriving (Generic, Show)
instance FromJSON ModuleRequest
instance ToJSON ModuleRequest

data ModuleResponse = ModuleResponse
  { mrsId             :: Int64
  , mrsTitle          :: Text
  , mrsSlug           :: Text
  , mrsDescription    :: Text
  , mrsOrderIdx       :: Int
  , mrsPrerequisiteId :: Maybe Int64
  } deriving (Generic, Show)
instance FromJSON ModuleResponse
instance ToJSON ModuleResponse

toModuleResponse :: Entity Module -> ModuleResponse
toModuleResponse (Entity mid m) = ModuleResponse
  { mrsId             = fromSqlKey mid
  , mrsTitle          = moduleTitle m
  , mrsSlug           = moduleSlug m
  , mrsDescription    = moduleDescription m
  , mrsOrderIdx       = moduleOrderIdx m
  , mrsPrerequisiteId = fromSqlKey <$> modulePrerequisiteId m
  }

-- Lesson --------------------------------------------------------------

data LessonRequest = LessonRequest
  { lrqModuleId :: Int64
  , lrqTitle    :: Text
  , lrqContent  :: Text
  , lrqOrderIdx :: Int
  } deriving (Generic, Show)
instance FromJSON LessonRequest
instance ToJSON LessonRequest

data LessonResponse = LessonResponse
  { lrsId       :: Int64
  , lrsModuleId :: Int64
  , lrsTitle    :: Text
  , lrsContent  :: Text
  , lrsOrderIdx :: Int
  } deriving (Generic, Show)
instance FromJSON LessonResponse
instance ToJSON LessonResponse

toLessonResponse :: Entity Lesson -> LessonResponse
toLessonResponse (Entity lid l) = LessonResponse
  { lrsId       = fromSqlKey lid
  , lrsModuleId = fromSqlKey (lessonModuleId l)
  , lrsTitle    = lessonTitle l
  , lrsContent  = lessonContent l
  , lrsOrderIdx = lessonOrderIdx l
  }

-- Exercise ------------------------------------------------------------

data ExerciseRequest = ExerciseRequest
  { erqLessonId    :: Int64
  , erqKind        :: ExerciseKind
  , erqPrompt      :: Text
  , erqPayload     :: Value
  , erqAnswer      :: Value
  , erqExplanation :: Text
  , erqOrderIdx    :: Int
  } deriving (Generic, Show)
instance FromJSON ExerciseRequest
instance ToJSON ExerciseRequest

data ExerciseResponse = ExerciseResponse
  { ersId          :: Int64
  , ersLessonId    :: Int64
  , ersKind        :: ExerciseKind
  , ersPrompt      :: Text
  , ersPayload     :: Value
  , ersOrderIdx    :: Int
  -- intencionalmente sem answer/explanation no GET (esses só vêm pós-submit)
  } deriving (Generic, Show)
instance FromJSON ExerciseResponse
instance ToJSON ExerciseResponse

toExerciseResponse :: Entity Exercise -> ExerciseResponse
toExerciseResponse (Entity eid e) = ExerciseResponse
  { ersId       = fromSqlKey eid
  , ersLessonId = fromSqlKey (exerciseLessonId e)
  , ersKind     = exerciseKind e
  , ersPrompt   = exercisePrompt e
  , ersPayload  = decodeStored (exercisePayload e)
  , ersOrderIdx = exerciseOrderIdx e
  }

-- | Decodifica JSON armazenado como Text. Devolve Null se inválido.
decodeStored :: Text -> Value
decodeStored t = case decode (LBS.fromStrict (TE.encodeUtf8 t)) of
  Just v  -> v
  Nothing -> Null

newtype SubmitExerciseRequest = SubmitExerciseRequest
  { serAnswer :: Value
  } deriving (Generic, Show)
instance FromJSON SubmitExerciseRequest
instance ToJSON SubmitExerciseRequest

data SubmitExerciseResponse = SubmitExerciseResponse
  { sersCorrect     :: Bool
  , sersExplanation :: Text
  } deriving (Generic, Show)
instance FromJSON SubmitExerciseResponse
instance ToJSON SubmitExerciseResponse

-- Progress ------------------------------------------------------------

data ProgressEntry = ProgressEntry
  { peLessonId    :: Int64
  , peCompleted   :: Bool
  , peCompletedAt :: UTCTime
  } deriving (Generic, Show)
instance FromJSON ProgressEntry
instance ToJSON ProgressEntry

toProgressEntry :: Entity Progress -> ProgressEntry
toProgressEntry (Entity _ p) = ProgressEntry
  { peLessonId    = fromSqlKey (progressLessonId p)
  , peCompleted   = progressCompleted p
  , peCompletedAt = progressCompletedAt p
  }

newtype CompleteLessonRequest = CompleteLessonRequest
  { clrLessonId :: Int64
  } deriving (Generic, Show)
instance FromJSON CompleteLessonRequest
instance ToJSON CompleteLessonRequest

-- Roadmap -------------------------------------------------------------

data RoadmapItemResponse = RoadmapItemResponse
  { riModuleId         :: Int64
  , riTitle            :: Text
  , riSlug             :: Text
  , riDescription      :: Text
  , riOrderIdx         :: Int
  , riPrerequisiteId   :: Maybe Int64
  , riUnlocked         :: Bool
  , riCompletedLessons :: Int
  , riTotalLessons     :: Int
  } deriving (Generic, Show)
instance FromJSON RoadmapItemResponse
instance ToJSON RoadmapItemResponse

-- Diagnostic ----------------------------------------------------------

data DiagnosticQuestionResponse = DiagnosticQuestionResponse
  { dqId      :: Int64
  , dqTopic   :: Text
  , dqPrompt  :: Text
  , dqOptions :: Value
  } deriving (Generic, Show)
instance FromJSON DiagnosticQuestionResponse
instance ToJSON DiagnosticQuestionResponse

toDiagnosticQuestionResponse :: Entity DiagnosticQuestion -> DiagnosticQuestionResponse
toDiagnosticQuestionResponse (Entity qid q) = DiagnosticQuestionResponse
  { dqId      = fromSqlKey qid
  , dqTopic   = diagnosticQuestionTopic q
  , dqPrompt  = diagnosticQuestionPrompt q
  , dqOptions = decodeStored (diagnosticQuestionOptions q)
  }

data DiagnosticAnswer = DiagnosticAnswer
  { daQuestionId  :: Int64
  , daSelectedIdx :: Int
  } deriving (Generic, Show)
instance FromJSON DiagnosticAnswer
instance ToJSON DiagnosticAnswer

newtype DiagnosticSubmission = DiagnosticSubmission
  { dsAnswers :: [DiagnosticAnswer]
  } deriving (Generic, Show)
instance FromJSON DiagnosticSubmission
instance ToJSON DiagnosticSubmission

data DiagnosticResultResponse = DiagnosticResultResponse
  { drStrengths        :: Value
  , drWeaknesses       :: Value
  , drRecommendedSlugs :: Value
  , drCreatedAt        :: UTCTime
  } deriving (Generic, Show)
instance FromJSON DiagnosticResultResponse
instance ToJSON DiagnosticResultResponse
