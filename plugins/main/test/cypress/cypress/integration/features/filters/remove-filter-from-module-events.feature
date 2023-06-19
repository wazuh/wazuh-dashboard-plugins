Feature: Validate that the added filter label is remove after click remove filter option modules Events

  As a Wazuh user
  I want to set a new filter
  in order to manage them
  Background:
    Given The wazuh admin user is logged

  @filter
  Scenario Outline: The user remove an added filter - Module - Events <Module Name>
    When The user goes to <Module Name>
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
      | Vulnerabilities      |
      | Mitre & Attack       |
      | NIST                 |
      | TSC                  |
      | Policy Monitoring    |
      | PCIDSS               |

