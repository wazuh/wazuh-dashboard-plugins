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
node scripts/generate-known-fields.js [branch]
```

By default uses the version declared in the package.json.

**Features:**

- Fetches templates from multiple sources (Wazuh server repo, dashboard repo)
- Dynamically reads version from package.json for sustainable URL generation
- Converts OpenSearch field mappings to dashboard known fields format
- Supports multiple URL fallbacks for each template type
- Handles nested field types properly
- Generates JSON files in `plugins/main/common/known-fields/`

## Generated Files

The script generates JSON files in `plugins/main/common/known-fields`: alerts, archives, events, states, monitoring and statistics

## Integration

The generated files are stored in `plugins/main/public/utils/known-fields/` and consumed by:

- `getKnownFieldsByIndexType(indexType)` - Get fields by index type constant

## Workflow

1. **Manual Execution**: Run the script when template changes are detected
2. **Future Enhancement**: Could be integrated into CI/CD to run automatically on releases
3. **Fallback**: Manual fields still available as backup in `known-fields.js`

## Adding New Templates

To add support for a new template:

1. Add configuration to `TEMPLATE_SOURCES` in `generate-known-fields.js`
2. Import the generated JSON in `known-fields-loader.js`
3. Add mapping entry to `KnownFieldsByIndexType`
4. Update the corresponding index type constants if needed

## Recent Improvements

- ✅ Dynamic version loading from package.json (no hardcoded versions)
- ✅ Proper nested field type handling
- ✅ Moved templates from TypeScript to JSON format for simplicity
- ✅ Generated files in public/utils/known-fields/ (accessible from both client and server via dynamic path resolution)
- ✅ Added support for all inventory state templates
- ✅ Monitoring fields intentionally excluded from auto-generation (template incomplete)

## Future Improvements

- [ ] Integrate with CI/CD for automatic updates on template changes
- [ ] Add validation to ensure generated fields match expected format
- [ ] Add diffing tool to show changes between template versions
