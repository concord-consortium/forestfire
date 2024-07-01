import { action, observable, makeObservable } from "mobx";
import { ISimulationSnapshot, SimulationModel } from "./simulation";
import { deepEqual } from "../utils";
import { yearInMinutes } from "../types";

export const SNAPSHOT_INTERVAL = 3; // years

export interface ISnapshot {
  simulationSnapshot: ISimulationSnapshot | undefined
}

export class SnapshotsManager {
  public snapshots: ISnapshot[] = [];

  @observable public maxYear = 0;

  private simulation: SimulationModel;
  private lastSnapshotYear: number | null = null;
  private didFireEventEnd = false;

  constructor(simulation: SimulationModel) {
    makeObservable(this);
    this.simulation = simulation;
    simulation.on("start", this.onStart);
    simulation.on("yearChange", this.onYearChange);
    simulation.on("restart", this.reset);
    simulation.on("stop", this.onStop);
    simulation.on("fireEventAdded", this.onFireEventAdded);
    simulation.on("sparkAdded", this.onSparkAdded);
    simulation.on("fireEventRemoved", this.onFireEventRemoved);
    simulation.on("fireEventEnded", this.onFireEventEnded);
    this.reset();
  }

  // We only care about the last snapshot during a fire event
  @action.bound public onFireEventAdded() {
    console.log("in onFireEventAdded before time", this.simulation.time);
    if (this.snapshots.length > 0) {
      this.snapshots[this.snapshots.length - 1].simulationSnapshot = this.simulation.snapshot();
    } else {
      this.snapshots.push({ simulationSnapshot: this.simulation.snapshot() });
    }
    console.log("in onFireEventAdded after", this.snapshots.length);
  }

  @action.bound public onFireEventRemoved() {
    this.snapshots.pop();
  }

  @action.bound public onSparkAdded() {
    console.log("in onSparkAdded before", this.snapshots.length);
    if (this.snapshots.length > 0) {
      this.snapshots[this.snapshots.length - 1].simulationSnapshot = this.simulation.snapshot();
    } else {
      this.snapshots.push({ simulationSnapshot: this.simulation.snapshot() });
    }
    console.log("in onSparkAdded after", this.snapshots.length);
  }

  @action.bound public onFireEventEnded() {
    const currentSimulationSnapshot = this.simulation.snapshot();
    console.log("in onFireEventEnded before", this.snapshots.length);

    if (this.snapshots.length > 0) {
      // Retrieve the last snapshot's simulationSnapshot
      const lastSnapshot = this.snapshots[this.snapshots.length - 1]?.simulationSnapshot;
      // Merge sparks from the last snapshot with the current simulation snapshot
      const mergedSparks = lastSnapshot ? [...lastSnapshot.sparks, ...currentSimulationSnapshot.sparks]
                                        : currentSimulationSnapshot.sparks;
      // Update the last snapshot with the merged sparks and other properties from the current simulation snapshot
      if (lastSnapshot) {
        this.snapshots[this.snapshots.length - 1].simulationSnapshot = {
          ...currentSimulationSnapshot,
          sparks: mergedSparks,
        };
      }
    }
    // this.didFireEventEnd = true;
    this.lastSnapshotYear = Math.floor(this.simulation.timeInYears);
    console.log("in onFireEventEnded after", this.snapshots.length);
  }

  @action.bound public onStart() {
    this.maxYear = 0;
    if (this.snapshots.length <= 0) {
      this.snapshots.push({simulationSnapshot: this.simulation.snapshot()});
    }
  }

  @action.bound public onStop() {
    if (this.simulation.isFireActive) {
      this.snapshots[this.snapshots.length - 1].simulationSnapshot = this.simulation.snapshot();
    } else {
      this.snapshots.push({simulationSnapshot: this.simulation.snapshot()});
    }
  }

  @action.bound public onYearChange() {
    if (this.simulation.timeInYears > this.maxYear) {
      this.maxYear = this.simulation.timeInYears;
    }
    console.log("in onYearChange timeinyears", this.simulation.timeInYears);
    // We only take a snapshot every 3 years, and only if the vegetation statistics have changed
    // Otherwise, we just store undefined. This should improve performance.
    // if (this.simulation.simulationRunning && Math.floor(this.simulation.timeInYears) % SNAPSHOT_INTERVAL === 0) {
    // if (this.simulation.simulationRunning && this.didFireEventEnd) {
    //   console.log("in onYearChange fire event ended", this.didFireEventEnd);

    //   this.didFireEventEnd = false;
    //   this.snapshots.push({ simulationSnapshot: this.simulation.snapshot() });
    //   this.lastSnapshotYear = this.simulation.timeInYears;
    //   // return;
    // } else {
      const currentYear = Math.floor(this.simulation.timeInYears);
      console.log("in onYearChange currentYear", currentYear, this.lastSnapshotYear, this.snapshots.length, this.maxYear)
      if (this.lastSnapshotYear !== null) {
        const yearsSinceLastSnapshot = currentYear - this.lastSnapshotYear;
        if (yearsSinceLastSnapshot >= SNAPSHOT_INTERVAL) {


        // if (this.simulation.simulationRunning && Math.floor(this.simulation.timeInYears) % SNAPSHOT_INTERVAL === 0) {
          if (this.simulation.yearlyVegetationStatistics.length > 1) {
            const currentYearlyVegetationStats = this.simulation.yearlyVegetationStatistics[this.simulation.yearlyVegetationStatistics.length - 1];
            const previousYearlyVegetationStats = this.simulation.yearlyVegetationStatistics[this.simulation.yearlyVegetationStatistics.length - 2];
            if (!deepEqual(currentYearlyVegetationStats, previousYearlyVegetationStats)) {
              this.snapshots.push({ simulationSnapshot: this.simulation.snapshot() });
            } else {
              this.snapshots.push({ simulationSnapshot: undefined });
            }
          }
          this.lastSnapshotYear = currentYear;
        }
      }
    // }
    console.log("snapshots length", this.snapshots.length, "maxYear", this.maxYear);
  }

  public restoreSnapshot(year: number) {
    // const timeInMinutes = year * yearInMinutes;
    // const timeRangeStart = timeInMinutes - yearInMinutes;
    // const timeRangeEnd = timeInMinutes + yearInMinutes;
    // const eventSnapshot = this.fireEventSnapshots.slice().reverse()
    // .find(snapshot =>
    //   (snapshot.fireEventSnapshot.startTime <= timeRangeEnd && snapshot.fireEventSnapshot.startTime >= timeRangeStart) ||
    //   (snapshot.fireEventSnapshot.endTime <= timeRangeEnd && snapshot.fireEventSnapshot.endTime >= timeRangeStart)
    // );
    // if (eventSnapshot) {
    //   this.simulation.stop();
    //   this.simulation.restoreFireEventSnapshot(eventSnapshot?.fireEventSnapshot);
    //   this.simulation.updateCellsStateFlag();
    //   this.simulation.updateCellsElevationFlag();
    // } else {
    console.log("in restoreSnapshot year", year);
    // arrayIndex is year/3 because we only take a snapshot every 3 years
      const arrayIndex = year > 1 ? Math.floor(year/3) : 0;
      console.log("arrayIndex", arrayIndex, "snapshots length", this.snapshots.length);
      // Find the first previous snapshot that is not undefined
      let previousSnapshotIndex = -1;
      for (let i = arrayIndex; i >= 0; i--) {
        if (this.snapshots[i].simulationSnapshot) {
          previousSnapshotIndex = i;
          break;
        }
      }
      if (previousSnapshotIndex !== -1) {
        const snapshot = this.snapshots[previousSnapshotIndex].simulationSnapshot;
        if (snapshot !== undefined) {
          this.simulation.stop();
          this.simulation.restoreSnapshot(snapshot);
          this.simulation.updateCellsStateFlag();
          this.simulation.updateCellsElevationFlag();
        }
      }
    // }
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
