Feature: Validate that the added filter label is displayed from the events page

  As a Wazuh user
  I want to set a new filter
  in order to manage them
  Background:
    Given The wazuh admin user is logged
    
  @filter @actions
  Scenario Outline: The user add a new filer from the events page <Module Name>
    When The user goes to <Module Name>
    And The user moves to events page
    And The user adds a new filter
    And The user checks filter label is added
    And The user navigates overview page
    And The user goes to <Module Name>
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
