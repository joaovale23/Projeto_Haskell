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

createLesson :: ModuleId -> Text -> Text -> Int -> AppM LessonId
createLesson mid title content idx =
  runDb (LessonRepo.create Lesson
    { lessonModuleId = mid
    , lessonTitle    = title
    , lessonContent  = content
    , lessonOrderIdx = idx
    })

updateLesson :: LessonId -> ModuleId -> Text -> Text -> Int -> AppM ()
updateLesson lid mid title content idx =
  runDb (LessonRepo.update lid Lesson
    { lessonModuleId = mid
    , lessonTitle    = title
    , lessonContent  = content
    , lessonOrderIdx = idx
    })

deleteLesson :: LessonId -> AppM ()
deleteLesson = runDb . LessonRepo.delete
