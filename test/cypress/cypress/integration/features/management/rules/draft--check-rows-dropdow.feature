Feature: Validate row dropdown on Rule page

    As a wazuh user
    i want to see the Rules pages
    in order to manage them

    Scenario: Rules are displayed - Select 10 rows
        Given the wazuh admin user is logged
        When the user navigates to management rules
        And the user see that the rule list is displayed with a limit per rows
        And the user click the limit selector
        And the user select 10 rows
        Then a maximum of 10 rows of rules are displayed per page


    Scenario: Rules are displayed - Select 15 rows
        Given the wazuh admin user is logged
        When the user navigates to management rules
        And the user see that the rule list is displayed with a limit per rows
        And the user click the limit selector
        And the user select 15 rows
        Then a maximum of 15 rows of rules are displayed per page


    Scenario: Rules are displayed - Select 25 rows
        Given the wazuh admin user is logged
        When the user navigates to management rules
        And the user see that the rule list is displayed with a limit per rows
        And the user click the limit selector
        And the user select 25 rows
        Then a maximum of 25 rows of rules are displayed per page



    Scenario: Rules are displayed - Select 50 rows
        Given the wazuh admin user is logged
        When the user navigates to management rules
        And the user see that the rule list is displayed with a limit per rows
        And the user click the limit selector
        And the user select 50 rows
        Then a maximum of 50 rows of rules are displayed per page



    Scenario: Rules are displayed - Select 100 rows
        Given the wazuh admin user is logged
        When the user navigates to management rules
        And the user see that the rule list is displayed with a limit per rows
        And the user click the limit selector
        And the user select 100 rows
        Then a maximum of 100 rows of rules are displayed per page
