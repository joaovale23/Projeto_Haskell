module Main (main) where

import App.Env (Env (..))
import Config.AppConfig (AppConfig (..), loadConfig)
import Database.Pool (makePool, runMigrations)
import Network.Wai.Handler.Warp (run)
import Server (app)
import System.IO (BufferMode (LineBuffering), hSetBuffering, stderr, stdout)

main :: IO ()
main = do
  -- Em container, stdout/stderr sao pipes e o GHC usa block-buffering por
  -- padrao, o que faz os logs nao aparecerem no Render. Forca line-buffering.
  hSetBuffering stdout LineBuffering
  hSetBuffering stderr LineBuffering
  cfg  <- loadConfig
  putStrLn ("Conectando ao banco em " <> show (acDatabaseUrl cfg))
  pool <- makePool (acDatabaseUrl cfg) 3
  putStrLn "Rodando migracoes..."
  runMigrations pool
  let env = Env { envDbPool = pool, envConfig = cfg }
  putStrLn ("Servidor rodando na porta " <> show (acPort cfg))
  run (acPort cfg) (app env)
