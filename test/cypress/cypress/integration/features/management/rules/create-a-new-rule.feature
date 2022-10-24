Feature: Should Displayes a message to restart the cluster after saves

  As a wazuh user
  i want to edit a custom rule
  in order to check if the saves message its displayed

@rules @actions
Scenario: Validate creation message is displayed after creating a new rule
    Given The wazuh admin user is logged
    When The user navigates to rules
    And The user clicks the new rules button
    And The user writes a new rule
    And The user saves the rule
    Then The save message its displayed