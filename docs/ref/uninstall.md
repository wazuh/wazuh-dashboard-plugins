# Uninstalling the Wazuh dashboard

Follow the step below to uninstall the Wazuh dashboard using your package manager.

The Wazuh indexer, manager and dashboard share `/etc/wazuh`, which holds the credentials file
(`credentials.env`) and the default directory of the shared root CA (`ca/`). Purging the dashboard
(`apt-get remove --purge`, or removing the RPM package) removes `/etc/wazuh` only when neither
`wazuh-indexer` nor `wazuh-manager` is still installed on the host. On Debian-based systems, a
package removed without purging its configuration files still counts as installed. A CA relocated
with `WAZUH_CA_DIR` is not removed. See [Credentials](getting-started/credentials.md#upgrades-and-removal).

## Remove the Wazuh dashboard installation.

**APT**

```bash
apt-get remove --purge wazuh-dashboard -y
```

**Yum**

```bash
yum remove wazuh-dashboard -y
rm -rf /var/lib/wazuh-dashboard/
rm -rf /usr/share/wazuh-dashboard/
rm -rf /etc/wazuh-dashboard/
```

**DNF**

```bash
dnf remove wazuh-dashboard -y
rm -rf /var/lib/wazuh-dashboard/
rm -rf /usr/share/wazuh-dashboard/
rm -rf /etc/wazuh-dashboard/
```
