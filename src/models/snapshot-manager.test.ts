import { SNAPSHOT_INTERVAL, SnapshotsManager } from "./snapshots-manager";
import { SimulationModel } from "./simulation";
import { yearInMinutes } from "../types";

const getSimpleSimulation = async () => {
  const s = new SimulationModel({
    elevation: [[0]],
    zoneIndex: [[0]],
    riverData: null,
    unburntIslands: [[0]],
    gridWidth: 1
  });
  await s.dataReadyPromise;
  return s;
};

describe("SnapshotsManager", () => {
  const ratio = 86400 * 365 / 0.25; // 1 year
  const optimalTimeStep = ratio * 0.000277;
  const timeStep = optimalTimeStep * 4;

  it("should initialize correctly", async () => {
    const simulation = await getSimpleSimulation();
    const snapshotsManager = new SnapshotsManager(simulation);
    expect(snapshotsManager.snapshots).toEqual([]);
    expect(snapshotsManager.maxYear).toBe(0);
  });

  it("should create a snapshot on year change", async () => {
    const simulation = await getSimpleSimulation();
    const snapshotsManager = new SnapshotsManager(simulation);
    while (simulation.timeInYears < SNAPSHOT_INTERVAL) {
      simulation.tick(timeStep);
    }

    expect(Math.floor(snapshotsManager.maxYear)).toBe(SNAPSHOT_INTERVAL);
    expect(snapshotsManager.snapshots).toHaveLength(1);
    while (simulation.timeInYears < 3 * SNAPSHOT_INTERVAL) {
      simulation.tick(timeStep);
    }

    expect(Math.floor(snapshotsManager.maxYear)).toBe(3 * SNAPSHOT_INTERVAL);
    expect(snapshotsManager.snapshots).toHaveLength(3);
  });

  describe("findClosestSnapshot", () => {
    it("should return the closest snapshot", async () => {
      const simulation = await getSimpleSimulation();
      const snapshotsManager = new SnapshotsManager(simulation);
      snapshotsManager.snapshots = [
        { simulationSnapshot: { time: yearInMinutes * 0 } as any },
        { simulationSnapshot: { time: yearInMinutes * 1 } as any },
        { simulationSnapshot: { time: yearInMinutes * 1.2 } as any },
        { simulationSnapshot: { time: yearInMinutes * 1.8 } as any },
        { simulationSnapshot: { time: yearInMinutes * 2 } as any },
      ];

      expect(snapshotsManager.findClosestSnapshot(0)?.simulationSnapshot.time).toBeCloseTo(0 * yearInMinutes);
      expect(snapshotsManager.findClosestSnapshot(1)?.simulationSnapshot.time).toBeCloseTo(1 * yearInMinutes);
      expect(snapshotsManager.findClosestSnapshot(1.1)?.simulationSnapshot.time).toBeCloseTo(1.2 * yearInMinutes);
      expect(snapshotsManager.findClosestSnapshot(1.2)?.simulationSnapshot.time).toBeCloseTo(1.2 * yearInMinutes);
      expect(snapshotsManager.findClosestSnapshot(1.3)?.simulationSnapshot.time).toBeCloseTo(1.2 * yearInMinutes);
      expect(snapshotsManager.findClosestSnapshot(1.51)?.simulationSnapshot.time).toBeCloseTo(1.8 * yearInMinutes);
      expect(snapshotsManager.findClosestSnapshot(2)?.simulationSnapshot.time).toBeCloseTo(2 * yearInMinutes);
      expect(snapshotsManager.findClosestSnapshot(5)?.simulationSnapshot.time).toBeCloseTo(2 * yearInMinutes);
    });

    it("should return null if no snapshots are available", async () => {
      const simulation = await getSimpleSimulation();
      const snapshotsManager = new SnapshotsManager(simulation);
      const closestSnapshot = snapshotsManager.findClosestSnapshot(2.5);
      expect(closestSnapshot).toBeNull();
    });
  });
});
