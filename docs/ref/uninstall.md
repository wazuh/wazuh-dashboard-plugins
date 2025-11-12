# Uninstalling the Wazuh dashboard

Follow the step below to uninstall the Wazuh dashboard using your package manager.

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
