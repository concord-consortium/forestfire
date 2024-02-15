import React from "react";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { WindDial, degToCompass } from "./wind-dial";
import { DroughtLevel, Vegetation } from "../types";
import { clsx } from "clsx";

import css from "./simulation-info.scss";

const avgTempLabels = ["Low", "Normal", "High", "Very High", "Extreme"];

export const SimulationInfo = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const showTempInfo = simulation.initialDroughtLevel !== simulation.finalDroughtLevel;
  const scaledWind = simulation.wind.speed / simulation.config.windScaleFactor;
  const avgTemp = (simulation.droughtLevel / DroughtLevel.SevereDrought) * avgTempLabels.length;
  const avgTempLabel = avgTempLabels[Math.min(avgTempLabels.length - 1, Math.floor(avgTemp))];
  const stats = simulation.vegetationStatistics;

  const getStat = (vegetation: Vegetation | "burned") => `${Math.round(stats[vegetation] * 100)}%`;

  return (
    <div className={css.simulationInfo}>
      <div className={css.title}>Current Conditions</div>

      <div className={clsx(css.container, css.vegetationStats)}>
        <div className={css.header}>Vegetation (%)</div>
        <div className={css.stat}><div className={clsx(css.box, css.coniferous)}>{ getStat(Vegetation.ConiferousForest) }</div> Coniferous</div>
        <div className={css.stat}><div className={clsx(css.box, css.deciduous)}>{ getStat(Vegetation.DeciduousForest) }</div> Deciduous</div>
        <div className={css.stat}><div className={clsx(css.box, css.shrub)}>{ getStat(Vegetation.Shrub) }</div> Shrub</div>
        <div className={css.stat}><div className={clsx(css.box, css.grass)}>{ getStat(Vegetation.Grass) }</div> Grass</div>
        <div className={css.stat}><div className={clsx(css.box, css.burned)}>{ getStat("burned") }</div> Burned</div>
      </div>

      {
        showTempInfo &&
        <div className={css.container} >
          <div className={css.header}>Average Temp.</div>
          <div className={css.text}>
            {`${avgTemp.toFixed(2)}: ${avgTempLabel}`}
          </div>
        </div>
      }

      <div className={clsx(css.container, css.wind, { [css.windDidChange] : simulation.windDidChange })} >
        <div className={css.header}>Wind</div>
        <div className={css.text}>
            {`${Math.round(scaledWind)} MPH from ${degToCompass(simulation.wind.direction)}`}
        </div>
        <div className={css.windDial}>
          <WindDial windDirection={simulation.wind.direction} />
        </div>
      </div>
    </div>
  );
});
