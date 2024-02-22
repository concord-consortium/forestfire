import React from "react";
import { observer } from "mobx-react";
import { clsx } from "clsx";
import { useStores } from "../use-stores";
import { WindDial, degToCompass } from "./wind-dial";
import { Vegetation } from "../types";
import { Thermometer } from "./thermometer";
import { FireDanger } from "./fire-danger";

import css from "./simulation-info.scss";

export const SimulationInfo = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const scaledWind = simulation.wind.speed / simulation.config.windScaleFactor;
  const stats = simulation.vegetationStatistics;
  const fireEventActive = simulation.isFireEventActive;

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
        simulation.config.climateChange &&
        <div className={css.container} >
          <div className={css.header}>Average Temp.</div>
          <Thermometer climateChangeEnabled={simulation.climateChangeEnabled} droughtLevel={simulation.droughtLevel} />
        </div>
      }

      <div className={clsx(css.container, { [css.inactive]: !fireEventActive})} >
        <div className={css.header}>Fire Danger</div>
        <FireDanger droughtLevel={simulation.droughtLevel} scaledWindSpeed={scaledWind} />
      </div>

      <div className={clsx(css.container, css.wind, { [css.windDidChange] : simulation.windDidChange, [css.inactive]: !fireEventActive })} >
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
