module Services.LessonService
  ( listByModule
  , getLesson
  , createLesson
  , updateLesson
  , deleteLesson
  ) where

import App.Monad (AppM, runDb)
import Data.Text (Text)
import Database.Persist (Entity)
import Database.Schema
import qualified Repositories.LessonRepo as LessonRepo

listByModule :: ModuleId -> AppM [Entity Lesson]
listByModule = runDb . LessonRepo.listByModule

getLesson :: LessonId -> AppM (Maybe Lesson)
getLesson = runDb . LessonRepo.findById

-- | Cria a lição na próxima posição livre do módulo (ordenação automática) e
-- devolve o id junto da posição atribuída.
createLesson :: ModuleId -> Text -> Text -> AppM (LessonId, Int)
createLesson mid title content = runDb $ do
  idx <- LessonRepo.nextOrderIdx mid
  lid <- LessonRepo.create Lesson
    { lessonModuleId = mid
    , lessonTitle    = title
    , lessonContent  = content
    , lessonOrderIdx = idx
    }
  pure (lid, idx)

updateLesson :: LessonId -> ModuleId -> Text -> Text -> Int -> AppM ()
updateLesson lid mid title content idx =
  runDb (LessonRepo.update lid Lesson
    { lessonModuleId = mid
    , lessonTitle    = title
    , lessonContent  = content
    , lessonOrderIdx = idx
    })

-- | Exclui em cascata e renumera as lições do módulo afetado.
deleteLesson :: LessonId -> AppM ()
deleteLesson lid = runDb $ do
  mLesson <- LessonRepo.findById lid
  LessonRepo.deleteCascade lid
  case mLesson of
    Just l  -> LessonRepo.resequence (lessonModuleId l)
    Nothing -> pure ()
