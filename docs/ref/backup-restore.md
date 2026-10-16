# Backup and restore

This guide focuses on the assets managed by the Wazuh dashboard itself.

## What to back up

- Dashboard configuration: `/etc/wazuh-dashboard/opensearch_dashboards.yml`
- Dashboard NodeJS options: `/etc/wazuh-dashboard/node.options`
- Dashboard keystore: `/etc/wazuh-dashboard/opensearch_dashboards.keystore`
- TLS certificates and peer CAs: `/etc/wazuh-dashboard/certs/`, including the
  `.indexer-ca.imported` and `.manager-ca.imported` markers
- Dashboard CA: `/etc/wazuh-dashboard/ca/` and `/etc/wazuh-dashboard/export/` (see
  [Credentials](getting-started/credentials.md#certificates)). Back up `ca/` as a whole: it includes
  the `.wazuh-dashboard-bootstrap-ca` marker, which records that this dashboard created the CA.
- Operator values, if any: `/etc/wazuh-dashboard/local.env`
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
/etc/wazuh-dashboard/ca/ \
/etc/wazuh-dashboard/export/ \
$backup_folder
[ -f /etc/wazuh-dashboard/local.env ] && rsync -aREz /etc/wazuh-dashboard/local.env $backup_folder
```

> **Note:** The keystore holds the `kibanaserver` and `wazuh-internal-client` passwords and the AI Assistant
> encryption key (`wazuh_ai_assistant.encryptionKey`). Without that key, the provider API keys
> stored by the AI Assistant cannot be decrypted, so keep the keystore backup as protected as the
> passwords themselves. `ca/root-ca.key` can issue certificates that browsers trusting the
> dashboard CA accept: protect the backup accordingly.

3. Export the saved objects

3.1. Create the **saved_objects** directory

```
mkdir -p "$backup_folder/saved_objects"
```

> Note: if multitenancy is used, export the saved objects of each tenant repeating the following steps, consider separating in directories by tenant.

3.2. Open **Dashboard management > Dashboards Management > Saved objects**.

3.3. Export the required objects, or use **Export all objects**. Choose as destination the **saved_objects** directory.

> **Note:** **Export all objects** does not include hidden saved object types, such as the
> `wazuh-check-updates-*` objects created by `wazuh-check-updates` (see
> [Persistence](architecture.md#persistence)) — they are not listed in **Saved objects**
> management and have no export option there. The only way to back them up is an index or
> snapshot backup of the OpenSearch Dashboards index itself, through the Wazuh indexer.

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
backup_destination_folder=$(tar -tzf wazuh-dashboard-backup.tar.gz | head -1)
cd $backup_destination_folder
```

3. Restore the files:

```
cp etc/wazuh-dashboard/opensearch_dashboards.yml /etc/wazuh-dashboard/opensearch_dashboards.yml
cp etc/wazuh-dashboard/node.options /etc/wazuh-dashboard/node.options
cp etc/wazuh-dashboard/opensearch_dashboards.keystore /etc/wazuh-dashboard/opensearch_dashboards.keystore
cp -a etc/wazuh-dashboard/certs/. /etc/wazuh-dashboard/certs/
cp -a etc/wazuh-dashboard/ca/. /etc/wazuh-dashboard/ca/
cp -a etc/wazuh-dashboard/export/. /etc/wazuh-dashboard/export/
[ -f etc/wazuh-dashboard/local.env ] && cp -a etc/wazuh-dashboard/local.env /etc/wazuh-dashboard/local.env
chown root:wazuh-dashboard /etc/wazuh-dashboard/opensearch_dashboards.yml /etc/wazuh-dashboard/node.options /etc/wazuh-dashboard/opensearch_dashboards.keystore
chmod 640 /etc/wazuh-dashboard/opensearch_dashboards.yml /etc/wazuh-dashboard/node.options /etc/wazuh-dashboard/opensearch_dashboards.keystore
chown -R root:wazuh-dashboard /etc/wazuh-dashboard/certs
chmod 750 /etc/wazuh-dashboard/certs
find /etc/wazuh-dashboard/certs -type f -exec chmod 640 {} +
chown -R root:root /etc/wazuh-dashboard/ca /etc/wazuh-dashboard/export
chmod 700 /etc/wazuh-dashboard/ca /etc/wazuh-dashboard/export
```

`cp -a` keeps the ownership and permissions the backup preserved, including the
`.wazuh-dashboard-bootstrap-ca` and import markers. The dashboard refuses to start with any of
these files owned by another user or writable by one (`UNSAFE`).

The restored keystore entries take precedence over `local.env` and the peers' `export/`, so the dashboard
uses the restored passwords. If the passwords changed since the backup, update them as described in
[Rotation](getting-started/credentials.md#rotation).

4. Restore the custom assets files

If some custom asset was backed, then for each one:

```
cp <path/to/asset/> <destination_path>
chown root:root <destination_path>
```

Custom assets hosted in the dashboard server (see [Custom branding](custom-branding/custom-branding.md#host-the-images-in-the-dashboard-server))
live under `/usr/share/wazuh-dashboard/`, which the package installs as `root:root` — matching
ownership here keeps it consistent with the rest of that tree.

5. Restart the service:

**Systemd:**

```
systemctl restart wazuh-dashboard
```

**SysV init:**

```
service wazuh-dashboard restart
```

6. Import saved objects from **Dashboard management > Dashboards Management > Saved objects**.

Import the saved object stored in `$backup_folder`. If using multitenancy, import the related saved objects into each tenant.
