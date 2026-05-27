module Handlers.Roadmap
  ( roadmapServer
  ) where

import API.Routes (RoadmapAPI)
import API.Types
import App.Monad (AppM)
import Data.Int (Int64)
import Database.Persist (Entity (..))
import Database.Schema (Module, moduleDescription, moduleOrderIdx, moduleSlug, moduleTitle)
import qualified Domain.Roadmap as Roadmap
import Servant
import qualified Services.PermissionService as Permission
import qualified Services.RoadmapService as RoadmapSvc

roadmapServer :: ServerT RoadmapAPI AppM
roadmapServer = handleGet

handleGet :: Maybe Int64 -> AppM [RoadmapItemResponse]
handleGet userId = do
  uid <- Permission.requireUserId userId
  items <- RoadmapSvc.buildRoadmapForUser uid
  pure (map toResponse items)
  where
    toResponse :: Roadmap.RoadmapItem (Entity Module) -> RoadmapItemResponse
    toResponse it = RoadmapItemResponse
      { API.Types.riModuleId         = Roadmap.riModuleId it
      , API.Types.riTitle            = moduleTitle (extract (Roadmap.riModule it))
      , API.Types.riSlug             = moduleSlug (extract (Roadmap.riModule it))
      , API.Types.riDescription      = moduleDescription (extract (Roadmap.riModule it))
      , API.Types.riOrderIdx         = moduleOrderIdx (extract (Roadmap.riModule it))
      , API.Types.riPrerequisiteId   = Roadmap.riPrerequisiteId it
      , API.Types.riUnlocked         = Roadmap.riUnlocked it
      , API.Types.riCompletedLessons = Roadmap.riCompletedLessons it
      , API.Types.riTotalLessons     = Roadmap.riTotalLessons it
      }

    extract :: Entity Module -> Module
    extract (Entity _ m) = m
