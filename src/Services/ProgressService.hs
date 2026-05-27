module Services.ProgressService
  ( listForUser
  , markCompleted
  , unmark
  ) where

import App.Monad (AppM, runDb)
import Control.Monad.IO.Class (liftIO)
import Data.Time (getCurrentTime)
import Database.Persist (Entity)
import Database.Schema
import qualified Repositories.ProgressRepo as ProgressRepo

listForUser :: UserId -> AppM [Entity Progress]
listForUser = runDb . ProgressRepo.listForUser

markCompleted :: UserId -> LessonId -> AppM ()
markCompleted uid lid = do
  now <- liftIO getCurrentTime
  runDb (ProgressRepo.upsert uid lid now)

unmark :: UserId -> LessonId -> AppM ()
unmark uid lid = runDb (ProgressRepo.deleteByUserLesson uid lid)
