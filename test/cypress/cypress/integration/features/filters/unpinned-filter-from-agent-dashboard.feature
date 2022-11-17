Feature: Unpinned filter from agent - Dashboard

  As a Wazuh user
  I want to unpin a selected filter
  in order to apply it across the modules
  Background:
    Given The wazuh admin user is logged
    And The user navigates to the agent page
    And The user navigates to the agent dashboard

  @filter @actions
  Scenario Outline: The user adds a new pin filer and remove it - across the modules - from dashboard <Module Name>
    When The user navigates to agentModule <Module Name>
    And The user adds a new filter
    And The user checks filter label is added
    And The user pins a filter
    And The user checks if the filter is displayed
    And The user unpins the selected filter
    And The user navigates to the agent page
    And The user navigates to the agent dashboard
    And The user navigates to agentModule <Module Name>
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
