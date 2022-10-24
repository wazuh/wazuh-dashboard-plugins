Feature: Should Displayes a warning modal - Management - edit rules

  As a kibana user
  i want to edit a custom rule
  in order to check if the warning no saving toast is displayed.

@rules @actions
  Scenario: Validate confirmation when closing modal without saving - Management - edit rules
    Given The wazuh admin user is logged
    When The user navigates to rules
    And The user clicks the custom rules button
    And The user selects a custom rule to edit
    And The user modify the selected rule 
    And The user tries to exit create rules page without saving data
    Then The informative modal is displayed
    
