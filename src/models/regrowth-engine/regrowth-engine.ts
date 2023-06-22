import { Cell } from "../cell";
import { Vegetation, yearInMinutes } from "../../types";
import { getGridIndexForLocation } from "../utils/grid-utils";

export interface IRegrowthEngineConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  regrowthEngineNeighborsDist: number;
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
  public time = 0;
  public year = 0;

  constructor(cells: Cell[], config: IRegrowthEngineConfig) {
    this.cells = cells;
    this.gridWidth = config.gridWidth;
    this.gridHeight = config.gridHeight;
    this.cellSize = config.cellSize;
    this.neighborsDist = config.regrowthEngineNeighborsDist;
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
    this.time = time;

    let yearDidChange = false;
    const newYear = Math.floor(time / yearInMinutes);
    if (newYear !== this.year) {
      this.year = newYear;
      yearDidChange = true;
    }

    if (!yearDidChange) {
      // Nothing to do. All the vegetation updates are done on per-year basis.
      return;
    }

    const numCells = this.cells.length;
    for (let i = 0; i < numCells; i++) {
      const cell = this.cells[i];
      cell.vegetationAge += yearInMinutes;

      // Growth of existing vegetation
      if (cell.vegetation === Vegetation.Grass && cell.vegetationAgeInYears > 3) {
        const adjacentShrub = this.isAdjacentVegetationPresent(cell, Vegetation.Shrub);
        if (Math.random() < (adjacentShrub ? 0.3 : 0.1)) {
          cell.vegetation = Vegetation.Shrub;
        }
      } else if (cell.vegetation === Vegetation.Shrub && cell.vegetationAgeInYears > 3) {
        const adjacentDeciduousForest = this.isAdjacentVegetationPresent(cell, Vegetation.DeciduousForest);
        if (Math.random() < (adjacentDeciduousForest ? 0.3 : 0.1)) {
          cell.vegetation = Vegetation.DeciduousForest;
        }
      } else if (cell.vegetation === Vegetation.DeciduousForest && cell.vegetationAgeInYears > 40) {
        const adjacentConiferousForest = this.isAdjacentVegetationPresent(cell, Vegetation.ConiferousForest);
        if (Math.random() < (adjacentConiferousForest ? 0.3 : 0.1)) {
          cell.vegetation = Vegetation.ConiferousForest;
        }
      }
    }
  }
}
