import { action, observable, makeObservable } from "mobx";
import { IFireEventSnapshot, ISimulationSnapshot, SimulationModel } from "./simulation";

export const SNAPSHOT_INTERVAL = 1; // years

export interface ISnapshot {
  simulationSnapshot: ISimulationSnapshot
}

export interface IEventSnapshot {
  fireEventSnapshot: IFireEventSnapshot;
}

export class SnapshotsManager {
  public snapshots: ISnapshot[] = [];
  public fireEventSnapshots: IEventSnapshot[] = [];

  @observable public maxYear = 0;

  private simulation: SimulationModel;

  constructor(simulation: SimulationModel) {
    makeObservable(this);
    this.simulation = simulation;
    simulation.on("yearChange", this.onYearChange);
    simulation.on("restart", this.reset);
    simulation.on("fireEventAdded", this.onFireEventAdded);
    simulation.on("sparkAdded", this.onSparkAdded);
    simulation.on("fireEventRemoved", this.onFireEventRemoved);
    simulation.on("fireEventUpdated", this.onFireEventUpdated);
    simulation.on("fireEventEnded", this.onFireEventEnded);
    this.reset();
  }

  @action.bound public onFireEventAdded() {
    const fireEventsLength = this.simulation.fireEvents.length;
    const fireEventsIndex = fireEventsLength > 0 ? fireEventsLength - 1 : 0;
    this.fireEventSnapshots[fireEventsIndex] = {
      fireEventSnapshot: this.simulation.fireEventSnapshot()
    };
  }

  @action.bound public onFireEventRemoved() {
    this.fireEventSnapshots.pop();
  }

  @action.bound public onSparkAdded() {
    const fireEventsLength = this.fireEventSnapshots.length;
    const fireEventsIndex = fireEventsLength > 0 ? fireEventsLength - 1 : 0;
    if (!this.fireEventSnapshots[fireEventsIndex].fireEventSnapshot.sparks) {
      this.fireEventSnapshots[fireEventsIndex].fireEventSnapshot.sparks = [];
    }
    this.fireEventSnapshots[fireEventsIndex].fireEventSnapshot.sparks.push(this.simulation.sparks[this.simulation.sparks.length - 1]);
  }

  @action.bound public onFireEventUpdated() {
    const simSnapshot = this.simulation.snapshot();
    const fireEventsLength = this.simulation.fireEvents.length;
    const fireEventsIndex = fireEventsLength > 0 ? fireEventsLength - 1 : 0;
    this.fireEventSnapshots[fireEventsIndex].fireEventSnapshot.simulationSnapshots.push(simSnapshot);
  }

  @action.bound public onFireEventEnded() {
    const fireEventsLength = this.simulation.fireEvents.length;
    const fireEventsIndex = fireEventsLength > 0 ? fireEventsLength - 1 : 0;
    this.fireEventSnapshots[fireEventsIndex].fireEventSnapshot.endTime = this.simulation.time;
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

  public restoreFireEventSnapshot(time: number) {
    const yearInMinutes = 60 * 24 * 365;
    const timeInMinutes = time * yearInMinutes;
    const timeRangeStart = timeInMinutes - yearInMinutes;
    const timeRangeEnd = timeInMinutes + yearInMinutes;

    // Reverse the array and find the snapshot where startTime or endTime falls within the defined range
    const eventSnapshot = this.fireEventSnapshots.slice().reverse()
      .find(snapshot =>
        (snapshot.fireEventSnapshot.startTime <= timeRangeEnd && snapshot.fireEventSnapshot.startTime >= timeRangeStart) ||
        (snapshot.fireEventSnapshot.endTime <= timeRangeEnd && snapshot.fireEventSnapshot.endTime >= timeRangeStart)
      );
    this.simulation.stop();
    this.simulation.restoreFireEventSnapshot(eventSnapshot?.fireEventSnapshot);
    this.simulation.updateCellsStateFlag();
    this.simulation.updateCellsElevationFlag();
  }

  public restoreLastSnapshot() {
    const arrayIndex = this.snapshots.length - 1;
    const snapshot = this.snapshots[arrayIndex];
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
}
