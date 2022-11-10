Feature: Check that the added filter is removed after click on the removed button - Events

  As a Wazuh user
  I want to remove a selected filter
  in order to manage them
  Background:
    Given The wazuh admin user is logged
    And The user navigates to the agent page
    And The user navigates to the agent dashboard

  @filter
  Scenario Outline: The user remove a filter from Agent - <Module Name> - Dashboard
    When The user navigates to agentModule <Module Name>
    And The user moves to events page
    And The user adds a new filter
    And The user checks filter label is added
    And The user removes the applied filter
    Then The user checks filter label is not added
    Examples:
      | Module Name          |
      | Security Events      |
      | Integrity Monitoring |
      | System Auditing      |
      | Mitre & Attack       |
      | NIST                 |
      | TSC                  |
      | Policy Monitoring    |
      | PCIDSS               |
