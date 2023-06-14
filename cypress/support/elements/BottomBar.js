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
    return cy.get('[data-testid="start-button"]');
  }
}

