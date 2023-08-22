
import { SimulationInfo } from "../support/elements/SimulationInfo";

context("Test the overall app", () => {
  const simulationInfo = new SimulationInfo();

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
    });
  });
});
