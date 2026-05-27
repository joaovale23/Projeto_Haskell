module Domain.Progress
  ( percent
  ) where

-- | Calcula a porcentagem (0..100) de itens concluídos.
-- Garante: nunca negativo, nunca > 100, retorna 0 quando total <= 0.
percent :: Int -> Int -> Int
percent _ total | total <= 0 = 0
percent done total =
  let capped = max 0 (min done total)
  in (capped * 100) `div` total
