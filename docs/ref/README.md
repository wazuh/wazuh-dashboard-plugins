# Introduction

This reference manual describes the Wazuh dashboard plugins: their purpose,
configuration options, operational guidance, and supporting concepts. Use it as
an always-on companion to the installation guide when validating environments
or running end-to-end tests.

## About the examples

Command examples authenticate with the passwords generated or supplied during installation, which
are unique to each deployment, never with a shipped default:

| Variable                        | Account                             |
| ------------------------------- | ----------------------------------- |
| `$WAZUH_INDEXER_ADMIN_PASSWORD` | `admin` on the Wazuh indexer        |
| `$WAZUH_MANAGER_WUI_PASSWORD`   | `wazuh-wui` on the Wazuh server API |

Load them into your shell before running the examples, on a host where `/etc/wazuh/credentials.env`
holds them:

```bash
WAZUH_INDEXER_ADMIN_PASSWORD=$(sudo grep '^WAZUH_INDEXER_ADMIN_PASSWORD=' /etc/wazuh/credentials.env | cut -d= -f2- | tr -d '\"')
WAZUH_MANAGER_WUI_PASSWORD=$(sudo grep '^WAZUH_MANAGER_WUI_PASSWORD=' /etc/wazuh/credentials.env | cut -d= -f2- | tr -d '\"')
```

`source` cannot read the file directly: it is `0600 root:root`, and `source` is a shell builtin, so
`sudo` cannot run it. Run the examples as root instead if you prefer.

If you have already removed that file, as recommended once every component is installed, substitute
the passwords directly. See [Credentials](getting-started/credentials.md).
