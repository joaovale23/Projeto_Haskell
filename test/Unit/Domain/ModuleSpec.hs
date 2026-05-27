module Unit.Domain.ModuleSpec (spec) where

import Domain.Module (canAccessModule)
import Test.Hspec

spec :: Spec
spec = describe "canAccessModule" $ do
  it "permite acesso quando nao ha pre-requisito" $
    canAccessModule [] Nothing `shouldBe` True

  it "permite acesso ao modulo inicial mesmo sem nada concluido" $
    canAccessModule [] Nothing `shouldBe` True

  it "bloqueia acesso quando pre-requisito nao foi concluido" $
    canAccessModule [] (Just 1) `shouldBe` False

  it "libera acesso quando pre-requisito esta entre os concluidos" $
    canAccessModule [1, 2, 3] (Just 2) `shouldBe` True

  it "bloqueia quando pre-requisito nao esta na lista" $
    canAccessModule [1, 3] (Just 2) `shouldBe` False
