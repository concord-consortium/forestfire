import { observer } from "mobx-react";
import React from "react";
import { VegetationGraph } from "./vegetation-graph";
import { useStores } from "../use-stores";
import { log } from "@concord-consortium/lara-interactive-api";

import css from "./right-panel.scss";

export const RightPanel = observer(() => {
  const { ui } = useStores();

  const handleToggleDrawer = (e: React.SyntheticEvent) => {
    ui.toggleChart();

    if (ui.showChart) {
      log("ChartTabShown");
    } else {
      log("ChartTabHidden");
    }
  };

  return (
    <div className={`${css.rightPanel} ${ui.showChart ? css.open : ""}`} data-testid="right-panel">
      <div className={css.rightPanelContent}>
        <VegetationGraph allData={false} />
      </div>
      <div className={css.rightPanelTabs}>
        <div className={css.rightPanelTab} onClick={handleToggleDrawer}>
            <div className={css.tabContent}>Graphs</div>
        </div>
      </div>
    </div>
  );
});
