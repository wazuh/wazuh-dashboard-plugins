# Custom Wazuh Data Path Configuration

## Overview

Starting with Wazuh v4.14.0, you can configure a custom data directory path for Wazuh files using OpenSearch Dashboards' native `path.data` configuration setting. This feature allows you to specify where Wazuh stores its configuration files, downloads, and reports.

## Prerequisites

- Wazuh v4.14.0 or later
- Administrative access to the Wazuh Dashboard server
- Write permissions to the desired custom data directory

## ⚠️ Important Considerations

- **Backup**: Always backup your current configuration before making changes
- **Service Restart**: The Wazuh Dashboard service must be restarted for changes to take effect
- **Permissions**: Ensure proper file system permissions are set on the custom directory
- **Disk Space**: Verify sufficient disk space is available in the target location

## Default Behavior

When `path.data` is not configured, Wazuh uses the default location:

```
/usr/share/wazuh-dashboard/data/wazuh/
├── config/
│   └── wazuh.yml
└── downloads/
    └── reports/
```

## Configuration Steps

### Step 1: Choose Your Custom Path

Select an appropriate directory for your Wazuh data. Common choices:

- **Linux/Unix**: `/var/lib/wazuh-dashboard/data`
- **Docker**: `/wazuh-dashboard-data`
- **Custom**: Any directory with proper permissions

### Step 2: Create and Set Permissions

Create the directory and set appropriate permissions:

```bash
# Create the directory
sudo mkdir -p /var/lib/wazuh-dashboard/data

# Set ownership and permissions
sudo chown -R wazuh-dashboard:wazuh-dashboard /var/lib/wazuh-dashboard/data
sudo chmod -R 755 /var/lib/wazuh-dashboard/data
```

### Step 3: Edit Configuration File

Edit your OpenSearch Dashboards configuration file:

**Production environments:**

```bash
sudo nano /etc/wazuh-dashboard/opensearch_dashboards.yml
```

**Development environments:**

```bash
nano opensearch_dashboards.yml
```

### Step 4: Add path.data Setting

Add or modify the `path.data` setting in the configuration file:

```yaml
# Custom data directory
path.data: /var/lib/wazuh-dashboard/data
```

### Step 5: Restart Wazuh Dashboard

Restart the service to apply changes:

```bash
sudo systemctl restart wazuh-dashboard
```

### Step 6: Verify Configuration

Check that Wazuh created the directory structure:

```bash
ls -la /var/lib/wazuh-dashboard/data/wazuh/
```

You should see:

```
drwxr-xr-x wazuh-dashboard wazuh-dashboard config/
drwxr-xr-x wazuh-dashboard wazuh-dashboard downloads/
```

Check the Wazuh Dashboard logs for any errors:

```bash
sudo tail -f /var/log/wazuh-dashboard/wazuh-dashboard.log
```

## Configuration Examples

### Standard Production Setup

```yaml
# /etc/wazuh-dashboard/opensearch_dashboards.yml
path.data: /var/lib/wazuh-dashboard/data
```

**Result**: Wazuh files at `/var/lib/wazuh-dashboard/data/wazuh/`

### Docker Container

```yaml
# opensearch_dashboards.yml
path.data: /usr/share/wazuh-dashboard/data
```

**Result**: Wazuh files at `/usr/share/wazuh-dashboard/data/wazuh/`

### Network Storage

```yaml
# opensearch_dashboards.yml
path.data: /mnt/shared-storage/wazuh-dashboard
```

**Result**: Wazuh files at `/mnt/shared-storage/wazuh-dashboard/wazuh/`

## Directory Structure Created

Wazuh automatically creates this structure within your specified `path.data`:

```
<path.data>/wazuh/
├── config/
│   └── wazuh.yml          # Main Wazuh configuration
└── downloads/
    └── reports/           # Generated PDF reports
```

## Migration from Default Location

If you're migrating from the default location:

### Option 1: Copy Existing Data

```bash
# Stop Wazuh Dashboard
sudo systemctl stop wazuh-dashboard

# Copy existing data to new location
sudo cp -r /usr/share/wazuh-dashboard/data/wazuh/* /var/lib/wazuh-dashboard/data/wazuh/

# Set permissions
sudo chown -R wazuh-dashboard:wazuh-dashboard /var/lib/wazuh-dashboard/data

# Update configuration and restart
sudo systemctl start wazuh-dashboard
```

### Option 2: Fresh Start

Simply configure the new path and let Wazuh create new files with default settings.

## Troubleshooting

### Service Fails to Start

**Check permissions:**

```bash
ls -la /var/lib/wazuh-dashboard/data/
sudo chown -R wazuh-dashboard:wazuh-dashboard /var/lib/wazuh-dashboard/data
```

**Check disk space:**

```bash
df -h /var/lib/wazuh-dashboard/data
```

**Check logs:**

```bash
sudo journalctl -u wazuh-dashboard -f
```

### Directory Not Created

Verify the path.data setting in your configuration:

```bash
grep "path.data" /etc/wazuh-dashboard/opensearch_dashboards.yml
```

Ensure the parent directory exists and is writable:

```bash
sudo mkdir -p /var/lib/wazuh-dashboard
sudo chown wazuh-dashboard:wazuh-dashboard /var/lib/wazuh-dashboard
```

### Configuration Not Applied

- Verify you edited the correct configuration file
- Ensure the YAML syntax is correct (spaces, not tabs)
- Restart the service after changes
- Check for typos in the path

## Benefits

- **Centralized Storage**: Keep all Wazuh data in one organized location
- **Easy Backup**: Simplifies backup and restore procedures
- **Flexible Deployment**: Works with containers, network storage, and custom setups
- **No Service Modifications**: Uses standard OpenSearch Dashboards configuration
- **Backward Compatible**: Existing installations continue to work unchanged

## Security Considerations

- Ensure the custom directory has appropriate file system permissions
- Consider encryption if storing on network-attached storage
- Regular backup of the custom data directory is recommended
- Monitor disk usage to prevent storage exhaustion

## References

- **Issue**: [#7579](https://github.com/wazuh/wazuh-dashboard-plugins/issues/7579) - Configure Wazuh data directory using OpenSearch Dashboards path.data setting
- **Pull Request**: [#7586](https://github.com/wazuh/wazuh-dashboard-plugins/pull/7586) - Implementation Details
- **Feature Available**: Wazuh v4.14.0
