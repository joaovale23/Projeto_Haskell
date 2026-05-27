module Domain.Diagnostic
  ( DiagnosticAnalysis (..)
  , analyze
  , recommendedSlugFor
  ) where

import Data.List (nub)
import Data.Map.Strict (Map)
import qualified Data.Map.Strict as Map
import Data.Maybe (mapMaybe)
import Data.Text (Text)

data DiagnosticAnalysis = DiagnosticAnalysis
  { daStrengths        :: [Text]
  , daWeaknesses       :: [Text]
  , daRecommendedSlugs :: [Text]
  } deriving (Show, Eq)

-- | Mapeamento fixo entre tópicos do diagnóstico e slugs de módulos sugeridos.
recommendedSlugFor :: Text -> Maybe Text
recommendedSlugFor "algebra"       = Just "funcoes"
recommendedSlugFor "funcoes"       = Just "limites"
recommendedSlugFor "trigonometria" = Just "funcoes"
recommendedSlugFor "graficos"      = Just "limites"
recommendedSlugFor _               = Nothing

-- | Agrupa respostas por tópico e classifica forças (>=70% acerto) e
-- fraquezas (<50% acerto). Recomenda módulos a partir das fraquezas.
analyze :: [(Text, Bool)] -> DiagnosticAnalysis
analyze answers =
  let grouped = foldr addAnswer Map.empty answers
      scored  = Map.toList (fmap score grouped)
      strengths  = [topic | (topic, pct) <- scored, pct >= 70]
      weaknesses = [topic | (topic, pct) <- scored, pct < 50]
      recommended = nub (mapMaybe recommendedSlugFor weaknesses)
  in DiagnosticAnalysis
       { daStrengths        = strengths
       , daWeaknesses       = weaknesses
       , daRecommendedSlugs = recommended
       }

addAnswer :: (Text, Bool) -> Map Text (Int, Int) -> Map Text (Int, Int)
addAnswer (topic, correct) =
  Map.insertWith (\(c1, t1) (c2, t2) -> (c1 + c2, t1 + t2))
                 topic
                 (if correct then 1 else 0, 1)

score :: (Int, Int) -> Int
score (_, 0)         = 0
score (correct, tot) = (correct * 100) `div` tot
