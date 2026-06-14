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
  , toExerciseResponseFull
  , SubmitExerciseRequest (..)
  , SubmitExerciseResponse (..)
  , ExerciseResponseEntry (..)
  , toExerciseResponseEntry
    -- Progress
  , ProgressEntry (..)
  , toProgressEntry
  , CompleteLessonRequest (..)
    -- Roadmap
  , RoadmapItemResponse (..)
    -- Profile
  , ProfileResponse (..)
  , ProfileRequest (..)
  , toProfileResponse
    -- Dashboard
  , DashboardResponse (..)
  , DashboardModuleStat (..)
  , DashboardActivity (..)
  , DashboardStudent (..)
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
  { rrEmail      :: Text
  , rrPassword   :: Text
  , rrName       :: Text
  , rrRole       :: Role
  , rrCourse     :: Maybe Text
  , rrEnrollment :: Maybe Text
  , rrSemester   :: Maybe Text
  , rrShift      :: Maybe Text
  , rrDiscipline :: Maybe Text
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
  -- answer/explanation só vêm preenchidos para professor (consulta/edição) ou pós-submit
  , ersAnswer      :: Maybe Value
  , ersExplanation :: Maybe Text
  } deriving (Generic, Show)
instance FromJSON ExerciseResponse
instance ToJSON ExerciseResponse

-- | Visão básica (aluno): sem gabarito nem explicação.
toExerciseResponse :: Entity Exercise -> ExerciseResponse
toExerciseResponse (Entity eid e) = ExerciseResponse
  { ersId          = fromSqlKey eid
  , ersLessonId    = fromSqlKey (exerciseLessonId e)
  , ersKind        = exerciseKind e
  , ersPrompt      = exercisePrompt e
  , ersPayload     = decodeStored (exercisePayload e)
  , ersOrderIdx    = exerciseOrderIdx e
  , ersAnswer      = Nothing
  , ersExplanation = Nothing
  }

-- | Visão completa (professor): inclui gabarito e explicação.
toExerciseResponseFull :: Entity Exercise -> ExerciseResponse
toExerciseResponseFull (Entity eid e) = (toExerciseResponse (Entity eid e))
  { ersAnswer      = Just (decodeStored (exerciseAnswer e))
  , ersExplanation = Just (exerciseExplanation e)
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

-- | Resposta já enviada por um aluno (para bloquear/repintar no front).
data ExerciseResponseEntry = ExerciseResponseEntry
  { rseExerciseId :: Int64
  , rseAnswer     :: Value
  , rseCorrect    :: Bool
  } deriving (Generic, Show)
instance FromJSON ExerciseResponseEntry
instance ToJSON ExerciseResponseEntry

toExerciseResponseEntry :: Entity ExerciseAttempt -> ExerciseResponseEntry
toExerciseResponseEntry (Entity _ r) = ExerciseResponseEntry
  { rseExerciseId = fromSqlKey (exerciseAttemptExerciseId r)
  , rseAnswer     = decodeStored (exerciseAttemptAnswer r)
  , rseCorrect    = exerciseAttemptCorrect r
  }

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

-- Profile -------------------------------------------------------------

data ProfileResponse = ProfileResponse
  { prId         :: Int64
  , prEmail      :: Text
  , prName       :: Text
  , prRole       :: Role
  , prCourse     :: Maybe Text
  , prEnrollment :: Maybe Text
  , prSemester   :: Maybe Text
  , prShift      :: Maybe Text
  , prDiscipline :: Maybe Text
  } deriving (Generic, Show)
instance FromJSON ProfileResponse
instance ToJSON ProfileResponse

data ProfileRequest = ProfileRequest
  { puName       :: Text
  , puCourse     :: Maybe Text
  , puEnrollment :: Maybe Text
  , puSemester   :: Maybe Text
  , puShift      :: Maybe Text
  , puDiscipline :: Maybe Text
  } deriving (Generic, Show)
instance FromJSON ProfileRequest
instance ToJSON ProfileRequest

toProfileResponse :: Entity User -> ProfileResponse
toProfileResponse (Entity uid u) = ProfileResponse
  { prId         = fromSqlKey uid
  , prEmail      = userEmail u
  , prName       = userName u
  , prRole       = userRole u
  , prCourse     = userCourse u
  , prEnrollment = userEnrollment u
  , prSemester   = userSemester u
  , prShift      = userShift u
  , prDiscipline = userDiscipline u
  }

-- Dashboard -----------------------------------------------------------

data DashboardModuleStat = DashboardModuleStat
  { dmsModuleId       :: Int64
  , dmsTitle          :: Text
  , dmsCompletionRate :: Double  -- % de alunos que concluíram o módulo
  , dmsAccuracyRate   :: Double  -- % de acertos nas tentativas dos exercícios do módulo
  , dmsAttempts       :: Int
  } deriving (Generic, Show)
instance FromJSON DashboardModuleStat
instance ToJSON DashboardModuleStat

data DashboardActivity = DashboardActivity
  { dacUserName :: Text
  , dacPrompt   :: Text
  , dacCorrect  :: Bool
  , dacAt       :: UTCTime
  } deriving (Generic, Show)
instance FromJSON DashboardActivity
instance ToJSON DashboardActivity

data DashboardStudent = DashboardStudent
  { dstName      :: Text
  , dstEmail     :: Text
  , dstCreatedAt :: UTCTime
  } deriving (Generic, Show)
instance FromJSON DashboardStudent
instance ToJSON DashboardStudent

data DashboardResponse = DashboardResponse
  { dbTotalStudents       :: Int
  , dbTotalModules        :: Int
  , dbTotalLessons        :: Int
  , dbTotalExercises      :: Int
  , dbAvgProgress         :: Double  -- progresso médio dos alunos (0..100)
  , dbAccuracyRate        :: Double  -- taxa de acertos global (0..100)
  , dbTotalAttempts       :: Int
  , dbActiveStudents      :: Int     -- ativos nos últimos 14 dias
  , dbLowProgressStudents :: Int     -- progresso < 30%
  , dbModules             :: [DashboardModuleStat]
  , dbRecentActivity      :: [DashboardActivity]
  , dbNewStudents         :: [DashboardStudent]
  } deriving (Generic, Show)
instance FromJSON DashboardResponse
instance ToJSON DashboardResponse
