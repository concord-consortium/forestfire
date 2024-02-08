import { Zone, moistureLookups } from "./zone";
import { Vegetation, DroughtLevel, yearInMinutes, IFireHistory, BurnIndex, FireState } from "../types";

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
    return moistureLookups[this.droughtLevel][this.vegetation];
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
      if (this.spreadRate < 45) {
        return BurnIndex.Low;
      }
      return BurnIndex.Medium;
    }
    if (this.vegetation === Vegetation.Shrub) {
      if (this.spreadRate < 10) {
        return BurnIndex.Low;
      }
      if (this.spreadRate < 50) {
        return BurnIndex.Medium;
      }
      return BurnIndex.High;
    }
    if (this.vegetation === Vegetation.DeciduousForest) {
      if (this.spreadRate < 25) {
        return BurnIndex.Low;
      }
      return BurnIndex.Medium;
    }
    // this.vegetation === Vegetation.ConiferousForest
    if (this.spreadRate < 12) {
      return BurnIndex.Low;
    }
    if (this.spreadRate < 40) {
      return BurnIndex.Medium;
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
}
