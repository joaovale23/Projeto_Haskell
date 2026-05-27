module Services.ModuleService
  ( listModules
  , getModule
  , createModule
  , updateModule
  , deleteModule
  ) where

import App.Monad (AppM, runDb)
import Data.Text (Text)
import Database.Persist (Entity)
import Database.Schema
import qualified Repositories.ModuleRepo as ModuleRepo

listModules :: AppM [Entity Module]
listModules = runDb ModuleRepo.listAll

getModule :: ModuleId -> AppM (Maybe Module)
getModule = runDb . ModuleRepo.findById

createModule
  :: Text          -- ^ title
  -> Text          -- ^ slug
  -> Text          -- ^ description
  -> Int           -- ^ orderIdx
  -> Maybe ModuleId
  -> AppM ModuleId
createModule title slug desc idx prereq =
  runDb (ModuleRepo.create Module
    { moduleTitle          = title
    , moduleSlug           = slug
    , moduleDescription    = desc
    , moduleOrderIdx       = idx
    , modulePrerequisiteId = prereq
    })

updateModule
  :: ModuleId
  -> Text
  -> Text
  -> Text
  -> Int
  -> Maybe ModuleId
  -> AppM ()
updateModule mid title slug desc idx prereq =
  runDb (ModuleRepo.update mid Module
    { moduleTitle          = title
    , moduleSlug           = slug
    , moduleDescription    = desc
    , moduleOrderIdx       = idx
    , modulePrerequisiteId = prereq
    })

deleteModule :: ModuleId -> AppM ()
deleteModule = runDb . ModuleRepo.delete
