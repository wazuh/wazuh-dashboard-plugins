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
`wazuh-dashboard` user and group, and the dashboard CA in `/etc/wazuh-dashboard/ca/` and
`/etc/wazuh-dashboard/export/`. There is no purge on RPM, so the rest of the configuration directory
`/etc/wazuh-dashboard/` is kept: the certificates with their private keys, the peer CAs,
`local.env`, the keystore, and any `*.rpmsave` file. A modified `/etc/default/wazuh-dashboard` is kept as
`/etc/default/wazuh-dashboard.rpmsave`.

Before it removes the user and group, the package makes `root` the owner of what it kept and
removes group and other access from it. The freed user ID can later be given to another account,
but that account cannot read the files left behind. The removal prints:

```
Kept /etc/wazuh-dashboard, owned by root. Reinstalling wazuh-dashboard takes it back.
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

Installing the package again takes `/etc/wazuh-dashboard/` back, and the dashboard starts with the
certificate pair, peer CAs and keystore it kept. The dashboard CA and `export/ca.pem` are not
restored: commands that use `--cacert /etc/wazuh-dashboard/export/ca.pem` fail, and browsers keep
trusting the old CA only if they imported it before. To keep the CA, back up
`/etc/wazuh-dashboard/ca/` and `export/` before removing the package and put them back before
reinstalling.

To delete everything the removal kept:

```bash
rm -rf /etc/wazuh-dashboard/
rm -f /etc/default/wazuh-dashboard.rpmsave
```

This cannot be undone: it deletes the certificates' private keys and the keystore.

## Other Wazuh components

The dashboard owns only `/etc/wazuh-dashboard/`. Removing or purging it never touches the
configuration directory of another Wazuh component, such as `/etc/wazuh-indexer/` or
`/etc/wazuh-manager/`. Removing the RPM package also deletes the dashboard CA (`ca/`) and its
published copy (`export/`). See [Credentials](getting-started/credentials.md#upgrades-and-removal).

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
