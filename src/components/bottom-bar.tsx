import { inject, observer } from "mobx-react";
import React from "react";
import { BaseComponent, IBaseProps } from "./base";
import { droughtLabels, terrainLabels, vegetationLabels } from "../types";
import CCLogo from "../assets/cc-logo.svg";
import CCLogoSmall from "../assets/cc-logo-small.svg";
import screenfull from "screenfull";
import Button from "@mui/material/Button";
import SparkIcon from "../assets/bottom-bar/spark.svg";
import SparkHighlight from "../assets/bottom-bar/spark_highlight.svg";
import PauseIcon from "../assets/bottom-bar/pause.svg";
import StartIcon from "../assets/bottom-bar/start.svg";
import ReloadIcon from "../assets/bottom-bar/reload.svg";
import RestartIcon from "../assets/bottom-bar/restart.svg";
import { Interaction } from "../models/ui";
import { FireIntensityScale } from "./fire-intensity-scale";
import { IconButton } from "./icon-button";
import { log } from "@concord-consortium/lara-interactive-api";

import css from "./bottom-bar.scss";

interface IProps extends IBaseProps {}
interface IState {
  fullscreen: boolean;
}

const toggleFullscreen = () => {
  if (!screenfull?.isEnabled) {
    return;
  }
  if (!screenfull.isFullscreen) {
    screenfull.request();
    log("FullscreenEnabled");
  } else {
    screenfull.exit();
    log("FullscreenDisabled");
  }
};

@inject("stores")
@observer
export class BottomBar extends BaseComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      fullscreen: false
    };
  }

  get fullscreenIconStyle() {
    return css.fullscreenIcon + (this.state.fullscreen ? ` ${css.fullscreen}` : "");
  }

  get sparkBtnDisabled() {
    const { simulation, ui } = this.stores;
    return ui.interaction === Interaction.PlaceSpark || !simulation.canAddSpark || simulation.simulationStarted;
  }

  public componentDidMount() {
    if (screenfull?.isEnabled) {
      document.addEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange);
    }
  }

  public componentWillUnmount() {
    if (screenfull?.isEnabled) {
      document.removeEventListener(screenfull.raw.fullscreenchange, this.fullscreenChange);
    }
  }

  public render() {
    const { simulation } = this.stores;
    return (
      <div className={css.bottomBar}>
        <div className={css.leftContainer}>
          <CCLogo className={css.logo} />
          <CCLogoSmall className={css.logoSmall} />
        </div>
        <div className={css.mainContainer}>
          <div className={`${css.widgetGroup} ${css.placeSpark}`}>
            <div className={css.sparksCount}>{ simulation.remainingSparks }</div>
            <IconButton
              icon={<SparkIcon />}
              highlightIcon={<SparkHighlight />}
              disabled={this.sparkBtnDisabled}
              buttonText="Spark"
              dataTest="spark-button"
              onClick={this.placeSpark}
            />
          </div>
          <div className={`${css.widgetGroup} ${css.reloadRestart}`}>
            <Button
              className={css.playbackButton}
              data-testid="reload-button"
              onClick={this.handleReload}
              disableRipple={true}
            >
              <span><ReloadIcon/> Reload</span>
            </Button>
            <Button
              className={css.playbackButton}
              data-testid="restart-button"
              onClick={this.handleRestart}
              disableRipple={true}
            >
              <span><RestartIcon/> Restart</span>
            </Button>
          </div>
          <div className={`${css.widgetGroup} ${css.startStop}`}>
            <Button
              onClick={this.handleStart}
              disabled={!simulation.ready}
              className={css.playbackButton}
              data-testid="start-button"
              disableRipple={true}
            >
              { simulation.simulationRunning ? <span><PauseIcon/> Stop</span> : <span><StartIcon /> Start</span> }
            </Button>
          </div>
          {
            simulation.config.showBurnIndex &&
            <div className={css.widgetGroup}>
              <div className={css.label}>Fire Intensity Scale</div>
              <FireIntensityScale />
            </div>
          }
        </div>
        {/* This empty container is necessary so the spacing works correctly */}
        <div className={css.rightContainer}>
          {
            screenfull?.isEnabled &&
            <div className={this.fullscreenIconStyle} onClick={toggleFullscreen} title="Toggle Fullscreen" />
          }
        </div>
      </div>
    );
  }

  public fullscreenChange = () => {
    this.setState({ fullscreen: screenfull.isEnabled && screenfull.isFullscreen });
  };

  public handleStart = () => {
    const { simulation } = this.stores;
    if (simulation.simulationRunning) {
      simulation.stop();
      log("SimulationStopped");
    } else {
      simulation.start();
      log("SimulationStarted", {
        sparks: simulation.sparks.map (s => ({
          x: s.x / simulation.config.modelWidth,
          y: s.y / simulation.config.modelHeight,
          elevation: simulation.cellAt(s.x, s.y).elevation
        })),
        zones: simulation.zones.map(z => ({
          vegetation: vegetationLabels[z.vegetation],
          terrainType: terrainLabels[z.terrainType],
          droughtLevel: droughtLabels[z.droughtLevel]
        }))
      });
    }
  };

  public handleRestart = () => {
    this.stores.simulation.restart();
    log("SimulationRestarted");
  };

  public handleReload = () => {
    this.stores.simulation.reload();
    log("SimulationReloaded");
  };

  public placeSpark = () => {
    const { ui } = this.stores;
    ui.interaction = Interaction.PlaceSpark;
    log("SparkButtonClicked");
  };
}
