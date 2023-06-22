import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";
import FireEventSpark from "../../assets/bottom-bar/Fire Event.svg";
import { dayInMinutes } from "../../types";

import css from "./timeline.scss";

const TICK_COUNT = 16;

export const Timeline: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();

  const tickDiff = simulation.config.simulationEndYear / TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => i * tickDiff);
  const timeProgress = `${(simulation.timeInYears / simulation.config.simulationEndYear) * 100}%`;
  const endTime = simulation.simulationEndTime;

  // Convert time from minutes to days.
  const fireEventTimeInDays = Math.floor(simulation.fireEventTime / dayInMinutes);
  const fireEventTimeHours = Math.floor((simulation.fireEventTime % dayInMinutes) / 60);

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
        <div className={css.fireEvents}>
          {
            simulation.fireEvents.map((event, i) => (
              <div key={i} className={css.fireEvent} style={{ left: `${(event.time / endTime) * 100}%` }}>
                {
                  simulation.isFireActive && i === simulation.fireEvents.length - 1 &&
                  <div className={css.fireEventTime}>
                    {fireEventTimeInDays} {fireEventTimeInDays === 1 ? "day " : "days "}
                    and {fireEventTimeHours} {fireEventTimeHours === 1 ? "hour" : "hours"}
                  </div>
                }
                <FireEventSpark />
                <div className={css.fireEventIdx}>
                  { i + 1 }
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
});
