# Wazuh App 3.2.0

[![Slack](https://img.shields.io/badge/slack-join-blue.svg)](https://goo.gl/forms/M2AoZC4b2R9A9Zy12)
[![Email](https://img.shields.io/badge/email-join-blue.svg)](https://groups.google.com/forum/#!forum/wazuh)
[![Documentation](https://img.shields.io/badge/docs-view-green.svg)](https://documentation.wazuh.com)
[![Documentation](https://img.shields.io/badge/web-view-green.svg)](https://wazuh.com)

Wazuh is a security detection, visibility, and compliance open source project. It was born as a fork of OSSEC HIDS, and later was integrated with the Elastic Stack and OpenSCAP, evolving into a more comprehensive solution. You can read more in the [official website](https://wazuh.com/).

Table of Contents
===================

* [Wazuh App Description](#wazuh-app-description)
* [Documentation](#documentation)
* [Getting started](#getting-started)
	* [Requisites](#requisites)
	* [Installation](#installation)
	* [Upgrade](#upgrade)
* [Contribute](#contribute)
* [Software and libraries used](#software-and-libraries-used)

# Description

Visualize and analyze Wazuh alerts stored in Elasticsearch using our Kibana app plugin.

* See at a glance a general overview of your hosts with the different graphics and charts.
* Search alerts of apply filters to the visualizations. Obtain a more general view with the **Discover** tab.
* Navigate through the different tabs to see specific alerts, such as **File integrity monitoring**, **OpenSCAP**, **vulnerabilities**, etc.
* View the Wazuh manager configuration. You can see the current status of your manager, your ruleset configuration, all your available agent groups and their configuration, an more.
* Customize your app. Add new APIs, select different index-patterns and enable or disable our different extensions, according to your needs.

Check our [changelog](https://github.com/wazuh/wazuh-kibana-app/blob/3.2-6.2.0/CHANGELOG.md) to stay updated about all the new features on this version of the Wazuh App.

# Documentation

* Visit the [Wazuh documentation](https://documentation.wazuh.com) to get all the info about our software.
* Follow the [Wazuh installation guide](https://documentation.wazuh.com/current/installation-guide/index.html).
* Take a look at some [Wazuh App screenshots](https://documentation.wazuh.com/current/index.html#example-screenshots)

![Overview](https://wazuh.com/wp-content/uploads/2017/01/Overview_general.png)

# Getting started

## Requisites

We always recommend to install and use the Wazuh ecosystem following the documentation, if you are planning to 
use it directly from this repository, please ensure that you fit the following requisites to avoid a wrong installation:

- Wazuh Manager 3.2.0
- Wazuh RESTful API 3.2.0
- Kibana 6.2.1
- Elasticsearch 6.2.1
- Logstash / Filebeat 6.2.1

We suggest following the [Wazuh installation guide](https://documentation.wazuh.com/current/installation-guide/index.html).

## Installation

In order to have a properly working installation, please check the following compatibility table:

| Kibana version | Wazuh App version | Installation |
| :---:         | :---:         |     :---      |
| 6.0.0  | 3.0.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.0.0.zip  |
| 6.0.1  | 3.0.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.0.1.zip  |
| 6.1.0  | 3.0.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.0.0_6.1.0.zip  |
| 6.1.0  | 3.1.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.0.zip  |
| 6.1.1  | 3.1.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.1.zip  |
| 6.1.2  | 3.1.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.2.zip  |
| 6.1.3  | 3.1.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.1.0_6.1.3.zip  |
| 6.1.2  | 3.2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.2.zip  |
| 6.1.3  | 3.2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.1.3.zip  |
| 6.2.0  | 3.2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.2.0.zip  |
| 6.2.1  | 3.2.0  | /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.2.0_6.2.1.zip  |

## Upgrade

If you come from an previous version of the Wazuh App, you can upgrade it as follow:

- Remove the App using kibana-plugin tool:
	- ```/usr/share/kibana/bin/kibana-plugin remove wazuh ```
- Install the App:
	- ```/usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/wazuhapp/wazuhapp-3.x.x_6.x.x.zip ```

# Contribute

If you want to contribute to our project please don't hesitate to send a pull request. You can also join our users [mailing list](https://groups.google.com/d/forum/wazuh), by sending an email to [wazuh+subscribe@googlegroups.com](mailto:wazuh+subscribe@googlegroups.com), to ask questions and participate in discussions.

# Software and libraries used

The Wazuh App development team is always working with the most modern and powerful technologies like Elasticsearch, Kibana, Angular, Node.js, Angular Material, etc.

* [https://elastic.co](https://elastic.co)
* [https://angularjs.org/](https://angularjs.org/)
* [https://nodejs.org/](https://nodejs.org/) 
* [https://material.angularjs.org](https://material.angularjs.org)
* [https://getbootstrap.com](https://getbootstrap.com)

Wazuh App &copy; 2018 Wazuh Inc. (License GPLv2)
