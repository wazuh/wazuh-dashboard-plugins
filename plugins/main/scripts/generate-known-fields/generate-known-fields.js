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
const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Minimal CLI argument parser
function parseInput(input) {
  const options = {};

  for (let i = 0; i < input.length; i++) {
    if (input[i].startsWith('--')) {
      const key = input[i].slice(2);
      const value =
        input[i + 1] && !input[i + 1].startsWith('--') ? input[i + 1] : true;
      options[key] = value;
      if (value !== true) {
        i++;
      } // Skip next arg if it's a value
    }
  }

  return options;
}
// Helper function to generate URLs with dynamic version
function wazuhUrl(path) {
  return `https://raw.githubusercontent.com/wazuh/wazuh-indexer-plugins/{branch}/${path}`;
}

// Simple template interpolation
function interpolate(template, variables) {
  return template.replace(/{(\w+)}/g, (_, key) => {
    return key in variables ? variables[key] : `{${key}}`;
  });
}

// Configuration for different template sources
// Template resource: https://github.com/wazuh/wazuh-indexer-plugins/tree/main/plugins/setup/src/main/resources
const TEMPLATE_SOURCES = {
  'states-vulnerabilities': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/vulnerabilities.json',
      ),
    ],
    outputFile: 'states-vulnerabilities.json',
  },
  alerts: {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/alerts.json',
      ),
    ],
    outputFile: 'alerts.json',
  },
  archives: {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/archives.json',
      ),
    ],
    outputFile: 'archives.json',
  },
  'events-access-management': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/access-management.json',
      ),
    ],
    outputFile: 'events-access-management.json',
  },
  'events-applications': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/applications.json',
      ),
    ],
    outputFile: 'events-applications.json',
  },
  'events-cloud-services': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/cloud-services.json',
      ),
    ],
    outputFile: 'events-cloud-services.json',
  },
  'events-cloud-services-aws': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/cloud-services-aws.json',
      ),
    ],
    outputFile: 'events-cloud-services-aws.json',
  },
  'events-cloud-services-azure': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/cloud-services-azure.json',
      ),
    ],
    outputFile: 'events-cloud-services-azure.json',
  },
  'events-cloud-services-gcp': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/cloud-services-gcp.json',
      ),
    ],
    outputFile: 'events-cloud-services-gcp.json',
  },
  'events-network-activity': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/network-activity.json',
      ),
    ],
    outputFile: 'events-network-activity.json',
  },
  'events-other': {
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/templates/streams/other.json'),
    ],
    outputFile: 'events-other.json',
  },
  'events-security': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/security.json',
      ),
    ],
    outputFile: 'events-security.json',
  },
  'events-system-activity': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/streams/system-activity.json',
      ),
    ],
    outputFile: 'events-system-activity.json',
  },
  monitoring: {
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/templates/monitoring.json'),
    ],
    outputFile: 'monitoring.json',
  },
  statistics: {
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/templates/statistics.json'),
    ],
    outputFile: 'statistics.json',
  },
  // FIM templates
  'states-fim-files': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/fim-files.json',
      ),
    ],
    outputFile: 'states-fim-files.json',
  },
  'states-fim-registries-keys': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/fim-registry-keys.json',
      ),
    ],
    outputFile: 'states-fim-registries-keys.json',
  },
  'states-fim-registries-values': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/fim-registry-values.json',
      ),
    ],
    outputFile: 'states-fim-registries-values.json',
  },
  // Inventory templates (using the most recent versions without -update suffix)
  'states-inventory-system': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-system.json',
      ),
    ],
    outputFile: 'states-inventory-system.json',
  },
  'states-inventory-hardware': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-hardware.json',
      ),
    ],
    outputFile: 'states-inventory-hardware.json',
  },
  'states-inventory-networks': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-networks.json',
      ),
    ],
    outputFile: 'states-inventory-networks.json',
  },
  'states-inventory-packages': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-packages.json',
      ),
    ],
    outputFile: 'states-inventory-packages.json',
  },
  'states-inventory-ports': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-ports.json',
      ),
    ],
    outputFile: 'states-inventory-ports.json',
  },
  'states-inventory-processes': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-processes.json',
      ),
    ],
    outputFile: 'states-inventory-processes.json',
  },
  'states-inventory-protocols': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-protocols.json',
      ),
    ],
    outputFile: 'states-inventory-protocols.json',
  },
  'states-inventory-users': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-users.json',
      ),
    ],
    outputFile: 'states-inventory-users.json',
  },
  'states-inventory-groups': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-groups.json',
      ),
    ],
    outputFile: 'states-inventory-groups.json',
  },
  'states-inventory-services': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-services.json',
      ),
    ],
    outputFile: 'states-inventory-services.json',
  },
  'states-inventory-interfaces': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-interfaces.json',
      ),
    ],
    outputFile: 'states-inventory-interfaces.json',
  },
  'states-inventory-hotfixes': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-hotfixes.json',
      ),
    ],
    outputFile: 'states-inventory-hotfixes.json',
  },
  'states-inventory-browser-extensions': {
    urls: [
      wazuhUrl(
        'plugins/setup/src/main/resources/templates/states/inventory-browser-extensions.json',
      ),
    ],
    outputFile: 'states-inventory-browser-extensions.json',
  },
  'states-sca': {
    urls: [
      wazuhUrl('plugins/setup/src/main/resources/templates/states/sca.json'),
    ],
    outputFile: 'states-sca.json',
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
    object: 'object',
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

function saveOutput(location, dataASObject) {
  const dir = path.dirname(location);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(location, JSON.stringify(dataASObject, null, 2));
}

/**
 * Processes a template and generates known fields
 */
async function processTemplate(templateConfig, config) {
  console.log(`Processing ${templateConfig.name} template...`);

  try {
    const { template, url } = await fetchTemplateFromUrls(
      templateConfig.urls.map(url =>
        interpolate(url, { branch: config.branch }),
      ),
    );
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
    const absoluteOutputFile = path.resolve(
      config.destination,
      templateConfig.outputFile,
    );

    // Write to file
    saveOutput(absoluteOutputFile, knownFields);

    // process.exit(0);
    console.log(
      `  ✅ Generated ${knownFields.length} known fields for ${templateConfig.name} -> ${absoluteOutputFile}`,
    );

    return knownFields;
  } catch (error) {
    console.error(
      `  ❌ Error processing ${templateConfig.name}: ${error.message}`,
    );
    throw error;
  }
}

/**
 * Main function
 */
/**
 * Generic function to combine fields from multiple sources into a single file
 * @param {Object} options - Configuration options
 * @param {Object} options.results - Object containing all processed template results
 * @param {Object} options.config - Configuration object with destination path
 * @param {string} options.keyPrefix - Prefix to filter keys (e.g., 'states-inventory-', 'events-')
 * @param {string} options.outputFileName - Name of the output file (e.g., 'states-inventory.json', 'events.json')
 * @param {string} options.displayName - Display name for logging (e.g., 'states-inventory', 'events')
 * @returns {Promise<Array|null>} Combined fields array or null if no fields to combine
 */
async function generateCombinedFields({
  results,
  config,
  keyPrefix,
  outputFileName,
  displayName,
}) {
  console.log(`Processing combined ${displayName} fields...`);

  const matchingKeys = Object.keys(results).filter(
    key => key.startsWith(keyPrefix) && results[key],
  );

  if (matchingKeys.length === 0) {
    console.log(`  ⚠️  No ${displayName} fields to combine`);
    return null;
  }

  // Use a Map to deduplicate fields by name
  const fieldsMap = new Map();

  for (const key of matchingKeys) {
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
  const outputPath = path.resolve(config.destination, outputFileName);
  saveOutput(outputPath, combinedFields);

  console.log(
    `  ✅ Generated ${combinedFields.length} combined fields for ${displayName} -> ${outputPath}`,
  );

  return combinedFields;
}

async function main(config) {
  console.log(`📦 Using Wazuh version: ${config.branch}`);
  console.log('🚀 Starting known fields generation...\n');

  const results = {};

  for (const [key, templateConfig] of Object.entries(TEMPLATE_SOURCES)) {
    try {
      results[key] = await processTemplate(
        { ...templateConfig, name: key },
        config,
      );
    } catch (error) {
      console.error(`Failed to process ${key}:`, error.message);
      results[key] = null;
    }
    console.log(''); // Add spacing between processing
  }

  // Generate combined inventory fields
  try {
    results['states-inventory'] = await generateCombinedFields({
      results,
      config,
      keyPrefix: 'states-inventory-',
      outputFileName: 'states-inventory.json',
      displayName: 'states-inventory',
    });
  } catch (error) {
    console.error(
      'Failed to generate combined inventory fields:',
      error.message,
    );
    process.exit(1);
    results['states-inventory'] = null;
  }
  console.log(''); // Add spacing

  // Generate combined events fields
  try {
    results['events'] = await generateCombinedFields({
      results,
      config,
      keyPrefix: 'events-',
      outputFileName: 'events.json',
      displayName: 'events',
    });
  } catch (error) {
    console.error('Failed to generate combined events fields:', error.message);
    process.exit(1);
    results['events'] = null;
  }
  console.log(''); // Add spacing

  // Summary
  let shouldFail = false;

  console.log('📊 Summary:');
  for (const [key, fields] of Object.entries(results)) {
    if (fields) {
      console.log(`  ${key}: ✅ ${fields.length} fields generated`);
    } else {
      // Mark overall failure if any template failed
      shouldFail = true;
      console.log(`  ${key}: ❌ Failed`);
    }
  }

  // Exit with error if any template failed
  if (shouldFail) {
    console.error(
      '\n💥 One or more templates failed to process. Exiting with error.',
    );
    process.exit(1);
  }

  console.log('\n✨ Known fields generation completed!');
}

// Run if called directly
if (require.main === module) {
  const config = parseInput(process.argv.slice(2));
  // Default to package version if not provided
  config.branch = config.branch || packageJson.version;
  config.destination = path.resolve(
    config.destination ||
      path.resolve(__dirname, '..', '..', 'common', 'known-fields'),
  );
  // process.exit(0);

  main(config).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  processTemplate,
  extractFields,
  mapIndexFieldType,
};
