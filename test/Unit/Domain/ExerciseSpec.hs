module Unit.Domain.ExerciseSpec (spec) where

import Data.Aeson (Value (..), object, (.=))
import Domain.Exercise
  ( ExerciseKind (..)
  , SubmitError (..)
  , checkAnswer
  )
import Test.Hspec

spec :: Spec
spec = do
  describe "checkAnswer MultipleChoice" $ do
    it "aceita indice correto" $
      checkAnswer MultipleChoice Null (Number 2) (Number 2) `shouldBe` Right True

    it "rejeita indice diferente" $
      checkAnswer MultipleChoice Null (Number 2) (Number 0) `shouldBe` Right False

    it "rejeita resposta nao numerica" $
      checkAnswer MultipleChoice Null (Number 2) (String "x") `shouldBe` Left InvalidAnswer

  describe "checkAnswer Numeric" $ do
    it "aceita quando diferenca esta dentro da tolerancia" $
      let payload = object ["tolerance" .= (0.01 :: Double)]
      in checkAnswer Numeric payload (Number 3.14) (Number 3.145) `shouldBe` Right True

    it "rejeita quando diferenca excede a tolerancia" $
      let payload = object ["tolerance" .= (0.01 :: Double)]
      in checkAnswer Numeric payload (Number 3.14) (Number 3.5) `shouldBe` Right False

    it "usa tolerancia zero quando payload nao especifica" $
      checkAnswer Numeric Null (Number 1) (Number 1) `shouldBe` Right True

  describe "checkAnswer OpenText" $ do
    it "normaliza espacos e caixa" $
      checkAnswer OpenText Null (String "Limites") (String "  limites  ") `shouldBe` Right True

    it "rejeita textos diferentes" $
      checkAnswer OpenText Null (String "limites") (String "derivadas") `shouldBe` Right False

    it "rejeita resposta nao textual" $
      checkAnswer OpenText Null (String "x") (Number 1) `shouldBe` Left InvalidAnswer
