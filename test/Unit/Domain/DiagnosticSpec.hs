module Unit.Domain.DiagnosticSpec (spec) where

import Data.List (sort)
import Domain.Diagnostic (DiagnosticAnalysis (..), analyze, recommendedSlugFor)
import Test.Hspec

spec :: Spec
spec = do
  describe "analyze" $ do
    it "classifica topico com >=70% de acerto como forca" $ do
      let answers = replicate 7 ("algebra", True) ++ replicate 3 ("algebra", False)
          r = analyze answers
      daStrengths r `shouldBe` ["algebra"]

    it "classifica topico com <50% como fraqueza" $ do
      let answers = replicate 2 ("trigonometria", True) ++ replicate 8 ("trigonometria", False)
          r = analyze answers
      daWeaknesses r `shouldBe` ["trigonometria"]

    it "topico entre 50% e 70% nao entra em forca nem fraqueza" $ do
      let answers = replicate 6 ("funcoes", True) ++ replicate 4 ("funcoes", False)
          r = analyze answers
      daStrengths r `shouldBe` []
      daWeaknesses r `shouldBe` []

    it "deduz slugs recomendados das fraquezas" $ do
      let answers = replicate 1 ("algebra", True) ++ replicate 9 ("algebra", False)
                 ++ replicate 1 ("trigonometria", True) ++ replicate 9 ("trigonometria", False)
          r = analyze answers
      sort (daRecommendedSlugs r) `shouldBe` ["funcoes"]

    it "lista vazia retorna sem strengths ou weaknesses" $ do
      let r = analyze []
      daStrengths r `shouldBe` []
      daWeaknesses r `shouldBe` []
      daRecommendedSlugs r `shouldBe` []

  describe "recommendedSlugFor" $ do
    it "mapeia algebra para funcoes" $
      recommendedSlugFor "algebra" `shouldBe` Just "funcoes"

    it "mapeia funcoes para limites" $
      recommendedSlugFor "funcoes" `shouldBe` Just "limites"

    it "retorna Nothing para topico desconhecido" $
      recommendedSlugFor "topologia-algebrica" `shouldBe` Nothing
