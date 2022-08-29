Feature: Add/Delete Sample data to modules

  As a wazuh user
  I want to add sample data indices
  in order to check modules

  @sampleData
  Scenario: Add all sample data
    Given The wazuh admin user is logged
    When The user navigates to Sample data settings
    And The user adds sample data for
      | security information            |
      | auditing and policy monitoring  |
      | threat detection and response   |
    Then The add data success toasts are displayed

  @sampleData
  Scenario: Delete all sample data
      Given The wazuh admin user is logged
      When The user navigates to Sample data settings
      And The user removes sample data for
      | security information            |
      | auditing and policy monitoring  |
      | threat detection and response   |
    Then The remove data success toasts are displayed
