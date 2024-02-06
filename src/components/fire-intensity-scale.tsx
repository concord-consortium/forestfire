
import React from "react";
import { clsx } from "clsx";
import { BURN_INDEX_HIGH, BURN_INDEX_LOW, FIRE_HISTORY_BACKGROUND, FIRE_HISTORY_OVERLAY } from "./view-3d/terrain";
import css from "./fire-intensity-scale.scss";

const colorArrayToRGBA = (colorArray: number[]) =>
  `rgba(${colorArray.map((v, idx) => idx < 4 ? Math.round(v * 255) : v).join(",")})`;

export const FireIntensityScale = () => (
  <div className={clsx(css.scaleContainer, css.fireIntensity)}>
    <div className={css.barsContainer}>
      <div className={css.bar1} style={{backgroundColor: colorArrayToRGBA(BURN_INDEX_LOW) }} />
      <div className={css.bar2} style={{backgroundColor: colorArrayToRGBA(BURN_INDEX_HIGH) }} />
    </div>
    <div className={css.labels}>
      <div>Low</div>
      <div>High</div>
    </div>
  </div>
);

export const FireHistoryScale = () => (
  <div className={clsx(css.scaleContainer, css.fireHistory)}>
    <div className={css.barsContainer}>
      <div
        className={css.bar}
        style={{background: `linear-gradient(to right, ${colorArrayToRGBA(FIRE_HISTORY_BACKGROUND)} 0%, ${colorArrayToRGBA(FIRE_HISTORY_OVERLAY)} 100%)` }}
      />
    </div>
    <div className={css.labels}>
      <div>Few</div>
      <div>Many</div>
    </div>
  </div>
);
