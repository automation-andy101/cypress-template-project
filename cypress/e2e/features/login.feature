Feature: User Login

  As a user
  I want to login to the Swag Labs website
  So that I can access my account and perform actions

  Background:
    Given I am on the Swag Labs login page

  Scenario: Successful login with valid credentials
    When I enter the username "standard_user"
    And I enter the password "secret_sauce"
    And I click the login button
    Then I should be redirected to the products page

  Scenario: Successful login with valid credentials - using test fixtures
    When I enter the username for "standardUser"
    And I enter the password for "standardUser"
    And I click the login button
    Then I should be redirected to the products page

  Scenario: Login with invalid credentials
    When I enter the username "invalid_user"
    And I enter the password "invalid_password"
    And I click the login button
    Then I should see an error message "Epic sadface: Username and password do not match any user in this service"

  Scenario: Login with empty username
    When I leave the username field empty
    And I enter the password "secret_sauce"
    And I click the login button
    Then I should see an error message "Epic sadface: Username and password do not match any user in this service"

