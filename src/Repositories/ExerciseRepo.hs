module Repositories.ExerciseRepo
  ( listByLesson
  , findById
  , create
  , update
  , delete
  , nextOrderIdx
  , resequence
  ) where

import Control.Monad.IO.Class (MonadIO)
import Database.Persist
  ( Entity (..)
  , SelectOpt (Asc, Desc, LimitTo)
  , insert
  , replace
  , selectList
  , (=.)
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

-- | Próxima posição livre na sequência de exercícios de uma lição.
nextOrderIdx :: MonadIO m => LessonId -> SqlPersistT m Int
nextOrderIdx lid = do
  es <- selectList [ExerciseLessonId ==. lid] [Desc ExerciseOrderIdx, LimitTo 1]
  pure $ case es of
    (Entity _ e : _) -> exerciseOrderIdx e + 1
    []               -> 1

-- | Renumera os exercícios da lição para 1..n por ordem atual, fechando lacunas.
resequence :: MonadIO m => LessonId -> SqlPersistT m ()
resequence lid = do
  es <- selectList [ExerciseLessonId ==. lid] [Asc ExerciseOrderIdx]
  mapM_ (\(i, Entity eid _) -> P.update eid [ExerciseOrderIdx =. i]) (zip [1 ..] es)
