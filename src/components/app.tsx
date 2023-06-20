import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { View3d } from "./view-3d/view-3d";
import { SimulationInfo } from "./simulation-info";
import { RightPanel } from "./right-panel";
import { BottomBar } from "./bottom-bar";
import { Timeline } from "./timeline/timeline";
import { useStores } from "../use-stores";
import { TopBar } from "./geohazard-components/top-bar/top-bar";
import { AboutDialogContent } from "./about-dialog-content";
import { ShareDialogContent } from "./share-dialog-content";
import { useCustomCursor } from "./use-custom-cursors";
import Shutterbug from "shutterbug";

import css from "./app.scss";

export const AppComponent = observer(function WrappedComponent() {
  const { simulation, ui } = useStores();

  useEffect(() => {
    Shutterbug.enable("." + css.app);
    return () => {
      Shutterbug.disable();
    };
  }, []);

  // This will setup document cursor based on various states of UI store (interactions).
  useCustomCursor();

  const config = simulation.config;
  const showModelScale = config.showModelDimensions;
  return (
    <div className={css.app}>
      <TopBar projectName="Forest Fire Explorer" aboutContent={<AboutDialogContent />} shareContent={<ShareDialogContent />} />
      { showModelScale &&
        <div className={css.modelInfo}>
          <div>Model Dimensions: { config.modelWidth } ft x { config.modelHeight } ft</div>
          <div>Highest Point Possible: {config.heightmapMaxElevation} ft</div>
        </div>
      }
      <div className={`${css.mainContent} ${ui.showChart && css.shrink}`}>
        <SimulationInfo />
        <View3d />
      </div>
      <div className={css.timeline}>
        <Timeline />
      </div>
      <div className={`${css.rightContent} ${ui.showChart && css.grow}`}>
        <RightPanel />
      </div>
      <div className={css.bottomBar}>
        <BottomBar />
      </div>
    </div>
  );
});
