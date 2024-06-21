import { action, observable, makeObservable } from "mobx";
import { IFireEventSnapshot, ISimulationSnapshot, SimulationModel } from "./simulation";
import { deepEqual } from "../utils";
import { yearInMinutes } from "../types";

export const SNAPSHOT_INTERVAL = 3; // years

export interface ISnapshot {
  simulationSnapshot: ISimulationSnapshot | undefined
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
    simulation.on("start", this.onStart);
    simulation.on("yearChange", this.onYearChange);
    simulation.on("restart", this.reset);
    simulation.on("fireEventAdded", this.onFireEventAdded);
    simulation.on("sparkAdded", this.onSparkAdded);
    simulation.on("fireEventRemoved", this.onFireEventRemoved);
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
    this.fireEventSnapshots[fireEventsIndex].fireEventSnapshot.simulationSnapshot = simSnapshot;
  }

  @action.bound public onFireEventEnded() {
    const fireEventsLength = this.simulation.fireEvents.length;
    const fireEventsIndex = fireEventsLength > 0 ? fireEventsLength - 1 : 0;
    this.fireEventSnapshots[fireEventsIndex].fireEventSnapshot.endTime = this.simulation.time;
  }

  @action.bound public onStart() {
    this.maxYear = 0;
    this.snapshots[0] = {
      simulationSnapshot: this.simulation.snapshot()
    };
    console.log("onStart", this.snapshots[0].simulationSnapshot);
  }

  @action.bound public onYearChange() {
    if (this.simulation.timeInYears > this.maxYear) {
      this.maxYear = this.simulation.timeInYears;
    }
    // We only take a snapshot every 3 years, and only if the vegetation statistics have changed
    // Otherwise, we just store undefined. This should improve performance.
    if (this.simulation.timeInYears % SNAPSHOT_INTERVAL !== 0) {
      if (this.simulation.yearlyVegetationStatistics.length > 1) {
        const arrayIndex = this.snapshots.length;
        const currentYearlyVegetationStats = this.simulation.yearlyVegetationStatistics[this.simulation.yearlyVegetationStatistics.length - 1];
        const previousYearlyVegetationStats = this.simulation.yearlyVegetationStatistics[this.simulation.yearlyVegetationStatistics.length - 2];
        if (!deepEqual(currentYearlyVegetationStats, previousYearlyVegetationStats)) {
          this.snapshots[arrayIndex] = {
            simulationSnapshot: this.simulation.snapshot()
          };
        } else {
          this.snapshots[arrayIndex] = {
            simulationSnapshot: undefined
          };
        }
      }
    }
  }

  public restoreSnapshot(year: number) {
    const arrayIndex = year > 0 ? Math.floor(year) - 1 : 0;
    const snapshot = this.snapshots[arrayIndex].simulationSnapshot
                        ?? (this.snapshots.slice().reverse().find(s => s.simulationSnapshot
                          && s.simulationSnapshot.time < year * yearInMinutes))?.simulationSnapshot;
    if (!snapshot) {
      return;
    }
    this.simulation.stop();
    this.simulation.restoreSnapshot(snapshot);
    this.simulation.updateCellsStateFlag();
  }

  public restoreFireEventSnapshot(time: number) {
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
    const snapshot = this.snapshots[arrayIndex].simulationSnapshot ?? (this.snapshots.slice().reverse().find(s => s.simulationSnapshot))?.simulationSnapshot;
    if (!snapshot) {
      return;
    }
    this.simulation.stop();
    this.simulation.restoreSnapshot(snapshot);
    this.simulation.updateCellsStateFlag();
  }

  @action.bound public reset() {
    this.snapshots = [];
    this.maxYear = 0;
  }
}
