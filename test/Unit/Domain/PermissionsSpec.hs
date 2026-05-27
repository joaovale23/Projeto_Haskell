module Unit.Domain.PermissionsSpec (spec) where

import Domain.Permissions (PermissionError (..), requireTeacher)
import Domain.Types (Role (..))
import Test.Hspec

spec :: Spec
spec = describe "requireTeacher" $ do
  it "permite Teacher" $
    requireTeacher (Just Teacher) `shouldBe` Right ()

  it "bloqueia Student com NotTeacher" $
    requireTeacher (Just Student) `shouldBe` Left NotTeacher

  it "bloqueia ausencia de usuario com UserMissing" $
    requireTeacher Nothing `shouldBe` Left UserMissing
