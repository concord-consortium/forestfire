import { action, computed, observable, makeObservable } from "mobx";
import { IWindProps, Town } from "../types";
import {  Cell, CellOptions } from "./cell";
import { getDefaultConfig, ISimulationConfig, getUrlConfig } from "../config";
import { Vector2 } from "three";
import { getElevationData, getRiverData, getUnburntIslandsData, getZoneIndex } from "./utils/data-loaders";
import { Zone } from "./zone";
import { FireEngine } from "./engine/fire-engine";
import { getGridIndexForLocation } from "./utils/grid-utils";

// When config.changeWindOnDay is defined, but config.newWindSpeed is not, the model will use random value limited
// by this constant.
const NEW_WIND_MAX_SPEED = 20; // mph

const DEFAULT_ZONE_DIVISION = {
  2: [
    [0, 1]
  ],
  3: [
    [0, 1, 2],
  ]
};

// This class is responsible for data loading, adding sparks and fire lines and so on. It's more focused
// on management and interactions handling. Core calculations are delegated to FireEngine.
// Also, all the observable properties should be here, so the view code can observe them.
export class SimulationModel {
  public config: ISimulationConfig;
  public prevTickTime: number | null;
  public dataReadyPromise: Promise<void>;
  public engine: FireEngine | null = null;
  public zoneIndex: number[][] | string = [];
  // Cells are not directly observable. Changes are broadcasted using cellsStateFlag and cellsElevationFlag.
  public cells: Cell[] = [];

  public userDefinedWind: IWindProps | undefined = undefined;
  // This property is also used by the UI to highlight wind info box.
  @observable public windDidChange = false;

  @observable public time = 0;
  @observable public dataReady = false;
  @observable public wind: IWindProps;
  @observable public sparks: Vector2[] = [];
  @observable public townMarkers: Town[] = [];
  @observable public zones: Zone[] = [];
  @observable public simulationStarted = false;
  @observable public simulationRunning = false;
  @observable public totalCellCountByZone: {[key: number]: number} = {};
  @observable public burnedCellsInZone: {[key: number]: number} = {};
  // These flags can be used by view to trigger appropriate rendering. Theoretically, view could/should check
  // every single cell and re-render when it detects some changes. In practice, we perform these updates in very
  // specific moments and usually for all the cells, so this approach can be way more efficient.
  @observable public cellsStateFlag = 0;
  @observable public cellsElevationFlag = 0;

  constructor(presetConfig: Partial<ISimulationConfig>) {
    makeObservable(this);
    this.load(presetConfig);
  }

  @computed public get ready() {
    return this.dataReady && this.sparks.length > 0;
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
    return this.time / 1440;
  }

  @computed public get canAddSpark() {
    return this.remainingSparks > 0;
  }

  @computed public get zonesCount(): 2 | 3 {
    return this.zones.length as 2 | 3;
  }

  @computed public get remainingSparks() {
    // There's an assumption that number of sparks should be smaller than number of zones.
    return this.zonesCount - this.sparks.length;
  }

  public getZoneBurnPercentage(zoneIdx: number) {
    const burnedCells = this.engine?.burnedCellsInZone[zoneIdx] || 0;
    return burnedCells / this.totalCellCountByZone[zoneIdx];
  }

  public cellAt(x: number, y: number) {
    const gridX = Math.floor(x / this.config.cellSize);
    const gridY = Math.floor(y / this.config.cellSize);
    return this.cells[getGridIndexForLocation(gridX, gridY, this.config.gridWidth)];
  }

  @action.bound public setInputParamsFromConfig() {
    const config = this.config;
    this.zones = config.zones.map(options => new Zone(options));
    if (config.zonesCount) {
      this.zones.length = config.zonesCount;
    }
    this.zoneIndex = config.zoneIndex || DEFAULT_ZONE_DIVISION[this.zones.length as (2 | 3)];

    this.wind = {
      speed: config.windSpeed,
      direction: config.windDirection
    };
    this.sparks.length = 0;
    config.sparks.forEach(s => {
      this.addSpark(s[0], s[1]);
    });
  }

  @action.bound public load(presetConfig: Partial<ISimulationConfig>) {
    this.restart();
    // Configuration are joined together. Default values can be replaced by preset, and preset values can be replaced
    // by URL parameters.
    this.config = Object.assign(getDefaultConfig(), presetConfig, getUrlConfig());
    this.setInputParamsFromConfig();
    this.populateCellsData();
  }

  @action.bound public populateCellsData() {
    this.dataReady = false;
    const config = this.config;
    const zones = this.zones;
    this.totalCellCountByZone = {};
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
          if (!this.totalCellCountByZone[zi]) {
            this.totalCellCountByZone[zi] = 1;
          } else {
            this.totalCellCountByZone[zi]++;
          }
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
    }
    if (!this.engine) {
      this.engine = new FireEngine(this.cells, this.wind, this.sparks, this.config);
    }

    this.simulationRunning = true;
    this.prevTickTime = null;

    requestAnimationFrame(this.rafCallback);
  }

  @action.bound public stop() {
    this.simulationRunning = false;
  }

  @action.bound public restart() {
    this.simulationRunning = false;
    this.simulationStarted = false;
    this.cells.forEach(cell => cell.reset());
    this.updateCellsStateFlag();
    this.updateCellsElevationFlag();
    this.time = 0;
    this.engine = null;
    this.windDidChange = false;
    if (this.userDefinedWind) {
      this.wind.speed = this.userDefinedWind.speed;
      this.wind.direction = this.userDefinedWind.direction;
      // Clear the saved wind settings. Otherwise, the following scenario might fail:
      // - simulation is started, userDefinedWind is saved when the wind settings are updated during the simulation
      // - user restarts simulation, userDefinedWind props are restored (as expected)
      // - user manually updates wind properties to new values
      // - simulation started and then restarted again BEFORE the new wind settings are applied
      // If userDefinedWind value isn't cleared, the user would see wrong wind setting after the second model restart.
      // This use case is coved by one of the tests in the simulation.test.ts
      this.userDefinedWind = undefined;
    }
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
      // One day in model time (86400 seconds) should last X seconds in real time.
      const ratio = 86400 / this.config.modelDayInSeconds;
      // Optimal time step assumes we have stable 60 FPS:
      // realTime = 1000ms / 60 = 16.666ms
      // timeStepInMs = ratio * realTime
      // timeStepInMinutes = timeStepInMs / 1000 / 60
      // Below, these calculations are just simplified (1000 / 60 / 1000 / 60 = 0.000277):
      const optimalTimeStep = ratio * 0.000277;
      // Final time step should be limited by:
      // - maxTimeStep that model can handle
      // - reasonable multiplication of the "optimal time step" so user doesn't see significant jumps in the simulation
      //   when one tick takes much longer time (e.g. when cell properties are recalculated after adding fire line)
      timeStep = Math.min(this.config.maxTimeStep, optimalTimeStep * 4, ratio * realTimeDiffInMinutes);
    } else {
      // We don't know performance yet, so simply increase time by some safe value and wait for the next tick.
      timeStep = 1;
    }

    this.tick(timeStep);
  }

  @action.bound public tick(timeStep: number) {
    if (this.engine) {
      this.time += timeStep;
      this.engine.updateFire(this.time);
      if (this.engine.fireDidStop) {
        this.simulationRunning = false;
      }
    }

    this.updateCellsStateFlag();

    this.changeWindIfNecessary();
  }

  @action.bound public changeWindIfNecessary() {
    if (this.config.changeWindOnDay !== undefined && this.timeInDays >= this.config.changeWindOnDay && this.windDidChange === false) {
      const newDirection = this.config.newWindDirection !== undefined ? this.config.newWindDirection : Math.random() * 360;
      const newSpeed = (this.config.newWindSpeed !== undefined ? this.config.newWindSpeed : Math.random() * NEW_WIND_MAX_SPEED) * this.config.windScaleFactor;
      // Save user defined values that will be restored when model is reset or reloaded.
      this.userDefinedWind = {
        speed: this.wind.speed,
        direction: this.wind.direction
      };
      // Update UI.
      this.wind.direction = newDirection;
      this.wind.speed = newSpeed;
      // Update engine.
      if (this.engine) {
        this.engine.wind.direction = newDirection;
        this.engine.wind.speed = newSpeed;
      }
      // Mark that the change just happened.
      this.windDidChange = true;
    }
  }

  @action.bound public updateCellsElevationFlag() {
    this.cellsElevationFlag += 1;
  }

  @action.bound public updateCellsStateFlag() {
    this.cellsStateFlag += 1;
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
      this.sparks.push(new Vector2(x, y));
    }
  }

  // Coords are in model units (feet).
  @action.bound public setSpark(idx: number, x: number, y: number) {
    this.sparks[idx] = new Vector2(x, y);
  }

  @action.bound public setWindDirection(direction: number) {
    this.wind.direction = direction;
  }

  @action.bound public setWindSpeed(speed: number) {
    this.wind.speed = speed;
  }
}
