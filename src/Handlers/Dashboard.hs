module Handlers.Dashboard
  ( dashboardServer
  ) where

import API.Routes (DashboardAPI)
import API.Types (DashboardResponse)
import App.Monad (AppM)
import Data.Int (Int64)
import Servant
import qualified Services.DashboardService as DashboardSvc
import qualified Services.PermissionService as Permission

dashboardServer :: ServerT DashboardAPI AppM
dashboardServer = handleGet

handleGet :: Maybe Int64 -> AppM DashboardResponse
handleGet userId = do
  Permission.checkTeacher userId
  DashboardSvc.getDashboard
