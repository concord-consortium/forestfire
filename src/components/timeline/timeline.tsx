import React, { useLayoutEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useStores } from "../../use-stores";
import { VegetationStats } from "./vegetation-stats";
import { FireEvents } from "./fire-events";
import { Slider } from "@mui/material";
import { yearInMinutes } from "../../types";

import css from "./timeline.scss";

const TICK_COUNT = 16;
const LOADING_DELAY = 50; // ms

export const Timeline: React.FC = observer(function WrappedComponent() {
  const { simulation, snapshotsManager } = useStores();
  const timeoutId = useRef(0);
  const [val, setVal] = useState(simulation.timeInYears);

  const tickDiff = simulation.config.simulationEndYear / TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => i * tickDiff);
  const marks = ticks.map((tick) => ({ value: tick, label: tick }));

  const timeProgress = `${snapshotsManager.maxYear / simulation.config.simulationEndYear * 100}%`;

  // disable the slider when the simulation is running, or when a fire event is active. It'd be possible to support
  // scrubbing the timeline while a fire event is active, but it would require some additional logic to handle the
  // state of the Fire Engine (FireEngine .snapshot and .restoreSnapshot methods would need to be implemented).
  const disabled = !simulation.simulationStarted
    || (simulation.simulationRunning && !simulation.simulationEnded)
    || simulation.isFireEventActive;

  useLayoutEffect(() => {
    // Update handle when simulation is updated.
    setVal(simulation.timeInYears);
  }, [simulation.timeInYears, simulation]);

  const handleSliderChange = (e: Event, value: number) => {
    if (simulation.simulationRunning) {
      return;
    }
    value = Math.min(snapshotsManager.maxYear, value);
    const closestSnapshot = snapshotsManager.findClosestSnapshot(value);
    if (!closestSnapshot) {
      return;
    }
    setVal(closestSnapshot.simulationSnapshot.time / yearInMinutes); // update the scrubber position
    window.clearTimeout(timeoutId.current);
    timeoutId.current = window.setTimeout(() => {
      snapshotsManager.restoreSnapshot(closestSnapshot);
    }, LOADING_DELAY);
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
                thumb: disabled ? css.sliderThumbDisabled : css.sliderThumb,
              }}
              size="medium"
              step={0.01}
              min={0}
              max={simulation.config.simulationEndYear}
              value={val}
              marks={marks}
              disabled={disabled}
              onChange={handleSliderChange}
            />
            <div className={css.timeProgressTrack} style={{ width: timeProgress }} />
          </div>
        </div>
        <FireEvents />
      </div>
    </div>
  );
});
