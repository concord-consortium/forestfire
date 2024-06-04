import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";
import { VegetationStats } from "./vegetation-stats";
import { FireEvents } from "./fire-events";
import { Slider } from "@mui/material";

import css from "./timeline.scss";

const TICK_COUNT = 16;
const LOADING_DELAY = 100; // ms

export const Timeline: React.FC = observer(function WrappedComponent() {
  const { simulation, snapshotsManager } = useStores();
  const timeoutId = useRef(0);
  const [val, setVal] = useState(simulation.timeInYears);
  const [disabled, setDisabled] = useState(true);
  const [timeProgress, setTimeProgress] = useState("0%");

  const tickDiff = simulation.config.simulationEndYear / TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => i * tickDiff);
  const marks = ticks.map((tick) => ({ value: tick, label: tick }));
  useEffect(() => {
    setDisabled(!simulation.simulationStarted || (simulation.simulationRunning && !simulation.simulationEnded));
  }, [simulation.simulationStarted, simulation.simulationRunning, simulation.simulationEnded]);

  useLayoutEffect(() => {
    if (simulation.simulationRunning && snapshotsManager.maxYear > val) {
      snapshotsManager.restoreLastSnapshot();
      simulation.start(); //when we restoreLastSnapshot, we need to start the simulation again
    }
  },[simulation, simulation.simulationRunning, snapshotsManager, val]);

  useLayoutEffect(() => {
    if (simulation.simulationRunning) {
      if (snapshotsManager.maxYear > val) {
        setVal(snapshotsManager.maxYear);
        simulation.setTimeInYears(snapshotsManager.maxYear);
        setTimeProgress(`${snapshotsManager.maxYear / simulation.config.simulationEndYear * 100}%`);
      }
    } else if (!simulation.simulationStarted) {
      setTimeProgress("0%");
      setVal(0);
      simulation.setTimeInYears(0);
    } else {
      setVal(simulation.timeInYears);
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [simulation.simulationStarted, simulation.simulationRunning, snapshotsManager.maxYear, simulation.timeInYears]);

  const handleSliderChange = (e: Event, value: number) => {
    value = Math.min(snapshotsManager.maxYear, value);
    setVal(value);
    window.clearTimeout(timeoutId.current);
    timeoutId.current = window.setTimeout(() => {
      snapshotsManager.restoreSnapshot(value);
    }, LOADING_DELAY);
  };

  const handleTimeChangeCommitted = (event: Event, value: number) => {
    value = Math.min(snapshotsManager.maxYear, value);
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
              onChangeCommitted={handleTimeChangeCommitted}
            />
            <div className={css.timeProgressTrack} style={{ width: timeProgress }} />
          </div>
        </div>
        <FireEvents />
      </div>
    </div>
  );
});
