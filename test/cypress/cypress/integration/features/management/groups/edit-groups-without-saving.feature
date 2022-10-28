Feature: Should Displayes a warning modal - Management - edit groups

  As a kibana user
  i want to edit a custom rule
  in order to check if the warning no saving toast is displayed.

@rules @actions
  Scenario: Validate confirmation when closing modal without saving - Management - edit groups
    Given The wazuh admin user is logged
    When The user navigates to groups page
    And The user selects a group to edit
    And The user modify the selected group
    And The user tries to exit edit groups page without saving data
    Then The informative modal is displayed
    