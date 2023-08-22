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
}

