Feature: Should List Decoders And Show The Pager

  As a wazuh user
  i want to see the Decoders pages
  in order to manage them
  
  @decoder
  Scenario: Should List Decoders And Show The Pager
    Given The wazuh admin user is logged
    When The user navigates to decoders
    Then The user should see the decoders
  
  @decoder
  Scenario: Should List Custom Decoders And Show The Pager
    Given The wazuh admin user is logged
    When The user navigates to decoders
    When The user press button custom decoders
    Then The user should see the decoders
  
  @decoder
  Scenario: Should can edit a decoder
    Given The wazuh admin user is logged
    When The user navigates to decoders
    When The user press button custom decoders
    When The user presses the edit decoders button and edits it
    Then The user should see the message
