# Introduction

This reference manual describes the Wazuh dashboard plugins: their purpose,
configuration options, operational guidance, and supporting concepts. Use it as
an always-on companion to the installation guide when validating environments
or running end-to-end tests.

## About the examples

Command examples authenticate with the passwords generated or supplied during installation, which
are unique to each deployment, never with a shipped default:

| Variable                        | Account                                         |
| ------------------------------- | ----------------------------------------------- |
| `$WAZUH_INDEXER_ADMIN_PASSWORD` | `admin` on the Wazuh indexer                    |
| `$WAZUH_MANAGER_WUI_PASSWORD`   | `wazuh-internal-client` on the Wazuh server API |

Load them into your shell before running the examples. The indexer publishes the `admin` password in
`/etc/wazuh-indexer/export/credentials.env` on the indexer host, and the manager publishes the
`wazuh-internal-client` password in `/etc/wazuh-manager/export/credentials.env` on the manager host:

```bash
WAZUH_INDEXER_ADMIN_PASSWORD=$(sudo grep '^WAZUH_INDEXER_ADMIN_PASSWORD=' /etc/wazuh-indexer/export/credentials.env | cut -d= -f2- | tr -d '\"')
WAZUH_MANAGER_WUI_PASSWORD=$(sudo grep '^WAZUH_MANAGER_WUI_PASSWORD=' /etc/wazuh-manager/export/credentials.env | cut -d= -f2- | tr -d '\"')
```

`source` cannot read the files directly: they are readable by root only, and `source` is a shell
builtin, so `sudo` cannot run it. Run the examples as root instead if you prefer.

On a host without those files, substitute the passwords directly. See [Credentials](getting-started/credentials.md).
