Feature: add Configuration to modules

    As a wazuh user
    I want to add sample data indices
    in order to check modules

    @Configuration
    Scenario: Add sample data
        Given The wazuh admin user is logged
        When The user navigates to Configuration settings
        Then The app current settings are displayed