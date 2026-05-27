module Main (main) where

import App.Env (Env (..))
import Config.AppConfig (AppConfig (..), loadConfig)
import Database.Pool (makePool, runMigrations)
import Network.Wai.Handler.Warp (run)
import Server (app)

main :: IO ()
main = do
  cfg  <- loadConfig
  putStrLn ("Conectando ao banco em " <> show (acDatabaseUrl cfg))
  pool <- makePool (acDatabaseUrl cfg) 10
  putStrLn "Rodando migracoes..."
  runMigrations pool
  let env = Env { envDbPool = pool, envConfig = cfg }
  putStrLn ("Servidor rodando na porta " <> show (acPort cfg))
  run (acPort cfg) (app env)
