module Unit.Services.DashboardServiceSpec (spec) where

import API.Types
  ( DashboardModuleStat (..)
  , DashboardResponse (..)
  )
import Data.List (find)
import Data.Time (UTCTime (..), fromGregorian)
import Database.Persist (Entity (..))
import Database.Persist.Sql (toSqlKey)
import Database.Schema
import Domain.Exercise (ExerciseKind (MultipleChoice))
import Domain.Types (Role (Student, Teacher))
import Services.DashboardService (buildDashboard)
import Test.Hspec

now :: UTCTime
now = UTCTime (fromGregorian 2025 6 1) 0

mkUser :: Int -> Role -> Entity User
mkUser n role = Entity (toSqlKey (fromIntegral n))
  User
    { userEmail        = "user@x.com"
    , userPasswordHash = "h"
    , userName         = "User"
    , userRole         = role
    , userCreatedAt    = now
    , userCourse       = Nothing
    , userEnrollment   = Nothing
    , userSemester     = Nothing
    , userShift        = Nothing
    , userDiscipline   = Nothing
    }

mkModule :: Int -> Entity Module
mkModule n = Entity (toSqlKey (fromIntegral n))
  Module
    { moduleTitle          = "Mod"
    , moduleSlug           = "mod"
    , moduleDescription    = ""
    , moduleOrderIdx       = n
    , modulePrerequisiteId = Nothing
    }

mkLesson :: Int -> Int -> Entity Lesson
mkLesson lid mid = Entity (toSqlKey (fromIntegral lid))
  Lesson
    { lessonModuleId = toSqlKey (fromIntegral mid)
    , lessonTitle    = "L"
    , lessonContent  = ""
    , lessonOrderIdx = lid
    }

mkExercise :: Int -> Int -> Entity Exercise
mkExercise eid lid = Entity (toSqlKey (fromIntegral eid))
  Exercise
    { exerciseLessonId    = toSqlKey (fromIntegral lid)
    , exerciseKind        = MultipleChoice
    , exercisePrompt      = "P"
    , exercisePayload     = "{}"
    , exerciseAnswer      = "0"
    , exerciseExplanation = ""
    , exerciseOrderIdx    = eid
    }

mkProgress :: Int -> Int -> Entity Progress
mkProgress uid lid = Entity (toSqlKey (fromIntegral (uid * 100 + lid)))
  Progress
    { progressUserId      = toSqlKey (fromIntegral uid)
    , progressLessonId    = toSqlKey (fromIntegral lid)
    , progressCompleted   = True
    , progressCompletedAt = now
    }

mkAttempt :: Int -> Int -> Bool -> Entity ExerciseAttempt
mkAttempt uid eid correct = Entity (toSqlKey (fromIntegral (uid * 100 + eid)))
  ExerciseAttempt
    { exerciseAttemptUserId     = toSqlKey (fromIntegral uid)
    , exerciseAttemptExerciseId = toSqlKey (fromIntegral eid)
    , exerciseAttemptAnswer     = "0"
    , exerciseAttemptCorrect    = correct
    , exerciseAttemptAnsweredAt = now
    }

-- Cenário: 1 aluno; módulos 1 e 2 com 1 lição cada; módulo 3 vazio.
-- O aluno concluiu as lições dos módulos 1 e 2 e respondeu e1 (certo) e e2 (errado).
dashboard :: DashboardResponse
dashboard = buildDashboard now users modules lessons exercises progress attempts
  where
    users     = [mkUser 1 Student, mkUser 2 Teacher]
    modules   = [mkModule 1, mkModule 2, mkModule 3]
    lessons   = [mkLesson 1 1, mkLesson 2 2]
    exercises = [mkExercise 1 1, mkExercise 2 2]
    progress  = [mkProgress 1 1, mkProgress 1 2]
    attempts  = [mkAttempt 1 1 True, mkAttempt 1 2 False]

moduleStat :: Int -> Maybe DashboardModuleStat
moduleStat n = find ((== fromIntegral n) . dmsModuleId) (dbModules dashboard)

spec :: Spec
spec = describe "DashboardService.buildDashboard" $ do
  it "conta apenas alunos (ignora professores)" $
    dbTotalStudents dashboard `shouldBe` 1

  it "expõe os totais de módulos, lições e exercícios" $ do
    dbTotalModules dashboard `shouldBe` 3
    dbTotalLessons dashboard `shouldBe` 2
    dbTotalExercises dashboard `shouldBe` 2

  it "módulo vazio não impede o aluno de chegar a 100% de progresso" $
    dbAvgProgress dashboard `shouldBe` 100

  it "calcula a taxa de acertos global" $
    dbAccuracyRate dashboard `shouldBe` 50

  it "calcula a taxa de acertos por módulo" $ do
    fmap dmsAccuracyRate (moduleStat 1) `shouldBe` Just 100
    fmap dmsAccuracyRate (moduleStat 2) `shouldBe` Just 0

  it "calcula a taxa de conclusão por módulo" $ do
    fmap dmsCompletionRate (moduleStat 1) `shouldBe` Just 100
    fmap dmsCompletionRate (moduleStat 3) `shouldBe` Just 0
