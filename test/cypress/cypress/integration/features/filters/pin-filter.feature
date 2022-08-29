Feature: Pin filter - across the modules

  As a Wazuh user
  I want to pin a filter
  in order to aplly it across the modules
  Background:
    Given The wazuh admin user is logged

  @filter
  Scenario Outline: The user add and pin new filer - across the modules <Module Name>
    When The user goes to <Module Name>
    And The user adds a new filter
    And The user checks filter label is added
    And The user pins a filter
    And The user checks if the filter is displayed
    And The user navigates overview page
    And The user goes to <Module Name>
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
      
