import { Vegetation, TerrainType, DroughtLevel } from "../types";
import { observable, makeObservable } from "mobx";

export interface ZoneOptions {
  vegetation: Vegetation;
  terrainType: TerrainType;
  droughtLevel: number;
}

export class Zone {
  @observable public vegetation: Vegetation;
  @observable public terrainType: TerrainType;
  @observable public droughtLevel: DroughtLevel;

  constructor(props?: ZoneOptions) {
    makeObservable(this);
    Object.assign(this, props);
  }

  clone() {
    return new Zone({
      vegetation: this.vegetation,
      terrainType: this.terrainType,
      droughtLevel: this.droughtLevel,
    });
  }
}
