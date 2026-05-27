module Unit.Domain.PasswordSpec (spec) where

import Domain.Password (hashPassword, verifyPassword)
import Test.Hspec

spec :: Spec
spec = describe "Domain.Password" $ do
  it "verifica corretamente senha valida apos hash" $
    verifyPassword "minhaSenha123" (hashPassword "minhaSenha123") `shouldBe` True

  it "rejeita senha errada" $
    verifyPassword "outraSenha" (hashPassword "minhaSenha123") `shouldBe` False

  it "produz hash deterministico para a mesma senha" $
    hashPassword "abc" `shouldBe` hashPassword "abc"

  it "produz hashes diferentes para senhas diferentes" $
    hashPassword "abc" /= hashPassword "abd" `shouldBe` True

  it "hash nao expoe a senha em texto puro" $ do
    let h = hashPassword "minhaSenhaSecreta"
    (h == "minhaSenhaSecreta") `shouldBe` False
