export class SimulationInfo {

  getSimulationInfo() {
    return cy.get("[class^='simulation-info--simulationInfo--']");
  }
  verifySimulationInfoTitle() {
    this.getSimulationInfo().find("[class^='simulation-info--title--']").should("have.text", "Current Conditions");
  }
  getVegetationInfo() {
    return this.getSimulationInfo().find("[class^='simulation-info--container--__forestfire-v1__ simulation-info--vegetationStats--']");
  }
  verifyVegetationInfo() {
    this.getVegetationInfo().find("[class^='simulation-info--header--']").should("have.text", "Vegetation (%)");
    this.getVegetationInfo().find("[class^='simulation-info--stat--']")
    .should("contain", "100% Coniferous")
    .should("contain", "0% Deciduous")
    .should("contain", "0% Deciduous")
    .should("contain", "0% Shrub")
    .should("contain", "0% Grass");
  }
  getWindInfo() {
    return this.getSimulationInfo().find("[class^='simulation-info--container--__forestfire-v1__ simulation-info--wind--']");
  }
  verifyWindInfo() {
    this.getWindInfo()
    .should("contain", "Wind")
    .should("contain", "0 MPH from N");
  }
  verifyWindInfoDisabled() {
    this.getWindInfo().invoke("attr", "class").should("contain", "inactive");
  }
  verifyWindInfoEnabled() {
    this.getWindInfo().invoke("attr", "class").should("not.contain", "inactive");
  }
  getAverageTemp() {
    return this.getSimulationInfo().find("[class^='simulation-info--container--__forestfire-v1__']").eq(1);
  }
  verifyAverageTempInfo() {
    this.getAverageTemp()
    .should("contain", "Average Temp.")
    .should("contain", "Normal");
    this.getAverageTemp().find(".thermometer--temperatureStem--__forestfire-v1__").invoke("attr", "style").should("contain", "height: 4px;");
  }
  verifyAverageTempEnabled() {
    this.getAverageTemp().invoke("attr", "class").should("not.contain", "inactive");
  }
  getFireDanger() {
    return this.getSimulationInfo().find("[class^='simulation-info--container--__forestfire-v1__']").eq(2);
  }
  verifyFireDangerInfo() {
    this.getFireDanger()
    .should("contain", "Fire Danger")
    .should("contain", "1: Low");
  }
  verifyFireDangerDisabled() {
    this.getFireDanger().invoke("attr", "class").should("contain", "inactive");
  }
  verifyFireDangerEnabled() {
    this.getFireDanger().invoke("attr", "class").should("not.contain", "inactive");
  }
  getGraphs() {
    return cy.get("[class^='right-panel--rightPanelTabs--__forestfire-v1__']");
  }
  verifyGraphsTitle() {
    this.getGraphs().should("contain", "Graphs");
  }
  clickGraphs() {
    cy.get("[class^='right-panel--rightPanelTab--__forestfire-v1__']").click({ force: true });
  }
  verifyGraphPanelOpen() {
    cy.get("[class^='right-panel--rightPanel--__forestfire-v1__']").invoke("attr", "class").should("contain", "open");
  }
  verifyGraphPanelClose() {
    cy.get("[class^='right-panel--rightPanel--__forestfire-v1__']").invoke("attr", "class").should("not.contain", "open");
  }
  clickGraphControlButton() {
    cy.get("[class^='right-panel--graphControls--__forestfire-v1__'] button").click({ force: true });
  }
  verifyGraphControlButton(button) {
    cy.get("[class^='right-panel--graphControls--__forestfire-v1__'] button").should("contain", button);
  }
}

