# Known Fields Generation Script

This directory contains scripts to automatically generate known fields for Wazuh index patterns from their official template definitions.

## Overview

The known fields are used by the Wazuh Dashboard to ensure that all fields used in visualizations and data grids are available during index pattern creation, even when the underlying indices don't exist yet.

Previously, these fields were manually maintained, which could lead to synchronization issues when field definitions changed in the Wazuh server. This automated approach ensures the fields are always up-to-date with the official templates.

## Scripts

### `generate-known-fields.js`

Main script that fetches index templates from Wazuh repositories and converts them to the known fields format used by the dashboard.

**Usage:**
```bash
node scripts/generate-known-fields.js
```

**Features:**
- Fetches templates from multiple sources (Wazuh server repo, dashboard repo)
- Handles both JSON and TypeScript template formats
- Converts Elasticsearch field mappings to dashboard known fields format
- Supports multiple URL fallbacks for each template type
- Generates JSON files in `plugins/main/public/utils/known-fields/`

**Supported Templates:**
- **Vulnerabilities**: `wazuh-states-vulnerabilities-*` indices
- **Alerts**: `wazuh-alerts-*` indices  
- **Monitoring**: `wazuh-monitoring-*` indices (TODO: fix TypeScript parsing)
- **Statistics**: `wazuh-statistics-*` indices (TODO: fix TypeScript parsing)

## Template Sources

The script fetches templates from these official Wazuh repositories:

### Wazuh Server (github.com/wazuh/wazuh)
- **Vulnerabilities**: [`src/wazuh_modules/vulnerability_scanner/indexer/template/index-template.json`](https://github.com/wazuh/wazuh/blob/4.14.0/src/wazuh_modules/vulnerability_scanner/indexer/template/index-template.json)
- **Inventory States**: `src/wazuh_modules/inventory_harvester/indexer/template/` (TODO: add support)
- **Alerts**: [`extensions/elasticsearch/7.x/wazuh-template.json`](https://github.com/wazuh/wazuh/blob/4.14.0/extensions/elasticsearch/7.x/wazuh-template.json)

### Wazuh Dashboard Plugins (github.com/wazuh/wazuh-dashboard-plugins)
- **Monitoring**: [`plugins/main/server/integration-files/monitoring-template.ts`](https://github.com/wazuh/wazuh-dashboard-plugins/blob/4.14.0/plugins/main/server/integration-files/monitoring-template.ts)
- **Statistics**: [`plugins/main/server/integration-files/statistics-template.ts`](https://github.com/wazuh/wazuh-dashboard-plugins/blob/4.14.0/plugins/main/server/integration-files/statistics-template.ts)

## Generated Files

The script generates JSON files in `plugins/main/public/utils/known-fields/`:

- `alerts.json` - Fields for alert index patterns
- `states-vulnerabilities.json` - Fields for vulnerability state patterns
- `monitoring.json` - Fields for monitoring patterns (TODO)
- `statistics.json` - Fields for statistics patterns (TODO)

## Integration

The generated files are consumed by `plugins/main/public/utils/known-fields-loader.js`, which provides:

- `getKnownFieldsForStatesPattern(pattern)` - Get fields for a specific states pattern
- `getKnownFieldsForPattern(patternType)` - Get fields by pattern type
- `KnownFieldsStatesGenerated` - Mapping object for all states patterns

## Workflow

1. **Manual Execution**: Run the script when template changes are detected
2. **Future Enhancement**: Could be integrated into CI/CD to run automatically on releases
3. **Fallback**: Manual fields still available as backup in `known-fields.js`

## Adding New Templates

To add support for a new template:

1. Add configuration to `TEMPLATE_SOURCES` in `generate-known-fields.js`
2. Import the generated JSON in `known-fields-loader.js`
3. Add mapping entry to `KnownFieldsStatesGenerated`
4. Update the corresponding index type constants if needed

## Future Improvements

- [ ] Fix TypeScript template parsing for monitoring/statistics
- [ ] Add support for inventory state templates
- [ ] Integrate with CI/CD for automatic updates
- [ ] Add validation to ensure generated fields match expected format
- [ ] Add support for multiple template versions (e.g., different Wazuh releases)
