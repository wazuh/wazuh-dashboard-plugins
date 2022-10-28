Feature: Validate that the config to added new agent

    As a wazuh user
    I want to add a new agent
    in order to manage them

    @agent @actions
    Scenario Outline: Validate the information to add a new Agent
        Given The wazuh admin user is logged
        When The user navigates to the agent page
        And The user selects a deploy new agent
        Then The browser is on the new deploy agent page
        And A box with four steps to the different settings is displayed
        And A first step <subtitleFirst> is displayed and the following <options> options
        And A second step <subtitleSecond> with the <descriptionsSecond> are displayed and the following <secondInformation> by default
        And A third step <subtitleThird> with the <descriptionThird> are displayed and the following drop-down with Select group by default <informationThird>
        And A fourth step <subtitleFourth> with the <message> by default is displayed
        And An X button in the top right is displayed
        Examples:
            | subtitleFirst                 | options                                          | subtitleSecond         | descriptionsSecond                                                                                                                          | secondInformation   | subtitleThird                 | descriptionThird                     | informationThird   | subtitleFourth                 | message                               |
            | 'Choose the Operating system' | 'Red Hat / CentOS,Debian / Ubuntu,Windows,MacOS' | 'Wazuh server address' | 'This is the address the agent uses to communicate with the Wazuh server. It can be an IP address or a fully qualified domain name (FQDN).' | '172.19.0.4       ' | 'Assign the agent to a group' | 'Select one or more existing groups' | 'Select group    ' | 'Install and enroll the agent' | 'Please select the Operating system.' |
            