module Unit.Services.AuthServiceSpec (spec) where

import qualified Data.Text as T
import Services.AuthService (validateEmail, validatePassword)
import Test.Hspec

spec :: Spec
spec = do
  describe "validateEmail" $ do
    it "aceita email com @ e ." $
      validateEmail "user@example.com" `shouldBe` True

    it "rejeita string vazia" $
      validateEmail "" `shouldBe` False

    it "rejeita string sem @" $
      validateEmail "userexample.com" `shouldBe` False

    it "rejeita string sem ." $
      validateEmail "user@example" `shouldBe` False

    it "rejeita string apenas com espacos" $
      validateEmail "   " `shouldBe` False

  describe "validatePassword" $ do
    it "aceita senha com 6 caracteres" $
      validatePassword "abcdef" `shouldBe` True

    it "aceita senha longa" $
      validatePassword (T.replicate 20 "a") `shouldBe` True

    it "rejeita senha com menos de 6 caracteres" $
      validatePassword "abc" `shouldBe` False

    it "rejeita senha vazia" $
      validatePassword "" `shouldBe` False
