import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import { Button, Slider } from "@mui/material";
import { clsx } from "clsx";
import { VegetationGraph } from "./vegetation-graph";
import { TotalCarbonGraph } from "./total-carbon-graph";
import { useStores } from "../use-stores";
import { log } from "@concord-consortium/lara-interactive-api";

import css from "./right-panel.scss";

const RECENT_DATA_RANGE = 51;

export const RightPanel = observer(() => {
  const { ui, simulation } = useStores();
  const [allData, setAllData] = useState(false);
  const [graphEndPoint, setGraphEndPoint] = useState(0);

  const handleToggleDrawer = (e: React.SyntheticEvent) => {
    ui.toggleChart();

    if (ui.showChart) {
      log("ChartTabShown");
    } else {
      log("ChartTabHidden");
    }
  };

  const handleShowAllData = () => {
    if (!allData) {
      log("AllDataShown");
    } else {
      log("AllDataHidden");
    }

    setAllData(!allData);
  };

  const handleSliderChange = (e: Event, value: number | number[]) => {
    setGraphEndPoint(value as number);
  };

  useEffect(() => {
    // Reset graph offset when simulation is running and new data point is added.
    setGraphEndPoint(simulation.yearlyVegetationStatistics.length);
  }, [simulation.yearlyVegetationStatistics.length]);

  const showRangeSlider = !allData && simulation.yearlyVegetationStatistics.length > RECENT_DATA_RANGE;

  return (
    <div className={clsx(css.rightPanel, { [css.open]: ui.showChart, [css.wide]: simulation.config.graphWideAllData && allData })}>
      <div className={css.rightPanelContent}>
        <VegetationGraph allData={allData} recentDataEndPoint={graphEndPoint} recentDataLength={RECENT_DATA_RANGE} />
        <TotalCarbonGraph allData={allData} recentDataEndPoint={graphEndPoint} recentDataLength={RECENT_DATA_RANGE} />
        <div className={css.graphControls}>
          <div className={css.sliderContainer}>
            {
              showRangeSlider &&
              <div className={css.slider}>
                <Slider
                  classes={{
                    track: css.track,
                    rail: css.rail,
                    thumb: css.sliderThumb,
                  }}
                  size="small"
                  step={1}
                  min={RECENT_DATA_RANGE}
                  max={simulation.yearlyVegetationStatistics.length}
                  value={graphEndPoint}
                  onChange={handleSliderChange}
                />
              </div>
            }
          </div>
          <Button className={css.allDataBtn} onClick={handleShowAllData}>{allData ? "Show Recent Data" : "Show All Data"}</Button>
        </div>
      </div>
      <div className={css.rightPanelTabs}>
        <div className={css.rightPanelTab} onClick={handleToggleDrawer}>
          <div className={css.tabContent}>Graphs</div>
        </div>
      </div>
    </div>
  );
});
