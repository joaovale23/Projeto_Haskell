module Config.AppConfig
  ( AppConfig (..)
  , loadConfig
  ) where

import Data.ByteString (ByteString)
import qualified Data.ByteString.Char8 as BS
import System.Environment (lookupEnv)
import Text.Read (readMaybe)

data AppConfig = AppConfig
  { acDatabaseUrl :: ByteString
  , acPort        :: Int
  }

loadConfig :: IO AppConfig
loadConfig = do
  dbUrl <- lookupEnv "DATABASE_URL"
  port  <- lookupEnv "PORT"
  pure AppConfig
    { acDatabaseUrl = BS.pack (maybe defaultDbUrl id dbUrl)
    , acPort        = maybe 8080 id (port >>= readMaybe)
    }
  where
    defaultDbUrl = "postgresql://devs:devs@localhost:5432/calculo_devs"
