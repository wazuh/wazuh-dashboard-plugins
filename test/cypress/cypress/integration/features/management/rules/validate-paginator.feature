Feature: Validate paginator on Rule page

    As a wazuh user
    i want to see the Rules pages
    in order to manage them

    Background: the user navigate to the Rules page
        Given The wazuh admin user is logged
        When The user navigates to rules
        Then The user sees that the rule list is paginated
    
    @actions
    Scenario: Rules are displayed when user clicks the first page
        When The user clicks on the second page button
        And A new set of rules is displayed
        And The user clicks on the first page button
        Then The first page of rules is displayed
    
    @actions
    Scenario: Rules are displayed - Select a previous page
        When The user clicks on the second page button
        And The rule page is not the first available
        And The user clicks on the previous page button
        Then The user should be redirected to the next rule page available
   
    @actions
    Scenario: Rules are displayed - Select a next page
        When The user clicks on the second page button
        And The rule page is not the last available
        And The user clicks on the next page button
        Then The user should be redirected to the next rule page available
    
    @actions
    Scenario: Rules are displayed - Last Page
        When The rule page is the last available page
        Then The next page button should be disabled
    
    @actions
    Scenario: Rules are displayed - First Page
        When The rule page is the first available page
        Then The previous page button should be disabled
