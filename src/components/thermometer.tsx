import React from "react";
import ThermometerSVG from "../assets/average-temp-meter-normal.svg";
import { DroughtLevel, extremeDroughtConditions } from "../types";

import css from "./thermometer.scss";

const MAX_STEM_HEIGHT = 18;
const MIN_STEM_HEIGHT = 4;

interface IProps {
  droughtLevel: number;
  climateChangeEnabled: boolean;
}

export const Thermometer = ({ droughtLevel, climateChangeEnabled }: IProps) => {
  // When climate change toggle is disabled by user, always show the thermometer at normal level. It might not be accurate,
  // as the default drought level is 1 in such case, but that way we can avoid jump of the thermometer stem when user toggles
  // the climate change.
  const droughtLevelRelative = climateChangeEnabled ? droughtLevel / DroughtLevel.SevereDrought : 0;
  const stemHeight = MIN_STEM_HEIGHT + (MAX_STEM_HEIGHT - MIN_STEM_HEIGHT) * droughtLevelRelative;
  let label = "High";
  if (droughtLevelRelative < 0.4) {
    label = "Normal";
  } else if (droughtLevelRelative >= extremeDroughtConditions / DroughtLevel.SevereDrought) {
    label = "Extreme";
  }
  return (
    <div className={css.thermometerContainer}>
      <div className={css.thermometer}>
        <ThermometerSVG />
        <div className={css.temperatureStem} style={{height: stemHeight}} />
      </div>
      <div className={css.label}>
        { label }
      </div>
    </div>
  );
};
