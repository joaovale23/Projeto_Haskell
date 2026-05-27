module Repositories.DiagnosticRepo
  ( listQuestions
  , findQuestion
  , insertResult
  , latestResultForUser
  ) where

import Control.Monad.IO.Class (MonadIO)
import Database.Persist
  ( Entity (..)
  , SelectOpt (Asc, Desc, LimitTo)
  , insert
  , selectList
  , (==.)
  )
import Database.Persist.Sql (SqlPersistT, get)
import Database.Schema

listQuestions :: MonadIO m => SqlPersistT m [Entity DiagnosticQuestion]
listQuestions = selectList [] [Asc DiagnosticQuestionId]

findQuestion :: MonadIO m => DiagnosticQuestionId -> SqlPersistT m (Maybe DiagnosticQuestion)
findQuestion = get

insertResult :: MonadIO m => DiagnosticResult -> SqlPersistT m DiagnosticResultId
insertResult = insert

latestResultForUser :: MonadIO m => UserId -> SqlPersistT m (Maybe (Entity DiagnosticResult))
latestResultForUser uid = do
  results <- selectList [DiagnosticResultUserId ==. uid]
                        [Desc DiagnosticResultCreatedAt, LimitTo 1]
  case results of
    (r:_) -> pure (Just r)
    []    -> pure Nothing
