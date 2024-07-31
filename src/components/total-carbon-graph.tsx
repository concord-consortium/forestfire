import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend, ChartOptions } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import { yearInMinutes } from "../types";
import { Y_AXIS_WIDTH, tooltipTitle } from "./graph-common";

import cssExports from "./common.scss";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend, annotationPlugin);

export const defaultOptions: ChartOptions<"line"> = {
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
      text: "Total Stored Carbon vs. Time",
      color: cssExports.controlText,
      fullSize: false, // center over chart area only
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
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 7,
        color: cssExports.controlText
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
        text: "Time (years)",
        color: cssExports.controlText
      }
    },
    y: {
      stacked: true,
      min: 0,
      max: 10,
      ticks: {
        stepSize: 1,
        color: cssExports.controlText
      },
      grid: {
        display: false
      },
      border: {
        color: cssExports.controlGray,
      },
      title: {
        display: true,
        text: "Total Stored Carbon (kg/m²)",
        color: cssExports.controlText
      },
      afterFit(scaleInstance) {
        // Enforce fixed with so both total carbon and vegetation graphs have the same Y axis width.
        scaleInstance.width = Y_AXIS_WIDTH;
      }
    }
  }
};

const datasetOptions = {
  label: "Total Carbon",
  fill: false,
  borderColor: "#004eff",
  borderWidth: 2.5,
  pointRadius: 0,
  pointHitRadius: 10,
  tension: 0.2
};

const getFireEventAnnotations = (idx: number, xPos: number) => ({
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

export const TotalCarbonGraph: React.FC<IProps> = observer(({ allData, recentDataEndPoint, recentDataLength }) => {
  const { simulation } = useStores();
  const [, setFontsReady] = useState<number>(0); // used to force re-render graph after fonts are ready.

  // Wait for fonts to be loaded and re-render the graph.
  useEffect(() => {
    (document as any).fonts.ready.then(() => {
      setFontsReady(oldVal => oldVal + 1);
    });
  }, []);

  const dataset: any = {
    data: [],
    ...datasetOptions,
  };

  const labels: number[] = [];

  const startPoint = allData ? 0 : Math.max(0, recentDataEndPoint - recentDataLength);
  const range = allData ? simulation.config.simulationEndYear : (startPoint + recentDataLength);
  for (let i = startPoint; i < range; i++) {
    dataset.data.push(simulation.yearlyTotalCarbon[i] || undefined);
    labels.push(i);
  }

  const data = {
    labels,
    datasets: [dataset]
  };

  const options = {
    ...defaultOptions
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
    <div style={{ height: "210px", width: "100%" }}>
      <Line options={options} data={data} />
    </div>
  );
});
