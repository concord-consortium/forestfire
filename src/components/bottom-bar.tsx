import React from "react";
import { clsx } from "clsx";
import { BottomBarContainer, BottomBarWidgetGroup } from "./geohazard-components/bottom-bar/bottom-bar-container";
import { PlaybackControls } from "./geohazard-components/bottom-bar/playback-controls";
import { IconButton } from "./geohazard-components/bottom-bar/icon-button";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import { Interaction } from "../models/ui";
import { FireIntensityScale } from "./fire-intensity-scale";
import { log } from "@concord-consortium/lara-interactive-api";
import SparkIcon from "../assets/bottom-bar/spark.svg";
import SparkHighlight from "../assets/bottom-bar/spark_highlight.svg";
import FireEvent from "../assets/bottom-bar/Fire Event Map.svg";
import FireEventHighlight from "../assets/bottom-bar/Fire Event Map Highlight.svg";
import FireEventSpark from "../assets/bottom-bar/Fire Event.svg";
import FireEventAdd from "../assets/bottom-bar/Fire Event Add.svg";

import css from "./bottom-bar.scss";

export const BottomBar: React.FC = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();

  // Temporarily unnecessary, as reload and restart would result in the same state. Reload can become useful
  // when there is some input state that needs to be zeroed out.
  // const handleReload = () => {
  //   simulation.reload();
  //   log("SimulationReloaded");
  // };

  const handleRestart = () => {
    simulation.restart();
    log("SimulationRestarted");
  };

  const handleStart = () => {
    simulation.start();
    log("SimulationStarted");
  };

  const handleStop = () => {
    simulation.stop();
    log("SimulationStopped");
  };

  const placeSpark = () => {
    ui.interaction = Interaction.PlaceSpark;
    log("SparkButtonClicked");
  };

  const toggleFireEvent = () => {
    if (!simulation.isFireEventActive) {
      simulation.addFireEvent();
      log("FireEventActivated");
    } else if (simulation.isFireEventSetupActive) {
      simulation.cancelFireEventSetup();
      log("FireEventCancelled");
    }
  };

  const sparkBtnDisabled = !simulation.isFireEventActive || !simulation.canAddSpark || ui.interaction === Interaction.PlaceSpark;
  const startButtonDisabled =
    !simulation.ready ||
    // User cannot start the sim until he adds at least one spark during the fire event setup.
    (simulation.isFireEventSetupActive && simulation.sparks.length === 0) ||
    simulation.simulationEnded;

  const FireEventIcon = () => (
    <div className={css.fireEventIcon}>
      <div className={css.svgContainer}><FireEvent height={46} /></div>
      <div className={clsx(css.svgContainer, css.fireEventSymbol)}><FireEventSpark height={31} /></div>
      { !simulation.isFireEventActive && <div className={clsx(css.svgContainer, css.fireEventSymbol)}><FireEventAdd height={31} /></div> }
    </div>
  );

  return (
    <BottomBarContainer>
      <BottomBarWidgetGroup className={css.fireEvent}>
        <IconButton
          className={css.fireEventButton}
          icon={<FireEventIcon />}
          highlightIcon={<FireEventHighlight height={46} />}
          buttonText="Fire Event"
          dataTest="fire-event-button"
          onClick={toggleFireEvent}
          selected={simulation.isFireEventActive}
          disabled={simulation.isFireActive} // user cannot cancel active fire
        />
        <div className={clsx(css.sparksCount, {[css.disabled]: sparkBtnDisabled})}>{simulation.remainingSparks}</div>
        <IconButton
          className={clsx({[css.grayscale]: !simulation.canAddSpark})}
          icon={<SparkIcon height={48} />}
          highlightIcon={<SparkHighlight height={48} />}
          disabled={sparkBtnDisabled}
          buttonText="Spark"
          dataTest="spark-button"
          onClick={placeSpark}
        />
      </BottomBarWidgetGroup>
      <PlaybackControls
        // onReload={handleReload}
        onRestart={handleRestart}
        onStart={handleStart}
        onStop={handleStop}
        playing={simulation.simulationRunning}
        startStopDisabled={startButtonDisabled}
        reloadDisabled={!simulation.simulationStarted}
        resetDisabled={!simulation.simulationStarted}
      />
      {
        simulation.config.showBurnIndex &&
        <BottomBarWidgetGroup title="Fire Intensity Scale">
          <FireIntensityScale />
        </BottomBarWidgetGroup>
      }
    </BottomBarContainer>
  );
});
