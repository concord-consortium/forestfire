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

      // Growth of existing vegetation
      if (cell.fireState === FireState.Unburnt) {
        if (cell.vegetation === Vegetation.Grass && cell.vegetationAgeInYears > p.successionMinYears) {
          const adjacentShrub = this.isAdjacentVegetationPresent(cell, Vegetation.Shrub);
          if (Math.random() < (adjacentShrub ? p.grassToShrubAdjacent : p.grassToShrub)) {
            cell.vegetation = Vegetation.Shrub;
          }
        } else if (cell.vegetation === Vegetation.Shrub && cell.vegetationAgeInYears > p.successionMinYears) {
          const adjacentDeciduousForest = this.isAdjacentVegetationPresent(cell, Vegetation.DeciduousForest);
          if (Math.random() < (adjacentDeciduousForest ? p.shrubToDeciduousAdjacent : p.shrubToDeciduous)) {
            cell.vegetation = Vegetation.DeciduousForest;
          }
        } else if (cell.vegetation === Vegetation.DeciduousForest && cell.vegetationAgeInYears > p.deciduousToConiferousMinYears) {
          const adjacentConiferousForest = this.isAdjacentVegetationPresent(cell, Vegetation.ConiferousForest);
          if (Math.random() < (adjacentConiferousForest ? p.deciduousToConiferousAdjacent : p.deciduousToConiferous)) {
            cell.vegetation = Vegetation.ConiferousForest;
          }
        }
      }

      if (cell.fireState === FireState.Burnt) {
        const timeSinceLastFire = time - cell.lastFireTime;
        if (cell.lastFireBurnIndex === BurnIndex.Low && timeSinceLastFire > p.lowIntensityBurntAreaMinYears * yearInMinutes) {
          if (cell.vegetation === Vegetation.Shrub) {
            if (Math.random() < p.lowIntensityBurntShrubToGrass) {
              // 40% brows back as grass
              cell.vegetation = Vegetation.Grass;
            }
          }
          if (cell.vegetation === Vegetation.DeciduousForest) {
            if (Math.random() < p.lowIntensityBurntDeciduousToGrass) {
              // 10% brows back as grass
              cell.vegetation = Vegetation.Grass;
            }
          }
          if (cell.vegetation === Vegetation.ConiferousForest) {
            if (Math.random() < p.lowIntensityBurntConiferousToGrass) {
              // 10% brows back as grass
              cell.vegetation = Vegetation.Grass;
            }
          }
          cell.fireState = FireState.Unburnt;
        } else if (
            timeSinceLastFire > p.highIntensityBurntAreaMinYears * yearInMinutes &&
            Math.random() < p.highIntensityBurntAreaToGrass) { //  && (lastFireBurnIndex === BurnIndex.Medium || lastFireBurnIndex === BurnIndex.High)
          cell.vegetation = Vegetation.Grass;
          cell.fireState = FireState.Unburnt;
        }
      }
    }
  }
}
