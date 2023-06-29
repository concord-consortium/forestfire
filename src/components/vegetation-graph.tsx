import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend, defaults } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Vegetation } from "../types";

import cssExports from "./common.scss";

defaults.font.family = cssExports.robotoFontFamily;
defaults.color = cssExports.controlGray;
defaults.font.size = 14;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend);

export const defaultOptions = {
  responsive: true,
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
  categoryPercentage: 1, // no spacing between bars
  barPercentage: 0.9,
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 6,
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
      }
    }
  }
};

const datasetOptions = {
  fill: true,
  pointRadius: 0,
  borderWidth: 0,
};

const RECENT_YEARS = 26;
const GRAPH_HEIGHT = 210;

export interface IProps {
  allData?: boolean;
}

export const VegetationGraph: React.FC<IProps> = observer(({ allData }) => {
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

  const range = allData ? simulation.config.simulationEndYear : RECENT_YEARS;
  for (let i = Math.max(0, statsData.length - range); i < Math.max(statsData.length, range); i++) {
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

  const options = {
    ...defaultOptions,
    barPercentage: allData ? 1 : 0.9, // remove spacing between bars when displaying all data
  };

  return (
    <>
      <Line options={options} data={data} height={GRAPH_HEIGHT} />
      <Bar options={options} data={data} height={GRAPH_HEIGHT} />
    </>
  );
});
