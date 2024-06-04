/// <reference types="cypress" />

Cypress.Commands.add('navigateToUrl', (url) => {
    cy.visit(url);
})


Cypress.Commands.add('enterText', (selector, text) => {
    cy.get(selector)
        .should('be.visible')
        .clear()
        .type(text)
})

Cypress.Commands.add('clickButton', (selector, text) => {
    cy.get(selector)
        .should('be.visible')
        .and('not.be.disabled')
        .click()
})

