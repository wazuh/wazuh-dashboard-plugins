Feature: Validate row dropdown on Rule page

    As a wazuh user
    I want to see the Rules pages
    in order to manage them

    Background: the user navigate to the Rules page
        Given The wazuh admin user is logged
        When The user navigates to rules
        And The user see that the rule list is displayed with a limit per rows

    Scenario: Rules are displayed - Select 10 rows
        When The user click the limit selector for 10 rows
        Then a maximum of 10 rows of rules are displayed per page


    Scenario: Rules are displayed - Select 15 rows
        When The user click the limit selector for 15 rows
        Then a maximum of 15 rows of rules are displayed per page


    Scenario: Rules are displayed - Select 25 rows
        When The user click the limit selector for 25 rows
        Then a maximum of 25 rows of rules are displayed per page


    Scenario: Rules are displayed - Select 50 rows
        When The user click the limit selector for 50 rows
        Then a maximum of 50 rows of rules are displayed per page


    Scenario: Rules are displayed - Select 100 rows
        When The user click the limit selector for 100 rows
        Then a maximum of 100 rows of rules are displayed per page
