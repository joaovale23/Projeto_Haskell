{-# LANGUAGE DerivingStrategies #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}

module App.Monad
  ( AppM (..)
  , runDb
  ) where

import App.Env (Env (..))
import Control.Monad.IO.Class (MonadIO, liftIO)
import Control.Monad.Reader (MonadReader, ReaderT, asks)
import Database.Persist.Sql (SqlPersistT, runSqlPool)
import UnliftIO (MonadUnliftIO)

newtype AppM a = AppM { runAppM :: ReaderT Env IO a }
  deriving newtype
    ( Functor
    , Applicative
    , Monad
    , MonadIO
    , MonadReader Env
    , MonadUnliftIO
    )

runDb :: SqlPersistT IO a -> AppM a
runDb action = do
  pool <- asks envDbPool
  liftIO (runSqlPool action pool)
