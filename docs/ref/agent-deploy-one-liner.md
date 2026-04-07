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
for example `WAZUH_AGENT_NAME` or `WAZUH_REGISTRATION_PASSWORD`. See [Deployment variables](#deployment-variables)

## Enable and start the Wazuh agent service

Choose one option according to your operating system.

### Systemd

```bash
systemctl daemon-reload
systemctl enable wazuh-agent
systemctl start wazuh-agent
```

### SysV init

RPM-based operating systems:

```bash
chkconfig --add wazuh-agent
service wazuh-agent start
```

Debian-based operating systems:

```bash
update-rc.d wazuh-agent defaults 95 10
service wazuh-agent start
```

### No service manager

On some systems, you need to start the agent manually:

```bash
/var/ossec/bin/wazuh-control start
```

## References

### Deployment variables:

| Option                         | Description                                                                                                                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WAZUH_MANAGER                  | This is the primary Wazuh manager that the Wazuh agent will connect to for ongoing communication and security data exchange. Specifies the Wazuh manager IP address or FQDN (Fully Qualified Domain Name). If you want to specify multiple managers, you can add them separated by commas. |
| WAZUH_MANAGER_PORT             | Specifies the Wazuh manager connection port.                                                                                                                                                                                                                                               |
| WAZUH_PROTOCOL                 | Sets the communication protocol between the Wazuh manager and the Wazuh agent. Accepts UDP and TCP. The default is TCP.                                                                                                                                                                    |
| WAZUH_REGISTRATION_SERVER      | Specifies the Wazuh enrollment server, used for the Wazuh agent enrollment. If empty, the value set in WAZUH_MANAGER will be used.                                                                                                                                                         |
| WAZUH_REGISTRATION_PORT        | Specifies the port used by the Wazuh enrollment server.                                                                                                                                                                                                                                    |
| WAZUH_REGISTRATION_PASSWORD    | Sets password used to authenticate during enrollment, stored in etc/authd.pass.                                                                                                                                                                                                            |
| WAZUH_KEEP_ALIVE_INTERVAL      | Sets the time between Wazuh agent checks for Wazuh manager connection.                                                                                                                                                                                                                     |
| WAZUH_TIME_RECONNECT           | Sets the time interval for the Wazuh agent to reconnect with the Wazuh manager when connectivity is lost.                                                                                                                                                                                  |
| WAZUH_REGISTRATION_CA          | Host SSL validation need of Certificate of Authority. This option specifies the CA path.                                                                                                                                                                                                   |
| WAZUH_REGISTRATION_CERTIFICATE | The SSL agent verification needs a CA signed certificate and the respective key. This option specifies the certificate path.                                                                                                                                                               |
| WAZUH_REGISTRATION_KEY         | Specifies the key path completing the required variables with WAZUH_REGISTRATION_CERTIFICATE for the SSL agent verification process.                                                                                                                                                       |
| WAZUH_AGENT_NAME               | Designates the Wazuh agent's name. By default, it will be the computer name.                                                                                                                                                                                                               |
| WAZUH_AGENT_GROUP              | Assigns the Wazuh agent to one or more existing groups (separated by commas).                                                                                                                                                                                                              |
| ENROLLMENT_DELAY               | Assigns the time that agentd should wait after a successful enrollment.                                                                                                                                                                                                                    |
