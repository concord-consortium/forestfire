
import { BottomBar } from "../support/elements/BottomBar";

context("Forest Fire Smoke Test", () => {
  const bottomBar = new BottomBar();

  beforeEach(() => {
    cy.visit("/");
  });

  describe("Bottom bar", () => {
    it("adds sparks to graph and runs model", () => {
      bottomBar.getSparkButton().click({ force: true });
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(500, 700, { force: true });
      bottomBar.getSparkButton().click({ force: true });
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(800, 600, { force: true });
      bottomBar.getStartButton().should("contain", "Start");

      bottomBar.getStartButton().click({ force: true });
      cy.wait(3000);
      bottomBar.getStartButton().should("contain", "Pause");
    });

    it("restarts mode", () => {
      bottomBar.getRestartButton().click({ force: true });
      bottomBar.getStartButton().should("contain", "Start");
    });
  });
});
