import { ISimulationConfig } from "./config";
import { DroughtLevel, TerrainType, Vegetation } from "./types";

const presets: { [key: string]: Partial<ISimulationConfig> } = {
  basic: {
    modelWidth: 100000,
    modelHeight: 100000,
    gridWidth: 100,
    sparks: [[50000, 50000]],
    zoneIndex: [
      [0, 1]
    ],
    elevation: [
      [0]
    ],
    riverData: null
  },
  basicWithWind: {
    modelWidth: 100000,
    modelHeight: 100000,
    gridWidth: 100,
    sparks: [[50000, 50000]],
    windSpeed: 1,
    windDirection: 0,
    zoneIndex: [
      [0, 1]
    ],
    elevation: [
      [0]
    ],
    riverData: null
  },
  slope45deg: {
    modelWidth: 100000,
    modelHeight: 100000,
    gridWidth: 100,
    sparks: [[50000, 50000]],
    heightmapMaxElevation: 3000,
    zoneIndex: [
      [0, 1]
    ],
    elevation: [
      [100000, 0],
      [100000, 0]
    ],
    riverData: null
  },
  basicWithSlopeAndWind: {
    modelWidth: 100000,
    modelHeight: 100000,
    gridWidth: 100,
    sparks: [[50000, 50000]],
    windSpeed: 1,
    windDirection: 0,
    heightmapMaxElevation: 10000,
    zoneIndex: [
      [0, 1]
    ],
    elevation: [
      [10000, 0],
      [10000, 0]
    ],
    riverData: null
  },
  default: {
    zonesCount: 2,
    zones: [
      { terrainType: TerrainType.Foothills, vegetation: Vegetation.ConiferousForest },
      { terrainType: TerrainType.Foothills, vegetation: Vegetation.ConiferousForest },
    ],
    towns: []
  },
  mildDrought: {
    zonesCount: 2,
    climateChange: [DroughtLevel.MildDrought, DroughtLevel.SevereDrought],
    zones: [
      { terrainType: TerrainType.Foothills, vegetation: Vegetation.ConiferousForest },
      { terrainType: TerrainType.Foothills, vegetation: Vegetation.ConiferousForest },
    ],
    towns: []
  },
  severeDrought: {
    zonesCount: 2,
    climateChange: [DroughtLevel.SevereDrought, DroughtLevel.SevereDrought],
    zones: [
      { terrainType: TerrainType.Foothills, vegetation: Vegetation.ConiferousForest },
      { terrainType: TerrainType.Foothills, vegetation: Vegetation.ConiferousForest },
    ],
    towns: []
  },
  grass: {
    zonesCount: 2,
    zones: [
      { terrainType: TerrainType.Foothills, vegetation: Vegetation.Grass },
      { terrainType: TerrainType.Foothills, vegetation: Vegetation.Grass },
    ],
    towns: []
  }
};

export default presets;
