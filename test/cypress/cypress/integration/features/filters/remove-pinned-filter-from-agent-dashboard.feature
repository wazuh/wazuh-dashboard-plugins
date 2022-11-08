Feature: Remove Pin filter from agent - Dashboard

  As a Wazuh user
  I want to pin a filter
  in order to aplly it across the modules
  Background:
    Given The wazuh admin user is logged
    And The user navigates to the agent page
    And The user navigates to the agent dashboard

  @filter @actions
  Scenario Outline: The user add and pin new filer - across the modules - from dashboard to event page <Module Name>
    When The user navigates to agentModule <Module Name>
    And The user adds a new filter
    And The user checks filter label is added
    And The user pins a filter
    And The user checks if the filter is displayed
    And The user navigates to the agent page
    And The user navigates to the agent dashboard
    And The user navigates to agentModule <Module Name>
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
