import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend, ChartOptions } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Bar } from "react-chartjs-2";
import { Vegetation, yearInMinutes } from "../types";
import { renderToString } from "react-dom/server";
import FireEventSpark from "../assets/bottom-bar/Fire Event.svg";
import { Y_AXIS_WIDTH, tooltipTitle } from "./graph-common";

import cssExports from "./common.scss";

const SPARK_HEIGHT = 31;
const FireEventSparkString = renderToString(<FireEventSpark height={SPARK_HEIGHT} />);
const FireEventImage = new Image();
FireEventImage.src = `data:image/svg+xml;base64,${btoa(FireEventSparkString)}`;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend, annotationPlugin);

export const defaultOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0,
  },
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: "Vegetation vs. Time",
      fullSize: false, // center over chart area only
      padding: {
        bottom: SPARK_HEIGHT
      },
      font: {
        size: 15,
        weight: "bold"
      }
    },
    tooltip: {
      callbacks: {
        title: tooltipTitle
      }
    },
    annotation: {
      clip: false,
      annotations: {

      }
    }
  },
  // @ts-expect-error - barPercentage is not in the types, but it's a valid option.
  categoryPercentage: 1, // no additional spacing between bar categories
  barPercentage: 0.85,
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 7,
      },
      grid: {
        display: false
      },
      border: {
        color: cssExports.controlGray,
      },
      stacked: true
    },
    y: {
      stacked: true,
      min: 0,
      max: 100,
      ticks: {
        stepSize: 20,
      },
      grid: {
        display: false
      },
      border: {
        color: cssExports.controlGray,
      },
      title: {
        display: true,
        text: "Vegetation (%)"
      },
      afterFit(scaleInstance) {
        // Enforce fixed with so both total carbon and vegetation graphs have the same Y axis width.
        scaleInstance.width = Y_AXIS_WIDTH;
      }
    }
  }
};

const datasetOptions = {
  fill: true,
  pointRadius: 0,
  borderWidth: 0,
};

const getFireEventAnnotations = (idx: number, xPos: number) => ({
  [`image${idx}`]: {
    type: "label",
    content: FireEventImage,
    xValue: xPos,
    yValue: 100,
    height: SPARK_HEIGHT,
    yAdjust: -0.5 * SPARK_HEIGHT - 2,
  },
  [`label${idx}`]: {
    type: "label",
    // drawTime: "afterDraw",
    content: `${idx + 1}`,
    xValue: xPos,
    yValue: 100,
    yAdjust: -0.5 * SPARK_HEIGHT + 4,
    font: {
      size: 14,
      color: "#000",
      weight: "bold",
      // family: cssExports.robotoFontFamily,
    }
  },
  [`line${idx}`]: {
    type: "line",
    xMin: xPos,
    xMax: xPos,
    yMin: 0,
    yMax: 100,
    borderColor: "#b2b2b2",
    borderDash: [5, 5],
    borderWidth: 1.5,
  }
});

export interface IProps {
  allData: boolean;
  recentDataEndPoint: number;
  recentDataLength: number;
}

export const VegetationGraph: React.FC<IProps> = observer(({ allData, recentDataEndPoint, recentDataLength }) => {
  const { simulation } = useStores();
  const [, setFontsReady] = useState<number>(0); // used to force re-render graph after fonts are ready.

  // Wait for fonts to be loaded and re-render the graph.
  useEffect(() => {
    (document as any).fonts.ready.then(() => {
      setFontsReady(oldVal => oldVal + 1);
    });
  }, []);

  const datasetsByVegetation: Record<Vegetation | "burned", any> = {
    [Vegetation.Grass]: {
      data: [],
      label: "Grass",
      backgroundColor: cssExports.grass,
      ...datasetOptions,
    },
    [Vegetation.Shrub]: {
      data: [],
      label: "Shrub",
      backgroundColor: cssExports.shrub,
      ...datasetOptions,
    },
    [Vegetation.DeciduousForest]: {
      data: [],
      label: "Deciduous",
      backgroundColor: cssExports.deciduous,
      ...datasetOptions,
    },
    [Vegetation.ConiferousForest]: {
      data: [],
      label: "Coniferous",
      backgroundColor: cssExports.coniferous,
      ...datasetOptions,
    },
    burned: {
      data: [],
      label: "Burned",
      backgroundColor: cssExports.burned,
      ...datasetOptions,
    },
  };

  const dataKeys = Object.keys(datasetsByVegetation) as (Vegetation | "burned")[];
  const labels: number[] = [];

  const statsData = simulation.yearlyVegetationStatistics;

  const startPoint = allData ? 0 : Math.max(0, recentDataEndPoint - recentDataLength);
  const range = allData ? simulation.config.simulationEndYear : (startPoint + recentDataLength);
  for (let i = startPoint; i < range; i++) {
    const stats = statsData[i] || {};

    labels.push(i);

    dataKeys.forEach(dataKey => {
      datasetsByVegetation[dataKey].data.push(stats[dataKey] ? stats[dataKey] * 100 : undefined);
    });
  }

  const data = {
    labels,
    datasets: [
      datasetsByVegetation[Vegetation.Grass],
      datasetsByVegetation[Vegetation.Shrub],
      datasetsByVegetation[Vegetation.DeciduousForest],
      datasetsByVegetation[Vegetation.ConiferousForest],
      datasetsByVegetation.burned,
    ]
  };

  const barPercentage = simulation.config.graphBarPercentage;
  const wideAllData = simulation.config.graphWideAllData;
  const options = {
    ...defaultOptions,
    // When all data graph is squeezed in the narrow right panel, set bar percentage to 1 to avoid aliasing artifacts.
    barPercentage: allData ? (wideAllData ? barPercentage : 1) : barPercentage
  };

  (options.plugins as any).annotation.annotations = {};
  simulation.fireEvents.forEach((fireEvent, idx) => {
    const xPos = Math.floor(fireEvent.time / yearInMinutes) - startPoint;
    if (xPos < 0) {
      return;
    }
    const newAnnotations = getFireEventAnnotations(idx, xPos);
    Object.assign((options.plugins as any).annotation.annotations, newAnnotations);
  });

  return (
    <div style={{ height: "210px", width: "100%", marginBottom: "6px" }}>
      <Bar options={options} data={data} />
    </div>
  );
});
