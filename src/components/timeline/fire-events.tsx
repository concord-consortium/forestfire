import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";
import FireEventSpark from "../../assets/bottom-bar/Fire Event.svg";
import { dayInMinutes, weekInMinutes } from "../../types";

import css from "./fire-events.scss";

export const FireEvents: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const endTime = simulation.simulationEndTime;
  // Convert time from minutes to days and weeks.
  let fireEventTimeInWeeks = Math.floor(simulation.fireEventDisplayTime / weekInMinutes);
  let fireEventTimeInDays = Math.ceil((simulation.fireEventDisplayTime % weekInMinutes) / dayInMinutes);
  // Note that days are 1-indexed (using Math.ceil), as duration of 0 days is not intuitive without hours display.
  // Also, we don't want to show 7 days, but 1 week.
  if (fireEventTimeInDays === 7) {
    fireEventTimeInWeeks += 1;
    fireEventTimeInDays = 0;
  }

  return (
    <div className={css.fireEvents}>
      {
        simulation.fireEvents.map((event, i) => (
          <div key={i} className={css.fireEvent} style={{ left: `${(event.time / endTime) * 100}%` }}>
            {
              simulation.isFireActive && i === simulation.fireEvents.length - 1 &&
              <div className={css.fireEventTime}>
                {
                  fireEventTimeInWeeks > 0 &&
                  `${fireEventTimeInWeeks} ${fireEventTimeInWeeks === 1 ? "week " : "weeks "}`
                }
                { fireEventTimeInWeeks > 0 && fireEventTimeInDays > 0 && "and " }
                {
                  fireEventTimeInDays > 0 &&
                  `${fireEventTimeInDays} ${fireEventTimeInDays === 1 ? "day" : "days"}`
                }
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
