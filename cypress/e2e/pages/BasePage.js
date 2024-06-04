// cypress/pages/BasePage.js

class BasePage {
  
  constructor() {}

    // Method to navigate to a specific URL
    navigate(url) {
      cy.navigateToUrl(url)
    }
  
    // Method to enter text into any input field
    enterText(selector, text) {
      cy.enterText(selector, text)
    }
  
    // Method to click any button
    clickButton(selector) {
      cy.clickButton(selector)
    }
  
    // Method to get the text of an element
    getText(selector) {
      return cy.get(selector).invoke('text')
    }
  
    // Method to verify that an element contains specific text
    shouldContainText(selector, text) {
      cy.get(selector).should('contain.text', text)
    }
  }
  
  module.exports = BasePage
  