Feature: Validate refresh option is working fine

  As a kibana user
  i want to edit a custom rule
  in order to check if the warning no saving toast is displayed.

@rules @actions
Scenario: Rules are displayed after refreshing the page
Given The wazuh admin user is logged
When The user navigates to rules
And The user clicks the refresh button
Then The user should be able to see the rules page