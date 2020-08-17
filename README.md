# Wazuh Kibana App

[![Slack](https://img.shields.io/badge/slack-join-blue.svg)](https://wazuh.com/community/join-us-on-slack/)
[![Email](https://img.shields.io/badge/email-join-blue.svg)](https://groups.google.com/forum/#!forum/wazuh)
[![Documentation](https://img.shields.io/badge/docs-view-green.svg)](https://documentation.wazuh.com)
[![Documentation](https://img.shields.io/badge/web-view-green.svg)](https://wazuh.com)

This repository contains the Wazuh Kibana plugin, from which you can navigate through the Wazuh data using visualizations in a simple and understandable way. It also allows you to manage the configuration and capabilities of the Wazuh server.

Wazuh is a security detection, visibility, and compliance open source project. Wazuh helps you to gain deeper security visibility into your infrastructure by monitoring hosts at an operating system and application level.

You can learn more about it here [wazuh.com](https://wazuh.com/)

## Description

This plugin for Kibana allows you to visualize and analyze Wazuh alerts stored in Elasticsearch and provides the following capabilities:

- Search alerts classified by modules and filter them using the different views. You will be able to explore the alerts both at Wazuh cluster level, and in a particular agent. The modules, divided into the following use cases, are:
    - Security Information Management
        - Security events: Browse through your security alerts, identifying issues and threats in your environment.
        - Integrity monitoring: Alerts related to file changes, including permissions, content, ownership and attributes.
        - Amazon AWS: Security events related to your Amazon AWS services, collected directly via AWS API.
        - Google Cloud Platform: Security events related to your Google Cloud Platform services, collected directly via GCP API.
    - Auditing and Policy Monitoring
        - Policy monitoring: Verify that your systems are configured according to your security policies baseline.
        - Security configuration assessment: Scan your assets as part of a configuration assessment audit.
        - System auditing: Audit users behavior, monitoring command execution and alerting on access to critical files.
        - OpenSCAP: Configuration assessment and automation of compliance monitoring using SCAP checks.
        - CIS-CAT: Configuration assessment using Center of Internet Security scanner and SCAP checks.
    - Threat Detection and Response
        - Vulnerabilities: Discover what applications in your environment are affected by well-known vulnerabilities.
        - MITRE ATT&CK: Security events from the knowledge base of adversary tactics and techniques based on real-world observations.
        - VirusTotal: Alerts resulting from VirusTotal analysis of suspicious files via an integration with their API.
        - Osquery: Osquery can be used to expose an operating system as a high-performance relational database.
        - Docker listener: Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.
    - Regulatory Compliance
        - PCI DSS: Global security standard for entities that process, store or transmit payment cardholder data.
        - NIST 800-53: National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.
        - GDPR: General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.
        - HIPAA: Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.
        - TSC: Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy.
- View and edit the Wazuh manager configuration.
- Manage your ruleset (rules, decoders and CDB lists).
- Manage your groups of agents.
- Check the status and logs of your Wazuh cluster.
- Manage your agents, as well as see their configuration and data inventory. You can also deploy new agents.
- Explore and interact with the Wazuh API through our Dev Tools.

## Documentation

- [Full documentation](https://documentation.wazuh.com)
- [Wazuh installation guide](https://documentation.wazuh.com/current/installation-guide/index.html)
- [Screenshots](https://documentation.wazuh.com/current/index.html#example-screenshots)

![Overview](/public/img/app.png)

![Overview](/public/img/app2.png)

![Overview](/public/img/app3.png)

![Overview](/public/img/app4.png)

## Branches

- `stable` corresponds to the latest Wazuh app stable version.
- `master` branch contains the latest code, be aware of possible bugs on this branch.

## Requisites

- Wazuh HIDS 3.13.1
- Wazuh RESTful API 3.13.1
- Kibana 7.8.1
- Elasticsearch 7.8.1

## Installation

Install the Wazuh app plugin for Kibana

```
cd /usr/share/kibana
sudo -u kibana bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.1_7.8.1.zip
```

Restart Kibana

- Systemd:

```
systemctl restart kibana
```

- SysV Init:

```
service kibana restart
```

## Upgrade

Note: Since Wazuh 3.12.0 release (regardless of the Elastic Stack version) the location of the wazuh.yml has been moved from `/usr/share/kibana/plugins/wazuh/wazuh.yml` to `/usr/share/kibana/optimize/wazuh/config/wazuh.yml`.

Stop Kibana

- Systemd:

```
systemctl stop kibana
```

- SysV Init:

```
service kibana stop
```

Copy the `wazuh.yml` to its new location. (Only needed for upgrades from 3.11.x)

```
mkdir -p /usr/share/kibana/optimize/wazuh/config
cp /usr/share/kibana/plugins/wazuh/wazuh.yml /usr/share/kibana/optimize/wazuh/config/wazuh.yml
```

Remove the Wazuh app using the kibana-plugin tool

```
cd /usr/share/kibana/
sudo -u kibana bin/kibana-plugin remove wazuh
```

Remove generated bundles

```
rm -rf /usr/share/kibana/optimize/bundles
```

Update file permissions. This will prevent errors when generating new bundles or updating the app:

```
chown -R kibana:kibana /usr/share/kibana/optimize
chown -R kibana:kibana /usr/share/kibana/plugins
```

Install the Wazuh app

```
cd /usr/share/kibana/
sudo -u kibana bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.1_7.8.1.zip
```

Update configuration file permissions.

```
sudo chown kibana:kibana /usr/share/kibana/optimize/wazuh/config/wazuh.yml
sudo chmod 600 /usr/share/kibana/optimize/wazuh/config/wazuh.yml
```

Restart Kibana

- Systemd:

```
systemctl restart kibana
```
 
- SysV Init: 
 
``` 
service kibana restart 
```

 
## Wazuh - Kibana - Open Distro version compatibility matrix
 
| Wazuh app | Kibana | Open Distro | Package                                                         |
| :-------: | :----: | :---------: | :-------------------------------------------------------------- |
|   3.13.1  |  7.8.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.1_7.8.1.zip> |
|   3.13.1  |  7.8.0 |    1.9.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.1_7.8.0.zip> |
|   3.13.0  |  7.8.0 |    1.9.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.0_7.8.0.zip> |
|   3.13.0  |  7.7.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.0_7.7.1.zip> |
|   3.13.0  |  7.7.0 |    1.8.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.0_7.7.0.zip> |
|   3.12.3  |  7.7.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.3_7.7.1.zip> |
|   3.12.3  |  7.7.0 |    1.8.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.3_7.7.0.zip> |
|   3.12.3  |  7.6.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.3_7.6.2.zip> |
|   3.12.3  |  7.6.1 |1.6.0 - 1.7.0| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.3_7.6.1.zip> |
|   3.12.3  |  7.3.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.3_7.3.1.zip> |
|   3.12.3  |  6.8.10|             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.3_6.8.10.zip>|
|   3.12.3  |  6.8.9 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.3_6.8.9.zip> |
|   3.12.3  |  6.8.8 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.3_6.8.8.zip> |
|   3.12.2  |  7.6.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.2_7.6.2.zip> |
|   3.12.2  |  7.6.1 |1.6.0 - 1.7.0| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.2_7.6.1.zip> |
|   3.12.2  |  6.8.8 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.2_6.8.8.zip> |
|   3.12.1  |  7.6.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.1_7.6.2.zip> |
|   3.12.1  |  7.6.1 |1.6.0 - 1.7.0| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.1_7.6.1.zip> |
|   3.12.1  |  6.8.8 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.1_6.8.8.zip> |
|   3.12.0  |  7.6.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.0_7.6.2.zip> |
|   3.12.0  |  7.6.1 |1.6.0 - 1.7.0| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.0_7.6.1.zip> |
|   3.12.0  |  7.4.2 |    1.4.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.0_7.4.2.zip> |
|   3.12.0  |  6.8.8 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.0_6.8.8.zip> |
|   3.12.0  |  6.8.7 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.0_6.8.7.zip> |
|   3.11.4  |  7.6.1 |1.6.0 - 1.7.0| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_7.6.1.zip> |
|   3.11.4  |  7.6.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_7.6.0.zip> |
|   3.11.4  |  7.4.2 |    1.4.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_7.4.2.zip> |
|   3.11.4  |  6.8.7 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_6.8.7.zip> |
|   3.11.4  |  6.8.6 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_6.8.6.zip> |
|   3.11.3  |  7.6.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_7.6.0.zip> |
|   3.11.3  |  7.5.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_7.5.2.zip> |
|   3.11.3  |  7.4.2 |    1.4.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_7.4.2.zip> |
|   3.11.3  |  7.3.2 |    1.3.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_7.3.2.zip> |
|   3.11.3  |  6.8.6 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_6.8.6.zip> |
|   3.11.2  |  7.5.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.2_7.5.2.zip> |
|   3.11.2  |  7.5.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.2_7.5.1.zip> |
|   3.11.2  |  7.3.2 |    1.3.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.2_7.3.2.zip> |
|   3.11.2  |  6.8.6 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.2_6.8.6.zip> |
|   3.11.1  |  7.5.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.1_7.5.1.zip> |
|   3.11.1  |  7.3.2 |    1.3.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.1_7.3.2.zip> |
|   3.11.1  |  6.8.6 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.1_6.8.6.zip> |
|   3.11.0  |  7.5.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.0_7.5.1.zip> |
|   3.11.0  |  7.3.2 |    1.3.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.0_7.3.2.zip> |
|   3.11.0  |  6.8.6 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.0_6.8.6.zip> |
|   3.10.2  |  7.5.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.5.1.zip> |
|   3.10.2  |  7.5.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.5.0.zip> |
|   3.10.2  |  7.4.2 |    1.4.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.4.2.zip> |
|   3.10.2  |  7.4.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.4.1.zip> |
|   3.10.2  |  7.4.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.4.0.zip> |
|   3.10.2  |  7.3.2 |    1.3.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.3.2.zip> |
|   3.10.2  |  6.8.6 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_6.8.6.zip> |
|   3.10.2  |  6.8.5 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_6.8.5.zip> |
|   3.10.2  |  6.8.4 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_6.8.4.zip> |
|   3.10.2  |  6.8.3 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_6.8.3.zip> |
|   3.10.1  |  7.3.2 |    1.3.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.1_7.3.2.zip> |
|   3.10.1  |  7.3.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.1_7.3.1.zip> |
|   3.10.1  |  6.8.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.1_6.8.2.zip> |
|   3.10.0  |  7.3.2 |    1.3.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.0_7.3.2.zip> |
|   3.10.0  |  7.3.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.0_7.3.1.zip> |
|   3.10.0  |  6.8.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.0_6.8.2.zip> |
|   3.9.5   |  7.3.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.5_7.3.0.zip>  |
|   3.9.5   |  7.2.1 |    1.2.1    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.5_7.2.1.zip>  |
|   3.9.5   |  6.8.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.5_6.8.2.zip>  |
|   3.9.4   |  7.3.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.3.0.zip>  |
|   3.9.4   |  7.2.1 |    1.2.1    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.1.zip>  |
|   3.9.4   |  7.2.0 |    1.2.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.0.zip>  |
|   3.9.4   |  6.8.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_6.8.2.zip>  |
|   3.9.4   |  6.8.1 |    0.10.0   | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_6.8.1.zip>  |
|   3.9.3   |  7.2.0 |    1.2.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.2.0.zip>  |
|   3.9.3   |  7.1.1 |    1.1.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.1.1.zip>  |
|   3.9.3   |  7.0.1 |1.0.0 - 1.0.2| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.0.1.zip>  |
|   3.9.3   |  6.8.1 |    0.10.0   | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_6.8.1.zip>  |
|   3.9.2   |  7.1.1 |    1.1.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.2_7.1.1.zip>  |
|   3.9.1   |  7.1.1 |    1.1.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_7.1.1.zip>  |
|   3.9.1   |  7.1.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_7.1.0.zip>  |
|   3.9.1   |  6.8.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_6.8.0.zip>  |
|   3.9.0   |  6.7.2 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.0_6.7.2.zip>  |
|   3.9.0   |  6.7.1 |    0.9.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.0_6.7.1.zip>  |
|   3.8.2   |  6.7.1 |    0.9.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.7.1.zip>  |
|   3.8.2   |  6.7.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.7.0.zip>  |
|   3.8.2   |  6.6.2 |    0.8.0    | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.2.zip>  |
|   3.8.2   |  6.6.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.1.zip>  |
|   3.8.2   |  6.6.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.0.zip>  |
|   3.8.2   |  6.5.4 |0.7.0 - 0.7.1| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.5.4.zip>  |
|   3.8.1   |  6.5.4 |0.7.0 - 0.7.1| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.1_6.5.4.zip>  |
|   3.8.0   |  6.5.4 |0.7.0 - 0.7.1| <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.0_6.5.4.zip>  |


## Contribute

If you want to contribute to our project please don't hesitate to send a pull request. You can also join our users [mailing list](https://groups.google.com/d/forum/wazuh), by sending an email to [wazuh+subscribe@googlegroups.com](mailto:wazuh+subscribe@googlegroups.com), to ask questions and participate in discussions.

## Software and libraries used

- [Elastic](https://elastic.co)
- [Elastic UI framework](https://elastic.github.io/eui)
- [AngularJS](https://angularjs.org)
- [AngularJS Material](https://material.angularjs.org)
- [Node.js](https://nodejs.org)
- [NPM](https://npmjs.com)
- [React](https://reactjs.org)
- [Redux](https://redux.js.org)

## Copyright & License

Copyright &copy; 2020 Wazuh, Inc.

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

Find more information about this on the [LICENSE](LICENSE) file.
