module Services.ProfileService
  ( getProfile
  , updateProfile
  , deleteProfile
  ) where

import App.Monad (AppM, runDb)
import Data.Text (Text)
import Database.Persist (deleteWhere, (==.))
import qualified Database.Persist as P
import Database.Schema
import qualified Repositories.UserRepo as UserRepo

getProfile :: UserId -> AppM (Maybe User)
getProfile = runDb . UserRepo.findById

-- | Atualiza nome e campos de perfil, preservando email/senha/role/createdAt.
updateProfile
  :: UserId
  -> Text          -- ^ nome
  -> Maybe Text    -- ^ curso
  -> Maybe Text    -- ^ matrícula
  -> Maybe Text    -- ^ semestre
  -> Maybe Text    -- ^ turno
  -> Maybe Text    -- ^ disciplina
  -> AppM (Maybe User)
updateProfile uid name course enrollment semester shift discipline = runDb $ do
  mUser <- UserRepo.findById uid
  case mUser of
    Nothing -> pure Nothing
    Just u  -> do
      let u' = u
            { userName       = name
            , userCourse     = course
            , userEnrollment = enrollment
            , userSemester   = semester
            , userShift      = shift
            , userDiscipline = discipline
            }
      UserRepo.updateUser uid u'
      pure (Just u')

-- | Exclui a conta do usuário junto dos dados que a referenciam (progresso
-- e tentativas de exercício), evitando órfãos/FK.
deleteProfile :: UserId -> AppM ()
deleteProfile uid = runDb $ do
  deleteWhere [ProgressUserId ==. uid]
  deleteWhere [ExerciseAttemptUserId ==. uid]
  P.delete uid
