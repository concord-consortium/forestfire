import React from "react";
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

import css from "./bottom-bar.scss";

export const BottomBar: React.FC = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();

  const handleReload = () => {
    simulation.reload();
    log("SimulationReloaded");
  };

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

  const sparkBtnDisabled = ui.interaction === Interaction.PlaceSpark || !simulation.canAddSpark || simulation.simulationStarted;

  return (
    <BottomBarContainer>
      <BottomBarWidgetGroup>
        <div className={css.sparksCount}>{simulation.remainingSparks}</div>
        <IconButton
          icon={<SparkIcon />}
          highlightIcon={<SparkHighlight />}
          disabled={sparkBtnDisabled}
          buttonText="Spark"
          dataTest="spark-button"
          onClick={placeSpark}
        />
      </BottomBarWidgetGroup>
      <PlaybackControls
        onReload={handleReload}
        onRestart={handleRestart}
        onStart={handleStart}
        onStop={handleStop}
        playing={simulation.simulationRunning}
        startStopDisabled={!simulation.ready}
      />
      <BottomBarWidgetGroup title="Fire Intensity Scale">
        <FireIntensityScale />
      </BottomBarWidgetGroup>
    </BottomBarContainer>
  );
});
