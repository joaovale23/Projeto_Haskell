module Domain.Password
  ( hashPassword
  , verifyPassword
  ) where

import Crypto.Hash (Digest, SHA256, hash)
import Data.ByteArray.Encoding (Base (Base16), convertToBase)
import Data.ByteString (ByteString)
import qualified Data.ByteString as BS
import Data.Text (Text)
import qualified Data.Text.Encoding as TE

salt :: ByteString
salt = "calculo-devs-salt-v1"

hashPassword :: Text -> Text
hashPassword pwd =
  let input  = BS.append salt (TE.encodeUtf8 pwd)
      digest = hash input :: Digest SHA256
      hex    = convertToBase Base16 digest :: ByteString
  in TE.decodeUtf8 hex

verifyPassword :: Text -> Text -> Bool
verifyPassword plain stored = hashPassword plain == stored
