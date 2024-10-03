# Wazuh dashboard app

This folder contains the Wazuh dashboard plugin, from which you can navigate through the
Wazuh data using visualizations in a simple and understandable way. It also allows you to
manage the configuration and capabilities of the Wazuh server.

## Description

This plugin for Wazuh dashboard allows you to visualize and analyze Wazuh alerts stored in
the Wazuh Indexer. The plugin provides the following capabilities:

- Search alerts classified by modules and filter them using the different views. You will be able to explore the alerts both at Wazuh cluster level, and in a particular agent. The modules, divided into the following use cases, are:
  - Security Information Management
    - Security events: Browse through your security alerts, identifying issues and threats in your environment.
    - Integrity monitoring: Alerts related to file changes, including permissions, content, ownership and attributes.
    - Amazon AWS: Security events related to your Amazon AWS services, collected directly via AWS API.
    - Office 365: Security events related to your Office 365 services.
    - GitHub: Security events related to your GitHub organizations, collected via GitHub audit logs API.
    - Google Cloud Platform: Security events related to your Google Cloud Platform services, collected directly via GCP API.
  - Auditing and Policy Monitoring
    - Policy monitoring: Verify that your systems are configured according to your security policies baseline.
    - Security configuration assessment: Scan your assets as part of a configuration assessment audit.
    - System auditing: Audit users behavior, monitoring command execution and alerting on access to critical files.
    - OpenSCAP: Configuration assessment and automation of compliance monitoring using SCAP checks.
    - CIS-CAT: Configuration assessment using Center of Internet Security scanner and SCAP checks.
  - Threat Detection and Response
    - Vulnerabilities: Discover what applications in your environment are affected by well-known vulnerabilities.
    - MITRE ATT&CK: Explore security alerts mapped to adversary tactics and techniques for better threat understanding.
    - VirusTotal: Alerts resulting from VirusTotal analysis of suspicious files via an integration with their API.
    - Osquery: Osquery can be used to expose an operating system as a high-performance relational database.
    - Docker listener: Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.
  - Regulatory Compliance
    - PCI DSS: Global security standard for entities that process, store or transmit payment cardholder data.
    - NIST 800-53: National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.
    - GDPR: General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.
    - HIPAA: Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.
    - TSC: Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy.
- View and edit the Wazuh server configuration.
- Manage your ruleset (rules, decoders and CDB lists).
- Manage your groups of agents.
- Check the status and logs of your Wazuh cluster.
- Manage your agents, as well as see their configuration and data inventory. You can also deploy new agents.
- Explore and interact with the Wazuh API through our Dev Tools.

## Software and libraries used

- [OpenSearch](https://opensearch.org/)
- [OpenSearch OUI framework](https://github.com/opensearch-project/oui)
- [AngularJS](https://angularjs.org)
- [AngularJS Material](https://material.angularjs.org)
- [Node.js](https://nodejs.org)
- [NPM](https://npmjs.com)
- [React](https://reactjs.org)
- [Redux](https://redux.js.org)
