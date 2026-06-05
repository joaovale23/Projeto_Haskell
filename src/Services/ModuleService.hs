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

-- | Cria o módulo na próxima posição livre (ordenação automática) e devolve o
-- id junto da posição atribuída.
createModule
  :: Text          -- ^ title
  -> Text          -- ^ slug
  -> Text          -- ^ description
  -> Maybe ModuleId
  -> AppM (ModuleId, Int)
createModule title slug desc prereq = runDb $ do
  idx   <- ModuleRepo.nextOrderIdx
  slug' <- ModuleRepo.findFreeSlug slug
  mid   <- ModuleRepo.create Module
    { moduleTitle          = title
    , moduleSlug           = slug'
    , moduleDescription    = desc
    , moduleOrderIdx       = idx
    , modulePrerequisiteId = prereq
    }
  pure (mid, idx)

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

-- | Exclui em cascata e renumera a sequência de módulos.
deleteModule :: ModuleId -> AppM ()
deleteModule mid = runDb $ do
  ModuleRepo.deleteCascade mid
  ModuleRepo.resequence
