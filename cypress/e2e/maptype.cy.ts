
import { BottomBar } from "../support/elements/BottomBar";

context("Forest Fire Map Type Test", () => {
  const bottomBar = new BottomBar();

  beforeEach(() => {
    cy.visit("/");
  });

  describe("Map Type", () => {
    it("verify vegetation maptype", () => {
      bottomBar.VerifyMapTypeTitle();
      bottomBar.getMapTypeLabel().should("contain", "Vegetation");
      bottomBar.verifyVegetationMapDisplayed();
      bottomBar.getFireScaleTitle().should("contain", "Fire Intensity Scale");
      bottomBar.verifyFireIntensityScaleBarContainer();
      bottomBar.verifyFireIntensityScaleLabels();
    });
    it("verify fire history maptype", () => {
      bottomBar.changeMapType().click();
      bottomBar.VerifyMapTypeTitle();
      bottomBar.getMapTypeLabel().should("contain", "Fire History");
      bottomBar.verifyFireHistoryMapDisplayed();
      bottomBar.getFireScaleTitle().should("contain", "Fire History Scale");
      bottomBar.verifyFireHistoryScaleBarContainer();
      bottomBar.verifyFireHistoryScaleLabels();
    });
  });
});
