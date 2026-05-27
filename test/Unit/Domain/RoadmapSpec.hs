module Unit.Domain.RoadmapSpec (spec) where

import qualified Data.Map.Strict as Map
import qualified Data.Set as Set
import Domain.Roadmap (RoadmapItem (..), buildRoadmap)
import Test.Hspec

spec :: Spec
spec = describe "Domain.Roadmap.buildRoadmap" $ do
  it "modulo inicial (sem prereq) sempre unlocked" $ do
    let items = buildRoadmap
          [(1, Nothing, "M1")]
          (Map.fromList [(1, 0)])
          Map.empty
          Set.empty
    map riUnlocked items `shouldBe` [True]

  it "modulo com prereq nao concluido fica locked" $ do
    let items = buildRoadmap
          [(1, Nothing, "M1"), (2, Just 1, "M2")]
          (Map.fromList [(1, 3), (2, 2)])
          (Map.fromList [(1, 1)])
          Set.empty
    map (\it -> (riModuleId it, riUnlocked it)) items
      `shouldBe` [(1, True), (2, False)]

  it "completar prereq desbloqueia o proximo" $ do
    let items = buildRoadmap
          [(1, Nothing, "M1"), (2, Just 1, "M2")]
          (Map.fromList [(1, 3), (2, 2)])
          (Map.fromList [(1, 3)])
          (Set.fromList [1])
    map (\it -> (riModuleId it, riUnlocked it)) items
      `shouldBe` [(1, True), (2, True)]

  it "preserva ordem dos modulos de entrada" $ do
    let items = buildRoadmap
          [(10, Nothing, "A"), (20, Just 10, "B"), (30, Just 20, "C")]
          Map.empty
          Map.empty
          Set.empty
    map riModuleId items `shouldBe` [10, 20, 30]

  it "expõe contagens de lessons" $ do
    let items = buildRoadmap
          [(1, Nothing, "M1")]
          (Map.fromList [(1, 5)])
          (Map.fromList [(1, 2)])
          Set.empty
    map (\it -> (riCompletedLessons it, riTotalLessons it)) items
      `shouldBe` [(2, 5)]
