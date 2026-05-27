module Domain.Roadmap
  ( RoadmapItem (..)
  , buildRoadmap
  ) where

import Data.Int (Int64)
import Data.Map.Strict (Map)
import qualified Data.Map.Strict as Map
import Data.Set (Set)
import qualified Data.Set as Set
import Domain.Module (canAccessModule)

data RoadmapItem a = RoadmapItem
  { riModule           :: a
  , riModuleId         :: Int64
  , riPrerequisiteId   :: Maybe Int64
  , riUnlocked         :: Bool
  , riCompletedLessons :: Int
  , riTotalLessons     :: Int
  } deriving (Show, Eq)

-- | Constrói os itens do roadmap dado os módulos (com seus IDs e prereqs),
-- os totais e os concluídos por módulo, e o conjunto de módulos 100% concluídos.
buildRoadmap
  :: [(Int64, Maybe Int64, a)]  -- ^ (moduleId, prerequisiteId, payload)
  -> Map Int64 Int              -- ^ total de lições por módulo
  -> Map Int64 Int              -- ^ lições concluídas pelo usuário por módulo
  -> Set Int64                  -- ^ módulos com 100% concluído (derivável dos mapas)
  -> [RoadmapItem a]
buildRoadmap modules totals done completedModules =
  let completedList = Set.toList completedModules
  in map (toItem completedList) modules
  where
    toItem completed (mid, prereq, payload) = RoadmapItem
      { riModule           = payload
      , riModuleId         = mid
      , riPrerequisiteId   = prereq
      , riUnlocked         = canAccessModule completed prereq
      , riCompletedLessons = Map.findWithDefault 0 mid done
      , riTotalLessons     = Map.findWithDefault 0 mid totals
      }
