export class TimeLine {

  getTimeLineContainer() {
    return cy.get("[class^='timeline--timelineContainer--']");
  }
  verifyTimeLineLabels() {
    this.getTimeLineContainer().find("[class^='timeline--labels--']")
    .should("contain", "Vegetation (%)")
    .should("contain", "Time (years)")
    .should("contain", "Fire Events");
  }
  getFireEventIndex() {
    return cy.get("[class^='fire-events--fireEventIdx--']");
  }
  getProgressBar() {
    return this.getTimeLineContainer().find("[class^='vegetation-stats--bar--']", { timeout: 90000 }).last().invoke("attr", "style").should("contain", "width: 0.458333%; left: 99.5833%;");
  }
}

