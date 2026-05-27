module Services.RoadmapService
  ( buildRoadmapForUser
  ) where

import App.Monad (AppM, runDb)
import Data.Int (Int64)
import qualified Data.Map.Strict as Map
import qualified Data.Set as Set
import Database.Persist (Entity (..))
import Database.Persist.Sql (fromSqlKey, toSqlKey)
import Database.Schema
import Domain.Roadmap (RoadmapItem, buildRoadmap)
import qualified Repositories.ModuleRepo as ModuleRepo
import qualified Repositories.ProgressRepo as ProgressRepo

buildRoadmapForUser :: UserId -> AppM [RoadmapItem (Entity Module)]
buildRoadmapForUser uid = do
  modules                       <- runDb ModuleRepo.listAll
  (lessonToModule, totalByMod)  <- runDb ProgressRepo.countLessonsByModule
  doneByMod                     <- runDb (ProgressRepo.countCompletedLessonsByModule uid lessonToModule)
  let totalsInt = Map.mapKeys fromSqlKey totalByMod
      doneInt   = Map.mapKeys fromSqlKey doneByMod
      completedModules = Set.fromList
        [ mid
        | (mid, total) <- Map.toList totalsInt
        , total > 0
        , Map.findWithDefault 0 mid doneInt >= total
        ]
      tuples =
        [ (fromSqlKey mid, fromSqlKey <$> modulePrerequisiteId m, Entity mid m)
        | Entity mid m <- modules
        ]
  pure (buildRoadmap tuples totalsInt doneInt completedModules)
  where
    _ = toSqlKey :: Int64 -> ModuleId
