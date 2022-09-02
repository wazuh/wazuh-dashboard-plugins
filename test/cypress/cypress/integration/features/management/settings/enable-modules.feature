Feature: enable modules

  As a wazuh user
  I want to enable different modules
  in order to see them in the modules directory

  @EnableModules
  Scenario Outline: Enable modules, <Module Name>
    Given The wazuh admin user is logged
    When The user navigates to Modules settings
    And All modules are deactivates
    And The user activates the modules with <Module Name>
    Then The activated modules with <Module Name> are displayed on home page
    Examples:
      | Module Name           |
      | Amazon AWS            |
      | Google Cloud Platform |
      | GitHub                |
      | OpenSCAP              |
      | CIS-CAT               |
      | VirusTotal            |
      | Osquery               |
      | Docker listener       |
      | GDPR                  |
      | HIPAA                 |
      | TSC                   |