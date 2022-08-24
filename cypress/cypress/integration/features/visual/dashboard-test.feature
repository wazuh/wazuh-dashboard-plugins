 Feature: Take a screenshoot from Inital Dashboard page

  As a Wazuh user
  i want to set a new filter from the agent page
  in order to manage them
  Background:
    Given The wazuh admin user is logged

  Scenario:Taking screenshoot for compare
    When The user is in the overview page
    Then The user can see default module list
    When The user navigates to About settings
    Then The user can see the wazuh information