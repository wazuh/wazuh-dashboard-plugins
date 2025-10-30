#!/usr/bin/env node

/**
 * Script to generate known fields JSON files from Wazuh index templates
 *
 * This script fetches template definitions from Wazuh repositories and converts
 * them to the known fields format used by wazuh-dashboard-plugins
 *
 * Usage: node scripts/generate-known-fields.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load version from package.json
const packageJsonPath = path.resolve(
  __dirname,
  '..',
  'plugins',
  'main',
  'package.json',
);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const [, , branch] = process.argv;
const VERSION = branch || packageJson.version;

console.log(`📦 Using Wazuh version: ${VERSION}`);

// process.exit(0);
// Helper function to generate URLs with dynamic version
function wazuhUrl(path) {
  return `https://raw.githubusercontent.com/wazuh/wazuh-indexer-plugins/${VERSION}/${path}`;
}

// Configuration for different template sources
// Template resource: https://github.com/wazuh/wazuh-indexer-plugins/tree/main/plugins/setup/src/main/resources
const TEMPLATE_SOURCES = {
  vulnerabilities: {
    name: 'states-vulnerabilities',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-vulnerabilities.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/states-vulnerabilities.json',
  },
  alerts: {
    name: 'alerts',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-alerts.json'),
    ],
    outputFile: 'plugins/main/common/known-fields/alerts.json',
  },
  archives: {
    name: 'archives',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-archives.json'),
    ],
    outputFile: 'plugins/main/common/known-fields/archives.json',
  },
  'events-access-management': {
    name: 'events-access-management',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-access-management.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/events-access-management.json',
  },
  'events-applications': {
    name: 'events-applications',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-applications.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/events-applications.json',
  },
  'events-cloud-services': {
    name: 'events-cloud-services',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-cloud-services.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/events-cloud-services.json',
  },
  'events-cloud-services-aws': {
    name: 'events-cloud-services',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-cloud-services-aws.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/events-cloud-services-aws.json',
  },
  'events-cloud-services-azure': {
    name: 'events-cloud-services-azure',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-cloud-services-azure.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/events-cloud-services-azure.json',
  },
  'events-cloud-services-gcp': {
    name: 'events-cloud-services',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-cloud-services-gcp.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/events-cloud-services-gcp.json',
  },
  'events-network-activity': {
    name: 'events-network-activity',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-network-activity.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/events-network-activity.json',
  },
  'events-other': {
    name: 'events-network-activity',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-other.json'),
    ],
    outputFile: 'plugins/main/common/known-fields/events-other.json',
  },
  'events-security': {
    name: 'events-security',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-security.json'),
    ],
    outputFile: 'plugins/main/common/known-fields/events-security.json',
  },
  'events-system-activity': {
    name: 'events-system-activity',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-system-activity.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/events-system-activity.json',
  },
  monitoring: {
    name: 'monitoring',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-monitoring.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/monitoring.json',
  },
  statistics: {
    name: 'statistics',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-statistics.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/statistics.json',
  },
  // FIM templates
  'states-fim-files': {
    name: 'states-fim-files',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-fim-files.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/states-fim-files.json',
  },
  'states-fim-registries-keys': {
    name: 'states-fim-registries-keys',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-fim-registry-keys.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-fim-registries-keys.json',
  },
  'states-fim-registries-values': {
    name: 'states-fim-registries-values',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-fim-registry-values.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-fim-registries-values.json',
  },
  // Inventory templates (using the most recent versions without -update suffix)
  'states-inventory-system': {
    name: 'states-inventory-system',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-system.json'),
    ],
    outputFile: 'plugins/main/common/known-fields/states-inventory-system.json',
  },
  'states-inventory-hardware': {
    name: 'states-inventory-hardware',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-hardware.json'),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-hardware.json',
  },
  'states-inventory-networks': {
    name: 'states-inventory-networks',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-networks.json'),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-networks.json',
  },
  'states-inventory-packages': {
    name: 'states-inventory-packages',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-packages.json'),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-packages.json',
  },
  'states-inventory-ports': {
    name: 'states-inventory-ports',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-ports.json'),
    ],
    outputFile: 'plugins/main/common/known-fields/states-inventory-ports.json',
  },
  'states-inventory-processes': {
    name: 'states-inventory-processes',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-processes.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-processes.json',
  },
  'states-inventory-protocols': {
    name: 'states-inventory-protocols',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-protocols.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-protocols.json',
  },
  'states-inventory-users': {
    name: 'states-inventory-users',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-users.json'),
    ],
    outputFile: 'plugins/main/common/known-fields/states-inventory-users.json',
  },
  'states-inventory-groups': {
    name: 'states-inventory-groups',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-groups.json'),
    ],
    outputFile: 'plugins/main/common/known-fields/states-inventory-groups.json',
  },
  'states-inventory-services': {
    name: 'states-inventory-services',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-services.json'),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-services.json',
  },
  'states-inventory-interfaces': {
    name: 'states-inventory-interfaces',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-interfaces.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-interfaces.json',
  },
  'states-inventory-hotfixes': {
    name: 'states-inventory-hotfixes',
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/index-template-hotfixes.json'),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-hotfixes.json',
  },
  'states-inventory-browser-extensions': {
    name: 'states-inventory-browser-extensions',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-browser-extensions.json',
      ),
    ],
    outputFile:
      'plugins/main/common/known-fields/states-inventory-browser-extensions.json',
  },
  'states-sca': {
    name: 'states-sca',
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/index-template-browser-extensions.json',
      ),
    ],
    outputFile: 'plugins/main/common/known-fields/states-sca.json',
  },
};

/**
 * Converts index field type to our known field type
 */
function mapIndexFieldType(esType, field) {
  const typeMapping = {
    keyword: 'string',
    text: 'string',
    date: 'date',
    long: 'number',
    integer: 'number',
    double: 'number',
    float: 'number',
    byte: 'number',
    scaled_float: 'number',
    boolean: 'boolean',
    ip: 'ip',
    geo_point: 'geo_point',
    nested: 'nested',
    _id: 'string',
    _index: 'string',
    _source: '_source',
    _type: 'string',
  };

  return typeMapping[esType] || 'string';
}

/**
 * Determines if a field is searchable based on its properties
 */
function isSearchable(fieldProps, esType) {
  // Text and keyword fields are generally searchable
  if (['text', 'keyword'].includes(esType)) return true;

  // Check if explicitly set to false
  if (fieldProps.hasOwnProperty('index') && fieldProps.index === false)
    return false;

  // Most field types are searchable by default
  return !['_source'].includes(esType);
}

/**
 * Determines if a field is aggregatable based on its properties
 */
function isAggregatable(fieldProps, esType) {
  // Text fields are generally not aggregatable unless they have fielddata
  if (esType === 'text') {
    return fieldProps.fielddata === true;
  }

  // Check if explicitly disabled
  if (
    fieldProps.hasOwnProperty('doc_values') &&
    fieldProps.doc_values === false
  )
    return false;

  // Most structured types are aggregatable
  return !['text', '_source', 'nested'].includes(esType);
}

/**
 * Determines if a field should read from doc values
 */
function shouldReadFromDocValues(fieldProps, esType) {
  // These field types don't use doc values
  if (['_id', '_index', '_source', '_type', 'text', 'nested'].includes(esType))
    return false;

  // Check if explicitly disabled
  if (
    fieldProps.hasOwnProperty('doc_values') &&
    fieldProps.doc_values === false
  )
    return false;

  // Most other types use doc values by default
  return true;
}

/**
 * Recursively extracts field definitions from template mappings
 */
function extractFields(properties, prefix = '') {
  const fields = [];

  // Add basic index meta fields if we're at root level
  if (prefix === '') {
    const metaFields = [
      {
        name: '_id',
        type: 'string',
        esTypes: ['_id'],
        searchable: true,
        aggregatable: true,
        readFromDocValues: false,
      },
      {
        name: '_index',
        type: 'string',
        esTypes: ['_index'],
        searchable: true,
        aggregatable: true,
        readFromDocValues: false,
      },
      {
        name: '_score',
        type: 'number',
        searchable: false,
        aggregatable: false,
        readFromDocValues: false,
      },
      {
        name: '_source',
        type: '_source',
        esTypes: ['_source'],
        searchable: false,
        aggregatable: false,
        readFromDocValues: false,
      },
      {
        name: '_type',
        type: 'string',
        esTypes: ['_type'],
        searchable: true,
        aggregatable: true,
        readFromDocValues: false,
      },
    ];
    fields.push(...metaFields);
  }

  for (const [fieldName, fieldDef] of Object.entries(properties)) {
    const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;

    // Handle fields with type (including nested with properties)
    if (fieldDef.type) {
      const esType = fieldDef.type;
      const field = {
        name: fullFieldName,
        type: mapIndexFieldType(esType, fieldDef),
        esTypes: [esType],
        searchable: isSearchable(fieldDef, esType),
        aggregatable: isAggregatable(fieldDef, esType),
        readFromDocValues: shouldReadFromDocValues(fieldDef, esType),
      };

      fields.push(field);

      // Handle multi-fields (like .keyword subfields)
      if (fieldDef.fields) {
        for (const [subFieldName, subFieldDef] of Object.entries(
          fieldDef.fields,
        )) {
          const subFieldFullName = `${fullFieldName}.${subFieldName}`;
          const subEsType = subFieldDef.type;
          const subField = {
            name: subFieldFullName,
            type: mapIndexFieldType(subEsType, subFieldDef),
            esTypes: [subEsType],
            searchable: isSearchable(subFieldDef, subEsType),
            aggregatable: isAggregatable(subFieldDef, subEsType),
            readFromDocValues: shouldReadFromDocValues(subFieldDef, subEsType),
          };
          fields.push(subField);
        }
      }

      // Handle nested type with properties
      if (esType === 'nested' && fieldDef.properties) {
        fields.push(...extractFields(fieldDef.properties, fullFieldName));
      }
    } else if (fieldDef.properties) {
      // Object type without explicit type - recurse into properties
      fields.push(...extractFields(fieldDef.properties, fullFieldName));
    }
  }

  return fields;
}

/**
 * Fetches template JSON from URL
 */
function fetchTemplate(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const template = JSON.parse(data);
            resolve(template);
          } catch (error) {
            reject(
              new Error(
                `Failed to parse template from ${url}: ${error.message}`,
              ),
            );
          }
        });
      })
      .on('error', error => {
        reject(new Error(`Failed to fetch ${url}: ${error.message}`));
      });
  });
}

/**
 * Tries multiple URLs until one succeeds
 */
async function fetchTemplateFromUrls(urls) {
  let lastError;

  for (const url of urls) {
    try {
      const template = await fetchTemplate(url);
      return { template, url };
    } catch (error) {
      lastError = error;
      console.log(`  ⚠️  Failed to fetch from ${url}: ${error.message}`);
    }
  }

  throw lastError;
}

/**
 * Processes a template and generates known fields
 */
async function processTemplate(config) {
  console.log(`Processing ${config.name} template...`);

  try {
    const { template, url } = await fetchTemplateFromUrls(config.urls);
    console.log(`  ✅ Successfully fetched from: ${url}`);

    // Extract mappings - handle different template structures
    let mappings;
    if (template.mappings) {
      mappings = template.mappings;
    } else if (template.template && template.template.mappings) {
      mappings = template.template.mappings;
    } else {
      throw new Error('Could not find mappings in template structure');
    }

    // Extract properties from mappings
    let properties;
    if (mappings.properties) {
      properties = mappings.properties;
    } else if (mappings._doc && mappings._doc.properties) {
      properties = mappings._doc.properties;
    } else {
      throw new Error('Could not find properties in mappings');
    }

    // Generate known fields
    const knownFields = extractFields(properties);

    // Ensure output directory exists - resolve relative to script location
    const scriptDir = path.dirname(__filename);
    const projectRoot = path.resolve(scriptDir, '..');
    const absoluteOutputFile = path.resolve(projectRoot, config.outputFile);
    const outputDir = path.dirname(absoluteOutputFile);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(absoluteOutputFile, JSON.stringify(knownFields, null, 2));
    console.log(
      `  ✅ Generated ${knownFields.length} known fields for ${config.name} -> ${config.outputFile}`,
    );

    return knownFields;
  } catch (error) {
    console.error(`  ❌ Error processing ${config.name}: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
/**
 * Combines all states-inventory-* fields into a single states-inventory.json file
 * This is useful for the generic states-inventory pattern that matches all inventory indices
 */
async function generateCombinedInventoryFields(results) {
  console.log('Processing combined states-inventory fields...');

  const inventoryKeys = Object.keys(results).filter(
    key => key.startsWith('states-inventory-') && results[key],
  );

  if (inventoryKeys.length === 0) {
    console.log('  ⚠️  No inventory fields to combine');
    return null;
  }

  // Use a Map to deduplicate fields by name
  const fieldsMap = new Map();

  for (const key of inventoryKeys) {
    const fields = results[key];
    for (const field of fields) {
      // Keep the first occurrence of each field name
      if (!fieldsMap.has(field.name)) {
        fieldsMap.set(field.name, field);
      }
    }
  }

  const combinedFields = Array.from(fieldsMap.values());

  // Sort fields alphabetically by name for consistency
  combinedFields.sort((a, b) => a.name.localeCompare(b.name));

  // Write combined file
  const scriptDir = path.dirname(__filename);
  const projectRoot = path.resolve(scriptDir, '..');
  const outputPath = path.resolve(
    projectRoot,
    'plugins/main/common/known-fields/states-inventory.json',
  );

  fs.writeFileSync(outputPath, JSON.stringify(combinedFields, null, 2));

  console.log(
    `  ✅ Generated ${combinedFields.length} combined fields for states-inventory -> plugins/main/common/known-fields/states-inventory.json`,
  );

  return combinedFields;
}

async function main() {
  console.log('🚀 Starting known fields generation...\n');

  const results = {};

  for (const [key, config] of Object.entries(TEMPLATE_SOURCES)) {
    try {
      results[key] = await processTemplate(config);
    } catch (error) {
      console.error(`Failed to process ${key}:`, error.message);
      results[key] = null;
    }
    console.log(''); // Add spacing between processing
  }

  // Generate combined inventory fields
  try {
    results['states-inventory'] =
      await generateCombinedInventoryFields(results);
  } catch (error) {
    console.error(
      'Failed to generate combined inventory fields:',
      error.message,
    );
    results['states-inventory'] = null;
  }
  console.log(''); // Add spacing

  // Summary
  console.log('📊 Summary:');
  for (const [key, fields] of Object.entries(results)) {
    if (fields) {
      console.log(`  ${key}: ✅ ${fields.length} fields generated`);
    } else {
      console.log(`  ${key}: ❌ Failed`);
    }
  }

  console.log('\n✨ Known fields generation completed!');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  processTemplate,
  extractFields,
  mapIndexFieldType,
  TEMPLATE_SOURCES,
};
