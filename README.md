# Wazuh Kibana App

[![Slack](https://img.shields.io/badge/slack-join-blue.svg)](https://wazuh.com/community/join-us-on-slack/)
[![Email](https://img.shields.io/badge/email-join-blue.svg)](https://groups.google.com/forum/#!forum/wazuh)
[![Documentation](https://img.shields.io/badge/docs-view-green.svg)](https://documentation.wazuh.com)
[![Documentation](https://img.shields.io/badge/web-view-green.svg)](https://wazuh.com)

Wazuh is a security detection, visibility, and compliance open source project. It was born as a fork of OSSEC HIDS, and then it was integrated with Elastic Stack and OpenSCAP evolving into a more comprehensive solution. You can learn more about it here [wazuh.com](https://wazuh.com/)

## Description

Visualize and analyze Wazuh alerts stored in Elasticsearch using our Kibana app plugin.

- Obtain statistics per agent, search alerts and filter by using the different visualizations.
- View the Wazuh manager configuration.
- File integrity monitoring.
- Scan your assets as part of a configuration assessment audit.
- Verify that your systems are configured according to your security policies baseline with police monitoring module.

## Documentation

- [Full documentation](https://documentation.wazuh.com)
- [Wazuh installation guide](https://documentation.wazuh.com/current/installation-guide/index.html)
- [Screenshots](https://documentation.wazuh.com/current/index.html#example-screenshots)

![Overview](/public/img/app.png)

## Branches

- `stable` corresponds to the latest Wazuh app stable version.
- `master` branch contains the latest code, be aware of possible bugs on this branch.

## Requisites

- Wazuh HIDS 3.13.2
- Wazuh RESTful API 3.13.2
- Kibana 7.9.1
- Elasticsearch 7.9.1

## Installation

Install the Wazuh app plugin for Kibana

```
cd /usr/share/kibana
sudo -u kibana bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.2_7.9.1.zip
```

Restart Kibana

- Systemd:

```
sudo systemctl restart kibana
```

- SysV Init:

```
sudo service kibana restart
```

## Upgrade

Note: Since Wazuh 3.12.0 release (regardless of the Elastic Stack version) the location of the wazuh.yml has been moved from `/usr/share/kibana/plugins/wazuh/wazuh.yml` to `/usr/share/kibana/optimize/wazuh/config/wazuh.yml`.

Stop Kibana

- Systemd:

```
sudo systemctl stop kibana
```

- SysV Init:

```
sudo service kibana stop
```

Copy the `wazuh.yml` to its new location. (Only needed for upgrades from 3.11.x)

```
sudo mkdir -p /usr/share/kibana/optimize/wazuh/config
sudo cp /usr/share/kibana/plugins/wazuh/wazuh.yml /usr/share/kibana/optimize/wazuh/config/wazuh.yml
```

Remove the Wazuh app using the kibana-plugin tool

```
cd /usr/share/kibana/
sudo -u kibana bin/kibana-plugin remove wazuh
```

Remove generated bundles

```
sudo rm -rf /usr/share/kibana/optimize/bundles
```

Update file permissions. This will prevent errors when generating new bundles or updating the app:

```
sudo chown -R kibana:kibana /usr/share/kibana/optimize
sudo chown -R kibana:kibana /usr/share/kibana/plugins
```

Install the Wazuh app

```
cd /usr/share/kibana/
sudo -u kibana bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.2_7.9.1.zip
```

Update configuration file permissions.

```
sudo chown kibana:kibana /usr/share/kibana/optimize/wazuh/config/wazuh.yml
sudo chmod 600 /usr/share/kibana/optimize/wazuh/config/wazuh.yml
```

Start Kibana

- Systemd:

```
sudo systemctl start kibana
```
 
- SysV Init: 
 
``` 
sudo service kibana start 
```

 
## Wazuh - Kibana - Open Distro version compatibility matrix
 
| Wazuh app | Kibana | Open Distro | Package                                                         |
| :-------: | :----: | :---------: | :-------------------------------------------------------------- |
|   3.13.2  |  7.9.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.2_7.9.1.zip> |
|   3.13.1  |  7.9.1 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.1_7.9.1.zip> |
|   3.13.1  |  7.9.0 |             | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.13.1_7.9.0.zip> |
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
