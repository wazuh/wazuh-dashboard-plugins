Feature: Generating reports from modules

  As a Wazuh user
  i want to generate a report
  in order to could access to the report from management/reporting
Background:
    Given The wazuh admin user is logged
    And The sample data is loaded
@report
Scenario Outline: Create a report from modules <Module Name>
    When The user goes to <Module Name>
    And The user generate a module report clicking on the generate report option
    And The user navigates to management-reporting
    Then The report is displayed in the table <Module Name>
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