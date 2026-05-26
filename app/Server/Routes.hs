{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TypeApplications #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE OverloadedStrings #-}
module Server.Routes (app) where

import Data.Proxy (Proxy (..))
import Data.Text (Text)
import Servant.API
import Servant.Server

type API = "hello" :> Get '[PlainText] Text

handlerHello :: Handler Text
handlerHello = pure "hello world"

server :: Server API
server = handlerHello

app :: Application
app = serve (Proxy @API) server
