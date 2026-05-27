{-# LANGUAGE TemplateHaskell #-}

module Domain.Exercise
  ( ExerciseKind (..)
  , SubmitError (..)
  , checkAnswer
  ) where

import Data.Aeson (FromJSON, ToJSON, Value (..))
import qualified Data.Aeson.KeyMap as KM
import qualified Data.Aeson.Key as Key
import Data.Scientific (toRealFloat)
import qualified Data.Text as T
import Database.Persist.TH (derivePersistField)
import GHC.Generics (Generic)

data ExerciseKind
  = MultipleChoice
  | Numeric
  | OpenText
  deriving stock (Show, Read, Eq, Generic)

instance ToJSON ExerciseKind
instance FromJSON ExerciseKind

derivePersistField "ExerciseKind"

data SubmitError
  = WrongPayloadShape
  | InvalidAnswer
  deriving (Show, Eq)

-- | Avalia uma resposta dado o tipo, o payload do enunciado, o gabarito e a submissão.
checkAnswer
  :: ExerciseKind
  -> Value           -- ^ payload
  -> Value           -- ^ gabarito (answer)
  -> Value           -- ^ resposta enviada
  -> Either SubmitError Bool
checkAnswer MultipleChoice _payload answer submitted = do
  expected <- requireInt answer
  actual   <- requireInt submitted
  pure (expected == actual)
checkAnswer Numeric payload answer submitted = do
  expected <- requireNumber answer
  actual   <- requireNumber submitted
  let tol = numberFromObject "tolerance" payload
  pure (abs (actual - expected) <= tol)
checkAnswer OpenText _payload answer submitted = do
  expected <- requireText answer
  actual   <- requireText submitted
  pure (normalize expected == normalize actual)

requireInt :: Value -> Either SubmitError Int
requireInt (Number n) = case toRealFloat n :: Double of
  d | d == fromIntegral (round d :: Int) -> Right (round d)
  _ -> Left InvalidAnswer
requireInt _ = Left InvalidAnswer

requireNumber :: Value -> Either SubmitError Double
requireNumber (Number n) = Right (toRealFloat n)
requireNumber _ = Left InvalidAnswer

requireText :: Value -> Either SubmitError T.Text
requireText (String t) = Right t
requireText _ = Left InvalidAnswer

numberFromObject :: T.Text -> Value -> Double
numberFromObject k (Object o) = case KM.lookup (Key.fromText k) o of
  Just (Number n) -> toRealFloat n
  _               -> 0
numberFromObject _ _ = 0

normalize :: T.Text -> T.Text
normalize = T.toLower . T.strip . T.map (\c -> if c == '\t' then ' ' else c)
