import { Zone } from "./zone";
import { Vegetation, DroughtLevel, yearInMinutes, IFireHistory, BurnIndex, FireState } from "../types";
import { interpolate } from "./utils/interpolate";

const carbonAccumulationRate = (vegetation: Vegetation) => { // in kg/m2 per year
  // Cap and regrowth values are based on the reference provided in the PT story:
  // https://www.pivotaltracker.com/story/show/185316704
  switch (vegetation) {
    case Vegetation.Grass:
      return 0.068;
    case Vegetation.Shrub:
      return 0.09;
    case Vegetation.DeciduousForest:
      return 0.09;
    case Vegetation.ConiferousForest:
      return 0.021;
  }
};

const carbonMaxCapacity = (vegetation: Vegetation) => { // in kg/m2
  // Cap and regrowth values are based on the reference provided in the PT story:
  // https://www.pivotaltracker.com/story/show/185316704
  switch (vegetation) {
    case Vegetation.Grass:
      return 0.068;
    case Vegetation.Shrub:
      return 0.8;
    case Vegetation.DeciduousForest:
      return 6.9;
    case Vegetation.ConiferousForest:
      return 8.1;
  }
};

// values for each level of drought: 0 - no drought, 1 - mild, 2 - medium, 3 - severe
export const moistureLookups: {[key in Vegetation]: number[]} = {
  [Vegetation.Grass]: [0.1275, 0.09, 0.0525, 0.015],
  [Vegetation.Shrub]: [0.255, 0.18, 0.105, 0.03],
  [Vegetation.DeciduousForest]: [0.2125, 0.1, 0.017, 0.005],
  [Vegetation.ConiferousForest]: [0.085, 0.06, 0.035, 0.01]

};

export const getInterpolatedMoisture = (vegetationType: Vegetation, droughtLevel: number): number => {
  if (droughtLevel < DroughtLevel.NoDrought || droughtLevel > DroughtLevel.SevereDrought) {
    throw new Error("Drought level must be between DroughtLevel.NoDrought and DroughtLevel.SevereDrought");
  }

  const moistureLevels = moistureLookups[vegetationType];
  if (!moistureLevels) {
    throw new Error("Invalid vegetation type");
  }

  return interpolate(moistureLevels, droughtLevel);
};

export interface CellOptions {
  x: number;
  y: number;
  zone: Zone;
  zoneIdx?: number;
  baseElevation?: number;
  ignitionTime?: number;
  fireState?: FireState;
  isUnburntIsland?: boolean;
  isRiver?: boolean;
  isFireLine?: boolean;
  isFireLineUnderConstruction?: boolean;
}

export interface ICellSnapshot {
  zone: Zone;
  zoneIdx?: number;
  fireIdx: number | null;
  fireHistory: IFireHistory[];
  fireState: FireState;
  vegetation: Vegetation;
}

const FIRE_LINE_DEPTH = 2000;
const MAX_BURN_TIME = 500;

export class Cell {
  public x: number; // grid X coord
  public y: number; // grid Y coord
  public zone: Zone;
  public zoneIdx: number;
  public baseElevation = 0;
  public ignitionTime = Infinity;
  public spreadRate = 0;
  public vegetationAge = Infinity;
  public storedCarbon = 0;
  public burnTime: number = MAX_BURN_TIME;
  public fireState: FireState = FireState.Unburnt;
  public isUnburntIsland = false;
  public isRiver = false;
  public isFireLine = false;
  public isFireLineUnderConstruction = false;
  public helitackDropCount = 0;
  public fireIdx: number | null = null;
  public fireHistory: IFireHistory[] = [];
  private _vegetation: Vegetation = Vegetation.Grass;

  constructor(props: CellOptions) {
    Object.assign(this, props);
    this.vegetation = this.zone.vegetation;
    this.storedCarbon = carbonMaxCapacity(this.vegetation);
  }

  public get elevation() {
    if (this.isFireLine) {
      return this.baseElevation - FIRE_LINE_DEPTH;
    }
    return this.baseElevation;
  }

  public get isNonburnable() {
    return this.isRiver || this.isUnburntIsland;
  }

  public get moistureContent() {
    if (this.isNonburnable) {
      return Infinity;
    }
    return getInterpolatedMoisture(this.vegetation, this.droughtLevel);
  }

  public get droughtLevel() {
    if (this.helitackDropCount > 0) {
      const newDroughtLevel = this.zone.droughtLevel - this.helitackDropCount;
      return Math.max(newDroughtLevel, DroughtLevel.NoDrought) as DroughtLevel;
    }
    return this.zone.droughtLevel;
  }

  public get isBurningOrWillBurn() {
    return this.fireState === FireState.Burning || this.fireState === FireState.Unburnt && this.ignitionTime < Infinity;
  }

  public get canSurviveFire() {
    return this.burnIndex === BurnIndex.Low;
  }

  public get burnIndex() {
    // Values based on: https://www.pivotaltracker.com/story/show/170344417/comments/209774367
    if (this.vegetation === Vegetation.Grass) {
      if (this.spreadRate < 10) {
        return BurnIndex.Low;
      }
      return BurnIndex.High;
    }
    if (this.vegetation === Vegetation.Shrub) {
      if (this.spreadRate < 10) {
        return BurnIndex.Low;
      }
      return BurnIndex.High;
    }
    if (this.vegetation === Vegetation.DeciduousForest) {
      if (this.spreadRate < 5) {
        return BurnIndex.Low;
      }
      return BurnIndex.High;
    }
    // this.vegetation === Vegetation.ConiferousForest
    if (this.spreadRate < 5) {
      return BurnIndex.Low;
    }
    return BurnIndex.High;
  }

  public get lastFireBurnIndex() {
    return this.fireHistory[this.fireHistory.length - 1]?.burnIndex;
  }

  public get lastFireTime() {
    return this.fireHistory[this.fireHistory.length - 1]?.time;
  }

  public get vegetationAgeInYears() {
    return this.vegetationAge / yearInMinutes;
  }

  public get vegetation() {
    return this._vegetation;
  }

  public set vegetation(vegetation: Vegetation) {
    this._vegetation = vegetation;
    this.vegetationAge = 0;
  }

  public isInDoubleBurnState(time: number) {
    // Check fire history if 2 or more files have occurred within 30 years window span.
    const postMultipleBurnsStateLength = 150 * yearInMinutes; // 150 years after multiple burns within 30 years
    const multipleBurnsWindow = 30 * yearInMinutes;

    for (let i = this.fireHistory.length - 1; i >= 1; i--) {
      const fire = this.fireHistory[i];
      const prevFire = this.fireHistory[i - 1];
      if (time - fire.time <= postMultipleBurnsStateLength && fire.time - prevFire.time <= multipleBurnsWindow) {
        return true;
      }
    }

    return false;
  }

  public isInTripleBurnState(time: number) {
    // Check fire history if 3 or more files have occurred within 30 years window span.
    const postMultipleBurnsStateLength = 30 * yearInMinutes; // 30 years after multiple burns within 30 years
    const multipleBurnsWindow = 30 * yearInMinutes;

    for (let i = this.fireHistory.length - 1; i >= 2; i--) {
      const fire = this.fireHistory[i];
      const prevFire = this.fireHistory[i - 1];
      const prevPrevFire = this.fireHistory[i - 2];
      if (time - fire.time <= postMultipleBurnsStateLength &&
          fire.time - prevFire.time <= multipleBurnsWindow &&
          fire.time - prevPrevFire.time <= multipleBurnsWindow) {
        return true;
      }
    }

    return false;
  }

  public accumulateCarbon(yearsDiff = 1) {
    this.storedCarbon += carbonAccumulationRate(this.vegetation) * yearsDiff;
    this.storedCarbon = Math.min(carbonMaxCapacity(this.vegetation), this.storedCarbon);
  }

  public releaseCarbon() {
    this.storedCarbon = 0;
  }

  public isBurnableForBI(burnIndex: BurnIndex) {
    // Fire lines will burn when burn index is high.
    return !this.isNonburnable && (!this.isFireLine || burnIndex === BurnIndex.High);
  }

  public preFireEventReset() {
    this.ignitionTime = Infinity;
    this.spreadRate = 0;
    this.burnTime = MAX_BURN_TIME;
  }

  public reset() {
    this.preFireEventReset();
    this.fireState = FireState.Unburnt;
    this.isFireLineUnderConstruction = false;
    this.isFireLine = false;
    this.helitackDropCount = 0;
    this.vegetation = this.zone.vegetation;
    this.fireHistory = [];
  }

  public snapshot(): ICellSnapshot {
    return {
      zone: this.zone,
      zoneIdx: this.zoneIdx,
      fireIdx: this.fireIdx,
      fireHistory: this.fireHistory,
      fireState: this.fireState,
      vegetation: this.vegetation,
    };
  }

  public restoreSnapshot(snapshot: ICellSnapshot) {
    Object.assign(this, snapshot);
  }
}
