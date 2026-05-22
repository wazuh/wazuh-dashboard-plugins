# Multi-manager environments migration

In Wazuh dashboard 4.x, it was possible to configure multiple Wazuh manager API connections in `wazuh.yml` and switch between them at runtime using an API selector available in the dashboard navigation bar.

In Wazuh dashboard 5.x, the default behavior is different:

- Each dashboard instance connects to **one OpenSearch indexer cluster** and **one active Wazuh manager API** by default.
- If multiple entries are defined in `wazuh_core.hosts` and **Cross-Cluster Search (CCS) is not configured**, only the **first** entry is used. Additional entries are ignored for health checks, API requests, and session synchronization.
- If **CCS is configured** on the indexer (remote clusters registered via `/_remote/info`), the dashboard detects it automatically, validates **all** configured hosts, and restores the **Manager API** selector in the navigation bar so users can switch between them.

This guide describes the migration paths available for environments that relied on multi-manager functionality.

---

## Understanding the 4.x multi-manager setup

A typical 4.x `wazuh.yml` with multiple managers looked as follows:

```yaml
hosts:
  - production:
      url: https://wazuh-manager-prod
      port: 55000
      username: wazuh-wui
      password: <PROD_PASSWORD>
      run_as: false
  - staging:
      url: https://wazuh-manager-staging
      port: 55000
      username: wazuh-wui
      password: <STAGING_PASSWORD>
      run_as: false
```

Users could select the active manager from the navigation bar to view data from different Wazuh deployments within a single dashboard instance.

---

## Default behavior in 5.x (without Cross-Cluster Search)

When CCS is not configured:

- Configure **one** `wazuh_core.hosts` entry per dashboard instance.
- The navigation bar **Manager API** selector is hidden.
- Management operations (agents, configuration, rules, and similar features) run against that single manager only.

If your 4.x deployment listed multiple hosts that were not part of a CCS setup, do not copy all entries into `opensearch_dashboards.yml` expecting the old selector to work. Choose one of the migration options below instead.

---

## Supported migration paths in 5.x

Identify the purpose of each host in your 4.x configuration and choose the migration path that best matches it.

### Option A: Single manager (recommended for most deployments)

If the multiple entries connected to managers in a **Wazuh cluster**, or if one manager was the primary operational target, configure a single host entry pointing to that manager or the cluster's virtual IP or load balancer address.

In `opensearch_dashboards.yml`:

```yaml
wazuh_core.hosts:
  default:
    url: https://<WAZUH_MANAGER_IP_OR_HOSTNAME>
    port: 55000
    username: wazuh-wui
    password: <YOUR_PASSWORD>
    run_as: false
```

### Option B: Separate dashboard instances per manager

If the multiple entries served genuinely independent Wazuh deployments (for example, different customer environments or separate security domains), deploy a **separate Wazuh dashboard instance for each manager**.

Each instance is configured with a single `wazuh_core.hosts` entry pointing to its respective Wazuh manager:

**Instance 1** (`opensearch_dashboards.yml`):

```yaml
wazuh_core.hosts:
  production:
    url: https://wazuh-manager-prod
    port: 55000
    username: wazuh-wui
    password: <PROD_PASSWORD>
    run_as: false
```

**Instance 2** (`opensearch_dashboards.yml`):

```yaml
wazuh_core.hosts:
  staging:
    url: https://wazuh-manager-staging
    port: 55000
    username: wazuh-wui
    password: <STAGING_PASSWORD>
    run_as: false
```

Each instance operates independently and connects only to its designated manager.

### Option C: Wazuh cluster with a load balancer

If the managers were members of a **Wazuh cluster**, configure a single host entry pointing to the cluster's virtual IP address or the load balancer in front of the cluster nodes:

```yaml
wazuh_core.hosts:
  cluster:
    url: https://<CLUSTER_VIP_OR_LB>
    port: 55000
    username: wazuh-wui
    password: <YOUR_PASSWORD>
    run_as: false
```

This approach maintains a single dashboard instance while providing access to the full cluster.

### Option D: Cross-Cluster Search with multiple manager APIs

If your environment has multiple **independent OpenSearch indexer clusters** — each with its own Wazuh manager — and you need both **management access to multiple managers** and **unified querying of event data**, configure **OpenSearch Cross-Cluster Search (CCS)** and define one `wazuh_core.hosts` entry per manager.

When CCS is active, the dashboard:

1. Detects remote clusters through the OpenSearch `/_remote/info` API.
2. Validates every configured host during the health check.
3. Shows the **Manager API** selector in the navigation bar so users can switch between managers (similar to 4.x).

> **Important**: CCS alone does not enable the manager selector. The selector appears only when **both** conditions are met: remote clusters are registered in OpenSearch **and** multiple entries exist in `wazuh_core.hosts`. CCS is still required to query event data across indexer clusters using cross-cluster index patterns.

#### High-level setup

1. On the coordinating OpenSearch cluster, register each remote cluster under a short alias:

   ```bash
   curl -k -XPUT -H 'Content-Type: application/json' \
     -u 'admin:<PASSWORD>' \
     'https://<LOCAL_HOST>:9200/_cluster/settings' \
     -d '{
       "persistent": {
         "cluster.remote.<alias>": {
           "seeds": ["<REMOTE_HOST>:9300"]
         }
       }
     }'
   ```

   Replace `<alias>` with a short name (for example, `cluster-b`), `<LOCAL_HOST>` with the address of the coordinating cluster, and `<REMOTE_HOST>` with the address of a seed node in the remote cluster.

2. Verify that remote clusters are visible:

   ```bash
   curl -k -u 'admin:<PASSWORD>' 'https://<LOCAL_HOST>:9200/_remote/info'
   ```

   A non-empty response confirms that CCS is configured.

3. Define one host entry per manager in `opensearch_dashboards.yml`:

   ```yaml
   wazuh_core.hosts:
     production:
       url: https://wazuh-manager-prod
       port: 55000
       username: wazuh-wui
       password: <PROD_PASSWORD>
       run_as: false
     staging:
       url: https://wazuh-manager-staging
       port: 55000
       username: wazuh-wui
       password: <STAGING_PASSWORD>
       run_as: false
   ```

4. Once remote clusters are registered, their indices are accessible using the `<alias>:<index>` notation. For example:

   ```
   cluster-b:wazuh-events*
   ```

5. In the Wazuh dashboard, create an index pattern that spans multiple clusters:

   - Navigate to **☰ Menu > Dashboard Management > Index patterns**.
   - Create a new pattern such as `*:wazuh-events*` to include all registered remote clusters, or use `cluster-b:wazuh-events*` to target a specific one.

6. Build dashboards and visualizations using the cross-cluster index pattern.

For full configuration details and prerequisites (TLS, transport layer settings, required permissions), refer to the [OpenSearch Cross-Cluster Search documentation](https://docs.opensearch.org/latest/search-plugins/cross-cluster-search/).

---

## Step-by-step migration

1. **Identify the purpose of each host** in your 4.x `wazuh.yml`. Determine whether the hosts represent cluster nodes, independent environments, redundant connections to the same manager, or connections to separate OpenSearch clusters.

2. **Select the appropriate option** from the list above.

3. **Update `opensearch_dashboards.yml`** on each dashboard instance. Use a single entry for Options A–C; use multiple entries only for Option D after CCS is configured. See [Configuration migration](./configuration.md) for the full settings reference.

4. **Export saved objects** from the 4.x instance before decommissioning it. See [Custom dashboards and visualizations](./dashboards.md).

5. If deploying multiple instances (Option B), **import the relevant saved objects** into each new 5.x instance. Filter the export by dashboard or visualization name to import only the objects relevant to each manager.

6. **Start the Wazuh dashboard 5.x service** on each instance and verify the API connection through **☰ Menu > Dashboard management > Health Check** or **☰ Menu > Dashboard management > Server API**.

---

## Notes

- The Wazuh 5.x architecture associates **one Wazuh manager with one OpenSearch indexer cluster** by default. Multiple `wazuh_core.hosts` entries are intended for CCS-enabled deployments.
- Without CCS, configuring more than one host entry has no effect beyond the first entry and may cause confusion during troubleshooting.
- Cross-Cluster Search requires compatible OpenSearch versions across all clusters and proper TLS and transport configuration. Review the OpenSearch documentation before implementing this option in production.
