module Unit.Domain.ProgressSpec (spec) where

import Domain.Progress (percent)
import Test.Hspec

spec :: Spec
spec = describe "Domain.Progress.percent" $ do
  it "retorna 0 quando total e zero" $
    percent 0 0 `shouldBe` 0

  it "retorna 0 quando total e negativo" $
    percent 5 (-3) `shouldBe` 0

  it "calcula metade corretamente" $
    percent 5 10 `shouldBe` 50

  it "retorna 100 quando tudo concluido" $
    percent 10 10 `shouldBe` 100

  it "trunca como inteiro" $
    percent 1 3 `shouldBe` 33

  it "nunca passa de 100 mesmo com done maior que total" $
    percent 20 10 `shouldBe` 100

  it "nunca fica negativo com done negativo" $
    percent (-5) 10 `shouldBe` 0
