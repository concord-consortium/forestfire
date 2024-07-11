
import { SimulationInfo } from "../support/elements/SimulationInfo";
import { BottomBar } from "../support/elements/BottomBar";
import { TimeLine } from "../support/elements/TimeLine";

context("Test the overall app", () => {
  const simulationInfo = new SimulationInfo();
  const bottomBar = new BottomBar();
  const timeLine = new TimeLine();

  beforeEach(() => {
    cy.visit("");
  });

  describe("Desktop functionalities", () => {
    it("renders the canvas", () => {
      cy.get(".app--app--__forestfire-v1__ canvas").should("be.visible");
    });
    it("renders the current conditions", () => {
      simulationInfo.getSimulationInfo().should("exist");
      simulationInfo.verifySimulationInfoTitle();
      simulationInfo.verifyVegetationInfo();
      simulationInfo.verifyWindInfo();
      simulationInfo.verifyWindInfoDisabled();
      simulationInfo.verifyAverageTempInfo();
      simulationInfo.verifyAverageTempEnabled();
      simulationInfo.verifyFireDangerInfo();
      simulationInfo.verifyFireDangerDisabled();
    });
    it("verify fire danger and wind conditions", () => {
      simulationInfo.verifyWindInfoDisabled();
      simulationInfo.verifyFireDangerDisabled();
      bottomBar.getFireEventButton().click({ force: true });
      cy.wait(1000);
      simulationInfo.verifyWindInfoEnabled();
      simulationInfo.verifyFireDangerEnabled();
      bottomBar.getFireEventButton().click({ force: true });
      cy.wait(1000);
      simulationInfo.verifyWindInfoDisabled();
      simulationInfo.verifyFireDangerDisabled();
    });
    it("verify climate change toggle", () => {
      bottomBar.getClimateChangeToggle().should("exist");
      bottomBar.verifyClimateChangeToggleTitle();
      bottomBar.verifyClimateChangeToggleEnabled();
      bottomBar.verifyClimateChangeStatus("ON");
      bottomBar.switchToggle();
      bottomBar.verifyClimateChangeStatus("OFF");
      bottomBar.getStartButton().click({ force: true });
      cy.wait(1000);
      bottomBar.verifyClimateChangeToggleDisabled();
      bottomBar.getReloadButton().click({ force: true });
      cy.wait(1000);
      bottomBar.verifyClimateChangeToggleEnabled();
    });
    it("verify timeline scrubber", () => {
      timeLine.getTimeLineScrubber().should("exist");
      bottomBar.getStartButton().click({ force: true });
      cy.wait(8000); // Added wait to run the simulation for few seconds
      bottomBar.getStartButton().click({ force: true });
      timeLine.moveTimeLineScrubber(0);
      timeLine.verifyTimeLineTrackWidth("0%");
      timeLine.moveTimeLineScrubber(1);
      timeLine.verifyTimeLineTrackWidth("6.25%");
    });
    it("verify graphs", () => {
      simulationInfo.verifyGraphsTitle();
      simulationInfo.clickGraphs();
      simulationInfo.verifyGraphPanelOpen();
      simulationInfo.verifyGraphControlButton("Show All Data");
      simulationInfo.clickGraphControlButton();
      simulationInfo.verifyGraphControlButton("Show Recent Data");
      simulationInfo.clickGraphs();
      simulationInfo.verifyGraphPanelClose();
    });
  });
});
