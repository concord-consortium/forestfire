import { Cell } from "../cell";
import { FireEngine, getGridCellNeighbors, nonburnableCellBetween } from "./fire-engine";
import { Vector2 } from "three";
import { Zone } from "../zone";
import { Vegetation, dayInMinutes, FireState, BurnIndex, TerrainType, DroughtLevel } from "../../types";

describe("nonburnableCellBetween", () => {
  it("returns true if there's any nonburnable cell between two points", () => {
    const burnable = (bi: BurnIndex) => true;
    const nonburnable = (bi: BurnIndex) => false;
    const cells = [
      { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable },
      { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable },
      { isBurnableForBI: burnable }, { isBurnableForBI: nonburnable }, { isBurnableForBI: nonburnable }, { isBurnableForBI: nonburnable },
      { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable },
    ] as Cell[];
    expect(nonburnableCellBetween(cells, 4, 0, 0, 0, 3, BurnIndex.Low)).toEqual(false);
    expect(nonburnableCellBetween(cells, 4, 0, 0, 0, 3, BurnIndex.Low)).toEqual(false);

    expect(nonburnableCellBetween(cells, 4, 1, 0, 0, 3, BurnIndex.Low)).toEqual(false);
    expect(nonburnableCellBetween(cells, 4, 1, 1, 0, 2, BurnIndex.Low)).toEqual(false);
    expect(nonburnableCellBetween(cells, 4, 1, 1, 0, 3, BurnIndex.Low)).toEqual(true);

    expect(nonburnableCellBetween(cells, 4, 1, 0, 1, 2, BurnIndex.Low)).toEqual(true);
    expect(nonburnableCellBetween(cells, 4, 1, 0, 1, 3, BurnIndex.Low)).toEqual(true);

    expect(nonburnableCellBetween(cells, 4, 1, 0, 2, 2, BurnIndex.Low)).toEqual(true);
    expect(nonburnableCellBetween(cells, 4, 1, 0, 2, 3, BurnIndex.Low)).toEqual(true);
  });
});

describe("getGridCellNeighbors", () => {
  it("returns array of neighbours without cells that are nonburnable, or lay behind them", () => {
    const burnable = (bi: BurnIndex) => true;
    const nonburnable = (bi: BurnIndex) => false;
    const cells = [
      { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable },
      { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable },
      { isBurnableForBI: burnable }, { isBurnableForBI: nonburnable }, { isBurnableForBI: nonburnable }, { isBurnableForBI: nonburnable },
      { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable }, { isBurnableForBI: burnable },
    ] as Cell[];
    expect(getGridCellNeighbors(cells, 0, 4, 4, 1.5, BurnIndex.Low).sort()).toEqual([1, 4, 5]);
    expect(getGridCellNeighbors(cells, 5, 4, 4, 1.5, BurnIndex.Low).sort()).toEqual([0, 1, 2, 4, 6, 8]);
    expect(getGridCellNeighbors(cells, 5, 4, 4, 2.5, BurnIndex.Low).sort()).toEqual([0, 1, 12, 2, 3, 4, 6, 7, 8]);
    expect(getGridCellNeighbors(cells, 14, 4, 4, 2.5, BurnIndex.Low).sort()).toEqual([12, 13, 15]);
    expect(getGridCellNeighbors(cells, 15, 4, 4, 2.5, BurnIndex.Low).sort()).toEqual([13, 14]);
  });
});

describe("FireEngine", () => {
  const config = {
    cellSize: 20000,
    gridWidth: 5,
    gridHeight: 5,
    minCellBurnTime: 200,
    fireEngineNeighborsDist: 2.5,
    fireSurvivalProbability: 1 // so there's no randomness in the test
  };
  const wind = { speed: 0, direction: 0 };
  const sparks = [new Vector2(50000, 50000)];
  const defaultZone = new Zone({
    vegetation: Vegetation.Grass,
    terrainType: TerrainType.Foothills,
    droughtLevel: DroughtLevel.MildDrought
  });
  const generateCells = (zone = defaultZone) => {
    const res = [];
    for (let x = 0; x < config.gridWidth; x += 1) {
      for (let y = 0; y < config.gridWidth; y += 1) {
        res.push(new Cell({ x, y, zone }));
      }
    }
    return res;
  };

  it("should stop low intensity fire after 5 days (or earlier but it's random)", () => {
    const engine = new FireEngine(generateCells(), wind, config);
    engine.setSparks(sparks);
    engine.fires.forEach(fire => {
      expect(fire.endOfLowIntensityFire).toBe(false);
    });
    engine.updateFire(dayInMinutes * 5, dayInMinutes * 5); // 5 days in minutes
    engine.fires.forEach(fire => {
      expect(fire.endOfLowIntensityFire).toBe(true);
    });
  });

  it("should detect when nothing is burning anymore", () => {
    const engine = new FireEngine(generateCells(), wind, config);
    engine.setSparks(sparks);
    engine.updateFire(dayInMinutes * 5, dayInMinutes * 5);
    expect(engine.fireDidStop).toBe(false);
    expect(engine.cells.filter(c => c.isBurningOrWillBurn).length).toBeGreaterThan(0);
    engine.updateFire(dayInMinutes * 6, dayInMinutes * 6);
    engine.updateFire(dayInMinutes * 7, dayInMinutes * 7);
    expect(engine.cells.filter(c => c.isBurningOrWillBurn).length).toEqual(0);
    expect(engine.fireDidStop).toBe(true);
  });

  it("should mark unburnt islands cell and remove this flag from cells are directly under the spark", () => {
    const generateCellsWithUnburntIsland = () => {
      const res = [];
      for (let x = 0; x < config.gridWidth; x += 1) {
        for (let y = 0; y < config.gridWidth; y += 1) {
          res.push(new Cell({ x, y, zone: defaultZone, isUnburntIsland: true }));
        }
      }
      return res;
    };
    const cells = generateCellsWithUnburntIsland();
    cells.forEach(c => expect(c.isUnburntIsland).toEqual(true));
    const engine = new FireEngine(cells, wind, config);
    engine.setSparks(sparks);
    engine.cells.forEach(c => expect(c.isUnburntIsland).toEqual(false));
    engine.updateFire(dayInMinutes, dayInMinutes);
    expect(engine.cells.filter(c => c.isBurningOrWillBurn).length).toBeGreaterThan(0);
  });


  describe("fire survivors", () => {
    const testVegetationAndGetNumberOfFireSurvivors = (vegetation: Vegetation) => {
      const zone = new Zone({ vegetation, terrainType: TerrainType.Foothills, droughtLevel: DroughtLevel.MildDrought });
      const engine = new FireEngine(generateCells(zone), wind, config);
      engine.setSparks(sparks);
      expect(engine.cells.filter(c => c.fireState === FireState.Survived).length).toEqual(0);
      engine.updateFire(dayInMinutes, dayInMinutes);
      engine.updateFire(dayInMinutes, dayInMinutes);
      engine.updateFire(dayInMinutes, dayInMinutes);
      return engine.cells.filter(c => c.fireState === FireState.Survived).length;
    };

    it("should mark some grass cells as fire survivors", () => {
      expect(testVegetationAndGetNumberOfFireSurvivors(Vegetation.Grass)).toBeGreaterThan(0);
    });

    it("should not mark some shrub cells as fire survivors", () => {
      expect(testVegetationAndGetNumberOfFireSurvivors(Vegetation.Shrub)).toBeGreaterThan(0);
    });

    it("should mark some forest cells as fire survivors", () => {
      expect(testVegetationAndGetNumberOfFireSurvivors(Vegetation.DeciduousForest)).toBeGreaterThan(0);
    });

    it("should mark some forest with suppression cells as fire survivors", () => {
      expect(testVegetationAndGetNumberOfFireSurvivors(Vegetation.ConiferousForest)).toBeGreaterThan(0);
    });
  });
});
