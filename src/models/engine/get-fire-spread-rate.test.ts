import { getDirectionFactor, getFireSpreadRate } from "./get-fire-spread-rate";
import { Vegetation } from "../../types";

const cellSize = 1;

const sourceCell = {
  x: 10,
  y: 11,
  vegetation: Vegetation.Shrub,
  moistureContent: 0.06,
  elevation: 0
};

const targetCell = {
  x: 10,
  y: 10,
  vegetation: Vegetation.Shrub,
  moistureContent: 0.06,
  // Why such elevation? Note that spreadsheet uses value for slope 0.1.
  // Ensure that we use the same slope here (so calculate elevation accordingly).
  elevation: Math.tan(0.1) * cellSize
};

describe("getFireSpreadRate", () => {
  beforeEach(() => {
    sourceCell.vegetation = Vegetation.Shrub;
    targetCell.vegetation = Vegetation.Shrub;
  });

  it("calculates the fireSpreadRate correctly for grass fuel type", () => {
    sourceCell.vegetation = Vegetation.Grass;
    targetCell.vegetation = Vegetation.Grass;
    // Note that result is taken from:
    // https://drive.google.com/file/d/1ck0nwlawOtK-GjCV4qJ6ztMcxh3utbv-/view?usp=sharing
    // cells F13:
    // Wind speed in the spreadsheet uses feet/min, but we use mph here for better readability.
    // Also, note that target cell lies perfectly aligned with wind direction (northern).
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 1, direction: 0 }, cellSize)).toBeCloseTo(19.40563588);
    // cells F14:
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 2, direction: 0 }, cellSize)).toBeCloseTo(33.46252017);
    // cells F32:
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 20, direction: 0 }, cellSize)).toBeCloseTo(802.7428356);
  });

  it("calculates the fireSpreadRate correctly for shrub fuel type", () => {
    sourceCell.vegetation = Vegetation.Shrub;
    targetCell.vegetation = Vegetation.Shrub;
    // Note that result is taken from:
    // https://drive.google.com/file/d/1ck0nwlawOtK-GjCV4qJ6ztMcxh3utbv-/view?usp=sharing
    // cells F13:
    // Wind speed in the spreadsheet uses feet/min, but we use mph here for better readability.
    // Also, note that target cell lies perfectly aligned with wind direction (northern).
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 1, direction: 0 }, cellSize)).toBeCloseTo(14.1437344760);
    // cells F14:
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 2, direction: 0 }, cellSize)).toBeCloseTo(27.647260880);
    // cells F32:
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 20, direction: 0 }, cellSize)).toBeCloseTo(541.68779579);
  });

  it("calculates the fireSpreadRate correctly for deciduous forest fuel type", () => {
    sourceCell.vegetation = Vegetation.DeciduousForest;
    targetCell.vegetation = Vegetation.DeciduousForest;
    // Note that result is taken from:
    // https://drive.google.com/file/d/1ck0nwlawOtK-GjCV4qJ6ztMcxh3utbv-/view?usp=sharing
    // cells F13:
    // Wind speed in the spreadsheet uses feet/min, but we use mph here for better readability.
    // Also, note that target cell lies perfectly aligned with wind direction (northern).
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 1, direction: 0 }, cellSize)).toBeCloseTo(1.275686811);
    // cells F14:
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 2, direction: 0 }, cellSize)).toBeCloseTo(2.831591284);
    // cells F32:
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 20, direction: 0 }, cellSize)).toBeCloseTo(64.40222588);
  });

  it("calculates the fireSpreadRate correctly for foniferous forest fuel type", () => {
    sourceCell.vegetation = Vegetation.ConiferousForest;
    targetCell.vegetation = Vegetation.ConiferousForest;
    // Note that result is taken from:
    // https://drive.google.com/file/d/1ck0nwlawOtK-GjCV4qJ6ztMcxh3utbv-/view?usp=sharing
    // cells F13:
    // Wind speed in the spreadsheet uses feet/min, but we use mph here for better readability.
    // Also, note that target cell lies perfectly aligned with wind direction (northern).
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 1, direction: 0 }, cellSize)).toBeCloseTo(6.268576733);
    // cells F14:
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 2, direction: 0 }, cellSize)).toBeCloseTo(12.42085772);
    // cells F32:
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 20, direction: 0 }, cellSize)).toBeCloseTo(212.927632);
  });

  it("takes into account wind direction", () => {
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 2, direction: 0 }, cellSize)).toBeCloseTo(27.647260880);
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 2, direction: 90 }, cellSize)).toBeCloseTo(7.0274244);
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 2, direction: -90 }, cellSize)).toBeCloseTo(7.0274244);
    expect(getFireSpreadRate(sourceCell, targetCell, { speed: 2, direction: 180 }, cellSize)).toBeCloseTo(3.86127);
  });
});

describe("getDirectionFactor", () => {
  it("takes into account direction of the max fire spread", () => {
    // Max factor should be 1 when max fire spread is aligned with center of the cells.
    // Note that max fire spread angle is an angle from positive X axis.
    expect(getDirectionFactor(sourceCell, targetCell, 100, -Math.PI / 2)).toBeCloseTo(1);
    expect(getDirectionFactor(sourceCell, targetCell, 100, 0)).toBeCloseTo(0.37);
    expect(getDirectionFactor(sourceCell, targetCell, 100, Math.PI)).toBeCloseTo(0.37);
    expect(getDirectionFactor(sourceCell, targetCell, 100, Math.PI / 2)).toBeCloseTo(0.23);
  });
});
