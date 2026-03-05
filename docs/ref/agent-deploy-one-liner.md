# Agent deploy one-liner (FQDN and group)

The Wazuh dashboard provides a **Deploy new agent** wizard, but you can also
use one-line commands on Linux endpoints by passing deployment variables.

## Example (APT)

```bash
WAZUH_MANAGER="manager.example.org" \
WAZUH_REGISTRATION_SERVER="manager.example.org" \
WAZUH_AGENT_GROUP="linux-servers" \
apt-get install wazuh-agent
```

## Example (Yum/DNF)

```bash
WAZUH_MANAGER="manager.example.org" \
WAZUH_REGISTRATION_SERVER="manager.example.org" \
WAZUH_AGENT_GROUP="linux-servers" \
yum install wazuh-agent
```

Use the manager FQDN for both `WAZUH_MANAGER` and `WAZUH_REGISTRATION_SERVER`
when enrollment is performed through DNS. Add additional variables as needed,
for example `WAZUH_AGENT_NAME` or `WAZUH_REGISTRATION_PASSWORD`.

## References

- Deploying agents on Linux: https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-linux.html
- Deployment variables: https://documentation.wazuh.com/current/user-manual/agent/agent-enrollment/deployment-variables/deployment-variables-linux.html
