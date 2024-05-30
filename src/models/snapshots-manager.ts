import { action, observable, makeObservable } from "mobx";
import { ISimulationSnapshot, SimulationModel } from "./simulation";
import { yearInMinutes } from "../types";

export const SNAPSHOT_INTERVAL = 1; // years

export interface ISnapshot {
  simulationSnapshot: ISimulationSnapshot
}

export class SnapshotsManager {
  public snapshots: ISnapshot[] = [];
  @observable public maxYear = 0;

  private simulation: SimulationModel;

  constructor(simulation: SimulationModel) {
    makeObservable(this);
    this.simulation = simulation;
    simulation.on("yearChange", this.onYearChange);
    simulation.on("restart", this.reset);
    simulation.on("start", this.start);
    this.reset();
  }

  @action.bound public onYearChange() {
    const year = Math.floor(this.simulation.timeInYears);
    console.log("in onYearChange", year,
      this.simulation.simulationEndTime, year % SNAPSHOT_INTERVAL);
    if (year % SNAPSHOT_INTERVAL === 0) {
      //Change to last time step
      this.maxYear = this.simulation.simulationEndTime / yearInMinutes;
      const arrayIndex = year / SNAPSHOT_INTERVAL;
      this.snapshots[arrayIndex] = {
        simulationSnapshot: this.simulation.snapshot()
      };
    }
  }

  public restoreSnapshot(year: number) {
    const arrayIndex = year / SNAPSHOT_INTERVAL;

    const snapshot = this.snapshots[arrayIndex];
    console.log("in restoreSnapshot", snapshot, year, arrayIndex);
    if (!snapshot) {
      return;
    }
    console.log("in restoreSnapshot", snapshot.simulationSnapshot);
    this.simulation.stop();
    this.simulation.restoreSnapshot(snapshot.simulationSnapshot);
  }

  @action.bound public reset() {
    this.snapshots = [];
    this.maxYear = 0;
  }

  @action.bound public start() {
    console.log("in snapshots-manager start", this.simulation.simulationEndTime);
    const year = this.simulation.timeInYears * 10000;
    const arrayIndex = Math.floor(year / SNAPSHOT_INTERVAL);
    this.snapshots.length = arrayIndex + 1;
    this.maxYear = this.simulation.simulationEndTime / yearInMinutes;
  }
}
