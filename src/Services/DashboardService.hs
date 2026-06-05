module Services.DashboardService
  ( getDashboard
  , buildDashboard
  ) where

import API.Types
  ( DashboardActivity (..)
  , DashboardModuleStat (..)
  , DashboardResponse (..)
  , DashboardStudent (..)
  )
import App.Monad (AppM, runDb)
import Control.Monad.IO.Class (liftIO)
import Data.Int (Int64)
import Data.List (sortOn)
import Data.Map.Strict (Map)
import qualified Data.Map.Strict as Map
import Data.Ord (Down (..))
import Data.Set (Set)
import qualified Data.Set as Set
import Data.Text (Text)
import Data.Time (UTCTime, addUTCTime, getCurrentTime)
import Database.Persist (Entity (..), SelectOpt (Asc), selectList)
import Database.Persist.Sql (fromSqlKey)
import Database.Schema
import Domain.Types (Role (Student))

getDashboard :: AppM DashboardResponse
getDashboard = do
  now <- liftIO getCurrentTime
  runDb $ do
    users     <- selectList [] []
    modules   <- selectList [] [Asc ModuleOrderIdx]
    lessons   <- selectList [] []
    exercises <- selectList [] []
    progress  <- selectList [] []
    attempts  <- selectList [] []
    pure (buildDashboard now users modules lessons exercises progress attempts)

buildDashboard
  :: UTCTime
  -> [Entity User]
  -> [Entity Module]
  -> [Entity Lesson]
  -> [Entity Exercise]
  -> [Entity Progress]
  -> [Entity ExerciseAttempt]
  -> DashboardResponse
buildDashboard now users modules lessons exercises progress attempts =
  DashboardResponse
    { dbTotalStudents       = nStudents
    , dbTotalModules        = totalModules
    , dbTotalLessons        = length lessons
    , dbTotalExercises      = length exercises
    , dbAvgProgress         = avgProgress
    , dbAccuracyRate        = pct correctAttempts totalAttempts
    , dbTotalAttempts       = totalAttempts
    , dbActiveStudents      = activeCount
    , dbLowProgressStudents = lowCount
    , dbModules             = moduleStats
    , dbRecentActivity      = recentActivity
    , dbNewStudents         = newStudents
    }
  where
    students  = [e | e@(Entity _ u) <- users, userRole u == Student]
    nStudents = length students
    studentIds = [fromSqlKey uid | Entity uid _ <- students]
    studentIdSet = Set.fromList studentIds
    totalModules = length modules
    moduleIds = [fromSqlKey mid | Entity mid _ <- modules]

    -- mapas auxiliares ------------------------------------------------
    lessonModule :: Map Int64 Int64
    lessonModule = Map.fromList
      [(fromSqlKey lid, fromSqlKey (lessonModuleId l)) | Entity lid l <- lessons]

    lessonsByModule :: Map Int64 [Int64]
    lessonsByModule = Map.fromListWith (++)
      [(fromSqlKey (lessonModuleId l), [fromSqlKey lid]) | Entity lid l <- lessons]

    exerciseModule :: Map Int64 Int64
    exerciseModule = Map.fromList
      [ (fromSqlKey eid, mid)
      | Entity eid e <- exercises
      , Just mid <- [Map.lookup (fromSqlKey (exerciseLessonId e)) lessonModule]
      ]

    nameOf :: Map Int64 Text
    nameOf = Map.fromList [(fromSqlKey uid, userName u) | Entity uid u <- users]

    promptOf :: Map Int64 Text
    promptOf = Map.fromList [(fromSqlKey eid, exercisePrompt e) | Entity eid e <- exercises]

    -- progresso por usuário (lições concluídas) -----------------------
    completedByUser :: Map Int64 (Set Int64)
    completedByUser = Map.fromListWith Set.union
      [ (fromSqlKey (progressUserId p), Set.singleton (fromSqlKey (progressLessonId p)))
      | Entity _ p <- progress, progressCompleted p ]

    completedModulesFor :: Int64 -> Int
    completedModulesFor uid =
      let done = Map.findWithDefault Set.empty uid completedByUser
      in length
          [ () | m <- moduleIds
               , let ls = Map.findWithDefault [] m lessonsByModule
               , not (null ls)
               , all (`Set.member` done) ls ]

    -- Só módulos com ao menos uma lição contam no progresso (um módulo vazio
    -- nunca pode ser "concluído", então não deve impedir o aluno de chegar a 100%).
    progressDenom =
      length [m | m <- moduleIds, not (null (Map.findWithDefault [] m lessonsByModule))]

    progressOf :: Int64 -> Double
    progressOf uid
      | progressDenom == 0 = 0
      | otherwise = fromIntegral (completedModulesFor uid) / fromIntegral progressDenom * 100

    progresses = map progressOf studentIds
    avgProgress
      | null progresses = 0
      | otherwise = sum progresses / fromIntegral (length progresses)
    lowCount = length (filter (< 30) progresses)

    -- atividade recente / ativos --------------------------------------
    threshold = addUTCTime (negate (14 * 24 * 3600)) now
    activeUserIds = Set.fromList $
      [fromSqlKey (exerciseAttemptUserId a) | Entity _ a <- attempts, exerciseAttemptAnsweredAt a >= threshold]
      ++ [fromSqlKey (progressUserId p) | Entity _ p <- progress, progressCompletedAt p >= threshold]
    activeCount = Set.size (Set.intersection activeUserIds studentIdSet)

    -- tentativas ------------------------------------------------------
    totalAttempts = length attempts
    correctAttempts = length [() | Entity _ a <- attempts, exerciseAttemptCorrect a]

    attemptsByModule :: Map Int64 (Int, Int)  -- moduleId -> (total, corretas)
    attemptsByModule = Map.fromListWith addPair
      [ (mid, (1, if exerciseAttemptCorrect a then 1 else 0))
      | Entity _ a <- attempts
      , Just mid <- [Map.lookup (fromSqlKey (exerciseAttemptExerciseId a)) exerciseModule]
      ]
    addPair (t1, c1) (t2, c2) = (t1 + t2, c1 + c2)

    completedModuleCount :: Int64 -> Int
    completedModuleCount m =
      let ls = Map.findWithDefault [] m lessonsByModule
      in if null ls
           then 0
           else length
             [ () | uid <- studentIds
                  , let done = Map.findWithDefault Set.empty uid completedByUser
                  , all (`Set.member` done) ls ]

    moduleStats =
      [ DashboardModuleStat
          { dmsModuleId       = fromSqlKey mid
          , dmsTitle          = moduleTitle m
          , dmsCompletionRate =
              if nStudents == 0
                then 0
                else fromIntegral (completedModuleCount (fromSqlKey mid)) / fromIntegral nStudents * 100
          , dmsAccuracyRate   =
              let (t, c) = Map.findWithDefault (0, 0) (fromSqlKey mid) attemptsByModule in pct c t
          , dmsAttempts       = fst (Map.findWithDefault (0, 0) (fromSqlKey mid) attemptsByModule)
          }
      | Entity mid m <- modules ]

    -- atividades e novos alunos ---------------------------------------
    recentActivity =
      [ DashboardActivity
          { dacUserName = Map.findWithDefault "?" (fromSqlKey (exerciseAttemptUserId a)) nameOf
          , dacPrompt   = Map.findWithDefault "?" (fromSqlKey (exerciseAttemptExerciseId a)) promptOf
          , dacCorrect  = exerciseAttemptCorrect a
          , dacAt       = exerciseAttemptAnsweredAt a
          }
      | Entity _ a <- take 8 (sortOn (Down . exerciseAttemptAnsweredAt . entityVal) attempts) ]

    newStudents =
      [ DashboardStudent
          { dstName      = userName u
          , dstEmail     = userEmail u
          , dstCreatedAt = userCreatedAt u
          }
      | Entity _ u <- take 5 (sortOn (Down . userCreatedAt . entityVal) students) ]

    pct :: Int -> Int -> Double
    pct _ 0 = 0
    pct c t = fromIntegral c / fromIntegral t * 100
