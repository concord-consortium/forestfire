import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";
import { Vegetation } from "../../types";

import css from "./vegetation-stats.scss";

export const VegetationStats: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const endYear = simulation.config.simulationEndYear;

  // why * 1.1? The bar is 10% wider than it should be, so they slightly overlap and there's no visual artifact.
  // Otherwise, depending on the zoom level or browser window size, some small gaps may appear between the bars.
  const statsBarWidth = `${(100 / endYear) * 1.1}%`;
  const vegetationStats = simulation.yearlyVegetationStatistics;
  return (
    <div className={css.vegetation}>
      {
        vegetationStats.map((stats, i) => (
          // Left position theoretically is not necessary, but it ensures that the cumulative error of bar positioning
          // won't appear. Otherwise, the last bar might not line up with the end of the timeline.
          <div key={i} className={css.bar} style={{ width: statsBarWidth, left: `${100 * i / endYear}%` }}>
            <div className={css.burned} style={{ height: `${stats.burned * 100}%` }} />
            <div className={css.coniferous} style={{ height: `${stats[Vegetation.ConiferousForest] * 100}%` }} />
            <div className={css.deciduous} style={{ height: `${stats[Vegetation.DeciduousForest] * 100}%` }} />
            <div className={css.shrub} style={{ height: `${stats[Vegetation.Shrub] * 100}%` }} />
            <div className={css.grass} style={{ height: `${stats[Vegetation.Grass] * 100}%` }} />
          </div>
        ))
      }
    </div>
  );
});
