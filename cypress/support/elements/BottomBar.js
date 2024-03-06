export class BottomBar {

  getTerrainSetupButton() {
    return cy.get('[data-testid="terrain-button"]');
  }
  getSparkButton() {
    return cy.get('[data-testid="spark-button"]');
  }
  getReloadButton() {
    return cy.get('[data-testid="reload-button"]');
  }
  getRestartButton() {
    return cy.get('[data-testid="restart-button"]');
  }
  getStartButton() {
    return cy.get('[data-testid="start-stop-button"]');
  }
  getFireEventButton() {
    return cy.get('[data-testid="fire-event-button"]');
  }
  getSparkCount() {
    return cy.get("[class^='bottom-bar--sparksCount--']");
  }
  getMapType() {
    return cy.get("[class^='bottom-bar-container'] .hoverable");
  }
  VerifyMapTypeTitle() {
    this.getMapType().find("[class^='bottom-bar-container--title--']").contains("Map Type");
  }
  changeMapType() {
    return this.getMapType().find("button").eq(0);
  }
  getMapTypeLabel() {
    return this.getMapType().find("[class^='map-type-switch--label--']");
  }
  getFireScale() {
    return cy.get(".bottom-bar-container--widgetGroup--__forestfire-v1__").eq(4);
  }
  getFireScaleTitle() {
    return this.getFireScale().find("[class^='bottom-bar-container--title--']");
  }
  verifyFireIntensityScaleBarContainer() {
    this.getFireScale().find("[class^='fire-intensity-scale--bar1--']").invoke("attr", "style").should("contain", "rgb(255, 231, 117)");
    this.getFireScale().find("[class^='fire-intensity-scale--bar2--']").invoke("attr", "style").should("contain", "rgb(255, 96, 96)");
  }
  verifyFireIntensityScaleLabels() {
    return this.getFireScale().find("[class^='fire-intensity-scale--labels--']")
    .should("contain", "Low")
    .should("contain", "High");
  }
  verifyVegetationMapDisplayed() {
    cy.get("[data-name='Map Type Vegetation']").should("exist");
  }
  verifyFireHistoryMapDisplayed() {
    cy.get("[data-name='Map Type Burn History']").should("exist");
  }
  verifyFireHistoryScaleBarContainer() {
    this.getFireScale().find("[class^='fire-intensity-scale--bar--']").invoke("attr", "style")
      .should("contain", "linear-gradient(to right, rgb(255, 255, 255) 0%, rgb(255, 0, 240) 100%)");
  }
  verifyFireHistoryScaleLabels() {
    return this.getFireScale().find("[class^='fire-intensity-scale--labels--']")
    .should("contain", "Few")
    .should("contain", "Many");
  }
  getClimateChangeToggle() {
    return cy.get("[class^='bottom-bar-container--widgetGroup--__forestfire-v1__']").last();
  }
  verifyClimateChangeToggleTitle() {
    this.getClimateChangeToggle().find("[class^='bottom-bar-container--title--']").should("contain", "Climate Change");
  }
  verifyClimateChangeStatus(status) {
    this.getClimateChangeToggle().find('label').should("contain", status);
  }
  switchToggle() {
    this.getClimateChangeToggle().find("[class^='slider-switch--sliderSwitch--__forestfire-v1__']").click({ force: true });
  }
  verifyClimateChangeToggleDisabled() {
    this.getClimateChangeToggle().find("[class^='slider-switch--sliderSwitch--__forestfire-v1__']").invoke("attr", "class").should("contain", "disabled");
  }
  verifyClimateChangeToggleEnabled() {
    this.getClimateChangeToggle().find("[class^='slider-switch--sliderSwitch--__forestfire-v1__']").invoke("attr", "class").should("not.contain", "disabled");
  }
}

