## MainSca Component Documentation

### Overview

`MainSca` is the main component of the Security Configuration Assessment (SCA) module for Wazuh agents. It allows you to view the SCA inventory and dashboard for agents selected in the Wazuh dashboard.

### How does SCA work?

- Each Wazuh agent runs SCA assessments locally and stores the results of the checks.
- Only changes detected between scans are sent to the server, optimizing traffic and keeping the central database updated.
- The Wazuh server generates alerts and displays them on the dashboard when there are changes in the check results.

### What does this component display?

- If the agent has never connected, it shows a notice to select another agent.
- If the agent is selected, it allows toggling between the inventory view (checks, results, compliance, remediations) and the SCA dashboard.
- Check results can be: **Passed**, **Failed**, or **Not applicable**, depending on compliance with the rules defined in the SCA policy.

### Integrity

- SCA implements integrity mechanisms to ensure that results and policies are synchronized between agent and server.
- If discrepancies are found, the server requests new results from the agent.

### Usage

This component should be used within the Wazuh Security Configuration and Assessment module. It is essential for visualizing the compliance status of security policies on managed endpoints.

---

**Reference:** For more details on how SCA works, see the [official Wazuh documentation](https://documentation.wazuh.com/current/user-manual/capabilities/sec-config-assessment/index.html).
