import { action, observable, makeObservable } from "mobx";
import { ISimulationSnapshot, SimulationModel } from "./simulation";

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
    // simulation.on("start", this.start);
    this.reset();
  }

  @action.bound public onYearChange() {
    const year = Math.floor(this.simulation.timeInYears);
    if (year % SNAPSHOT_INTERVAL === 0) {
      //Change to last time step
      this.maxYear = this.simulation.timeInYears;
      const arrayIndex = year / SNAPSHOT_INTERVAL;
      this.snapshots[arrayIndex] = {
        simulationSnapshot: this.simulation.snapshot()
      };
    }
  }

  public restoreSnapshot(year: number) {
    const arrayIndex = Math.floor(year / SNAPSHOT_INTERVAL);

    const snapshot = this.snapshots[arrayIndex];
    if (!snapshot) {
      return;
    }
    this.simulation.stop();
    this.simulation.restoreSnapshot(snapshot.simulationSnapshot);
    this.simulation.updateCellsStateFlag();
  }

  public restoreLastSnapshot() {
    const arrayIndex = this.snapshots.length - 1;
    const snapshot = this.snapshots[arrayIndex];
    console.log("in restoreLastSnapshot", arrayIndex);
    if (!snapshot) {
      return;
    }
    this.simulation.stop();
    this.simulation.restoreSnapshot(snapshot.simulationSnapshot);
    this.simulation.updateCellsStateFlag();
  }

  @action.bound public reset() {
    this.snapshots = [];
    this.maxYear = 0;
  }

  // @action.bound public start() {
  //   console.log("in start timeInYears", this.simulation.timeInYears);
  //   const arrayIndex = Math.floor(this.simulation.timeInYears/10000 / SNAPSHOT_INTERVAL);
  //   this.snapshots.length = arrayIndex + 1;
  //   this.maxYear = this.snapshots.length;
  // }
}
