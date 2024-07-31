import { action, observable, makeObservable } from "mobx";
import { ISimulationSnapshot, SimulationModel } from "./simulation";
import { deepEqual } from "../utils";
import { yearInMinutes } from "../types";


export const SNAPSHOT_INTERVAL = 3; // years
export const MIN_DISTANCE_TO_FIRE_EVENT = 2; // years

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
    simulation.on("start", this.onStart);
    simulation.on("resume", this.onResume);
    simulation.on("stop", this.onStop);
    simulation.on("restart", this.reset);
    simulation.on("yearChange", this.onYearChange);
    simulation.on("fireEventEnded", this.onFireEventEnded);
    this.reset();
  }

  get lastSnapshot(): ISnapshot | null {
    return this.snapshots[this.snapshots.length - 1] ?? null;
  }

  get lastSnapshotTime() {
    return this.lastSnapshot ? this.lastSnapshot.simulationSnapshot.time : null;
  }

  get lastSnapshotYear() {
    return this.lastSnapshotTime !== null ? this.lastSnapshotTime / yearInMinutes : null;
  }

  get pastStateLoaded() {
    return this.lastSnapshotTime !== null && this.simulation.time < this.lastSnapshotTime;
  }

  public tooCloseToLastSnapshot(year: number) {
    return this.lastSnapshotYear !== null && Math.abs(year - this.lastSnapshotYear) < MIN_DISTANCE_TO_FIRE_EVENT;
  }

  public isFireEventSnapshot(snapshot: ISnapshot | null): boolean {
    return !!snapshot && snapshot.simulationSnapshot.sparks.length > 0;
  }

  public findClosestSnapshot(year: number): ISnapshot | null {
    let minDiff = Infinity;
    let closestSnapshot: ISnapshot | null = null;
    for (const snapshot of this.snapshots) {
      const snapshotYear = snapshot.simulationSnapshot.time / yearInMinutes;
      const diff = Math.abs(year - snapshotYear);
      if (diff <= minDiff) {
        minDiff = diff;
        closestSnapshot = snapshot;
      }
    }
    return closestSnapshot;
  }

  public saveSnapshot(existingCellSnapshots?: ISimulationSnapshot["cellSnapshots"]) {
    const snapshot = this.simulation.snapshot(existingCellSnapshots);
    this.snapshots.push({ simulationSnapshot: snapshot });
  }

  public restoreSnapshot(snapshot: ISnapshot) {
    this.simulation.restoreSnapshot(snapshot.simulationSnapshot);
    this.simulation.updateCellsStateFlag();
  }

  @action.bound public reset() {
    this.snapshots = [];
    this.maxYear = 0;
  }

  // Simulation event handlers:

  @action.bound public onStart() {
    this.maxYear = 0;
    // Skip snapshot handling when a fire event is active. A snapshot will be taken at the end of the fire event.
    if (this.simulation.isFireEventActive) {
      return;
    }
    if (this.snapshots.length === 0) {
      this.saveSnapshot();
    }
  }

  @action.bound public onStop() {
    // Skip snapshot handling when a fire event is active. A snapshot will be taken at the end of the fire event.
    if (this.simulation.isFireEventActive) {
      return;
    }
    this.saveSnapshot();
  }

  @action.bound public onResume() {
    // Skip snapshot handling when a fire event is active. A snapshot will be taken at the end of the fire event.
    if (this.simulation.isFireEventActive) {
      return;
    }
    if (this.lastSnapshot && this.lastSnapshot.simulationSnapshot.time !== this.simulation.time) {
      this.restoreSnapshot(this.lastSnapshot);
    }
    // Always remove snapshot taken onStop when resuming.
    this.snapshots.pop();
  }

  @action.bound public onYearChange() {
    // Skip snapshot handling when a fire event is active. A snapshot will be taken at the end of the fire event.
    if (this.simulation.isFireEventActive) {
      return;
    }
    if (this.simulation.timeInYears > this.maxYear) {
      this.maxYear = this.simulation.timeInYears;
    }
    const currentYear = Math.floor(this.simulation.timeInYears);
    // Don't take snapshot if it's too close to the last snapshot. That can only happen if the last snapshot was
    // taken during a fire event.
    if (currentYear % SNAPSHOT_INTERVAL === 0 && !this.tooCloseToLastSnapshot(currentYear)) {
      let existingCellSnapshots = undefined;
      const lastSnapshotYear = this.lastSnapshotYear;
      if (lastSnapshotYear != null && this.simulation.yearlyVegetationStatistics[lastSnapshotYear]) {
        // Vegetation stats are used as a proxy to determine if the cell snapshots are the same. The same stats don't
        // guarantee the same cell snapshots, but this is a good enough heuristic in practice.
        const currentYearlyVegetationStats = this.simulation.vegetationStatisticsForYear(currentYear);
        const previousYearlyVegetationStats = this.simulation.vegetationStatisticsForYear(lastSnapshotYear);
        if (previousYearlyVegetationStats && deepEqual(currentYearlyVegetationStats, previousYearlyVegetationStats)) {
          // Copy reference to the existing cell snapshots to save memory and time.
          existingCellSnapshots = this.snapshots[this.snapshots.length - 1].simulationSnapshot.cellSnapshots;
        }
      }
      this.saveSnapshot(existingCellSnapshots);
    }
  }

  @action.bound public onFireEventEnded() {
    if (!this.isFireEventSnapshot(this.lastSnapshot) && this.tooCloseToLastSnapshot(this.simulation.timeInYears)) {
      // Remove previous regular snapshot if it's too close to the fire event snapshot. This will help users to
      // snap to the fire event snapshot when scrubbing the timeline.
      this.snapshots.pop();
    }
    this.saveSnapshot();
  }
}
