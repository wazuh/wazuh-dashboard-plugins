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

- Wazuh HIDS 3.9.4
- Wazuh RESTful API 3.9.4
- Kibana 7.2.0
- Elasticsearch 7.2.0

## Installation

Install the app

- With sudo:

```
sudo -u kibana /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.0.zip
```

- Without sudo:

```
su -c '/usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.0.zip' kibana
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

Stop Kibana

- Systemd:

```
systemctl stop kibana
```

- SysV Init:

```
service kibana stop
```

Remove the app using kibana-plugin tool

```
/usr/share/kibana/bin/kibana-plugin remove wazuh
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

- With sudo:

```
sudo -u kibana /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.0.zip
```

- Without sudo:

```
su -c '/usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.0.zip' kibana
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

## Older packages

| Kibana version | Wazuh app version | Installation                                                                                               |
| :------------: | :---------------: | :--------------------------------------------------------------------------------------------------------- |
|      6.0.0     |       3.0.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.0.0.zip> |
|      6.0.1     |       3.0.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.0.1.zip> |
|      6.1.0     |       3.0.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.1.0.zip> |
|      6.1.0     |       3.1.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.0.zip> |
|      6.1.1     |       3.1.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.1.zip> |
|      6.1.2     |       3.1.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.2.zip> |
|      6.1.3     |       3.1.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.3.zip> |
|      6.1.0     |       3.2.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.0.zip> |
|      6.1.1     |       3.2.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.1.zip> |
|      6.1.2     |       3.2.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.2.zip> |
|      6.1.3     |       3.2.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.3.zip> |
|      6.2.0     |       3.2.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.2.0.zip> |
|      6.2.1     |       3.2.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.2.1.zip> |
|      6.2.2     |       3.2.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.2.2.zip> |
|      6.2.2     |       3.2.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.1_6.2.2.zip> |
|      6.2.3     |       3.2.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.1_6.2.3.zip> |
|      6.2.4     |       3.2.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.1_6.2.4.zip> |
|      6.2.4     |       3.2.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.2_6.2.4.zip> |
|      6.2.4     |       3.2.3       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.3_6.2.4.zip> |
|      6.2.4     |       3.2.4       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.4_6.2.4.zip> |
|      6.2.4     |       3.3.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.0_6.2.4.zip> |
|      6.2.4     |       3.3.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.1_6.2.4.zip> |
|      6.3.0     |       3.3.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.0_6.3.0.zip> |
|      6.3.0     |       3.3.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.1_6.3.0.zip> |
|      6.3.1     |       3.3.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.3.1_6.3.1.zip> |
|      6.3.1     |       3.4.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.4.0_6.3.1.zip> |
|      6.3.2     |       3.4.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.4.0_6.3.2.zip> |
|      6.3.2     |       3.5.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.5.0_6.3.2.zip> |
|      6.4.0     |       3.5.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.5.0_6.4.0.zip> |
|      6.3.2     |       3.6.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.0_6.3.2.zip> |
|      6.4.0     |       3.6.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.0_6.4.0.zip> |
|      6.3.2     |       3.6.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.3.2.zip> |
|      6.4.0     |       3.6.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.4.0.zip> |
|      6.4.1     |       3.6.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.4.1.zip> |
|      6.4.2     |       3.6.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.4.2.zip> |
|      6.4.3     |       3.6.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.6.1_6.4.3.zip> |
|      6.4.2     |       3.7.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.0_6.4.2.zip> |
|      6.4.3     |       3.7.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.0_6.4.3.zip> |
|      6.5.0     |       3.7.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.0_6.5.0.zip> |
|      6.5.1     |       3.7.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.0_6.5.1.zip> |
|      6.5.1     |       3.7.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.1_6.5.1.zip> |
|      6.5.2     |       3.7.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.1_6.5.2.zip> |
|      6.5.3     |       3.7.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.1_6.5.3.zip> |
|      6.5.3     |       3.7.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.2_6.5.3.zip> |
|      6.5.4     |       3.7.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.7.2_6.5.4.zip> |
|      6.5.4     |       3.8.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.0_6.5.4.zip> |
|      6.5.4     |       3.8.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.1_6.5.4.zip> |
|      6.5.4     |       3.8.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.5.4.zip> |
|      6.6.0     |       3.8.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.0.zip> |
|      6.6.1     |       3.8.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.1.zip> |
|      6.6.2     |       3.8.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.6.2.zip> |
|      6.7.0     |       3.8.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.7.0.zip> |
|      6.7.1     |       3.8.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.8.2_6.7.1.zip> |
|      6.7.1     |       3.9.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.0_6.7.1.zip> |
|      6.7.2     |       3.9.0       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.0_6.7.2.zip> |
|      6.8.0     |       3.9.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_6.8.0.zip> |
|      7.1.0     |       3.9.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_7.1.0.zip> |
|      7.1.1     |       3.9.1       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.1_7.1.1.zip> |
|      7.1.1     |       3.9.2       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.2_7.1.1.zip> |
|      6.8.1     |       3.9.3       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_6.8.1.zip> |
|      7.0.1     |       3.9.3       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.0.1.zip> |
|      7.1.1     |       3.9.3       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.1.1.zip> |
|      7.2.0     |       3.9.3       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.3_7.2.0.zip> |
|      6.8.1     |       3.9.4       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_6.8.1.zip> |
|      7.2.0     |       3.9.4       | /usr/share/kibana/bin/kibana-plugin install <https://packages.wazuh.com/wazuhapp/wazuhapp-3.9.4_7.2.0.zip> |


## Contribute

If you want to contribute to our project please don't hesitate to send a pull request. You can also join our users [mailing list](https://groups.google.com/d/forum/wazuh), by sending an email to <mailto:wazuh+subscribe@googlegroups.com>, to ask questions and participate in discussions.

## Software and libraries used

- https://elastic.co
- https://material.angularjs.org
- https://angularjs.org
- https://nodejs.org
- https://npmjs.com

## Copyright & License

Copyright &copy; 2019 Wazuh, Inc.

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

Find more information about this on the [LICENSE](LICENSE) file.
