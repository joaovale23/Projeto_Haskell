module Database.Pool
  ( makePool
  , runMigrations
  ) where

import Control.Monad.Logger (runStderrLoggingT)
import Data.ByteString (ByteString)
import Database.Persist.Postgresql
  ( ConnectionPool
  , createPostgresqlPool
  , runSqlPool
  )
import Database.Persist.Sql (runMigration)
import Database.Schema (migrateAll)

makePool :: ByteString -> Int -> IO ConnectionPool
makePool connStr poolSize =
  runStderrLoggingT (createPostgresqlPool connStr poolSize)

runMigrations :: ConnectionPool -> IO ()
runMigrations = runSqlPool (runMigration migrateAll)
