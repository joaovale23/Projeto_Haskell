module Repositories.UserRepo
  ( findByEmail
  , insertUser
  , findById
  ) where

import Control.Monad.IO.Class (MonadIO)
import Data.Text (Text)
import Database.Persist (Entity, getBy, insert)
import Database.Persist.Sql (SqlPersistT, get)
import Database.Schema

findByEmail :: MonadIO m => Text -> SqlPersistT m (Maybe (Entity User))
findByEmail email = getBy (UniqueEmail email)

insertUser :: MonadIO m => User -> SqlPersistT m UserId
insertUser = insert

findById :: MonadIO m => UserId -> SqlPersistT m (Maybe User)
findById = get
