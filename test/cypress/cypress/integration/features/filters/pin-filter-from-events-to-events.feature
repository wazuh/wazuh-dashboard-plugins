Feature: Pin filter - from event page

  As a Wazuh user
  I want to pin a filter
  in order to aplly it across the modules
  Background:
    Given The wazuh admin user is logged

  @filter @actions
  Scenario Outline: The user add and pin new filer - across the modules - from event page <Module Name>
    When The user goes to <Module Name>
    And The user moves to events page
    And The user adds a new filter
    And The user checks filter label is added
    And The user pins a filter
    And The user checks if the filter is displayed
    And The user navigates overview page
    And The user goes to <Module Name>
    And The user moves to events page
    Then The user checks if the filter is displayed
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
      
