Feature: Should Displayes a message to restart the cluster after saves

  As a wazuh user
  i want to edit a custom decoder
  in order to check if the save message it's displayed

@decoders @actions
  Scenario: Validate creation message is displayed after creating a new decoder
    Given The wazuh admin user is logged
    When The user navigates to decoders
    And The user clicks the new decoders button
    And The user writes a new decoder
    And The user saves the decoder
    Then The save message its displayed
    