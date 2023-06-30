import { observer } from "mobx-react";
import React, { useState } from "react";
import { Button } from "@mui/material";
import { clsx } from "clsx";
import { VegetationGraph } from "./vegetation-graph";
import { useStores } from "../use-stores";
import { log } from "@concord-consortium/lara-interactive-api";

import css from "./right-panel.scss";


export const RightPanel = observer(() => {
  const { ui, simulation } = useStores();
  const [allData, setAllData] = useState(false);

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

  return (
    <div className={clsx(css.rightPanel, {[css.open]: ui.showChart, [css.wide]: simulation.config.graphWideAllData && allData })}>
      <div className={css.rightPanelContent}>
        <VegetationGraph allData={allData} />
        <div className={css.graphControls}>
          <Button className={css.allDataBtn} onClick={handleShowAllData}>{allData ? "Show Recent Data": "Show All Data"}</Button>
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
