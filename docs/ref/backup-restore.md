# Backup and restore

This guide focuses on the assets managed by the Wazuh dashboard itself.

## What to back up

- Dashboard configuration: `/etc/wazuh-dashboard/opensearch_dashboards.yml`
- Dashboard NodeJS options: `/etc/wazuh-dashboard/node.options`
- Dashboard keystore: `/etc/wazuh-dashboard/opensearch_dashboards.keystore`
- TLS certificates: `/etc/wazuh-dashboard/certs/`
- Shared Wazuh root CA, when this host created it: `/etc/wazuh/ca/` (see [Credentials](getting-started/credentials.md#certificates)). It is shared with the other Wazuh components on the host, and its private key can issue certificates they trust. Back up the directory as a whole: it includes the `.wazuh-dashboard-bootstrap-ca` marker, which records that this dashboard created the CA.
- Saved objects exported from the UI (dashboards, visualizations, index patterns)
- Custom assets

## Creating a backup

To create a backup of the Wazuh dashboard, follow these steps:

1. Create the backup directory

```
backup_folder=~/wazuh_dashboard_backup/$(date +%Y%m%d-%H%M%S)
mkdir -p $backup_folder && echo $backup_folder
```

2. Back up the configuration and certificates

```
rsync -aREz \
/etc/wazuh-dashboard/opensearch_dashboards.yml \
/etc/wazuh-dashboard/node.options \
/etc/wazuh-dashboard/opensearch_dashboards.keystore \
/etc/wazuh-dashboard/certs/ \
$backup_folder
```

> **Note:** The keystore holds the `kibanaserver` and `wazuh-wui` passwords and the AI Assistant
> encryption key (`wazuh_ai_assistant.encryptionKey`). Without that key, the provider API keys
> stored by the AI Assistant cannot be decrypted, so keep the keystore backup as protected as the
> passwords themselves. `/etc/wazuh/credentials.env` does not need to be backed up for the
> dashboard: once the passwords are in the keystore, the dashboard does not read it again.

3. Export the saved objects

3.1. Create the **saved_objects** directory

```
mkdir -p "$backup_folder/saved_objects"
```

> Note: if multitenancy is used, exportthe saved objects of each tenant repeating the following steps, consider separating in directories by tenant.

3.2. Open **Dashboard management** > **Dashboards Management** > **Saved objects**.

3.3. Export the required objects, or use **Export all objects**. Choose as destination the **saved_objects** directory.

4. Custom assets

If the dashboard is serving custom assets (i.e. images for UI customization), copy these files to the $backup_folder directory.

```
rsync -aREz \
<PATH_TO_FILE> \
$backup_folder
```

5. Archive the files

```
tar -cvzf wazuh-dashboard-backup.tar.gz $backup_folder
```

## Restore

1. Stop the target Wazuh dashboard

**Systemd:**

```
systemctl stop wazuh-dashboard
```

**SysV init:**

```
service wazuh-dashboard stop
```

2. Decompress the files

Decompress the backup files and change the current working directory to the directory based on the date and time of the backup files:

```
tar -xzvf wazuh-dashboard-backup.tar.gz
cd $backup_destination_folder
```

3. Restore the files:

```
cp etc/wazuh-dashboard/opensearch_dashboards.yml /etc/wazuh-dashboard/opensearch_dashboards.yml
cp etc/wazuh-dashboard/node.options /etc/wazuh-dashboard/node.options
cp etc/wazuh-dashboard/opensearch_dashboards.keystore /etc/wazuh-dashboard/opensearch_dashboards.keystore
cp -r etc/wazuh-dashboard/certs/ /etc/wazuh-dashboard/certs/
chown wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/opensearch_dashboards.yml
chown wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/node.options
chown wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/opensearch_dashboards.keystore
chown -R wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/certs
chmod 500 /etc/wazuh-dashboard/certs
chmod 400 /etc/wazuh-dashboard/certs/*
```

The restored keystore entries take precedence over `/etc/wazuh/credentials.env`, so the dashboard
uses the restored passwords. If the passwords changed since the backup, update them as described in
[Rotation](getting-started/credentials.md#rotation).

4. Restore the custom assets files

If some custom asset was backed, then for each one:

```
cp <path/to/asset/> <destination_path>
chown wazuh-dashboard:wazuh-dashboard <destination_path>
```

5. Restart the service:

**Systemd:**

```
systemctl restart wazuh-dashboard
```

**SysV init:**

```
service wazuh-dashboard restart
```

6. Import saved objects from **Dashboard management** > **Dashboards Management** > **Saved objects**.

Import the saved object stored in `$backup_folder`. If using multitenancy, import the related saved objects into each tenant.
