{-# LANGUAGE TemplateHaskell #-}

module Domain.Types
  ( Role (..)
  ) where

import Data.Aeson (FromJSON, ToJSON)
import Database.Persist.TH (derivePersistField)
import GHC.Generics (Generic)

data Role
  = Student
  | Teacher
  deriving stock (Show, Read, Eq, Generic)

instance ToJSON Role
instance FromJSON Role

derivePersistField "Role"
