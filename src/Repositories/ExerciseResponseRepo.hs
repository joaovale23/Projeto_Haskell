module Repositories.ExerciseResponseRepo
  ( findByUserExercise
  , insert
  , listByUserAndExercises
  , deleteByExercise
  ) where

import Control.Monad (void)
import Control.Monad.IO.Class (MonadIO)
import Database.Persist
  ( Entity
  , deleteWhere
  , getBy
  , selectList
  , (<-.)
  , (==.)
  )
import qualified Database.Persist as P
import Database.Persist.Sql (SqlPersistT)
import Database.Schema

findByUserExercise
  :: MonadIO m
  => UserId -> ExerciseId -> SqlPersistT m (Maybe (Entity ExerciseAttempt))
findByUserExercise uid eid = getBy (UniqueUserExercise uid eid)

insert :: MonadIO m => ExerciseAttempt -> SqlPersistT m ()
insert = void . P.insert

-- | Tentativas de um usuário restritas a um conjunto de exercícios (ex.: os de
-- uma lição), para o front pintar o estado já respondido.
listByUserAndExercises
  :: MonadIO m
  => UserId -> [ExerciseId] -> SqlPersistT m [Entity ExerciseAttempt]
listByUserAndExercises uid eids =
  selectList [ExerciseAttemptUserId ==. uid, ExerciseAttemptExerciseId <-. eids] []

deleteByExercise :: MonadIO m => ExerciseId -> SqlPersistT m ()
deleteByExercise eid = deleteWhere [ExerciseAttemptExerciseId ==. eid]
