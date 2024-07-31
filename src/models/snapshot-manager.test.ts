import { SNAPSHOT_INTERVAL, SnapshotsManager } from "./snapshots-manager";
import { SimulationModel } from "./simulation";

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
});
