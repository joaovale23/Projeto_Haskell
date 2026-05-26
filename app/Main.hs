{-# LANGUAGE OverloadedStrings #-}
module Main (main) where

import Server.Routes (app)
import Network.Wai.Handler.Warp (run)

main :: IO ()
main = do
    putStrLn "Servidor rodando na porta 8080"
    run 8080 app
