module Domain.Permissions
  ( PermissionError (..)
  , requireTeacher
  ) where

import Domain.Types (Role (..))

data PermissionError
  = NotTeacher
  | UserMissing
  deriving (Show, Eq)

-- | Permite a operação somente se houver usuário e ele for Teacher.
requireTeacher :: Maybe Role -> Either PermissionError ()
requireTeacher Nothing        = Left UserMissing
requireTeacher (Just Teacher) = Right ()
requireTeacher (Just Student) = Left NotTeacher
