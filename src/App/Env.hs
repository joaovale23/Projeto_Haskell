module App.Env
  ( Env (..)
  ) where

import Config.AppConfig (AppConfig)
import Database.Persist.Sql (ConnectionPool)

data Env = Env
  { envDbPool :: ConnectionPool
  , envConfig :: AppConfig
  }
