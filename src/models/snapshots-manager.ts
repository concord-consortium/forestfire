import { action, observable, makeObservable } from "mobx";
import { ISimulationSnapshot, SimulationModel } from "./simulation";
import { deepEqual } from "../utils";

export const SNAPSHOT_INTERVAL = 3; // years

export interface ISnapshot {
  simulationSnapshot?: ISimulationSnapshot
}

export class SnapshotsManager {
  public snapshots: ISnapshot[] = [];

  @observable public maxYear = 0;

  private simulation: SimulationModel;
  private lastSnapshotYear: number | null = null;

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

  // We only care about the last snapshot during a fire event at fire event end.
  // So we add a snapshot when the fire event starts to get the time the fire event started.
  // and replace the snapshot when sparks are added to record where the sparks are. When the fire event ends,
  // the sparks array is emptied, so we have to take the sparks array from the last spark event snapshot and
  // copy it into the fire event end snapshot.
  @action.bound public onFireEventAdded() {
    // We attach the fire event start to the closest year a snapshot would have been taken
    const currentYear = this.simulation.timeInYears;
    if (this.lastSnapshotYear !== null) {
      const yearsSinceLastSnapshot = currentYear - this.lastSnapshotYear;
      if (this.snapshots.length > 0 && yearsSinceLastSnapshot <= SNAPSHOT_INTERVAL/2) {
        this.snapshots[this.snapshots.length - 1].simulationSnapshot = this.simulation.snapshot();
      } else {
        this.snapshots.push({ simulationSnapshot: this.simulation.snapshot() });
      }
    } else {
      this.snapshots.push({ simulationSnapshot: this.simulation.snapshot() });
    }
  }

  @action.bound public onFireEventRemoved() {
    this.snapshots.pop();
  }

  @action.bound public onSparkAdded() {
    if (this.snapshots.length > 0) {
      this.snapshots[this.snapshots.length - 1].simulationSnapshot = this.simulation.snapshot();
    } else {
      this.snapshots.push({ simulationSnapshot: this.simulation.snapshot() });
    }
  }

  @action.bound public onFireEventEnded() {
    const currentSimulationSnapshot = this.simulation.snapshot();
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
    this.lastSnapshotYear = Math.floor(this.simulation.timeInYears);
  }

  @action.bound public onStart() {
    this.maxYear = 0;
    if (this.snapshots.length <= 0) {
      this.snapshots.push({simulationSnapshot: this.simulation.snapshot()});
      this.lastSnapshotYear = Math.floor(this.simulation.timeInYears);
    }
  }

  @action.bound public onStop() {
    if (this.simulation.isFireActive) {
      this.snapshots[this.snapshots.length - 1].simulationSnapshot = this.simulation.snapshot();
    }
  }

  @action.bound public onYearChange() {
    if (this.simulation.timeInYears > this.maxYear) {
      this.maxYear = this.simulation.timeInYears;
    }
    const currentYear = Math.floor(this.simulation.timeInYears);
    const yearsSinceLastSnapshot = currentYear - (this.lastSnapshotYear ?? 0);
    if (yearsSinceLastSnapshot >= SNAPSHOT_INTERVAL) {
      if (this.simulation.yearlyVegetationStatistics.length > 1) {
        const currentYearlyVegetationStats = this.simulation.yearlyVegetationStatistics[this.simulation.yearlyVegetationStatistics.length - 1];
        const previousYearlyVegetationStats = this.simulation.yearlyVegetationStatistics[this.simulation.yearlyVegetationStatistics.length - 2];
        if (!deepEqual(currentYearlyVegetationStats, previousYearlyVegetationStats)) {
          this.snapshots.push({ simulationSnapshot: this.simulation.snapshot() });
        } else {
          this.snapshots.push({ simulationSnapshot: undefined });
        }
      }
      this.lastSnapshotYear = Math.floor(this.simulation.timeInYears);
    }
  }

  public restoreSnapshot(year: number) {
    const arrayIndex = year > 1 ? Math.floor(year/SNAPSHOT_INTERVAL) : 0;
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
      }
    }
  }

  public restoreLastSnapshot() {
    const arrayIndex = this.snapshots.length - 1;
    const snapshot = this.snapshots[arrayIndex].simulationSnapshot;
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
