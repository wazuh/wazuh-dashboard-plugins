# Wazuh Kibana App

[![Slack](https://img.shields.io/badge/slack-join-blue.svg)](https://wazuh.com/community/join-us-on-slack/)
[![Email](https://img.shields.io/badge/email-join-blue.svg)](https://groups.google.com/forum/#!forum/wazuh)
[![Documentation](https://img.shields.io/badge/docs-view-green.svg)](https://documentation.wazuh.com)
[![Documentation](https://img.shields.io/badge/web-view-green.svg)](https://wazuh.com)

Wazuh is a security detection, visibility, and compliance open source project. It was born as a fork of OSSEC HIDS, later was integrated with Elastic Stack and OpenSCAP evolving into a more comprehensive solution. You can read more in <https://wazuh.com/>

## Description

Visualize and analyze Wazuh alerts stored in Elasticsearch using our Kibana app plugin.

- Obtain statistics per agent, search alerts and filter by using the different visualizations.
- View the Wazuh manager configuration.
- File integrity monitoring.

## Documentation

- [Full documentation](https://documentation.wazuh.com)
- [Wazuh installation guide](https://documentation.wazuh.com/current/installation-guide/index.html)
- [Screenshots](https://documentation.wazuh.com/current/index.html#example-screenshots)

![Overview](/public/img/app.png)

## Branches

- `stable` branch on correspond to the last Wazuh app stable version.
- `master` branch contains the latest code, be aware of possible bugs on this branch.

## Requisites

- Wazuh HIDS 3.12.0
- Wazuh RESTful API 3.12.0
- Kibana 7.6.1
- Elasticsearch 7.6.1

## Installation

Install the app

```
cd /usr/share/kibana
sudo -u kibana bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.0_7.6.1.zip
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

Note: In Wazuh 3.12.0 (regardless of the Elastic Stack version) the location of the wazuh.yml has been moved from `/usr/share/kibana/plugins/wazuh/wazuh.yml` to `/usr/share/kibana/optimize/wazuh/config/wazuh.yml`.

Stop Kibana

- Systemd:

```
systemctl stop kibana
```

- SysV Init:

```
service kibana stop
```

Copy the wazuh.yml to its new location. (Only needed for upgrades from 3.11.x to 3.12.y)

```
mkdir -p /usr/share/kibana/optimize/wazuh/config
cp /usr/share/kibana/plugins/wazuh/wazuh.yml /usr/share/kibana/optimize/wazuh/config/wazuh.yml
```

Remove the app using kibana-plugin tool

```
cd /usr/share/kibana/
sudo -u kibana bin/kibana-plugin remove wazuh
```

Remove generated bundles

```
rm -rf /usr/share/kibana/optimize/bundles
```

Update file permissions. This will avoid several errors prior to updating the app:

```
chown -R kibana:kibana /usr/share/kibana/optimize
chown -R kibana:kibana /usr/share/kibana/plugins
```

Install the app

```
cd /usr/share/kibana/
sudo -u kibana bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.12.0_7.6.1.zip
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

 
## Wazuh - Kibana compatibility matrix
 
| Wazuh app version | Kibana version | Package                                                         |
| :---------------: | :------------: | :-------------------------------------------------------------- |
|       3.11.4      |      7.6.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_7.6.1.zip> |
|       3.11.4      |      7.6.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_7.6.0.zip> |
|       3.11.4      |      7.4.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_7.4.2.zip> |
|       3.11.4      |      6.8.6     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.4_6.8.6.zip> |
|       3.11.3      |      7.6.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_7.6.0.zip> |
|       3.11.3      |      7.5.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_7.5.2.zip> |
|       3.11.3      |      7.4.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_7.4.2.zip> |
|       3.11.3      |      7.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_7.3.2.zip> |
|       3.11.3      |      6.8.6     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.3_6.8.6.zip> |
|       3.11.2      |      7.5.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.2_7.5.2.zip> |
|       3.11.2      |      7.5.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.2_7.5.1.zip> |
|       3.11.2      |      7.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.2_7.3.2.zip> |
|       3.11.2      |      6.8.6     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.2_6.8.6.zip> |
|       3.11.1      |      7.5.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.1_7.5.1.zip> |
|       3.11.1      |      7.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.1_7.3.2.zip> |
|       3.11.1      |      6.8.6     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.1_6.8.6.zip> |
|       3.11.0      |      7.5.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.0_7.5.1.zip> |
|       3.11.0      |      7.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.0_7.3.2.zip> |
|       3.11.0      |      6.8.6     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.11.0_6.8.6.zip> |
|       3.10.2      |      7.5.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.5.1.zip> |
|       3.10.2      |      7.5.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.5.0.zip> |
|       3.10.2      |      7.4.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.4.2.zip> |
|       3.10.2      |      7.4.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.4.1.zip> |
|       3.10.2      |      7.4.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.4.0.zip> |
|       3.10.2      |      7.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_7.3.2.zip> |
|       3.10.2      |      6.8.6     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_6.8.6.zip> |
|       3.10.2      |      6.8.5     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_6.8.5.zip> |
|       3.10.2      |      6.8.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_6.8.4.zip> |
|       3.10.2      |      6.8.3     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.2_6.8.3.zip> |
|       3.10.1      |      7.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.1_7.3.2.zip> |
|       3.10.1      |      7.3.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.1_7.3.1.zip> |
|       3.10.1      |      6.8.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.1_6.8.2.zip> |
|       3.10.0      |      7.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.0_7.3.2.zip> |
|       3.10.0      |      7.3.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.0_7.3.1.zip> |
|       3.10.0      |      6.8.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.10.0_6.8.2.zip> |
|       3.9.5       |      7.3.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.5_7.3.0.zip>  |
|       3.9.5       |      7.2.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.5_7.2.1.zip>  |
|       3.9.5       |      6.8.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.5_6.8.2.zip>  |
|       3.9.4       |      7.3.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.3.0.zip>  |
|       3.9.4       |      7.2.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.1.zip>  |
|       3.9.4       |      7.2.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.0.zip>  |
|       3.9.4       |      6.8.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_6.8.2.zip>  |
|       3.9.4       |      6.8.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_6.8.1.zip>  |
|       3.9.3       |      7.2.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.2.0.zip>  |
|       3.9.3       |      7.1.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.1.1.zip>  |
|       3.9.3       |      7.0.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.0.1.zip>  |
|       3.9.3       |      6.8.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_6.8.1.zip>  |
|       3.9.2       |      7.1.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.2_7.1.1.zip>  |
|       3.9.1       |      7.1.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_7.1.1.zip>  |
|       3.9.1       |      7.1.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_7.1.0.zip>  |
|       3.9.1       |      6.8.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_6.8.0.zip>  |
|       3.9.0       |      6.7.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.0_6.7.2.zip>  |
|       3.9.0       |      6.7.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.0_6.7.1.zip>  |
|       3.8.2       |      6.7.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.7.1.zip>  |
|       3.8.2       |      6.7.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.7.0.zip>  |
|       3.8.2       |      6.6.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.2.zip>  |
|       3.8.2       |      6.6.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.1.zip>  |
|       3.8.2       |      6.6.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.0.zip>  |
|       3.8.2       |      6.5.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.5.4.zip>  |
|       3.8.1       |      6.5.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.1_6.5.4.zip>  |
|       3.8.0       |      6.5.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.0_6.5.4.zip>  |
|       3.7.2       |      6.5.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.2_6.5.4.zip>  |
|       3.7.2       |      6.5.3     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.2_6.5.3.zip>  |
|       3.7.1       |      6.5.3     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.1_6.5.3.zip>  |
|       3.7.1       |      6.5.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.1_6.5.2.zip>  |
|       3.7.1       |      6.5.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.1_6.5.1.zip>  |
|       3.7.0       |      6.5.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.0_6.5.1.zip>  |
|       3.7.0       |      6.5.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.0_6.5.0.zip>  |
|       3.7.0       |      6.4.3     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.0_6.4.3.zip>  |
|       3.7.0       |      6.4.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.0_6.4.2.zip>  |
|       3.6.1       |      6.4.3     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.4.3.zip>  |
|       3.6.1       |      6.4.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.4.2.zip>  |
|       3.6.1       |      6.4.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.4.1.zip>  |
|       3.6.1       |      6.4.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.4.0.zip>  |
|       3.6.1       |      6.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.3.2.zip>  |
|       3.6.0       |      6.4.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.0_6.4.0.zip>  |
|       3.6.0       |      6.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.0_6.3.2.zip>  |
|       3.5.0       |      6.4.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.5.0_6.4.0.zip>  |
|       3.5.0       |      6.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.5.0_6.3.2.zip>  |
|       3.4.0       |      6.3.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.4.0_6.3.2.zip>  |
|       3.4.0       |      6.3.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.4.0_6.3.1.zip>  |
|       3.3.1       |      6.3.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.1_6.3.1.zip>  |
|       3.3.1       |      6.3.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.1_6.3.0.zip>  |
|       3.3.0       |      6.3.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.0_6.3.0.zip>  |
|       3.3.1       |      6.2.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.1_6.2.4.zip>  |
|       3.3.0       |      6.2.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.0_6.2.4.zip>  |
|       3.2.4       |      6.2.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.4_6.2.4.zip>  |
|       3.2.3       |      6.2.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.3_6.2.4.zip>  |
|       3.2.2       |      6.2.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.2_6.2.4.zip>  |
|       3.2.1       |      6.2.4     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.1_6.2.4.zip>  |
|       3.2.1       |      6.2.3     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.1_6.2.3.zip>  |
|       3.2.1       |      6.2.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.1_6.2.2.zip>  |
|       3.2.0       |      6.2.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.2.2.zip>  |
|       3.2.0       |      6.2.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.2.1.zip>  |
|       3.2.0       |      6.2.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.2.0.zip>  |
|       3.2.0       |      6.1.3     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.3.zip>  |
|       3.2.0       |      6.1.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.2.zip>  |
|       3.2.0       |      6.1.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.1.zip>  |
|       3.2.0       |      6.1.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.0.zip>  |
|       3.1.0       |      6.1.3     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.3.zip>  |
|       3.1.0       |      6.1.2     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.2.zip>  |
|       3.1.0       |      6.1.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.1.zip>  |
|       3.1.0       |      6.1.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.0.zip>  |
|       3.0.0       |      6.1.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.1.0.zip>  |
|       3.0.0       |      6.0.1     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.0.1.zip>  |
|       3.0.0       |      6.0.0     | <https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.0.0.zip>  |


## Contribute

If you want to contribute to our project please don't hesitate to send a pull request. You can also join our users [mailing list](https://groups.google.com/d/forum/wazuh), by sending an email to <mailto:wazuh+subscribe@googlegroups.com>, to ask questions and participate in discussions.

## Software and libraries used

- https://elastic.co
- https://elastic.github.io/eui
- https://material.angularjs.org
- https://angularjs.org
- https://nodejs.org
- https://npmjs.com
- https://reactjs.org
- https://redux.js.org

## Copyright & License

Copyright &copy; 2020 Wazuh, Inc.

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

Find more information about this on the [LICENSE](LICENSE) file.
