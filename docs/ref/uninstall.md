# Uninstall

Remove the Wazuh dashboard installation.

- RPM-based operating system:

```console
sudo yum remove wazuh-dashboard -y
sudo rm -rf /var/lib/wazuh-dashboard/
sudo rm -rf /usr/share/wazuh-dashboard/
sudo rm -rf /etc/wazuh-dashboard/
```

- Debian-based operating system:

```console
sudo apt-get remove --purge wazuh-dashboard -y
```
