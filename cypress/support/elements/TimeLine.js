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
}

