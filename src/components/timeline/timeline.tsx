import React from "react";
import { clsx } from "clsx";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";

import css from "./timeline.scss";


const TICK_COUNT = 16;

export const Timeline: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();

  const tickDiff = simulation.config.simulationEndYear / TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => i * tickDiff);
  const timeProgress = `${(simulation.timeInYears / simulation.config.simulationEndYear) * 100}%`;

  return (
    <div className={css.timelineContainer}>
      <div className={css.labels}>
        <div className={css.labelBold}>Vegetation (%)</div>
        <div className={css.labelCondensed}>Time (years)</div>
        <div className={css.labelBold}>Fire Events</div>
      </div>
      <div className={css.graphs}>
        <div className={css.vegetation} />
        <div className={css.time}>
          <div className={css.axis} />
          <div className={css.progressBar} style={{ width: timeProgress }} />
          {
            ticks.map((tick, i) => (
              <div key={i} className={css.tickContainer} style={{ left: `${i * (100 / TICK_COUNT)}%` }}>
                <div className={css.tickSymbol} />
                <div className={css.tickLabel}>{ tick }</div>
              </div>
            ))
          }
        </div>
        <div className={css.fireEvents} />
      </div>
    </div>
  );
});
