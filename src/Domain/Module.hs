module Domain.Module
  ( canAccessModule
  ) where

import Data.Int (Int64)

-- | Um módulo está acessível quando não tem pré-requisito
-- ou quando o pré-requisito consta na lista de módulos concluídos.
canAccessModule
  :: [Int64]      -- ^ Ids dos módulos já concluídos pelo usuário
  -> Maybe Int64  -- ^ Id do pré-requisito do módulo (se houver)
  -> Bool
canAccessModule _        Nothing       = True
canAccessModule done     (Just prereq) = prereq `elem` done
