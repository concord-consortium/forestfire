import React from "react";
import Button from "@mui/material/Button";
import { observer } from "mobx-react";
import { useStores } from "../use-stores";
import MapTypeFireHistory from "../assets/bottom-bar/Map Type Fire History.svg";
import MapTypeVegetation from "../assets/bottom-bar/Map Type Vegetation.svg";
import ScrollIcon from "../assets/bottom-bar/Scroll.svg";

import css from "./map-type-switch.scss";

export const MapTypeSwitch: React.FC = observer(function WrappedComponent() {
  const { ui } = useStores();

  const handleClick = () => {
    ui.setShowFireHistoryOverlay(!ui.showFireHistoryOverlay);
  };

  return (
    <div className={css.mapTypeSwitch}>
      <div className={css.topRow}>
        <Button onClick={handleClick}><ScrollIcon height={24} /></Button>
        { ui.showFireHistoryOverlay ? <MapTypeFireHistory height={22} /> : <MapTypeVegetation height={22} /> }
        <Button onClick={handleClick}><ScrollIcon height={24} style={{transform: "rotate(180deg)"}} /></Button>
      </div>
      <div className={css.label}>{ ui.showFireHistoryOverlay ? "Fire History" : "Vegetation" }</div>
    </div>
  );
});
