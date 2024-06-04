import { Given, When, Then, And } from "cypress-cucumber-preprocessor/steps";
import LoginPage from "../pages/LoginPage";

const loginPage = new LoginPage();

Given('I am on the Swag Labs login page', () => {
    loginPage.navigateToLoginPage();
});

When('I enter the username {string}', (username) => {
    loginPage.enterUsername(username);
});

When('I enter the username for {string}', (user) => {
    const person = cy.fixture(`users/${user}.json`)
    person.then((username) => {
        loginPage.enterUsername(username);
    })
});

When('I enter the password for {string}', (user) => {
    const person = cy.fixture(`users/${user}.json`)
    person.then((password) => {
        loginPage.enterPassword(password);
    })
});

When('I leave the username field empty', () => {
    loginPage.enterUsername('');
});

And('I enter the password {string}', (password) => {
    loginPage.enterPassword(password);
});

And('I click the login button', () => {
    loginPage.clickLoginButton()
});

Then('I should be redirected to the products page', () => {
    cy.url().should('include', '/inventory');
});

Then('I should see an error message {string}', (errorMessage) => {
    loginPage.getErrorText().should('contain', errorMessage)
  cy.get('[data-test="error-message"]').should('contain', errorMessage);
});
