module Repositories.ModuleRepo
  ( listAll
  , findById
  , create
  , update
  , delete
  , deleteCascade
  , nextOrderIdx
  , resequence
  , findFreeSlug
  ) where

import Control.Monad.IO.Class (MonadIO)
import Data.Text (Text)
import qualified Data.Text as T
import Database.Persist
  ( Entity (..)
  , SelectOpt (Asc, Desc, LimitTo)
  , getBy
  , insert
  , replace
  , selectList
  , updateWhere
  , (=.)
  , (==.)
  )
import qualified Database.Persist as P
import Database.Persist.Sql (SqlPersistT, get)
import Database.Schema
import qualified Repositories.LessonRepo as LessonRepo

listAll :: MonadIO m => SqlPersistT m [Entity Module]
listAll = selectList [] [Asc ModuleOrderIdx]

findById :: MonadIO m => ModuleId -> SqlPersistT m (Maybe Module)
findById = get

create :: MonadIO m => Module -> SqlPersistT m ModuleId
create = insert

update :: MonadIO m => ModuleId -> Module -> SqlPersistT m ()
update = replace

delete :: MonadIO m => ModuleId -> SqlPersistT m ()
delete = P.delete

-- | Remove o módulo junto de suas lições (em cascata) e do próprio registro,
-- evitando órfãos e violação de FK.
deleteCascade :: MonadIO m => ModuleId -> SqlPersistT m ()
deleteCascade mid = do
  lessons <- selectList [LessonModuleId ==. mid] []
  mapM_ (LessonRepo.deleteCascade . entityKey) lessons
  -- Desfaz a referência de pré-requisito em módulos que dependem deste,
  -- evitando violar a FK auto-referente ao remover o registro.
  updateWhere [ModulePrerequisiteId ==. Just mid] [ModulePrerequisiteId =. Nothing]
  P.delete mid

-- | Próxima posição livre na sequência global de módulos.
nextOrderIdx :: MonadIO m => SqlPersistT m Int
nextOrderIdx = do
  ms <- selectList [] [Desc ModuleOrderIdx, LimitTo 1]
  pure $ case ms of
    (Entity _ m : _) -> moduleOrderIdx m + 1
    []               -> 1

-- | Renumera todos os módulos para 1..n por ordem atual, fechando lacunas.
resequence :: MonadIO m => SqlPersistT m ()
resequence = do
  ms <- selectList [] [Asc ModuleOrderIdx]
  mapM_ (\(i, Entity mid _) -> P.update mid [ModuleOrderIdx =. i]) (zip [1 ..] ms)

-- | Garante um slug único a partir de um candidato (gerado do título). Se já
-- existir, sufixa com -2, -3, ... Evita violar a constraint UniqueSlug.
findFreeSlug :: MonadIO m => Text -> SqlPersistT m Text
findFreeSlug raw = pick base (1 :: Int)
  where
    base = if T.null raw then "modulo" else raw
    pick candidate n = do
      existing <- getBy (UniqueSlug candidate)
      case existing of
        Nothing -> pure candidate
        Just _  -> pick (base <> "-" <> T.pack (show (n + 1))) (n + 1)
