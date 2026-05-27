module Handlers.Module
  ( moduleServer
  ) where

import API.Routes (ModuleAPI)
import API.Types
import App.Monad (AppM)
import Control.Exception (throwIO)
import Control.Monad.IO.Class (liftIO)
import Data.Int (Int64)
import Database.Persist (Entity (..))
import Database.Persist.Sql (fromSqlKey, toSqlKey)
import Database.Schema
import Servant
import qualified Services.LessonService as LessonSvc
import qualified Services.ModuleService as ModuleSvc
import qualified Services.PermissionService as Permission

moduleServer :: ServerT ModuleAPI AppM
moduleServer =
       handleList
  :<|> handleGet
  :<|> handleCreate
  :<|> handleUpdate
  :<|> handleDelete
  :<|> handleLessonsOfModule

handleList :: AppM [ModuleResponse]
handleList = map toModuleResponse <$> ModuleSvc.listModules

handleGet :: Int64 -> AppM ModuleResponse
handleGet rawId = do
  let mid = toSqlKey rawId :: ModuleId
  result <- ModuleSvc.getModule mid
  case result of
    Just m  -> pure (toModuleResponse (Entity mid m))
    Nothing -> liftIO (throwIO err404 { errBody = "Modulo nao encontrado" })

handleCreate :: Maybe Int64 -> ModuleRequest -> AppM ModuleResponse
handleCreate userId ModuleRequest{..} = do
  Permission.checkTeacher userId
  let prereq = toSqlKey <$> mrqPrerequisiteId
  mid <- ModuleSvc.createModule mrqTitle mrqSlug mrqDescription mrqOrderIdx prereq
  pure ModuleResponse
    { mrsId             = fromSqlKey mid
    , mrsTitle          = mrqTitle
    , mrsSlug           = mrqSlug
    , mrsDescription    = mrqDescription
    , mrsOrderIdx       = mrqOrderIdx
    , mrsPrerequisiteId = mrqPrerequisiteId
    }

handleUpdate :: Int64 -> Maybe Int64 -> ModuleRequest -> AppM ModuleResponse
handleUpdate rawId userId ModuleRequest{..} = do
  Permission.checkTeacher userId
  let mid    = toSqlKey rawId :: ModuleId
      prereq = toSqlKey <$> mrqPrerequisiteId
  existing <- ModuleSvc.getModule mid
  case existing of
    Nothing -> liftIO (throwIO err404 { errBody = "Modulo nao encontrado" })
    Just _  -> do
      ModuleSvc.updateModule mid mrqTitle mrqSlug mrqDescription mrqOrderIdx prereq
      pure ModuleResponse
        { mrsId             = rawId
        , mrsTitle          = mrqTitle
        , mrsSlug           = mrqSlug
        , mrsDescription    = mrqDescription
        , mrsOrderIdx       = mrqOrderIdx
        , mrsPrerequisiteId = mrqPrerequisiteId
        }

handleDelete :: Int64 -> Maybe Int64 -> AppM NoContent
handleDelete rawId userId = do
  Permission.checkTeacher userId
  ModuleSvc.deleteModule (toSqlKey rawId :: ModuleId)
  pure NoContent

handleLessonsOfModule :: Int64 -> AppM [LessonResponse]
handleLessonsOfModule rawId = do
  let mid = toSqlKey rawId :: ModuleId
  map toLessonResponse <$> LessonSvc.listByModule mid
