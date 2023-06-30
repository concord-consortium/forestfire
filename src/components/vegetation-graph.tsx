import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend, defaults } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Vegetation } from "../types";

import cssExports from "./common.scss";

defaults.font.family = cssExports.robotoFontFamily;
defaults.color = cssExports.controlGray;
defaults.font.size = 14;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend);

export const defaultOptions = {
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
      font: {
        size: 15,
        weight: "bold"
      }
    },
  },
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
      stacked: true,
      title: {
        display: true,
        text: "Time (years)"
      }
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
      }
    }
  }
};

const datasetOptions = {
  fill: true,
  pointRadius: 0,
  borderWidth: 0,
};

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

  return (
    <div style={{height: "210px", width: "100%" }}>
      <Bar options={options} data={data} />
    </div>
  );
});
