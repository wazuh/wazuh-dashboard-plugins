Feature: Wazuh version information

  As a wazuh user
  I want to check the about information
  in order to see information about the system

  @about @actions
  Scenario: Check Wazuh version information
    Given The wazuh admin user is logged
    When The user navigates to About settings
    Then The Wazuh information is displayed
