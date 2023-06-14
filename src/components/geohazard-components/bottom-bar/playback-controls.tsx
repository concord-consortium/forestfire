import React from "react";
import { BottomBarWidgetGroup } from "./bottom-bar-container";
import Button from "@mui/material/Button";
import ReloadIcon from "../assets/reload.svg";
import RestartIcon from "../assets/restart.svg";
import PauseIcon from "../assets/pause.svg";
import StartIcon from "../assets/start.svg";
import css from "./playback-controls.scss";

interface IProps {
  onReload?: () => void;
  onRestart?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  playing?: boolean;
  startStopDisabled?: boolean;
}

export const PlaybackControls: React.FC<IProps> = ({ onReload, onRestart, onStart, onStop, playing, startStopDisabled }) => {
  const handleStartPause = () => {
    if (playing) {
      onStop?.();
    } else {
      onStart?.();
    }
  };

  return (
    <>
      {
        (onReload || onRestart) &&
        <BottomBarWidgetGroup>
          {
            onReload &&
            <Button
              className={css.playbackButton}
              data-testid="reload-button"
              onClick={onReload}
            >
              <span><ReloadIcon /> Reload</span>
            </Button>
          }
          {
            onRestart &&
            <Button
              className={css.playbackButton}
              data-testid="restart-button"
              onClick={onRestart}
            >
              <span><RestartIcon /> Restart</span>
            </Button>
          }
        </BottomBarWidgetGroup>
      }
      {
        (onStart && onStop) &&
        <BottomBarWidgetGroup className={css.startStop}>
          <Button
            onClick={handleStartPause}
            disabled={startStopDisabled}
            className={css.playbackButton}
            data-testid="start-stop-button"
          >
            {playing ? <span><PauseIcon /> Stop</span> : <span><StartIcon /> Start</span>}
          </Button>
        </BottomBarWidgetGroup>
      }
    </>
  );
};
