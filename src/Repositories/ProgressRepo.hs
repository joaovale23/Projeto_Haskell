module Repositories.ProgressRepo
  ( listForUser
  , findByUserLesson
  , upsert
  , deleteByUserLesson
  , countCompletedLessonsByModule
  , countLessonsByModule
  ) where

import Control.Monad.IO.Class (MonadIO)
import Data.Map.Strict (Map)
import qualified Data.Map.Strict as Map
import Data.Time (UTCTime)
import Database.Persist
  ( Entity (..)
  , SelectOpt (Asc)
  , deleteWhere
  , getBy
  , insert
  , replace
  , selectList
  , (==.)
  )
import Database.Persist.Sql (SqlPersistT)
import Database.Schema

listForUser :: MonadIO m => UserId -> SqlPersistT m [Entity Progress]
listForUser uid = selectList [ProgressUserId ==. uid] [Asc ProgressCompletedAt]

findByUserLesson :: MonadIO m => UserId -> LessonId -> SqlPersistT m (Maybe (Entity Progress))
findByUserLesson uid lid = getBy (UniqueUserLesson uid lid)

upsert :: MonadIO m => UserId -> LessonId -> UTCTime -> SqlPersistT m ()
upsert uid lid now = do
  existing <- findByUserLesson uid lid
  let row = Progress
        { progressUserId      = uid
        , progressLessonId    = lid
        , progressCompleted   = True
        , progressCompletedAt = now
        }
  case existing of
    Just (Entity pid _) -> replace pid row
    Nothing             -> insert row >> pure ()

deleteByUserLesson :: MonadIO m => UserId -> LessonId -> SqlPersistT m ()
deleteByUserLesson uid lid =
  deleteWhere [ProgressUserId ==. uid, ProgressLessonId ==. lid]

-- | Carrega todas as lições e devolve dois mapas úteis para o roadmap:
-- (lesson→module, module→quantidade total de lições).
countLessonsByModule
  :: MonadIO m
  => SqlPersistT m (Map LessonId ModuleId, Map ModuleId Int)
countLessonsByModule = do
  lessons <- selectList [] [Asc LessonOrderIdx]
  let lessonToModule = Map.fromList [(lid, lessonModuleId l) | Entity lid l <- lessons]
      byModule       = Map.fromListWith (+) [(lessonModuleId l, 1) | Entity _ l <- lessons]
  pure (lessonToModule, byModule)

-- | Conta lições concluídas pelo usuário agrupadas por moduleId.
countCompletedLessonsByModule
  :: MonadIO m
  => UserId
  -> Map LessonId ModuleId
  -> SqlPersistT m (Map ModuleId Int)
countCompletedLessonsByModule uid lessonToModule = do
  progs <- listForUser uid
  let modules =
        [ mid
        | Entity _ p <- progs
        , progressCompleted p
        , Just mid <- [Map.lookup (progressLessonId p) lessonToModule]
        ]
  pure (Map.fromListWith (+) [(m, 1) | m <- modules])
