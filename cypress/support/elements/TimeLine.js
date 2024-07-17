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
  getTimeLineScrubber() {
    return cy.get("[class^='MuiSlider-thumb timeline--sliderThumb--']");
  }
  moveTimeLineScrubber(index) {
    cy.get("[class^='MuiSlider-markLabel']").eq(index).click();
  }
  verifyTimeLineTrackWidth(width) {
    cy.get("[class^='MuiSlider-track timeline--track--']").invoke("attr", "style").should("contain", width);
  }
}
