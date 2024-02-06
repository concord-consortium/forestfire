import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";
import FireEventSpark from "../../assets/bottom-bar/Fire Event.svg";
import { dayInMinutes } from "../../types";

import css from "./fire-events.scss";

export const FireEvents: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const endTime = simulation.simulationEndTime;
  // Convert time from minutes to days.
  const fireEventTimeInDays = Math.floor(simulation.fireEventDisplayTime / dayInMinutes);
  const fireEventTimeHours = Math.floor((simulation.fireEventDisplayTime % dayInMinutes) / 60);

  return (
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
              {i + 1}
            </div>
          </div>
        ))
      }
    </div>
  );
});
