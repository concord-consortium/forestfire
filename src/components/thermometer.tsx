import React from "react";
import ThermometerSVG from "../assets/average-temp-meter-normal.svg";
import { DroughtLevel, extremeDroughtConditions } from "../types";

import css from "./thermometer.scss";

const MAX_STEM_HEIGHT = 18;
const MIN_STEM_HEIGHT = 4;

interface IProps {
  droughtLevel: number;
}

export const Thermometer = ({ droughtLevel }: IProps) => {
  const droughtLevelRelative = droughtLevel / DroughtLevel.SevereDrought;
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
