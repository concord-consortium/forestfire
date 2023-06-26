import { Vector2 } from "three";

export interface Fuel {
  sav: number;
  packingRatio: number;
  netFuelLoad: number;
  mx: number;
  fuelBedDepth: number;
}

export interface Town {
  name: string;
  position: Vector2;
}

export enum Vegetation {
  Grass = 0,
  Shrub = 1,
  DeciduousForest = 2,
  ConiferousForest = 3
}

export const vegetationLabels: Record<Vegetation, string> = {
  [Vegetation.Grass]: "Grass",
  [Vegetation.Shrub]: "Shrub",
  [Vegetation.DeciduousForest]: "Deciduous Forest",
  [Vegetation.ConiferousForest]: "Coniferous Forest"
};

export enum TerrainType {
  Plains = 0,
  Foothills = 1,
  Mountains = 2
}

export const terrainLabels: Record<TerrainType, string> = {
  [TerrainType.Plains]: "Plains",
  [TerrainType.Foothills]: "Foothills",
  [TerrainType.Mountains]: "Mountains",
};

export enum DroughtLevel {
  NoDrought = 0,
  MildDrought = 1,
  MediumDrought = 2,
  SevereDrought = 3
}

export const droughtLabels: Record<DroughtLevel, string> = {
  [DroughtLevel.NoDrought]: "No Drought",
  [DroughtLevel.MildDrought]: "Mild Drought",
  [DroughtLevel.MediumDrought]: "Medium Drought",
  [DroughtLevel.SevereDrought]: "Severe Drought",
};

export interface IWindProps {
  // Wind speed in mph.
  speed: number;
  // Angle in degrees following this definition: https://en.wikipedia.org/wiki/Wind_direction
  // 0 is northern wind, 90 is eastern wind.
  direction: number;
}

export interface IFireEvent {
  time: number;
}

export interface ISpark {
  position: Vector2;
  locked: boolean;
}

export enum FireState {
  Unburnt = 0,
  Burning = 1,
  Burnt = 2,
  Survived = 3
}

// See: https://www.pivotaltracker.com/story/show/170344417
export enum BurnIndex {
  Low = 0,
  Medium = 1,
  High = 2
}

export interface IFireHistory {
  time: number;
  burnIndex: BurnIndex;
}

export type VegetationStatistics = Record<Vegetation | "burned", number>;

export const dayInMinutes = 1440;
export const yearInMinutes = 365 * dayInMinutes;

