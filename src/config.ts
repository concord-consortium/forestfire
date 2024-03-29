import { DroughtLevel, Vegetation, TerrainType, dayInMinutes } from "./types";

import riverTexture from "./assets/data/river-texmap.png";
import foothillsHeightmap from "./assets/data/foothills-foothills-heightmap.png";
import foothillsIslands from "./assets/data/foothills-foothills-islands.png";

interface TownOptions {
  name: string;
  x: number; // [0, 1], position relative to model width
  y: number; // [0, 1], position relative to model height
  terrainType?: TerrainType; // limit town marker to given terrain type
}

interface ZoneConfig {
  vegetation: Vegetation;
  terrainType: TerrainType;
}

export interface ISimulationConfig {
  modelWidth: number; // ft
  modelHeight: number; // ft
  // Note that modelHeight % gridWidth should always be 0!
  gridWidth: number; // ft
  // It will be calculated automatically using model dimensions and grid width.
  readonly gridHeight: number; // ft
  // It will be calculated automatically using model dimensions and grid width.
  readonly cellSize: number; // ft
  // If `elevation` height map is provided, it will be loaded during model initialization and terrain setup dialog
  // won't let users change terrain type. Otherwise, height map URL will be derived from zones `terrainType` properties.
  elevation?: number[][] | string;
  // `unburntIslands` data can provided using image url or 2D array.
  // Otherwise, unburnt islands map URL will be derived from zones `terrainType` properties.
  unburntIslands?: number[][] | string;
  // `zoneIndex` data can provided using image url or 2D array. If it's an array, it should include two or three
  // numbers, depending if model is using two or three zones (0 and 1, or 0, 1, and 2).
  zoneIndex?: number[][] | string;
  // Spark positions, in ft.
  sparks: number[][];
  // Number of available sparks.
  maxSparks: number;
  fireEngineMaxTimeStep: number; // minutes
  // This variable defines fire event time step. One day in model should last X seconds in real world.
  fireEventDayInSeconds: number;
  // The time displayed by the fire event label will be multiplied by this value.
  fireEventDisplayTimeScale: number;
  // This variable defines regrowth phase time step. One year in model should last X seconds in real world.
  regrowthYearInSeconds: number;
  // Stop model when year reaches this value.
  simulationEndYear: number;
  windSpeed: number; // mph
  windDirection: number; // degrees, 0 is northern wind
  fireEngineNeighborsDist: number;
  regrowthEngineNeighborsDist: number;
  // In min - note that larger cells will burn the same amount of time. Cell doesn't burn from edge to edge, but
  // its whole area is supposed to burn at the same time. We might consider whether it should be different for
  // different fuel types.
  minCellBurnTime: number;
  // Max elevation of 100% white points in heightmap (image used for elevation data).
  heightmapMaxElevation: number; // ft
  // Number of zones that the model is using. Zones are used to keep properties of some area of the model.
  zonesCount?: 2 | 3;
  zones: [ZoneConfig, ZoneConfig] | [ZoneConfig, ZoneConfig, ZoneConfig];
  towns: TownOptions[];
  // Visually fills edges of the terrain by setting elevation to 0.
  fillTerrainEdges: boolean;
  riverData: string | null;
  windScaleFactor: number;
  showModelDimensions: boolean;
  // Time that needs to pass before next fire line can be added.
  fireLineDelay: number;
  // Helitack has a cooldown before it can be used again
  helitackDelay: number;
  maxFireLineLength: number; // ft
  helitackDropRadius: number; // ft
  // Renders burn index.
  showBurnIndex: boolean;
  // Displays alert with current coordinates on mouse click. Useful for authoring.
  showCoordsOnClick: boolean;
  // Number between 0 and 1 which decides how likely is for unburnt island to form (as it's random).
  // 1 means that all the unburnt islands will be visible, 0 means that none of them will be visible.
  unburntIslandProbability: number;
  // Number between 0 and 1 which decides how likely is for a cells to survive fire. Note that there are other factors
  // too. The only vegetation that can survive low and medium intensity fire is `Forest`.
  fireSurvivalProbability: number;
  // Locks drought index slider in Terrain Setup dialog.
  droughtIndexLocked: boolean;
  // Makes severe drought option available in Terrain Setup dialog.
  severeDroughtAvailable: boolean;
  // River color, RGBA values (range: [0, 1]). Suggested colors:
  // [0.663,0.855,1,1], [0.337,0.69,0.957,1] or [0.067,0.529,0.882,1]
  riverColor: [number, number, number, number];
  // Adjusts spacing between bars in the vegetation bar chart, [0, 1].
  graphBarPercentage: number;
  // When true, "Show All Data" will expand the right panel to 75% of the screen width.
  graphWideAllData: boolean;
  // Range of drought levels that change over time due to climate change.
  climateChange: [number, number] | false;
  // Drought level that is used when climate change is not active.
  nonClimateChangeDroughtLevel: DroughtLevel;
  // Regrowth probabilities:
  successionMinYears: number;
  grassToShrub: number;
  grassToShrubAdjacent: number;
  shrubToDeciduous: number;
  shrubToDeciduousAdjacent: number;
  deciduousToConiferousMinYears: number;
  deciduousToConiferous: number;
  deciduousToConiferousAdjacent: number;
  lowIntensityBurntAreaMinYears: number;
  lowIntensityBurntShrubToGrass: number;
  lowIntensityBurntDeciduousToGrass: number;
  lowIntensityBurntConiferousToGrass: number;
  highIntensityBurntAreaMinYears: number;
  highIntensityBurntAreaToGrass: number;
}

export interface IUrlConfig extends ISimulationConfig {
  preset: string;
}

export const getDefaultConfig: () => IUrlConfig = () => ({
  preset: "default",
  // Most of the presets will use heightmap images that work the best with 120000x80000ft dimensions.
  modelWidth: 120000,
  modelHeight: 80000,
  // 240 works well with presets based on heightmap images.
  gridWidth: 240,
  get cellSize() { return this.modelWidth / this.gridWidth; },
  get gridHeight() { return Math.ceil(this.modelHeight / this.cellSize); },
  elevation: foothillsHeightmap,
  unburntIslands: foothillsIslands,
  zoneIndex: undefined,
  sparks: [],
  maxSparks: 10,
  fireEngineMaxTimeStep: 180, // minutes
  fireEventDayInSeconds: 2, // one day in model should last X seconds in real world
  fireEventDisplayTimeScale: 4, // the time displayed by the fire event label will be multiplied by this value
  regrowthYearInSeconds: 60 / 240, // Complete simulation should take around 60 seconds.
  simulationEndYear: 240,
  windSpeed: 0, // mph
  windDirection: 0, // degrees, northern wind
  // Note that 0.5 helps to create a nicer, more round shape of neighbours set for a given cell
  // on the rectangular grid when small radius values are used (like 2.5).
  // 2.5 seems to be first value that ensures that fire front looks pretty round.
  // Higher values will make this shape better, but performance will be affected.
  fireEngineNeighborsDist: 2.5,
  regrowthEngineNeighborsDist: 2.5,
  minCellBurnTime: 200, // minutes
  // This value works well with existing heightmap images.
  heightmapMaxElevation: 20000,
  // undefined zones count will make them configurable in Terrain Setup dialog.
  zonesCount: undefined,
  zones: [
    {
      terrainType: TerrainType.Plains,
      vegetation: Vegetation.Grass
    },
    {
      terrainType: TerrainType.Plains,
      vegetation: Vegetation.Shrub
    },
    {
      terrainType: TerrainType.Plains,
      vegetation: Vegetation.DeciduousForest
    }
  ],
  towns: [],
  fillTerrainEdges: true,
  riverData: riverTexture,
  windScaleFactor: 0.0666, // Note that model is very sensitive to wind.
  // Scale wind values down for now, so changes are less dramatic.
  showModelDimensions: false,
  fireLineDelay: dayInMinutes, // a day
  helitackDelay: 240, // four hours
  maxFireLineLength: 15000, // ft
  helitackDropRadius: 2640, // ft (5280 ft = 1 mile)
  showBurnIndex: true,
  showCoordsOnClick: false,
  unburntIslandProbability: 0.5, // [0, 1]
  fireSurvivalProbability: 0, // [0, 1]
  droughtIndexLocked: false,
  severeDroughtAvailable: true,
  riverColor: [0.067, 0.529, 0.882, 1],
  graphBarPercentage: 0.85,
  graphWideAllData: true,
  climateChange: [DroughtLevel.NoDrought, DroughtLevel.SevereDrought],
  nonClimateChangeDroughtLevel: DroughtLevel.MildDrought,
  // Regrowth probabilities:
  successionMinYears: 3,
  grassToShrub: 0.1,
  grassToShrubAdjacent: 0.3,
  shrubToDeciduous: 0.05,
  shrubToDeciduousAdjacent: 0.15,
  deciduousToConiferousMinYears: 50,
  deciduousToConiferous: 0.01,
  deciduousToConiferousAdjacent: 0.05,
  lowIntensityBurntAreaMinYears: 2,
  lowIntensityBurntShrubToGrass: 0.7,
  lowIntensityBurntDeciduousToGrass: 0.1,
  lowIntensityBurntConiferousToGrass: 0.1,
  highIntensityBurntAreaMinYears: 5,
  highIntensityBurntAreaToGrass: 0.9
});

const getURLParam = (name: string) => {
  const url = (self || window).location.href;
  name = name.replace(/[[]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return true;
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

const isArray = (value: any) => {
  return typeof value === "string" && value.match(/^\[.*\]$/);
};

const isJSON = (value: any) => {
  if (typeof value !== "string") {
    return false;
  }
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

export const getUrlConfig: () => IUrlConfig = () => {
  const urlConfig: any = {};
  // Populate `urlConfig` with values read from URL.
  Object.keys(getDefaultConfig()).forEach((key) => {
    const urlValue: any = getURLParam(key);
    if (urlValue === true || urlValue === "true") {
      urlConfig[key] = true;
    } else if (urlValue === "false") {
      urlConfig[key] = false;
    } else if (isJSON(urlValue)) {
      urlConfig[key] = JSON.parse(urlValue);
    } else if (isArray(urlValue)) {
      // Array can be provided in URL using following format:
      // &parameter=[value1,value2,value3]
      if (urlValue === "[]") {
        urlConfig[key] = [];
      } else {
        urlConfig[key] = urlValue.substring(1, urlValue.length - 1).split(",");
      }
    } else if (urlValue !== null && !isNaN(urlValue)) {
      // !isNaN(string) means isNumber(string).
      urlConfig[key] = parseFloat(urlValue);
    } else if (urlValue !== null) {
      urlConfig[key] = urlValue;
    }
  });
  return urlConfig as IUrlConfig;
};


