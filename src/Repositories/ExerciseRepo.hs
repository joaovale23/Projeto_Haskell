module Repositories.ExerciseRepo
  ( listByLesson
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

listByLesson :: MonadIO m => LessonId -> SqlPersistT m [Entity Exercise]
listByLesson lid = selectList [ExerciseLessonId ==. lid] [Asc ExerciseOrderIdx]

findById :: MonadIO m => ExerciseId -> SqlPersistT m (Maybe Exercise)
findById = get

create :: MonadIO m => Exercise -> SqlPersistT m ExerciseId
create = insert

update :: MonadIO m => ExerciseId -> Exercise -> SqlPersistT m ()
update = replace

delete :: MonadIO m => ExerciseId -> SqlPersistT m ()
delete = P.delete
