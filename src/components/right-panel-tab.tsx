import * as React from "react";
import css from "./right-panel-tab.scss";

export const RightPanelTab = () => (
  <div className={css.tab} data-testid="right-panel-tab">
    <div className={css.tabBack}>
      <div className={css.tabImage} />
      <div className={css.tabContent}>Graph</div>
    </div>
  </div>
);
