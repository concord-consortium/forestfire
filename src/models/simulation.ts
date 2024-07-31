import { action, computed, observable, makeObservable } from "mobx";
import { IWindProps, Town, IFireEvent, ISpark, dayInMinutes, yearInMinutes, Vegetation, FireState, VegetationStatistics, DroughtLevel } from "../types";
import { Cell, CellOptions, ICellSnapshot } from "./cell";
import { getDefaultConfig, ISimulationConfig, getUrlConfig } from "../config";
import { Vector2 } from "three";
import { EventEmitter } from "eventemitter3";
import { getElevationData, getRiverData, getUnburntIslandsData, getZoneIndex } from "./utils/data-loaders";
import { Zone } from "./zone";
import { FireEngine } from "./fire-engine/fire-engine";
import { RegrowthEngine } from "./regrowth-engine/regrowth-engine";
import { getGridIndexForLocation } from "./utils/grid-utils";

const DEFAULT_ZONE_DIVISION = {
  2: [
    [0, 1]
  ],
  3: [
    [0, 1, 2],
  ]
};

export type Event = "yearChange" | "restart" | "start" | "stop" | "fireEventAdded" | "fireEventRemoved" | "sparkAdded" | "fireEventEnded";

export interface ISimulationSnapshot {
  time: number;
  droughtLevel: DroughtLevel; // in fact that's average temperature
  wind: IWindProps;
  sparks: ISpark[];
  cellSnapshots: ICellSnapshot[];
}

// This class is responsible for data loading, adding sparks and fire lines and so on. It's more focused
// on management and interactions handling. Core calculations are delegated to FireEngine.
// Also, all the observable properties should be here, so the view code can observe them.
export class SimulationModel {
  public config: ISimulationConfig;
  public prevTickTime: number | null;
  public dataReadyPromise: Promise<void>;
  public fireEngine: FireEngine | null = null;
  public regrowthEngine: RegrowthEngine | null = null;
  public zoneIndex: number[][] | string = [];
  // Cells are not directly observable. Changes are broadcasted using cellsStateFlag and cellsElevationFlag.
  public cells: Cell[] = [];

  // This property is also used by the UI to highlight wind info box.
  @observable public windDidChange = false;

  @observable public time = 0;
  @observable public dataReady = false;
  @observable public wind: IWindProps;
  @observable public sparks: ISpark[] = [];
  @observable public townMarkers: Town[] = [];
  @observable public zones: Zone[] = [];
  @observable public climateChangeEnabled = true;
  @observable public simulationStarted = false;
  @observable public simulationRunning = false;
  @observable public fireEvents: IFireEvent[] = [];
  @observable public isFireActive = false;
  @observable public vegetationStatistics: VegetationStatistics;
  @observable public yearlyVegetationStatistics: VegetationStatistics[] = [];
  @observable public yearlyTotalCarbon: number[] = [];
  // These flags can be used by view to trigger appropriate rendering. Theoretically, view could/should check
  // every single cell and re-render when it detects some changes. In practice, we perform these updates in very
  // specific moments and usually for all the cells, so this approach can be way more efficient.
  @observable public cellsStateFlag = 0;
  @observable public cellsElevationFlag = 0;
  private emitter = new EventEmitter();
  private prevWind: IWindProps = { direction: 0, speed: 0 };

  constructor(presetConfig: Partial<ISimulationConfig>) {
    makeObservable(this);
    this.load(presetConfig);
  }

  @computed public get ready() {
    return this.dataReady;
  }

  @computed public get gridWidth() {
    return this.config.gridWidth;
  }

  @computed public get gridHeight() {
    return this.config.gridHeight;
  }

  @computed public get simulationAreaAcres() {
    // dimensions in feet, convert sqft to acres
    return this.config.modelWidth * this.config.modelHeight / 43560;
  }

  @computed public get timeInHours() {
    return Math.floor(this.time / 60);
  }

  @computed public get timeInDays() {
    return this.time / dayInMinutes;
  }

  @computed public get timeInYears() {
    return this.time / yearInMinutes;
  }

  @computed public get simulationEndTime() {
    return this.config.simulationEndYear * yearInMinutes;
  }

  @computed public get simulationEnded() {
    return this.timeInYears >= this.config.simulationEndYear;
  }

  @computed public get canAddSpark() {
    return this.remainingSparks > 0;
  }

  @computed public get zonesCount(): 2 | 3 {
    return this.zones.length as 2 | 3;
  }

  @computed public get remainingSparks() {
    return this.config.maxSparks - this.sparks.length;
  }

  @computed public get isFireEventSetupActive() {
    return this.fireEvents[this.fireEvents.length - 1]?.time === this.time;
  }

  @computed public get isFireEventActive() {
    return this.isFireActive || this.isFireEventSetupActive;
  }

  @computed public get fireEventTime() {
    if (!this.isFireEventActive) {
      return -1;
    }
    return this.time - this.fireEvents[this.fireEvents.length - 1]?.time;
  }

  @computed public get fireEventDisplayTime() {
    return this.fireEventTime * this.config.fireEventDisplayTimeScale;
  }

  @computed public get initialDroughtLevel() {
    return this.climateChangeEnabled && this.config.climateChange ? this.config.climateChange?.[0] : this.config.nonClimateChangeDroughtLevel;
  }

  @computed public get finalDroughtLevel() {
    return this.config.climateChange ? this.config.climateChange[1] : this.config.nonClimateChangeDroughtLevel;
  }

  public get droughtLevel() {
    // When fire event is not active, we should return the initial drought level. Fire Danger is inactive and
    // the arrow should point the lowest value.
    if (!this.isFireEventActive) {
      return DroughtLevel.NoDrought;
    }
    // average drought level of all zones
    return this.zones.reduce((sum, zone) => sum + zone.droughtLevel, 0) / this.zones.length;
  }

  public on(event: Event, callback: any) {
    this.emitter.on(event, callback);
  }

  public off(event: Event, callback: any) {
    this.emitter.off(event, callback);
  }

  public emit(event: Event) {
    this.emitter.emit(event);
  }

  public setDroughtLevel(value: number) {
    // set drought level of all zones
    this.zones.forEach(zone => zone.droughtLevel = value);
  }

  public setTimeInYears(value: number) {
    this.time = value * yearInMinutes;
  }

  public calculateVegetationStatistics(): VegetationStatistics {
    const statistics: VegetationStatistics = {
      [Vegetation.Grass]: 0,
      [Vegetation.Shrub]: 0,
      [Vegetation.DeciduousForest]: 0,
      [Vegetation.ConiferousForest]: 0,
      burned: 0
    };

    const numCells = this.cells.length;

    if (numCells === 0) {
      return statistics;
    }

    for (let i = 0; i < numCells; i++) {
      const cell = this.cells[i];
      if (cell.fireState === FireState.Burnt) {
        statistics.burned++;
      } else {
        statistics[cell.vegetation]++;
      }
    }

    statistics.burned /= numCells;
    statistics[Vegetation.Grass] /= numCells;
    statistics[Vegetation.Shrub] /= numCells;
    statistics[Vegetation.DeciduousForest] /= numCells;
    statistics[Vegetation.ConiferousForest] /= numCells;

    return statistics;
  }

  public calculateTotalStoredCarbon(): number {
    // Note that the total carbon graph shows values in kg/m^2, so it is actually an average, not a sum as the name might suggest.
    let sum = 0;
    let count = 0;
    this.cells.forEach(cell => {
      if (!cell.isNonburnable) {
        sum += cell.storedCarbon;
        count++;
      }
    });
    return sum / count;
  }

  public cellAt(x: number, y: number) {
    const gridX = Math.floor(x / this.config.cellSize);
    const gridY = Math.floor(y / this.config.cellSize);
    return this.cells[getGridIndexForLocation(gridX, gridY, this.config.gridWidth)];
  }

  @action.bound public setClimateChangeEnabled(value: boolean) {
    this.climateChangeEnabled = value;
    // Note that climate change affects initial drought level, so we need to update it when climate change is updated.
    this.setDroughtLevel(this.initialDroughtLevel);
  }

  @action.bound public setInputParamsFromConfig() {
    const config = this.config;
    this.zones = config.zones.map(options => new Zone({ ...options, droughtLevel: this.initialDroughtLevel }));
    if (config.zonesCount) {
      this.zones.length = config.zonesCount;
    }
    this.zoneIndex = config.zoneIndex || DEFAULT_ZONE_DIVISION[this.zones.length as (2 | 3)];

    this.wind = {
      speed: config.windSpeed,
      direction: config.windDirection
    };
  }

  @action.bound public load(presetConfig: Partial<ISimulationConfig>) {
    // Configuration are joined together. Default values can be replaced by preset, and preset values can be replaced
    // by URL parameters.
    this.config = Object.assign(getDefaultConfig(), presetConfig, getUrlConfig());
    this.restart();
    this.setInputParamsFromConfig();
    this.populateCellsData();
  }

  @action.bound public populateCellsData() {
    this.dataReady = false;
    const config = this.config;
    const zones = this.zones;
    this.dataReadyPromise = Promise.all([
      getZoneIndex(config, this.zoneIndex), getElevationData(config, zones), getRiverData(config), getUnburntIslandsData(config, zones)
    ]).then(values => {
      const zoneIndex = values[0];
      const elevation = values[1];
      const river = values[2];
      const unburntIsland = values[3];

      this.cells.length = 0;

      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const index = getGridIndexForLocation(x, y, this.gridWidth);
          const zi = zoneIndex ? zoneIndex[index] : 0;
          const isRiver = river && river[index] > 0;
          // When fillTerrainEdge is set to true, edges are set to elevation 0.
          const isEdge = config.fillTerrainEdges &&
            (x === 0 || x === this.gridWidth - 1 || y === 0 || y === this.gridHeight);
          // Also, edges and their neighboring cells need to be marked as nonburnable to avoid fire spreading over
          // the terrain edge. Note that in this case two cells need to be marked as nonburnable due to way how
          // rendering code is calculating colors for mesh faces.
          const isNonBurnable = config.fillTerrainEdges &&
            x <= 1 || x >= this.gridWidth - 2 || y <= 1 || y >= this.gridHeight - 2;
          const cellOptions: CellOptions = {
            x, y,
            zone: zones[zi],
            zoneIdx: zi,
            isRiver,
            isUnburntIsland: unburntIsland && unburntIsland[index] > 0 || isNonBurnable,
            baseElevation: isEdge ? 0 : elevation?.[index]
          };
          this.cells.push(new Cell(cellOptions));
        }
      }
      this.updateCellsElevationFlag();
      this.updateCellsStateFlag();
      this.updateTownMarkers();
      this.dataReady = true;
    });
  }

  @action.bound public start() {
    if (!this.ready) {
      return;
    }
    if (!this.simulationStarted) {
      this.simulationStarted = true;
      this.emit("start");
    }
    if (this.sparks.length > 0 && !this.fireEngine) {
      this.fireEngine = new FireEngine(this.cells, this.wind, this.config);
    }
    if (!this.regrowthEngine) {
      this.regrowthEngine = new RegrowthEngine(this.cells, this.config);
    }

    this.simulationRunning = true;
    this.prevTickTime = null;

    requestAnimationFrame(this.rafCallback);
  }

  @action.bound public stop() {
    this.simulationRunning = false;
    this.emit("stop");
  }

  @action.bound public restart() {
    this.simulationRunning = false;
    this.simulationStarted = false;
    this.setDroughtLevel(this.initialDroughtLevel);
    this.cells.forEach(cell => cell.reset());
    this.updateCellsStateFlag();
    this.updateCellsElevationFlag();
    this.time = 0;
    this.fireEngine = null;
    this.regrowthEngine = null;
    this.windDidChange = false;
    this.isFireActive = false;
    this.fireEvents = [];
    this.sparks = [];
    this.yearlyVegetationStatistics = [];
    this.yearlyTotalCarbon = [];
    this.config.sparks.forEach(s => {
      this.addSpark(s[0], s[1]);
    });
    this.emit("restart");
  }

  @action.bound public reload() {
    this.restart();
    // Reset user-controlled properties too.
    this.setInputParamsFromConfig();
    this.populateCellsData();
  }

  @action.bound public rafCallback(time: number) {
    if (!this.simulationRunning) {
      return;
    }
    requestAnimationFrame(this.rafCallback);

    let realTimeDiffInMinutes = null;
    if (!this.prevTickTime) {
      this.prevTickTime = time;
    } else {
      realTimeDiffInMinutes = (time - this.prevTickTime) / 60000;
      this.prevTickTime = time;
    }
    let timeStep;
    if (realTimeDiffInMinutes) {
      // One day in model time (86400 seconds) should last X seconds in real time when fire event is active. When the
      // regrowth phase is active, one year in model time (31536000 seconds) should last X seconds in real time.
      const ratio = this.isFireEventActive ?
        (86400 / this.config.fireEventDayInSeconds) : (86400 * 365 / this.config.regrowthYearInSeconds);
      // Optimal time step assumes we have stable 60 FPS:
      // realTime = 1000ms / 60 = 16.666ms
      // timeStepInMs = ratio * realTime
      // timeStepInMinutes = timeStepInMs / 1000 / 60
      // Below, these calculations are just simplified (1000 / 60 / 1000 / 60 = 0.000277):
      const optimalTimeStep = ratio * 0.000277;
      // Final time step should be limited by:
      // - fireEngineMaxTimeStep that Fire Engine can handle
      // - reasonable multiplication of the "optimal time step" so user doesn't see significant jumps in the simulation
      //   when one tick takes much longer time (e.g. when cell properties are recalculated after adding fire line)
      timeStep = Math.min(
        this.isFireEventActive ? this.config.fireEngineMaxTimeStep : Infinity, // regrowth phase has no limits on time step
        optimalTimeStep * 4,
        ratio * realTimeDiffInMinutes
      );
    } else {
      // We don't know performance yet, so simply increase time by some safe value and wait for the next tick.
      timeStep = 1;
    }

    this.tick(timeStep);
  }

  @action.bound public tick(timeStep: number) {
    const oldYear = Math.floor(this.timeInYears);
    this.time += timeStep;
    const newYear = Math.floor(this.timeInYears);
    const yearDidChange = newYear !== oldYear;

    if (yearDidChange) {
      this.yearlyVegetationStatistics.push(this.calculateVegetationStatistics());
      this.yearlyTotalCarbon.push(this.calculateTotalStoredCarbon());

      if (this.climateChangeEnabled) {
        const simulationProgress = newYear / this.config.simulationEndYear;
        const newDroughtLevel = this.initialDroughtLevel + (this.finalDroughtLevel - this.initialDroughtLevel) * simulationProgress;
        this.setDroughtLevel(newDroughtLevel);
      }
      this.emit("yearChange");
    }

    if (this.fireEngine) {
      this.processSparks();
      this.fireEngine.updateFire(this.fireEventTime, this.time);
      this.updateCellsStateFlag();
      this.isFireActive = !this.fireEngine.fireDidStop;
      if (!this.isFireActive) {
        this.fireEngine = null;
        // Fire event just ended. Remove all the spark markers. Reset Wind and Fire Danger to default values.
        this.setWindDirection(this.config.windDirection);
        this.setWindSpeed(this.config.windSpeed);
        this.sparks.length = 0;
        this.emit("fireEventEnded");
      }
    }

    if (!this.isFireEventActive && this.regrowthEngine && yearDidChange) {
      this.regrowthEngine.updateVegetation(this.time);
      this.updateCellsStateFlag();
    }

    if (!this.isFireEventActive && this.timeInYears >= this.config.simulationEndYear) {
      this.stop();
    }
  }

  @action.bound public processSparks() {
    const notProcessedSparks = this.sparks.filter(spark => !spark.locked);
    this.fireEngine?.setSparks(notProcessedSparks.map(spark => spark.position));
    notProcessedSparks.forEach(spark => spark.locked = true);
  }

  @action.bound public updateCellsElevationFlag() {
    this.cellsElevationFlag += 1;
  }

  @action.bound public updateCellsStateFlag() {
    this.cellsStateFlag += 1;

    this.vegetationStatistics = this.calculateVegetationStatistics();
  }

  @action.bound public updateTownMarkers() {
    this.townMarkers.length = 0;
    this.config.towns.forEach(town => {
      const x = town.x * this.config.modelWidth;
      const y = town.y * this.config.modelHeight;
      const cell = this.cellAt(x, y);
      if (town.terrainType === undefined || town.terrainType === cell.zone.terrainType) {
        this.townMarkers.push({ name: town.name, position: new Vector2(x, y) });
      }
    });
  }

  @action.bound public addSpark(x: number, y: number) {
    if (this.canAddSpark) {
      this.sparks.push({ time: this.time, position: new Vector2(x, y), locked: false });
      this.emit("sparkAdded");
    }
  }

  // Coords are in model units (feet).
  @action.bound public setSpark(idx: number, x: number, y: number) {
    this.sparks[idx].position = new Vector2(x, y);
  }

  @action.bound public setWindDirection(direction: number) {
    this.wind.direction = direction;
  }

  @action.bound public setWindSpeed(speed: number) {
    this.wind.speed = speed;
  }

  @action.bound public addFireEvent() {
    this.stop();
    // Wind is randomly updated at the beginning of each fire event.
    this.prevWind = { ...this.wind };
    this.setWindDirection(Math.random() * 360);
    const minWind = 0.666;
    const maxWind = 2.000;
    this.setWindSpeed(minWind + Math.random() * (maxWind - minWind));
    this.windDidChange = true; // notify user wind has been updated
    this.fireEvents.push({ time: this.time });
    this.emit("fireEventAdded");
  }

  @action.bound public cancelFireEventSetup() {
    if (this.time === this.fireEvents[this.fireEvents.length - 1].time) {
      // Fire event was just added and not started yet, so it's still safe to cancel it.
      this.fireEvents.pop();
      this.sparks.length = 0;
      this.setWindDirection(this.prevWind?.direction || 0);
      this.setWindSpeed(this.prevWind?.speed || 0);
      this.emit("fireEventRemoved");
    }
  }

  public vegetationStatisticsForYear(year: number) {
    // First vegetation statistic are calculated for year 1, so we need to subtract 1 from the year.
    return this.yearlyVegetationStatistics[year - 1];
  }

  // Calculating cell snapshots is expensive, so we don't want to do it every time we need to save a snapshot.
  // Sometimes it's possible to reuse previous snapshot when cells did not change in the meantime.
  public snapshot(existingCellSnapshots?: ICellSnapshot[]): ISimulationSnapshot {
    return {
      time: this.time,
      droughtLevel: this.droughtLevel,
      wind: { ...this.wind },
      sparks: [...this.sparks],
      cellSnapshots: existingCellSnapshots ?? this.cells.map(c => c.snapshot())
    };
  }

  public restoreSnapshot(snapshot: ISimulationSnapshot) {
    this.time = snapshot.time;
    this.setDroughtLevel(snapshot.droughtLevel);
    this.setWindDirection(snapshot.wind.direction);
    this.setWindSpeed(snapshot.wind.speed);
    this.windDidChange = true;
    this.sparks = snapshot.sparks;
    snapshot.cellSnapshots.forEach((cellSnapshot, idx) => {
      this.cells[idx].restoreSnapshot(cellSnapshot);
    });
  }
}
