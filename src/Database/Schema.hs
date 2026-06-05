{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DerivingStrategies #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE QuasiQuotes #-}
{-# LANGUAGE StandaloneDeriving #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE UndecidableInstances #-}

module Database.Schema where

import Data.Text (Text)
import Data.Time (UTCTime)
import Database.Persist.TH
  ( mkMigrate
  , mkPersist
  , persistLowerCase
  , share
  , sqlSettings
  )
import Domain.Exercise (ExerciseKind)
import Domain.Types (Role)

share
  [ mkPersist sqlSettings
  , mkMigrate "migrateAll"
  ]
  [persistLowerCase|
User
    email Text
    passwordHash Text
    name Text
    role Role
    createdAt UTCTime
    course Text Maybe
    enrollment Text Maybe
    semester Text Maybe
    shift Text Maybe
    discipline Text Maybe
    UniqueEmail email
    deriving Show

Module
    title Text
    slug Text
    description Text
    orderIdx Int
    prerequisiteId ModuleId Maybe
    UniqueSlug slug
    deriving Show

Lesson
    moduleId ModuleId
    title Text
    content Text
    orderIdx Int
    deriving Show

Exercise
    lessonId LessonId
    kind ExerciseKind
    prompt Text
    payload Text
    answer Text
    explanation Text
    orderIdx Int
    deriving Show

Progress
    userId UserId
    lessonId LessonId
    completed Bool
    completedAt UTCTime
    UniqueUserLesson userId lessonId
    deriving Show

ExerciseAttempt
    userId UserId
    exerciseId ExerciseId
    answer Text
    correct Bool
    answeredAt UTCTime
    UniqueUserExercise userId exerciseId
    deriving Show

DiagnosticQuestion
    topic Text
    prompt Text
    options Text
    correctIdx Int
    deriving Show

DiagnosticResult
    userId UserId
    strengths Text
    weaknesses Text
    recommendedSlugs Text
    createdAt UTCTime
    deriving Show
|]
