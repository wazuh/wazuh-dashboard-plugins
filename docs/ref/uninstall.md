# Uninstalling the Wazuh dashboard

Follow the steps below to uninstall the Wazuh dashboard using your package manager.

> **Note**: You need root user privileges to run all the commands described below.

## Stop and disable the service

Stop the service before removing the package, and disable it so it does not start again on a
future reinstall before the configuration is ready:

**Systemd:**

```bash
systemctl stop wazuh-dashboard
systemctl disable wazuh-dashboard
```

**SysV init:**

```bash
service wazuh-dashboard stop
chkconfig wazuh-dashboard off  # or: update-rc.d -f wazuh-dashboard remove
```

## Remove the Wazuh dashboard installation

**APT**

```bash
apt-get remove --purge wazuh-dashboard -y
```

Purging deletes the installation (`/usr/share/wazuh-dashboard/`), the configuration
(`/etc/wazuh-dashboard/`, including the certificates and the keystore) and the `wazuh-dashboard`
user and group. Nothing is left to delete by hand.

To keep the configuration for a later reinstall, remove the package without purging it:
`apt-get remove wazuh-dashboard -y`. This keeps `/etc/wazuh-dashboard/` and the `wazuh-dashboard`
user and group.

**Yum**

```bash
yum remove wazuh-dashboard -y
```

**DNF**

```bash
dnf remove wazuh-dashboard -y
```

Removing the RPM package deletes the installation (`/usr/share/wazuh-dashboard/`) and the
`wazuh-dashboard` user and group. There is no purge on RPM, so the configuration directory
`/etc/wazuh-dashboard/` is kept: the certificates with their private keys, the keystore, and any
`*.rpmsave` file. A modified `/etc/default/wazuh-dashboard` is kept as
`/etc/default/wazuh-dashboard.rpmsave`.

Before it removes the user and group, the package makes `root` the owner of what it kept and
removes group and other access from it. The freed user ID can later be given to another account,
but that account cannot read the files left behind. The removal prints:

```
Kept /etc/wazuh-dashboard, now owned by root. Reinstalling wazuh-dashboard takes it back.
```

If a file cannot be given to `root`, for example because the directory is on a read-only file
system, the removal names the directory instead, and still removes the user and group:

```
Some files under /etc/wazuh-dashboard could not be handed over to root; they keep the ID of the removed wazuh-dashboard user.
```

Give those files to `root` yourself once the file system is writable:

```bash
chown -R root:root /etc/wazuh-dashboard/
chmod -R go-rwx /etc/wazuh-dashboard/
```

Installing the package again gives `/etc/wazuh-dashboard/` back to the `wazuh-dashboard` user.

To delete everything the removal kept:

```bash
rm -rf /etc/wazuh-dashboard/
rm -f /etc/default/wazuh-dashboard.rpmsave
```

This cannot be undone: it deletes the certificates' private keys and the keystore.

## Shared credentials

The Wazuh indexer, manager and dashboard share `/etc/wazuh`, which holds the credentials file
(`credentials.env`) and the default directory of the shared root CA (`ca/`). Purging the dashboard
(`apt-get remove --purge`, or removing the RPM package) removes `/etc/wazuh` only when neither
`wazuh-indexer` nor `wazuh-manager` is still installed on the host. On Debian-based systems, a
package removed without purging its configuration files still counts as installed. A CA relocated
with `WAZUH_CA_DIR` is not removed. See [Credentials](getting-started/credentials.md#upgrades-and-removal).

## Leftovers on the Wazuh indexer

Removing or purging the `wazuh-dashboard` package only touches this host's files. It never
connects to the Wazuh indexer, so everything the dashboard stored there survives the uninstall:

- The OpenSearch Dashboards index, with the index patterns, dashboards and visualizations created
  by Health Check, and the hidden `wazuh-check-updates-*` saved objects. See
  [Persistence](architecture.md#persistence).
- The `wazuh-ai-assistant-sessions` data stream, if the AI Assistant plugin was installed.
- The notification channel configurations (`default_slack_channel`, `default_pagerduty_channel`,
  `default_jira_channel`, `default_shuffle_channel`, and any custom channel), stored by the
  Notifications plugin. See [Notifications and Alerting](modules/notifications-alerting.md).

Delete these through the Wazuh indexer directly (for example, `DELETE` the OpenSearch Dashboards
index or data stream) if they must not outlive the dashboard installation that created them.
