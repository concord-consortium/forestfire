import React from "react";
import FireDangerMeterSVG from "../assets/Fire Danger Meter.svg";
import FireDangerMeterArrowSVG from "../assets/Fire Danger Meter Arrow.svg";
import { extremeDroughtConditions } from "../types";

import css from "./fire-danger.scss";

const FIRE_DANGER_LABEL: Record<number, string> = {
  0: "Low",
  1: "Moderate",
  2: "High",
  3: "Very High",
  4: "Extreme",
};

interface IProps {
  droughtLevel: number;
  scaledWindSpeed: number;
}

export const FireDanger = ({ droughtLevel, scaledWindSpeed }: IProps) => {
  let fireDanger = 0;
  const wind = Math.round(scaledWindSpeed);
  // Values based on https://www.pivotaltracker.com/story/show/187047434.
  if (wind <= 15) {
    fireDanger = 0;
  } else if (wind <= 20) {
    fireDanger = 1;
  } else if (wind <= 25) {
    fireDanger = 2;
  } else { // if (wind <= 30)
    fireDanger = 3;
  }
  // Extreme drought conditions increase fire danger.
  if (droughtLevel >= extremeDroughtConditions) {
    fireDanger += 1;
  }

  const relativeFireDanger = fireDanger / 4;
  // Note that angle range is from -75 to 75 deg, as per the design.
  const arrowAngle = -75 + 150 * relativeFireDanger;

  return (
    <div className={css.fireDangerContainer}>
      <div className={css.label}>
        { fireDanger + 1 }: { FIRE_DANGER_LABEL[fireDanger] }
      </div>
      <div className={css.fireDanger}>
        <FireDangerMeterSVG width="99px" height="54px" />
        <div className={css.arrow} style={{ transform: `rotate(${arrowAngle}deg)` }}>
          <FireDangerMeterArrowSVG width="99px" height="99px" />
        </div>
      </div>
    </div>
  );
};
