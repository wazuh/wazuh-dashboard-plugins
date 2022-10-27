Feature: Search by parameters

    As a Wazuh user
    I want to pin a filter
    in order to aplly it across the modules
    Background:
        Given The wazuh admin user is logged
        And The sample data is loaded

    Scenario Outline: Search by parameters with AND
        When The user goes to <Module Name>
        And The user types a particular search <key> on the search bar
        Then The query is accepted and the results should be displayed
        Examples:
            | Module Name          | key                                              |
            | Security Events      | cluster.name : "wazuh" and rule.level : "3"      |
            | Integrity Monitoring | cluster.name : "wazuh" and agent.id : "001"      |
            | NIST                 | cluster.name : "wazuh" and agent.name : "Ubuntu" |
            | TSC                  | cluster.name : "wazuh" and agent.name : "Ubuntu" |
            | PCIDSS               | cluster.name : "wazuh" and agent.name : "Ubuntu" |

    Scenario Outline: Search by parameters with OR
        When The user goes to <Module Name>
        And The user types a particular search <key> on the search bar
        Then The query is accepted and the results should be displayed
        Examples:
            | Module Name          | key                                             |
            | Security Events      | cluster.name : "wazuh" or rule.level : "3"      |
            | Integrity Monitoring | cluster.name : "wazuh" or agent.id : "001"      |
            | NIST                 | cluster.name : "wazuh" or agent.name : "Ubuntu" |
            | TSC                  | cluster.name : "wazuh" or agent.name : "Ubuntu" |
            | PCIDSS               | cluster.name : "wazuh" or agent.name : "Ubuntu" |