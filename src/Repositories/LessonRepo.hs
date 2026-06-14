module Repositories.LessonRepo
  ( listByModule
  , findById
  , create
  , update
  , deleteCascade
  , nextOrderIdx
  , resequence
  ) where

import Control.Monad.IO.Class (MonadIO)
import Database.Persist
  ( Entity (..)
  , SelectOpt (Asc, Desc, LimitTo)
  , deleteWhere
  , insert
  , replace
  , selectList
  , (<-.)
  , (=.)
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

-- | Remove a lição junto de tudo que depende dela (exercícios e progresso),
-- evitando registros órfãos e violação de FK.
deleteCascade :: MonadIO m => LessonId -> SqlPersistT m ()
deleteCascade lid = do
  exs <- selectList [ExerciseLessonId ==. lid] []
  deleteWhere [ExerciseAttemptExerciseId <-. map entityKey exs]
  deleteWhere [ExerciseLessonId ==. lid]
  deleteWhere [ProgressLessonId ==. lid]
  P.delete lid

-- | Próxima posição livre na sequência de lições de um módulo.
nextOrderIdx :: MonadIO m => ModuleId -> SqlPersistT m Int
nextOrderIdx mid = do
  ls <- selectList [LessonModuleId ==. mid] [Desc LessonOrderIdx, LimitTo 1]
  pure $ case ls of
    (Entity _ l : _) -> lessonOrderIdx l + 1
    []               -> 1

-- | Renumera as lições do módulo para 1..n por ordem atual, fechando lacunas.
resequence :: MonadIO m => ModuleId -> SqlPersistT m ()
resequence mid = do
  ls <- selectList [LessonModuleId ==. mid] [Asc LessonOrderIdx]
  mapM_ (\(i, Entity lid _) -> P.update lid [LessonOrderIdx =. i]) (zip [1 ..] ls)
