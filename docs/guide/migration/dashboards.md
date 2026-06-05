# Custom dashboards and visualizations migration

The Wazuh dashboard stores user-created dashboards and visualizations as **saved objects** in the Wazuh indexer indices. These objects can be exported from a 4.x deployment and imported into a 5.x deployment using the **Saved objects** management interface.

> **Scope**: This guide covers only **custom** dashboards and visualizations created or modified by users. Default Wazuh dashboards and visualizations are provisioned automatically by the Wazuh 5.x plugin on first start and do not require manual migration.

In Wazuh 4.x, default dashboard definitions were embedded in the plugin. In Wazuh 5.x, default dashboards are provisioned as saved objects by reference during the health check task on first start.

> **Warning**: Do not re-import default Wazuh objects. Overwriting the default dashboards and visualizations with 4.x versions may cause broken panels, stale index pattern references, or conflicts with features introduced in 5.x. If you are unsure whether an object is custom or default, open **☰ Menu > Dashboard Management > Saved objects** after installation and look for objects whose description includes `Provided by Wazuh` — those are provisioned automatically and must not be re-imported.

---

## Understanding saved objects

Saved objects in the Wazuh dashboard include:

- **Dashboards** — Panels composed of one or more visualizations.
- **Visualizations** — Individual charts, tables, maps, and metrics.
- **Searches** — Saved queries and filters.
- **Index patterns** — Definitions of data source field mappings.

All of these are exported and imported as a single `.ndjson` (newline-delimited JSON) file.

---

## Before you export: note the index pattern and field name changes

In Wazuh 4.x, the default index pattern is `wazuh-alerts-*`. In Wazuh 5.x, the default index pattern is `wazuh-events-v5*`.

The 5.x data model uses a family of data streams (`wazuh-events-v5-*`, `wazuh-findings-v5-*`, and others). For rule-based alert data — the closest equivalent to `wazuh-alerts-*` — the correct 5.x index pattern is `wazuh-findings-v5*`. This is the pattern used by most default Wazuh dashboards and visualizations in 5.x that previously targeted `wazuh-alerts-*`.

Custom visualizations and searches that reference `wazuh-alerts-*` will not display data after import until the index pattern reference is updated. When importing saved objects, the dashboard will prompt you to select a replacement index pattern for any unresolved references.

### Field name changes in the 5.x data model

Beyond the index pattern rename, the 5.x data model uses a different field schema. Fields that were available at the root level in 4.x are now nested under the `wazuh.*` prefix. Visualizations that aggregate or filter on those fields must be updated manually after import.

Common field mappings:

| 4.x field          | 5.x field          | Notes                                                                                        |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------------- |
| `rule.level`       | `wazuh.rule.level` | Type changed: integer (1–15) → string (`low`, `medium`, `high`, `critical`, `informational`) |
| `rule.description` | `wazuh.rule.title` |                                                                                              |
| `rule.id`          | `wazuh.rule.id`    |                                                                                              |
| `rule.groups`      | `wazuh.integration.name` |                                                                                        |
| `agent.name`       | `wazuh.agent.name` |                                                                                              |
| `agent.id`         | `wazuh.agent.id`   |                                                                                              |

> **Note**: The index pattern to use depends on the type of data being visualized. Use `wazuh-findings-v5*` for rule-based alerts (the closest equivalent to `wazuh-alerts-*`), and `wazuh-events-v5*` for raw event data. Visualizations that filter on `rule.*` fields will need to target `wazuh-findings-v5*` and use the `wazuh.*` field names above.

After completing the import, open each migrated visualization in the editor and update the index pattern and any field references that use the old names.

---

## Step 1: Export saved objects from Wazuh 4.x

Export only the objects you created or modified. Exporting default Wazuh objects is unnecessary because they are re-created automatically on the first start of the 5.x plugin.

### Using the UI

1. Navigate to **☰ Menu > Dashboard Management > Saved objects**.
2. To export all custom objects, select the checkboxes next to each user-created dashboard or visualization and click **Export** in the action bar.
3. Enable **Include related objects** to include all referenced visualizations and searches.
4. Save the exported `.ndjson` file to a secure location.

If you need to export everything at once as a fallback:

1. Select **Export X objects** (the button label shows the total count).
2. In the export dialog, ensure that **Include related objects** is selected.
3. Save the file. When importing into 5.x, use the **Check for existing objects** conflict strategy (see Step 3) to avoid overwriting default Wazuh objects that were already provisioned.

### Using the API

Run the following command from **any machine with network access to the 4.x dashboard**, replacing `<DASHBOARD_HOST>` with the 4.x dashboard hostname or IP, `<DASHBOARD_PORT>` with the dashboard port (default: `5601`), and `<PASSWORD>` with the admin password. The output file is saved in the current working directory:

```bash
curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/_export" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -u admin:<PASSWORD> \
  -k \
  -d '{
    "type": ["dashboard", "visualization", "search", "index-pattern"],
    "includeReferencesDeep": true
  }' \
  -o saved-objects-backup-$(date +%Y%m%d).ndjson
```

---

## Step 2: Install and start Wazuh dashboard 5.x

Complete the Wazuh 5.x installation and verify that the dashboard is accessible before proceeding with the import.

---

## Step 3: Import saved objects into Wazuh 5.x

### Using the UI

1. Navigate to **☰ Menu > Dashboard Management > Saved objects**.
2. Click **Import**.
3. Select the `.ndjson` file exported from the 4.x deployment.
4. Choose a conflict resolution strategy:
   - **Check for existing objects** (recommended): Skips objects that already exist. Preserves any objects already provisioned by the health check.
   - **Automatically overwrite all conflicts**: Replaces any existing objects with the same ID. Use with caution if Wazuh default dashboards have already been provisioned.
5. Click **Import**.

### Using the API

Run the following command from **the machine where the `.ndjson` backup file is located**, with network access to the 5.x dashboard. Replace `<DASHBOARD_HOST>` with the 5.x dashboard hostname or IP, `<DASHBOARD_PORT>` with the dashboard port (default: `5601`), `<PASSWORD>` with the admin password, and `<DATE>` with the date suffix of your backup file.

The response body contains two fields: `successResults` (objects accepted) and `errors` (objects that could not be imported). Visualizations and saved searches that reference `wazuh-alerts-*` will appear in `errors` with `"type": "missing_references"`.

```bash
curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/_import?overwrite=false" \
  -H "osd-xsrf: true" \
  -u admin:<PASSWORD> \
  -k \
  --form file=@saved-objects-backup-<DATE>.ndjson
```

Set `overwrite=true` to replace existing objects with the same ID.

> **Important**: When objects in the import file fail with `missing_references` (for example, visualizations and saved searches that reference `wazuh-alerts-*`), dashboards in the same import file that depend on those objects may appear in `successResults` but are not actually saved. This behavior depends on the Wazuh dashboard build. Always proceed with Step 4 to resolve reference errors and then re-import the dashboards separately, regardless of whether the initial import reports success.

---

## Step 4: Resolve index pattern conflicts

### Using the UI

After import, any saved object that referenced the old `wazuh-alerts-*` index pattern will show an unresolved reference. The dashboard prompts you to select a replacement.

1. When prompted to select a replacement index pattern, choose the pattern that matches the type of data your visualization was displaying. For visualizations that previously targeted `wazuh-alerts-*` (rule-based alert data), select `wazuh-findings-v5*`. The 5.x health check provisions this pattern automatically on first start.
2. Repeat step 1 for each affected object.

### Using the API

Use the `_resolve_import_errors` endpoint to retry the failed objects with a remapped index pattern reference. For each object that failed with `"type": "missing_references"`, include a `replaceReferences` entry that maps `wazuh-alerts-*` to the appropriate 5.x pattern. For most alert-based visualizations, the replacement is `wazuh-findings-v5*`.

Run all commands below from **the machine where the `.ndjson` backup file is located**, with network access to the 5.x dashboard. Replace `<DASHBOARD_HOST>` with the 5.x dashboard hostname or IP and `<DASHBOARD_PORT>` with the dashboard port (default: `5601`).

**Step 4a — Resolve references for visualizations and saved searches:**

```bash
curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/_resolve_import_errors" \
  -H "osd-xsrf: true" \
  -u admin:<PASSWORD> \
  -k \
  --form file=@saved-objects-backup-<DATE>.ndjson \
  --form 'retries=[
    {"type":"visualization","id":"<VIZ_ID>","overwrite":false,"replaceReferences":[{"type":"index-pattern","from":"wazuh-alerts-*","to":"wazuh-findings-v5*"}]},
    {"type":"search","id":"<SEARCH_ID>","overwrite":false,"replaceReferences":[{"type":"index-pattern","from":"wazuh-alerts-*","to":"wazuh-findings-v5*"}]}
  ]'
```

Populate the `retries` array from the `errors` list in the Step 3 response. Include one entry per failed object.

**Step 4b — Re-import dashboards:**

After the visualizations and saved searches are successfully imported, extract the dashboard objects from the backup file and re-import them so that their panel references are satisfied. Run the following commands **on the same machine where the backup file is located**:

Extract using `jq` (recommended):

```bash
jq -c 'select(.type == "dashboard")' saved-objects-backup-<DATE>.ndjson > dashboards-only.ndjson
```

If `jq` is not available, use `grep` as a fallback. The OpenSearch Dashboards export format uses compact JSON (no spaces around `:`), so a literal match is reliable:

```bash
grep '"type":"dashboard"' saved-objects-backup-<DATE>.ndjson > dashboards-only.ndjson
```

Then re-import just the dashboards:

```bash
curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/_import?overwrite=false" \
  -H "osd-xsrf: true" \
  -u admin:<PASSWORD> \
  -k \
  --form file=@dashboards-only.ndjson
```

---

## Verification

After importing, verify that the migrated objects are accessible and displaying data:

1. Navigate to **☰ Menu > Dashboard Management > Saved objects** and confirm that the expected dashboards and visualizations appear in the list.
2. Open each migrated dashboard and confirm that panels load without errors.
3. If a panel shows a "No results found" message, verify that:
   - the index pattern referenced by its visualizations points to `wazuh-findings-v5*` (for alert-based visualizations) or another appropriate 5.x pattern
   - any aggregation or filter fields use the 5.x field names (for example, `wazuh.rule.level` instead of `rule.level`)
   - the selected time range contains data

---

## Multitenancy

If multitenancy was enabled in the 4.x deployment, repeat the export and import steps for each tenant separately. Saved objects are scoped per tenant — objects exported from one tenant must be imported into the same tenant in 5.x.

### Using the UI

1. Use the tenant selector in the top navigation bar to switch to the target tenant.
2. Follow Steps 1–4 of this guide to export (4.x) or import (5.x) saved objects for that tenant.
3. Repeat for each tenant.

### Using the API

Add the `securitytenant` header to each API request to target a specific tenant. Replace `<TENANT>` with the tenant name (for the Global tenant, use `global`). Use a separate backup file per tenant.

Export example (4.x):

```bash
curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/_export" \
  -H "osd-xsrf: true" \
  -H "Content-Type: application/json" \
  -H "securitytenant: <TENANT>" \
  -u admin:<PASSWORD> \
  -k \
  -d '{
    "type": ["dashboard", "visualization", "search", "index-pattern"],
    "includeReferencesDeep": true
  }' \
  -o saved-objects-backup-<TENANT>-$(date +%Y%m%d).ndjson
```

Import example (5.x):

```bash
curl -X POST "https://<DASHBOARD_HOST>:<DASHBOARD_PORT>/api/saved_objects/_import?overwrite=false" \
  -H "osd-xsrf: true" \
  -H "securitytenant: <TENANT>" \
  -u admin:<PASSWORD> \
  -k \
  --form file=@saved-objects-backup-<TENANT>-<DATE>.ndjson
```

Apply the same `securitytenant` header to the Step 4 `_resolve_import_errors` and re-import commands. This approach is useful for programmatic migration or environments with several tenants.

---

## Notes

- Saved objects exported from OpenSearch Dashboards 2.x (used in Wazuh 4.x) are compatible with OpenSearch Dashboards 3.x (used in Wazuh 5.x) for the standard object types listed above. However, objects that carry a `migrationVersion` field referencing a schema version newer than what OpenSearch Dashboards 3.x recognizes will be rejected with a 422 error during import. If you encounter this error, remove or downgrade the `migrationVersion` entry for the affected object type before re-importing. Objects created natively by Wazuh 4.x use `migrationVersion` values that are compatible with OpenSearch Dashboards 3.x.
