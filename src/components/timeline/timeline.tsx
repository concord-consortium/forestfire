import React, { useEffect, useLayoutEffect, useState } from "react";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";
import { VegetationStats } from "./vegetation-stats";
import { FireEvents } from "./fire-events";

import css from "./timeline.scss";
import { Slider } from "@mui/material";

const TICK_COUNT = 16;

export const Timeline: React.FC = observer(function WrappedComponent() {
  const { simulation } = useStores();
  const [val, setVal] = useState(simulation.timeInYears);
  const [disabled, setDisabled] = useState(true);

  const tickDiff = simulation.config.simulationEndYear / TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => i * tickDiff);
  const progressPercentage = simulation.timeInYears / simulation.config.simulationEndYear;
  const timeProgress = `${progressPercentage * 100}%`;
  const marks = ticks.map((tick) => ({ value: tick, label: tick }));
  useEffect(() => {
    setDisabled(!simulation.simulationStarted || (simulation.simulationRunning && !simulation.simulationEnded));
  }, [simulation.simulationStarted, simulation.simulationRunning, simulation.simulationEnded]);

  useLayoutEffect(() => {
    setVal(simulation.timeInYears);
  }, [simulation.timeInYears]);

  const handleSliderChange = (e: Event, value: number) => {
    setVal(value);
  };

  return (
    <div className={css.timelineContainer}>
      <div className={css.labels}>
        <div className={css.labelBold}>Vegetation (%)</div>
        <div className={css.labelCondensed}>Time (years)</div>
        <div className={css.labelBold}>Fire Events</div>
      </div>
      <div className={css.graphs}>
        <VegetationStats />
        <div className={css.sliderContainer}>
          <div className={css.slider}>
            <div className={css.progressBar} style={{ width: timeProgress }} />
            <Slider
              classes={{
                track: css.track,
                rail: css.rail,
                mark: css.mark,
                markLabel: css.markLabel,
                thumb: css.sliderThumb,
              }}
              size="medium"
              step={1}
              min={0}
              max={simulation.config.simulationEndYear}
              value={val}
              marks={marks}
              disabled={disabled}
              onChange={handleSliderChange}
            />
          </div>
        </div>
        <FireEvents />
      </div>
    </div>
  );
});
