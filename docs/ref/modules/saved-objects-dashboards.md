# Saved Objects for Dashboards and Visualizations

## Overview

The health check can provision saved objects for selected dashboards that are currently rendered **by value** in the UI. The task reads versioned NDJSON definitions from the repository and creates the equivalent **by reference** visualizations and dashboards on the server, so the UI can switch to references without requiring manual imports.

Use this task to:

- Guarantee that official Wazuh dashboards exist as saved objects after installation or upgrade.
- Avoid manual imports of NDJSON export files when a deployment is recreated.
- Prepare existing dashboards to be reused by features that rely on saved object references (for example, sharing, reporting, or embedding).

## How It Works

- **Source of truth**: definitions live under `plugins/main/common/dashboards/dashboard-definitions` (recursively) with the `.ndjson` extension.
- **Supported objects**: `visualization` and `dashboard` types. Each definition file must contain exactly one dashboard plus its referenced visualizations (one JSON document per line).
- **Creation and overwrite**: on the **initial** health check run (`scope === 'internal-initial'`, which happens on every dashboard restart, not only the first install), the task creates every object with `overwrite: true` — any manual edit a user made to one of these provided dashboards/visualizations is reverted back to the repository definition. On later, non-initial runs it checks whether each object already exists and, if present, skips it (`overwrite: false`); only missing objects get created. Every write uses `refresh: true`.
- **Execution context**: runs under the Dashboard internal user in the `Global` tenant through the health check lifecycle. Any parsing or creation error will fail the task and surface in the health check status.

## Related Health Check Task

- **Task name**: `saved-objects:dashboards`
- **Function**: reads every NDJSON definition file, creates all referenced visualizations first, and then ensures the dashboard that depends on them. Custom IDs defined in the files allow predictable tracking and reuse.
- **Configuration**: enabled by default, like every other check (`healthcheck.checks_enabled`
  defaults to `.*`). To limit the enabled checks to only this one:

```yml
healthcheck.checks_enabled: 'saved-objects:dashboards'
```

For general Health Check details, see [Health Check](./healthcheck.md).

## Logs and Troubleshooting

Typical log entries when the task runs:

```
server    log   [10:04:59.700] [debug][healthcheck][saved-objects:dashboards] Processing dashboard definition file [plugins/main/common/dashboards/dashboard-definitions/overview/mitre/overview/mitre-overview-dashboard-tab.ndjson]
server    log   [10:04:59.701] [debug][healthcheck][saved-objects:dashboards] Visualization ensured [mitre-overview] title [MITRE ATT&CK Overview]
server    log   [10:04:59.702] [debug][healthcheck][saved-objects:dashboards] Dashboard ensured [mitre-overview-dashboard] title [MITRE ATT&CK Overview]
```

If the task fails, review the logs for parsing errors (invalid JSON, unsupported types) or save conflicts. Fix the NDJSON file or adjust the saved object IDs, then rerun the Health Check.
