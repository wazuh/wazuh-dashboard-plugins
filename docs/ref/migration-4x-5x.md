# Migration guide (4.x to 5.x)

This comprehensive guide covers migrating the Wazuh dashboard plugins from version 4.x to 5.x, including breaking changes, configuration updates, and troubleshooting steps.

## Overview

Wazuh 5.x introduces significant changes to the dashboard plugins architecture and configuration:

- **Platform upgrade**: Migration from Kibana/OpenSearch Dashboards 2.x to OpenSearch Dashboards 3.x
- **Configuration changes**: Settings relocated from `wazuh.yml` to `opensearch_dashboards.yml`
- **Plugin restructure**: Core functionality split into modular plugins (`wazuh-core`, `wazuh-check-updates`)
- **Index pattern updates**: New default pattern `wazuh-events*` replacing `wazuh-alerts-*`
- **UI modernization**: Removal of legacy interfaces and deprecated features
- **Security enhancements**: Updated authentication and authorization mechanisms

## Compatibility matrix

| Wazuh Version | Dashboard Platform        | Indexer Version | Manager Version |
| ------------- | ------------------------- | --------------- | --------------- |
| 4.x           | OpenSearch Dashboards 2.x | OpenSearch 2.x  | Wazuh 4.x       |
| 5.0.x         | OpenSearch Dashboards 3.x | OpenSearch 3.x  | Wazuh 5.x       |

> **Important**: All Wazuh stack components (indexer, manager, dashboard) must be upgraded to 5.x together. Mixed-version deployments are not supported.

---

## Pre-migration preparation

### 1. Review system requirements

Verify your system meets 5.x requirements:

- **OS**: Supported Linux distribution (see [Requirements](getting-started/requirements.md))
- **Hardware**: Minimum 4 GB RAM, 8 GB recommended
- **Network**: Connectivity to upgraded indexer and manager
- **Certificates**: Valid TLS certificates compatible with OpenSearch 3.x

### 2. Back up critical data

Before starting the migration:

#### Back up saved objects

1. Navigate to **☰ Menu > Dashboard Management > Saved objects**
2. Click **Export all**
3. Save the exported `.ndjson` file to a safe location
4. Alternatively, use the API:

   ```bash
   curl -X POST "https://localhost:5601/api/saved_objects/_export" \
     -H "osd-xsrf: true" \
     -H "Content-Type: application/json" \
     -u admin:admin \
     -d '{"type": ["dashboard", "visualization", "search", "index-pattern"]}' \
     -o saved-objects-backup-$(date +%Y%m%d).ndjson
   ```

#### Back up configuration files

```bash
# Dashboard configuration
sudo cp -a /etc/wazuh-dashboard/ /root/backup-wazuh-dashboard-$(date +%Y%m%d)/

# Plugin-specific config (if exists)
sudo cp /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml \
   /root/backup-wazuh-config-$(date +%Y%m%d).yml
```

#### Back up certificates

```bash
sudo cp -a /etc/wazuh-dashboard/certs/ /root/backup-certs-$(date +%Y%m%d)/
```

#### Document custom settings

Record any custom configuration:

```bash
# Extract custom settings from opensearch_dashboards.yml
grep -v "^#" /etc/wazuh-dashboard/opensearch_dashboards.yml | grep -v "^$" \
  > custom-settings-$(date +%Y%m%d).txt
```

### 3. Review breaking changes

Review the full [CHANGELOG](../../CHANGELOG.md) and note:

- Deprecated settings that must be removed
- Renamed configuration keys
- Removed features you may be using
- New required configurations

---

## Breaking changes in 5.x

### Configuration file changes

#### wazuh.yml deprecated

The standalone `wazuh.yml` configuration file is **removed** in 5.x. All plugin settings have been moved to:

1. **`opensearch_dashboards.yml`** - Core settings
2. **Advanced Settings UI** - Tenant-level preferences

**Migration path**:

**4.x (`/usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml`):**

```yaml
hosts:
  - id: default
    url: https://wazuh-manager
    port: 55000
    username: wazuh-wui
    password: wazuh-wui
    run_as: false

pattern: wazuh-alerts-*

timeout: 20000

api.selector: true

ip.selector: true
```

**5.x (`/etc/wazuh-dashboard/opensearch_dashboards.yml`):**

```yaml
wazuh_core.hosts:
  default:
    url: https://wazuh-manager
    port: 55000
    username: wazuh-wui
    password: wazuh-wui
    run_as: false
```

**5.x (Advanced Settings UI):**

- Navigate to **☰ Menu > Dashboard Management > Advanced Settings**
- Configure tenant-level settings:
  - `timeout`: 20000
  - Other UI preferences

#### Index pattern changes

| 4.x Setting                | 5.x Equivalent    | Notes                                 |
| -------------------------- | ----------------- | ------------------------------------- |
| `pattern: wazuh-alerts-*`  | `wazuh-events*`   | Default changed; update if customized |
| `wazuh.monitoring.pattern` | Advanced Settings | Configure in UI, not config file      |

#### Removed settings

These settings are **no longer supported** and must be removed:

```yaml
# Removed in 5.x - do NOT include
customization.enabled: true
customization.logo.app: /custom/logo.svg
customization.logo.healthcheck: /custom/healthcheck.svg
wazuh.monitoring.creation: h
wazuh.monitoring.shards: 1
wazuh.monitoring.replicas: 0
admin: true
```

**Replacement**:

- **Custom branding**: Use `opensearchDashboards.branding.*` (see [Custom Branding](custom-branding.md))
- **Monitoring**: Configured via index lifecycle management
- **Admin mode**: Replaced by role-based access control

### Plugin architecture changes

#### New plugin structure

| 4.x                   | 5.x                                                          |
| --------------------- | ------------------------------------------------------------ |
| Single `wazuh` plugin | `wazuh` (main), `wazuh-core` (shared), `wazuh-check-updates` |

**Impact**: Plugin dependencies are automatically managed. No manual action required.

#### API changes

If you have custom scripts or integrations:

| 4.x Endpoint         | 5.x Equivalent                     |
| -------------------- | ---------------------------------- |
| `/api/status`        | `/api/wazuh-core/status`           |
| `/api/check-updates` | `/api/wazuh-check-updates/updates` |
| `/api/timestamp`     | `/api/wazuh-core/timestamp`        |

### UI changes

#### Removed features

- **Legacy App Settings**: Use **☰ Menu > Dashboard Management > Advanced Settings** or `opensearch_dashboards.yml`
- **Dev Tools integration**: Use native OpenSearch Dashboards Dev Tools
- **Deprecated modules**: Some 4.x experimental modules removed

#### Renamed navigation paths

| 4.x Path                   | 5.x Path                                 |
| -------------------------- | ---------------------------------------- |
| `/app/wazuh#/overview`     | `/app/wz-home`                           |
| `/app/wazuh#/settings`     | Dashboard Management > Advanced Settings |
| `/app/wazuh#/health-check` | **☰ Menu > Management > Health Check**   |

---

## Migration steps

### Step 1: Upgrade stack components in order

Follow this sequence to avoid compatibility issues:

#### 1.1 Upgrade Wazuh indexer (first)

```bash
# Stop Wazuh dashboard first
sudo systemctl stop wazuh-dashboard

# Upgrade indexer
sudo apt-get update && sudo apt-get install wazuh-indexer=5.0.0-1  # Debian/Ubuntu
# OR
sudo yum install wazuh-indexer-5.0.0-1  # RHEL/CentOS

# Restart indexer
sudo systemctl restart wazuh-indexer

# Verify indexer health
curl -k -u admin:admin https://localhost:9200/_cluster/health?pretty
```

#### 1.2 Upgrade Wazuh manager (second)

```bash
# Upgrade manager
sudo apt-get install wazuh-manager=5.0.0-1  # Debian/Ubuntu
# OR
sudo yum install wazuh-manager-5.0.0-1  # RHEL/CentOS

# Restart manager
sudo systemctl restart wazuh-manager

# Verify manager status
sudo systemctl status wazuh-manager
```

#### 1.3 Upgrade Wazuh dashboard (last)

```bash
# Upgrade dashboard package
sudo apt-get install wazuh-dashboard=5.0.0-1  # Debian/Ubuntu
# OR
sudo yum install wazuh-dashboard-5.0.0-1  # RHEL/CentOS

# Do NOT start yet - configure first
```

### Step 2: Migrate configuration

#### 2.1 Update opensearch_dashboards.yml

Edit `/etc/wazuh-dashboard/opensearch_dashboards.yml`:

```bash
sudo nano /etc/wazuh-dashboard/opensearch_dashboards.yml
```

**Required changes**:

1. **Update server settings** (if customized):

   ```yaml
   server.host: '0.0.0.0'
   server.port: 443
   server.name: 'wazuh-dashboard'
   ```

2. **Update indexer connection**:

   ```yaml
   opensearch.hosts: ['https://localhost:9200']
   opensearch.ssl.verificationMode: certificate
   ```

3. **Add Wazuh API configuration** (migrated from wazuh.yml):

   ```yaml
   wazuh_core.hosts:
     default:
       url: https://localhost
       port: 55000
       username: wazuh-wui
       password: wazuh-wui
       run_as: false
   ```

4. **Set default route**:

   ```yaml
   opensearchDashboards.defaultAppId: wz-home
   ```

5. **Remove deprecated settings** (if present):

   Remove any lines containing:

   - `customization.*`
   - `wazuh.monitoring.*`
   - `admin`

#### 2.2 Update certificate paths (if changed)

Verify certificate paths in `opensearch_dashboards.yml`:

```yaml
server.ssl.enabled: true
server.ssl.certificate: /etc/wazuh-dashboard/certs/dashboard.crt
server.ssl.key: /etc/wazuh-dashboard/certs/dashboard.key

opensearch.ssl.certificateAuthorities:
  ['/etc/wazuh-dashboard/certs/root-ca.pem']
```

#### 2.3 Apply custom branding (if used in 4.x)

Migrate `customization.*` settings to OpenSearch Dashboards branding:

**4.x custom branding:**

```yaml
# Old - remove from config
customization.enabled: true
customization.logo.app: /custom/logo.svg
```

**5.x branding:**

```yaml
opensearchDashboards.branding.logo:
  defaultUrl: 'https://example.com/logo.svg'
opensearchDashboards.branding.mark:
  defaultUrl: 'https://example.com/icon.svg'
opensearchDashboards.branding.applicationTitle: 'Custom Security Dashboard'
```

See [Custom Branding](custom-branding.md) for complete guide.

### Step 3: Update file permissions

```bash
# Ensure correct ownership
sudo chown -R wazuh-dashboard:wazuh-dashboard /usr/share/wazuh-dashboard/
sudo chown -R wazuh-dashboard:wazuh-dashboard /etc/wazuh-dashboard/
sudo chown -R wazuh-dashboard:wazuh-dashboard /var/lib/wazuh-dashboard/

# Set secure permissions
sudo chmod 640 /etc/wazuh-dashboard/opensearch_dashboards.yml
sudo chmod 600 /etc/wazuh-dashboard/certs/*.key
```

### Step 4: Start and verify dashboard

```bash
# Start dashboard
sudo systemctl daemon-reload
sudo systemctl enable wazuh-dashboard
sudo systemctl start wazuh-dashboard

# Monitor startup logs
sudo tail -f /var/log/wazuh-dashboard/opensearch_dashboards.log
```

Look for successful startup messages:

```
[info][server][OpenSearchDashboards] http server running at https://0.0.0.0:443
[info][plugins][wazuh] Wazuh plugin initialized
```

### Step 5: Import saved objects

1. Log in to the dashboard at `https://your-dashboard-ip/`
2. Navigate to **☰ Menu > Dashboard Management > Saved objects**
3. Click **Import**
4. Select your backed-up `.ndjson` file
5. Handle conflicts:
   - **Check for existing objects**: Recommended for most cases
   - **Automatically overwrite**: Use with caution
6. Click **Import**

---

## Post-migration validation

### 1. Verify dashboard functionality

✅ **Check list**:

- [ ] Dashboard loads at `/app/wz-home`
- [ ] Wazuh logo and branding appear correctly
- [ ] Navigation menu displays all modules
- [ ] Agents list loads successfully
- [ ] Events are displayed in Threat Hunting

### 2. Run health check

1. Navigate to **☰ Menu > Management > Health Check**
2. Click **Check**
3. Verify all checks pass:
   - ✅ API connection
   - ✅ Indexer connection
   - ✅ Plugin status
   - ✅ Index patterns
   - ✅ Template verification

### 3. Validate API connections

Test Wazuh manager API connectivity:

```bash
# From dashboard server
curl -k -u wazuh-wui:wazuh-wui https://localhost:55000/
```

Expected response:

```json
{
  "data": {
    "title": "Wazuh API REST",
    "api_version": "5.0.0",
    "revision": 50000,
    "hostname": "wazuh-manager",
    "timestamp": "2026-02-24T10:00:00Z"
  }
}
```

### 4. Verify index patterns

Navigate to **☰ Menu > Dashboard Management > Index patterns**:

- Default pattern `wazuh-events*` exists
- Time field is `timestamp`
- Field mappings are loaded

### 5. Test notifications and alerting

If using external integrations:

1. Navigate to **☰ Menu > Explore > Notifications > Channels**
2. Verify migrated channels exist and are enabled
3. Send test messages to each channel
4. Check **☰ Menu > Explore > Alerting > Monitors**
5. Verify monitors are active

See [External Integrations](external-integrations.md) for reconfiguration if needed.

### 6. Validate agent enrollment

Test new agent enrollment:

```bash
# Use updated enrollment command with 5.x manager
curl -so wazuh-agent-5.0.0-1.deb \
  https://packages.wazuh.com/5.x/apt/pool/main/w/wazuh-agent/wazuh-agent_5.0.0-1_amd64.deb \
  && WAZUH_MANAGER='your-manager-ip' dpkg -i ./wazuh-agent-5.0.0-1.deb

sudo systemctl daemon-reload
sudo systemctl enable wazuh-agent
sudo systemctl start wazuh-agent
```

Verify agent appears in dashboard under **Agents**.

---

## Troubleshooting common migration issues

### Issue 1: Dashboard fails to start

**Symptoms**:

```
[error][savedobjects-service] Unable to connect to OpenSearch
```

**Solutions**:

1. **Verify indexer is running**:

   ```bash
   sudo systemctl status wazuh-indexer
   curl -k -u admin:admin https://localhost:9200/
   ```

2. **Check certificate paths**:

   ```bash
   ls -la /etc/wazuh-dashboard/certs/
   ```

3. **Test indexer connectivity**:

   ```bash
   openssl s_client -connect localhost:9200 -CAfile /etc/wazuh-dashboard/certs/root-ca.pem
   ```

4. **Review logs**:
   ```bash
   sudo tail -100 /var/log/wazuh-dashboard/opensearch_dashboards.log
   ```

### Issue 2: API connection errors

**Symptoms**:

```
Wazuh API is not reachable
```

**Solutions**:

1. **Verify API configuration** in `opensearch_dashboards.yml`:

   ```bash
   grep -A 10 "wazuh_core.hosts:" /etc/wazuh-dashboard/opensearch_dashboards.yml
   ```

2. **Test API manually**:

   ```bash
   curl -k -u wazuh-wui:wazuh-wui https://localhost:55000/
   ```

3. **Check manager firewall**:

   ```bash
   sudo firewall-cmd --list-all  # RHEL/CentOS
   sudo ufw status  # Ubuntu
   ```

4. **Verify API user credentials**:
   ```bash
   # On manager
   sudo /var/ossec/bin/wazuh-authd -P
   ```

### Issue 3: Missing saved objects

**Symptoms**: Dashboards or visualizations don't appear after migration.

**Solutions**:

1. **Re-import saved objects**:

   - Go to **Dashboard Management > Saved objects > Import**
   - Select backed-up `.ndjson` file
   - Choose **Automatically overwrite conflicts**

2. **Manually create index pattern** if missing:

   ```bash
   curl -X POST "https://localhost:5601/api/saved_objects/index-pattern/wazuh-events" \
     -H "osd-xsrf: true" \
     -H "Content-Type: application/json" \
     -u admin:admin \
     -d '{
       "attributes": {
         "title": "wazuh-events*",
         "timeFieldName": "timestamp"
       }
     }'
   ```

3. **Regenerate default objects**:
   - Navigate to **Management > Health Check**
   - Click **Check** to recreate missing templates and patterns

### Issue 4: Custom branding not working

**Symptoms**: Logos or colors from 4.x don't appear.

**Solution**:

Migrate to OpenSearch Dashboards branding in `opensearch_dashboards.yml`:

```yaml
opensearchDashboards.branding:
  logo:
    defaultUrl: 'https://your-cdn.com/logo.svg'
  mark:
    defaultUrl: 'https://your-cdn.com/icon.svg'
  applicationTitle: 'Your Custom Title'
  faviconUrl: 'https://your-cdn.com/favicon.ico'
  darkMode: false
```

See [Custom Branding](custom-branding.md).

### Issue 5: Plugins not loading

**Symptoms**:

```
[error][plugins] Failed to load plugin wazuh-core
```

**Solutions**:

1. **Reinstall plugins** (should auto-install with package):

   ```bash
   sudo /usr/share/wazuh-dashboard/bin/opensearch-dashboards-plugin list
   ```

2. **Verify plugin compatibility**:

   ```bash
   cat /usr/share/wazuh-dashboard/plugins/wazuh/package.json | grep -A 2 "opensearchDashboards"
   ```

3. **Reset plugins**:
   ```bash
   sudo systemctl stop wazuh-dashboard
   sudo rm -rf /usr/share/wazuh-dashboard/optimize/bundles/*
   sudo systemctl start wazuh-dashboard
   ```

### Issue 6: Performance degradation

**Symptoms**: Dashboard is slow or unresponsive after migration.

**Solutions**:

1. **Clear browser cache and cookies**

2. **Optimize OpenSearch indices**:

   ```bash
   curl -X POST "https://localhost:9200/wazuh-events*/_forcemerge?max_num_segments=1" \
     -u admin:admin -k
   ```

3. **Review resource allocation**:

   ```bash
   # Check memory usage
   free -h
   # Check disk space
   df -h
   ```

4. **Tune dashboard settings** in `opensearch_dashboards.yml`:

   ```yaml
   ops.interval: 10000 # Increase monitoring interval
   opensearch.requestTimeout: 60000 # Increase timeout
   ```

5. See [Performance](performance.md) guide.

---

## Rollback procedure

If migration fails and you need to rollback:

### 1. Stop 5.x dashboard

```bash
sudo systemctl stop wazuh-dashboard
```

### 2. Downgrade package

```bash
# Debian/Ubuntu
sudo apt-get install wazuh-dashboard=4.9.0-1 --allow-downgrades

# RHEL/CentOS
sudo yum downgrade wazuh-dashboard-4.9.0-1
```

### 3. Restore configuration

```bash
sudo rm -rf /etc/wazuh-dashboard/
sudo cp -a /root/backup-wazuh-dashboard-YYYYMMDD/ /etc/wazuh-dashboard/
```

### 4. Rollback stack components

Follow the same procedure for indexer and manager (in reverse order).

### 5. Restart services

```bash
sudo systemctl start wazuh-dashboard
```

> **Warning**: Rollback is complex and may result in data loss. Only perform if absolutely necessary.

---

## Additional migration resources

- **Upgrade documentation**: [Upgrade](upgrade.md)
- **CHANGELOG**: [CHANGELOG.md](../../CHANGELOG.md)
- **Official migration guide**: https://documentation.wazuh.com/current/upgrade-guide/index.html
- **Requirements**: [Requirements](getting-started/requirements.md)
- **Configuration reference**: [Configuration](configuration.md)
- **Security hardening**: [Security](security.md)
- **Performance tuning**: [Performance](performance.md)

## Support

For migration assistance:

- Community forum: https://groups.google.com/g/wazuh
- GitHub issues: https://github.com/wazuh/wazuh-dashboard-plugins/issues
- Official documentation: https://documentation.wazuh.com/
