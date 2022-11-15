Feature: Should Create a new security policy for the user.

  As a wazuh user
  i want to create a new policy
  in order to check if the creation it's working


  Scenario: Add a new policy
    Given The wazuh admin user is logged
    When the user navigates to the policy section
    And the user creates a new policy
    #Then the policiy its displayed on the policy list
