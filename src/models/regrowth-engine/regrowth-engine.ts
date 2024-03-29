import { Cell } from "../cell";
import { Vegetation, yearInMinutes, FireState, BurnIndex } from "../../types";
import { getGridIndexForLocation } from "../utils/grid-utils";

export interface IRegrowthEngineConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  regrowthEngineNeighborsDist: number;
  // Probabilities of vegetation type change in a cell.
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

// Lightweight helper that is responsible only for math calculations. It's not bound to MobX or any UI state
// (it's role of the Simulation model). Config properties are explicitly listed, so it's clear
// which config options are responsible for simulation progress.
export class RegrowthEngine {
  public cells: Cell[];
  public gridWidth: number;
  public gridHeight: number;
  public cellSize: number;
  public neighborsDist: number;
  public config: IRegrowthEngineConfig;

  constructor(cells: Cell[], config: IRegrowthEngineConfig) {
    this.cells = cells;
    this.gridWidth = config.gridWidth;
    this.gridHeight = config.gridHeight;
    this.cellSize = config.cellSize;
    this.neighborsDist = config.regrowthEngineNeighborsDist;
    this.config = config;
  }

  public cellAt(x: number, y: number) {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    return this.cells[getGridIndexForLocation(gridX, gridY, this.gridWidth)];
  }

  public isAdjacentVegetationPresent(cell: Cell, type: Vegetation): boolean {
    const x = cell.x;
    const y = cell.y;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) {
          continue;
        }
        const neighborX = x + i;
        const neighborY = y + j;
        if (neighborX < 0 || neighborX >= this.gridWidth || neighborY < 0 || neighborY >= this.gridHeight) {
          continue;
        }
        const neighborCell = this.cells[getGridIndexForLocation(neighborX, neighborY, this.gridWidth)];
        if (neighborCell.vegetation === type) {
          return true;
        }
      }
    }
    return false;
  }

  public updateVegetation(time: number) {
    const p = this.config;
    const numCells = this.cells.length;
    for (let i = 0; i < numCells; i++) {
      const cell = this.cells[i];
      cell.vegetationAge += yearInMinutes;

      const randomNumber = Math.random();

      // Growth of existing vegetation
      if (cell.fireState === FireState.Unburnt) {
        cell.accumulateCarbon();

        if (cell.vegetation === Vegetation.Grass && cell.vegetationAgeInYears > p.successionMinYears) {
          const adjacentShrub = this.isAdjacentVegetationPresent(cell, Vegetation.Shrub);
          if (randomNumber < (adjacentShrub ? p.grassToShrubAdjacent : p.grassToShrub)) {
            cell.vegetation = Vegetation.Shrub;
          }
        } else if (cell.vegetation === Vegetation.Shrub &&
            !cell.isInTripleBurnState(time) && // When cell experienced 3 burns within short time span, deciduous trees will not grow.
            cell.vegetationAgeInYears > p.successionMinYears) {
          const adjacentDeciduousForest = this.isAdjacentVegetationPresent(cell, Vegetation.DeciduousForest);
          if (randomNumber < (adjacentDeciduousForest ? p.shrubToDeciduousAdjacent : p.shrubToDeciduous)) {
            cell.vegetation = Vegetation.DeciduousForest;
          }
        } else if (cell.vegetation === Vegetation.DeciduousForest &&
            !cell.isInDoubleBurnState(time) && // When cell experienced 2 burns within short time span, coniferous trees will not grow.
            cell.vegetationAgeInYears > p.deciduousToConiferousMinYears) {
          const adjacentConiferousForest = this.isAdjacentVegetationPresent(cell, Vegetation.ConiferousForest);
          if (randomNumber < (adjacentConiferousForest ? p.deciduousToConiferousAdjacent : p.deciduousToConiferous)) {
            cell.vegetation = Vegetation.ConiferousForest;
          }
        }
      }

      if (cell.fireState === FireState.Burnt) {
        cell.releaseCarbon();

        const timeSinceLastFire = time - cell.lastFireTime;
        if (cell.lastFireBurnIndex === BurnIndex.Low && timeSinceLastFire > p.lowIntensityBurntAreaMinYears * yearInMinutes) {
          if (cell.vegetation === Vegetation.Shrub) {
            if (randomNumber < p.lowIntensityBurntShrubToGrass) {
              // 40% brows back as grass
              cell.vegetation = Vegetation.Grass;
            }
          }
          if (cell.vegetation === Vegetation.DeciduousForest) {
            if (randomNumber < p.lowIntensityBurntDeciduousToGrass) {
              // 10% brows back as grass
              cell.vegetation = Vegetation.Grass;
            }
          }
          if (cell.vegetation === Vegetation.ConiferousForest) {
            if (randomNumber < p.lowIntensityBurntConiferousToGrass) {
              // 10% brows back as grass
              cell.vegetation = Vegetation.Grass;
            }
          }
          cell.fireState = FireState.Unburnt;
        } else if (
            timeSinceLastFire > p.highIntensityBurntAreaMinYears * yearInMinutes &&
            randomNumber < p.highIntensityBurntAreaToGrass) { //  && (lastFireBurnIndex === BurnIndex.Medium || lastFireBurnIndex === BurnIndex.High)
          cell.vegetation = Vegetation.Grass;
          cell.fireState = FireState.Unburnt;
        }
      }
    }
  }
}
