import { SimulationModel } from "./simulation";
import { UIModel } from "./ui";
import presets from "../presets";
import { getDefaultConfig, getUrlConfig } from "../config";
import { DroughtLevel, TerrainType, Vegetation } from "../types";
import { SnapshotsManager } from "./snapshots-manager";

export interface IStores {
  simulation: SimulationModel;
  ui: UIModel;
  snapshotsManager: SnapshotsManager;
}

export const createStores = (): IStores => {
  // Export some variables and types to window. This lets authors open browser console and load preset manually like:
  // sim.load({
  //   modelWidth: 120000,
  //   modelHeight: 80000,
  //   gridWidth: 240,
  //   heightmapMaxElevation: 20000,
  //   zones: [
  //     { terrainType: TerrainType.Foothills, vegetation: Vegetation.Shrub, droughtLevel: 1 },
  //     { terrainType: TerrainType.Foothills, vegetation: Vegetation.Shrub, droughtLevel: 1 },
  //   ],
  //   zoneIndex: [
  //     [ 0, 1 ]
  //   ]
  // })
  const simulation = new SimulationModel(presets[getUrlConfig().preset || getDefaultConfig().preset]);
  (window as any).sim = simulation;
  (window as any).DroughtLevel = DroughtLevel;
  (window as any).Vegetation = Vegetation;
  (window as any).TerrainType = TerrainType;

  const ui = new UIModel();
  const snapshotsManager = new SnapshotsManager(simulation);
  (window as any).ui = ui;
  (window as any).snapshotsManager = snapshotsManager;

  return {
    simulation, ui, snapshotsManager
  };
};
