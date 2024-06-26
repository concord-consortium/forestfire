
import { BottomBar } from "../support/elements/BottomBar";
import { TimeLine } from "../support/elements/TimeLine";

context("Forest Fire Fire Event And Spark Test", () => {
  const bottomBar = new BottomBar();
  const timeLine = new TimeLine();

  beforeEach(() => {
    cy.visit("/");
  });

  describe("Fire Event", () => {
    it("adds fire event and runs model", () => {
      bottomBar.getFireEventButton().should("exist");
      bottomBar.getFireEventButton().invoke("attr", "disabled").should("not.exist");
      bottomBar.getSparkButton().invoke("attr", "disabled").should("exist");
      bottomBar.getStartButton().click({ force: true });
      cy.wait(3000);
      bottomBar.getFireEventButton().click({ force: true });
      bottomBar.getSparkButton().invoke("attr", "disabled").should("not.exist");
      bottomBar.getStartButton().invoke("attr", "disabled").should("exist");
      timeLine.getFireEventIndex().should("exist");
      timeLine.getFireEventIndex().eq(0).should("have.text", "1");
    });
    it("adds multiple sparks at once", () => {
      bottomBar.getSparkButton().invoke("attr", "disabled").should("exist");
      bottomBar.getSparkCount().should("have.text", "10");
      bottomBar.getStartButton().click({ force: true });
      cy.wait(3000);
      bottomBar.getFireEventButton().click({ force: true });
      bottomBar.getSparkButton().invoke("attr", "disabled").should("not.exist");
      bottomBar.getSparkButton().click({ force: true });
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(500, 400, { force: true });
      bottomBar.getSparkCount().should("have.text", "9");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(550, 450, { force: true });
      bottomBar.getSparkCount().should("have.text", "8");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(600, 500, { force: true });
      bottomBar.getSparkCount().should("have.text", "7");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(650, 550, { force: true });
      bottomBar.getSparkCount().should("have.text", "6");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(700, 200, { force: true });
      bottomBar.getSparkCount().should("have.text", "5");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(800, 300, { force: true });
      bottomBar.getSparkCount().should("have.text", "4");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(850, 450, { force: true });
      bottomBar.getSparkCount().should("have.text", "3");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(900, 400, { force: true });
      bottomBar.getSparkCount().should("have.text", "2");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(950, 550, { force: true });
      bottomBar.getSparkCount().should("have.text", "1");
      cy.get(".app--mainContent--__forestfire-v1__ canvas").click(1000, 400, { force: true });
      bottomBar.getSparkCount().should("have.text", "0");
      bottomBar.getSparkButton().invoke("attr", "disabled").should("exist");
    });
  });
});
