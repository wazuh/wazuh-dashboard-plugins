# Uninstalling the Wazuh dashboard

Follow the steps below to uninstall the Wazuh dashboard package.

## Remove the Wazuh dashboard installation

**Debian-based platforms:**

```bash
sudo dpkg --purge wazuh-dashboard
sudo rm -rf /var/lib/wazuh-dashboard/
sudo rm -rf /usr/share/wazuh-dashboard/
sudo rm -rf /etc/wazuh-dashboard/
```

**Red Hat-based platforms:**

```bash
sudo rpm -e wazuh-dashboard
sudo rm -rf /var/lib/wazuh-dashboard/
sudo rm -rf /usr/share/wazuh-dashboard/
sudo rm -rf /etc/wazuh-dashboard/
```
