import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { WindDial, degToCompass } from "./wind-dial";
import css from "./simulation-info.scss";

export const SimulationInfo = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const scaledWind = simulation.wind.speed / simulation.config.windScaleFactor;

  return (
    <div className={css.simulationInfo}>
      <div className={css.title}>Current Conditions</div>

      <div className={`${css.windContainer} ${simulation.windDidChange ? css.windDidChange : ""}`}>
        <div className={css.header}>Wind</div>
        <div className={css.windText}>
            {`${Math.round(scaledWind)} MPH from ${degToCompass(simulation.wind.direction)}`}
        </div>
        <div className={css.windDial}>
          <WindDial windDirection={simulation.wind.direction} />
        </div>
      </div>
    </div>
  );
});
