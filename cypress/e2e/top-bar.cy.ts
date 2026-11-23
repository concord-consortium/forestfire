// jsdom applies no stylesheet, so these layout checks run in Cypress.

describe("Top bar and dialog layout", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  ["about", "share"].forEach((testid) => {
    it(`shows the ${testid} dialog's copyright line at 12px`, () => {
      cy.get(`[data-testid="${testid}"]`).click();
      cy.get('[role="dialog"]')
        .contains("p", /^© \d{4} The Concord Consortium, Inc\.$/)
        .should("have.css", "font-size", "12px");
    });
  });

  it("lays its buttons out left to right in Tab order", () => {
    // jQuery returns the matches in DOM order, which is the order Tab visits them.
    cy.get('[data-testid="reload"], [data-testid="share"], [data-testid="about"]').should("have.length", 3).then(($buttons) => {
      const lefts = $buttons.toArray().map((button) => button.getBoundingClientRect().left);
      expect(lefts, "left edges in DOM order").to.deep.eq(lefts.slice().sort((a, b) => a - b));
    });
  });
});
