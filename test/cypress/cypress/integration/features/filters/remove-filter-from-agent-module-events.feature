Feature: Validate that the added filter label is remove after click remove filter option agent modules Dashboard

  As a Wazuh user
  I want to set a new filter
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
