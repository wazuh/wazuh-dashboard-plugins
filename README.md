# Wazuh - Kibana App

## Requisites

- Wazuh HIDS 1.2 or superior
- Wazuh RESTful API 1.3 or superior
- Kibana 5 or superior
- Elasticsearch 5 or superior

## Installation

```/usr/share/kibana/bin/kibana-plugin install  http://wazuh.com/resources/wazuh-app.zip ```

## Upgrading

```/usr/share/kibana/bin/kibana-plugin remove wazuh ```

```/usr/share/kibana/bin/kibana-plugin install  http://wazuh.com/resources/wazuh-app.zip ```

## Wazuh Open Source modules and contributions

* [OSSEC Wazuh Ruleset](http://documentation.wazuh.com/en/latest/ossec_ruleset.html): Includes compliance mapping with PCI DSS v3.1, CIS and additional decoders and rules. Users can contribute to this rule set by submitting pull requests to our [Github repository](https://github.com/wazuh/wazuh-ruleset). Our team will continue to maintain and update it periodically.

* [Wazuh fork](http://documentation.wazuh.com/en/latest/ossec_wazuh.html) with extended JSON logging capabilities, for easy [integration with ELK Stack](http://documentation.wazuh.com/en/latest/ossec_elk.html) and third party log management tools. The manager also include modifications in OSSEC binaries needed by the [OSSEC Wazuh RESTful API](http://documentation.wazuh.com/en/latest/ossec_api.html).

* [Wazuh RESTful API](http://documentation.wazuh.com/en/latest/ossec_api.html): Used to monitor and control your OSSEC installation, providing an interface to interact with the manager from anything that can send an HTTP request.

* [Pre-compiled installation packages](http://documentation.wazuh.com/en/latest/ossec_installation.html), both for OSSEC agent and manager: Include repositories for RedHat, CentOS, Fedora, Debian, Ubuntu and Windows.

* [Puppet scripts](http://documentation.wazuh.com/en/latest/ossec_puppet.html) for automatic OSSEC deployment and configuration.

* [Docker containers](http://documentation.wazuh.com/en/latest/ossec_docker.html) to virtualize and run your OSSEC manager and an all-in-one integration with ELK Stack.

## Documentation

* [Full documentation](http://documentation.wazuh.com)
* [Wazuh installation guide](http://documentation.wazuh.com/en/latest/wazuh_installation.html)

## Branches

* `stable` branch on correspond to the last stable version.
* `master` branch contains the latest code, be aware of possible bugs on this branch.
* `development` branch includes all the new features we're adding and testing.

## Contribute

If you want to contribute to our project please don't hesitate to send a pull request. You can also join our users [mailing list](https://groups.google.com/d/forum/wazuh), by sending an email to [wazuh+subscribe@googlegroups.com](mailto:wazuh+subscribe@googlegroups.com), to ask questions and participate in discussions.

## Software and libraries used

* API from Elastic and Kibana (elastic.co).
* Angular Material (material.angularjs.org).
* Bootstrap (getbootstrap.com/).
* AngularJS
* Node.js (Ryan Dahl).
* NPM packages Angular animate, aria, cookies, md5, needle and cron.

## License and copyright

Wazuh App Copyright (C) 2016 Wazuh Inc. (License GPLv2)

## References

* [Wazuh website](http://wazuh.com)
* [Wazuh documentation](http://documentation.wazuh.com)
* [Elastic stack](http://elastic.co)
