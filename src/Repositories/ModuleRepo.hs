module Repositories.ModuleRepo
  ( listAll
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
  )
import qualified Database.Persist as P
import Database.Persist.Sql (SqlPersistT, get)
import Database.Schema

listAll :: MonadIO m => SqlPersistT m [Entity Module]
listAll = selectList [] [Asc ModuleOrderIdx]

findById :: MonadIO m => ModuleId -> SqlPersistT m (Maybe Module)
findById = get

create :: MonadIO m => Module -> SqlPersistT m ModuleId
create = insert

update :: MonadIO m => ModuleId -> Module -> SqlPersistT m ()
update = replace

delete :: MonadIO m => ModuleId -> SqlPersistT m ()
delete = P.delete
