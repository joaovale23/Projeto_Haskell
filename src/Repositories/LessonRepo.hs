module Repositories.LessonRepo
  ( listByModule
  , findById
  , create
  , update
  , delete
  ) where

import Control.Monad.IO.Class (MonadIO)
import Database.Persist
  ( Entity
  , SelectOpt (Asc)
  , insert
  , replace
  , selectList
  , (==.)
  )
import qualified Database.Persist as P
import Database.Persist.Sql (SqlPersistT, get)
import Database.Schema

listByModule :: MonadIO m => ModuleId -> SqlPersistT m [Entity Lesson]
listByModule mid = selectList [LessonModuleId ==. mid] [Asc LessonOrderIdx]

findById :: MonadIO m => LessonId -> SqlPersistT m (Maybe Lesson)
findById = get

create :: MonadIO m => Lesson -> SqlPersistT m LessonId
create = insert

update :: MonadIO m => LessonId -> Lesson -> SqlPersistT m ()
update = replace

delete :: MonadIO m => LessonId -> SqlPersistT m ()
delete = P.delete
