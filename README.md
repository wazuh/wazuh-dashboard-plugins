# Wazuh

Wazuh is a security detection, visibility, and compliance open source project. It was born as a fork of OSSEC HIDS, later was integrated with Elastic Stack and OpenSCAP evolving into a more comprehensive solution. You can read more in https://wazuh.com/

## Wazuh - Kibana App Description

Visualize and analyze Wazuh alerts stored in Elasticsearch using our Kibana app plugin.

- Obtain statistics per agent, search alerts and filter by using the different visualizations.

- View the Wazuh manager configuration.

- File integrity monitoring.

## Documentation

* [Full documentation](https://documentation.wazuh.com)
* [Wazuh installation guide](https://documentation.wazuh.com/current/installation-guide/index.html)
* [Screenshots](https://documentation.wazuh.com/current/index.html#example-screenshots)

![Overview](https://wazuh.com/wp-content/uploads/2017/01/Overview_general.png)

## Requisites

- Wazuh HIDS 2.0 or superior
- Wazuh RESTful API 2.0 or superior
- Kibana 5.2.2 or superior
- Elasticsearch 5 or superior

## Installation

| Kibana version | Wazuh App version | Installation |
| :---:         | :---:         |     :---      |
| 5.2.2  | 2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.2.2.zip  |
| 5.3.0  | 2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.3.0.zip  |
| 5.3.1  | 2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.3.1.zip  |
| 5.4.0  | 2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.4.0.zip  |
| 5.4.1  | 2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.4.1.zip  |
| 5.4.2  | 2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.4.2.zip  |
| 5.4.3  | 2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.4.3.zip  |
| 5.5.0  | 2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.5.0.zip  |
| 5.5.0  | 2.0.1  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0.1_5.5.0.zip  |
| 5.5.1  | 2.0.1  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0.1_5.5.1.zip  |
| 5.5.1  | 2.1.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.1.0_5.5.1.zip  |
| 5.5.2  | 2.1.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.1.0_5.5.2.zip  |
| 5.5.3  | 2.1.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.1.0_5.5.3.zip  |
| 5.6.1  | 2.1.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.1.0_5.6.1.zip  |
| 5.6.1  | 2.1.1  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.1.1_5.6.1.zip  |
| 5.6.2  | 2.1.1  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.1.1_5.6.2.zip  |
| 5.6.3  | 2.1.1  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.1.1_5.6.3.zip  |

## Upgrade

Remove the App using kibana-plugin tool

```/usr/share/kibana/bin/kibana-plugin remove wazuh ```

Install the App

```/usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-2.0_5.x.x.zip ```

## Contribute

If you want to contribute to our project please don't hesitate to send a pull request. You can also join our users [mailing list](https://groups.google.com/d/forum/wazuh), by sending an email to [wazuh+subscribe@googlegroups.com](mailto:wazuh+subscribe@googlegroups.com), to ask questions and participate in discussions.

## Software and libraries used

* API from Elastic and Kibana (elastic.co).
* Angular Material (material.angularjs.org).
* Bootstrap (getbootstrap.com).
* AngularJS.
* Node.js (Ryan Dahl).
* NPM packages Angular animate, aria, cookies, md5, needle and cron.

## License and copyright

Wazuh App Copyright (C) 2016 Wazuh Inc. (License GPLv2)

## References

* [Wazuh website](https://wazuh.com)
* [Wazuh documentation](https://documentation.wazuh.com)
* [Elastic stack](https://elastic.co)