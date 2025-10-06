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
const VERSION = packageJson.version;

console.log(`📦 Using Wazuh version: ${VERSION}`);

// Helper function to generate URLs with dynamic version
function wazuhUrl(path) {
  return `https://raw.githubusercontent.com/wazuh/wazuh/${VERSION}/${path}`;
}

function dashboardPluginsUrl(path) {
  return `https://raw.githubusercontent.com/wazuh/wazuh-dashboard-plugins/${VERSION}/${path}`;
}

// Configuration for different template sources
const TEMPLATE_SOURCES = {
  vulnerabilities: {
    name: 'states-vulnerabilities',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/vulnerability_scanner/indexer/template/index-template.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-vulnerabilities.json',
  },
  alerts: {
    name: 'alerts',
    urls: [wazuhUrl('extensions/elasticsearch/7.x/wazuh-template.json')],
    outputFile: 'plugins/main/public/utils/known-fields/alerts.json',
  },
  monitoring: {
    name: 'monitoring',
    // This is in the dashboard-plugins repo
    urls: [
      dashboardPluginsUrl(
        'plugins/main/server/integration-files/monitoring-template.ts',
      ),
    ],
    outputFile: 'plugins/main/public/utils/known-fields/monitoring.json',
    isTypeScript: true,
  },
  statistics: {
    name: 'statistics',
    // This is in the dashboard-plugins repo
    urls: [
      dashboardPluginsUrl(
        'plugins/main/server/integration-files/statistics-template.ts',
      ),
    ],
    outputFile: 'plugins/main/public/utils/known-fields/statistics.json',
    isTypeScript: true,
  },
  // FIM templates
  'states-fim-files': {
    name: 'states-fim-files',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-fim-files.json',
      ),
    ],
    outputFile: 'plugins/main/public/utils/known-fields/states-fim-files.json',
  },
  'states-fim-registries': {
    name: 'states-fim-registries',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-fim-registries.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-fim-registries.json',
  },
  // Inventory templates (using the most recent versions without -update suffix)
  'states-inventory-system': {
    name: 'states-inventory-system',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-system.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-system.json',
  },
  'states-inventory-hardware': {
    name: 'states-inventory-hardware',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-hardware.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-hardware.json',
  },
  'states-inventory-networks': {
    name: 'states-inventory-networks',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-networks.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-networks.json',
  },
  'states-inventory-packages': {
    name: 'states-inventory-packages',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-packages.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-packages.json',
  },
  'states-inventory-ports': {
    name: 'states-inventory-ports',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-ports.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-ports.json',
  },
  'states-inventory-processes': {
    name: 'states-inventory-processes',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-processes.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-processes.json',
  },
  'states-inventory-protocols': {
    name: 'states-inventory-protocols',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-protocols.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-protocols.json',
  },
  'states-inventory-users': {
    name: 'states-inventory-users',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-users.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-users.json',
  },
  'states-inventory-groups': {
    name: 'states-inventory-groups',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-groups.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-groups.json',
  },
  'states-inventory-services': {
    name: 'states-inventory-services',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-services.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-services.json',
  },
  'states-inventory-interfaces': {
    name: 'states-inventory-interfaces',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-interfaces.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-interfaces.json',
  },
  'states-inventory-hotfixes': {
    name: 'states-inventory-hotfixes',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-hotfixes.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-hotfixes.json',
  },
  'states-inventory-browser-extensions': {
    name: 'states-inventory-browser-extensions',
    urls: [
      wazuhUrl(
        'src/wazuh_modules/inventory_harvester/indexer/template/wazuh-states-inventory-browser-extensions.json',
      ),
    ],
    outputFile:
      'plugins/main/public/utils/known-fields/states-inventory-browser-extensions.json',
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
  return !['text', '_source'].includes(esType);
}

/**
 * Determines if a field should read from doc values
 */
function shouldReadFromDocValues(fieldProps, esType) {
  // These field types don't use doc values
  if (['_id', '_index', '_source', '_type', 'text'].includes(esType))
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

    if (fieldDef.properties) {
      // Nested object - recurse
      fields.push(...extractFields(fieldDef.properties, fullFieldName));
    } else if (fieldDef.type) {
      // Leaf field
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
    }
  }

  return fields;
}

/**
 * Fetches template from URL
 */
function fetchTemplate(url, isTypeScript = false) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (isTypeScript) {
              // For TypeScript files, we need to extract the template object
              // Look for export const template or similar patterns
              const templateMatch = data.match(
                /export\s+const\s+\w*[tT]emplate\s*=\s*({[\s\S]*});?\s*$/m,
              );
              if (templateMatch) {
                try {
                  // Clean up the template string and evaluate it
                  let templateStr = templateMatch[1];

                  // Remove any trailing semicolon or comma
                  templateStr = templateStr.replace(/[;,]\s*$/, '');

                  // Use Function constructor instead of eval for safer evaluation
                  const template = new Function(`return ${templateStr}`)();
                  resolve(template);
                } catch (evalError) {
                  reject(
                    new Error(
                      `Failed to evaluate template object: ${evalError.message}`,
                    ),
                  );
                }
              } else {
                reject(
                  new Error(
                    `Could not extract template from TypeScript file: ${url}`,
                  ),
                );
              }
            } else {
              const template = JSON.parse(data);
              resolve(template);
            }
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
async function fetchTemplateFromUrls(urls, isTypeScript = false) {
  let lastError;

  for (const url of urls) {
    try {
      const template = await fetchTemplate(url, isTypeScript);
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
    const { template, url } = await fetchTemplateFromUrls(
      config.urls,
      config.isTypeScript,
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
