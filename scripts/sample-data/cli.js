#!/usr/bin/env node

const { generateSampleDataWithDataset } = require('./lib/index');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Get avalible datasets
const datasets = fs
  .readdirSync(
    path.join(__dirname, '../../plugins/main/server/lib/sample-data/dataset'),
  )
  .filter(file => !file.startsWith('.') && !file.endsWith('.js'));

const findings_datasets = datasets.filter(file => file.startsWith('findings'));

// TODO: Remove at least the manager component if the states datasets are refactored or removed, not an existing field
// Default document generation parameters
const defaultDocumentGenerationParams = {
  manager: {
    name: 'wazuh-manager',
  },
  cluster: {
    name: 'wazuh',
    node: 'node01',
  },
};

// Output formats
const formats = {
  ndjson: {
    description: 'Format the documents to ndjson. Each line is a document.',
    run: docs => docs.map(item => JSON.stringify(item)).join('\n'),
  },
  'bulk-api': {
    description:
      'Format the documents to OpenSearch or Elasticsearch Bulk API.',
    run: (docs, index) => {
      if (!index) {
        console.error(
          'Index is not defined. Use --index parameter with bulk-api format.',
        );
        process.exit(1);
      }
      return (
        docs
          .map(
            doc => `{"create": {"_index": "${index}"}}\n${JSON.stringify(doc)}`,
          )
          .join('\n') + '\n'
      );
    },
  },
};

const args = process.argv.slice(2);
const usage = `
Usage: node cli.js (--dataset <name> | --all) [options]

There are two kinds of dataset, both used the same way from this CLI:

  - Synthesized (e.g. states-fim-files, metrics-agents): generate fresh random
    documents on every call.
  - Pre-generated findings (prefixed findings-, e.g. findings-aws):
    load documents from a findings.json, reajust their timestamps and inject
    the manager/cluster params. --count cycles over the base documents.

Options:
  --dataset <name>      Dataset name to use (required) (available datasets: ${datasets.join(
    ', ',
  )})
  --all                 Generate --count documents for EVERY dataset
  --all-findings        Generate --count documents for EVERY finding dataset
  --count <number>      Number of documents to generate per dataset (default: 100)
  --output <file>       Output file to save the generated data (optional;
                        defaults to stdout)
  --output insert       Value to auto insert the output instead of defaulting to
                        stout or a file. The curl command with the data will be 
                        still saved on a log file, inside the logs folder.
                        insert overrides the format flag to default bulk-api.
                        Requires WAZUH_INDEXER_HOST, WAZUH_INDEXER_PORT, WAZUH_USERNAME and
                        WAZUH_PASSWORD environment variables to be set; any
                        missing value will trigger an interactive prompt.
  --format <format>     Output format (default: ndjson)
                        Available formats: ${Object.keys(formats).join(', ')}
  --index <name>        Index name for bulk-api format (required with bulk-api)
  TODO: REMOVE: --param-manager-name  <name>  Set the manager name (default: ${
    defaultDocumentGenerationParams.manager.name
  })
  --param-cluster-name <name>  Set the cluster name (default: ${
    defaultDocumentGenerationParams.cluster.name
  })
  --param-cluster-node <name>  Set the cluster node (default: ${
    defaultDocumentGenerationParams.cluster.node
  })
  --help               Show this help message

Examples:
  node cli.js --dataset states-fim-files --count 500
  node cli.js --dataset findings-aws/cloudtrail --count 20
  node cli.js --dataset findings-wazuh-sca --format bulk-api --index wazuh-findings-v5
  node cli.js --all --count 50 --output all.ndjson
  node cli.js --dataset states-fim-files --param-cluster-name my-cluster
`;

// Parse arguments
let dataset = null;
let all = false;
let all_findings = false;
let count = 100;
let output = null;
let format = 'ndjson';
let index = null;
const documentGenerationParams = { ...defaultDocumentGenerationParams };

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help') {
    console.log(usage);
    process.exit(0);
  } else if (args[i] === '--dataset' && i + 1 < args.length) {
    dataset = args[i + 1];
    i++;
  } else if (args[i] === '--all') {
    all = true;
  } else if (args[i] === '--all-findings') {
    all_findings = true;
  } else if (args[i] === '--count' && i + 1 < args.length) {
    count = parseInt(args[i + 1], 10);
    if (isNaN(count)) {
      console.error('Error: count must be a number');
      console.log(usage);
      process.exit(1);
    }
    i++;
  } else if (args[i] === '--format' && i + 1 < args.length) {
    const requestedFormat = args[i + 1];
    if (formats[requestedFormat]) {
      format = requestedFormat;
    } else {
      console.error(
        `Error: unsupported format '${requestedFormat}'. Supported formats: ${Object.keys(
          formats,
        ).join(', ')}`,
      );
      console.log(usage);
      process.exit(1);
    }
    i++;
  } else if (args[i] === '--output' && i + 1 < args.length) {
    output = args[i + 1];
    if (output === 'insert') {
      format = 'bulk-api';
      console.log('output set as "insert", override format as bulk-api');
    }
    i++;
  } else if (args[i] === '--index' && i + 1 < args.length) {
    index = args[i + 1];
    i++;
  } else if (args[i] === '--param-manager-name' && i + 1 < args.length) {
    documentGenerationParams.manager.name = args[i + 1];
    i++;
  } else if (args[i] === '--param-cluster-name' && i + 1 < args.length) {
    documentGenerationParams.cluster.name = args[i + 1];
    i++;
  } else if (args[i] === '--param-cluster-node' && i + 1 < args.length) {
    documentGenerationParams.cluster.node = args[i + 1];
    i++;
  }
}

// Validation
if (!dataset && !all && !all_findings) {
  console.error('Error: choose a source: --dataset <name> or --all');
  console.log(usage);
  process.exit(1);
}
if ((dataset && all) || (dataset && all_findings) || (all_findings && all)) {
  console.error(
    'Error: --dataset, --all and --all-findings are mutually exclusive',
  );
  console.log(usage);
  process.exit(1);
}
if (dataset && !datasets.includes(dataset)) {
  console.error(
    `Error: unknown dataset '${dataset}'. Available: ${datasets.join(', ')}`,
  );
  console.log(usage);
  process.exit(1);
}
if (format === 'bulk-api' && !index) {
  console.error('Error: --index is required when using bulk-api format');
  console.log(usage);
  process.exit(1);
}

// Generation
const allDocs = [];
try {
  const targets = all ? datasets : all_findings ? findings_datasets : [dataset];
  for (const name of targets) {
    for (let i = 0; i < count; i++) {
      allDocs.push(
        generateSampleDataWithDataset(name, {
          ...documentGenerationParams,
          index: i,
        }),
      );
    }
  }
} catch (error) {
  console.error('Error generating documents:', error);
  process.exit(1);
}

// Output
handleResult(allDocs);

/**
 * Inserts using curl the data directly to the defined host.
 * Used by --output insert
 * It will create a log on ./logs folder.
 * @param {string} data string with ndsjon format build by bulk-api
 * @param {Object} config object with the configuration: HOST, PORT, USERNAME, PASSWORD
 */
function insertData(data, config) {
  const { HOST, PORT, USERNAME, PASSWORD } = config;
  const url = `https://${HOST}:${PORT}/_bulk`;

  const curlArgs = [
    '-s',
    '-k',
    '-u',
    `${USERNAME}:${PASSWORD}`,
    '-X',
    'POST',
    url,
    '-H',
    'Content-Type: application/x-ndjson',
    '--data-binary',
    '@-',
  ];

  const date = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(
    __dirname,
    'logs',
    `cli_sample_data_insert_${date}.log`,
  );

  const quotedArgs = curlArgs.map(arg => `'${arg}'`).join(' ');
  log(logPath, `curl ${quotedArgs} <<'EOF'\n${data}\nEOF\n`);

  const result = spawnSync('curl', curlArgs, {
    input: data,
    encoding: 'utf-8',
  });

  if (result.error) {
    console.error('Error running curl:', result.error.message);
    log(logPath, `\nError running curl: ${result.error.message}\n`);
    return;
  }

  if (result.status !== 0) {
    console.error(`curl exited with code ${result.status}:`, result.stderr);
    log(
      logPath,
      `\ncurl exited with code ${result.status}:\n${result.stderr}\n`,
    );
    return;
  }

  log(logPath, `\nResponse:\n${result.stdout}\n`);

  try {
    const response = JSON.parse(result.stdout);
    const failed = response.errors
      ? response.items.filter(item => (item.create || item.index)?.error)
      : [];
    console.error(
      failed.length
        ? `Inserted with ${failed.length} error(s) out of ${response.items.length} documents`
        : `Successfully inserted ${response.items.length} documents`,
    );
  } catch (error) {
    console.error('Could not parse curl response:', result.stdout);
  }
}

/**
 * Appends content to a log file, creating the 'logs' folder and the file
 * itself if they don't exist yet.
 * @param {string} logPath full path of the log file to write to
 * @param {string} content text to append
 */
function log(logPath, content) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, content);
}

/**
 * Validates that the configuration is complete and prompts the user for
 * missing values.
 * @param {Object} config empty object or with the configuration:
 *                        HOST, PORT, USERNAME, PASSWORD
 * @returns {Object} Will return the configuration completed in case it was
 *                   missing something.
 */
function validateConfig(config) {
  const defaults = { HOST: 'localhost', PORT: '9200' };

  for (const key of ['HOST', 'PORT', 'USERNAME', 'PASSWORD']) {
    if (!config[key]) {
      const fallback = defaults[key];
      const answer = prompt(`${key}${fallback ? ` (${fallback})` : ''}: `);
      config[key] = answer || fallback;
    }
  }

  return config;
}

/**
 * Helper function for validateConfig to prompt the user.
 */
function prompt(question) {
  process.stdout.write(question);
  const buffer = Buffer.alloc(1024);
  const bytesRead = fs.readSync(0, buffer, 0, 1024);
  return buffer.toString('utf8', 0, bytesRead).trim();
}

function handleResult(result) {
  if (!result || result.length === 0) {
    console.log('No documents were generated');
    return;
  }

  const docsArray = Array.isArray(result) ? result : [result];

  const formatted =
    format === 'bulk-api'
      ? formats['bulk-api'].run(docsArray, index)
      : formats.ndjson.run(docsArray);

  if (output) {
    if (output === 'insert') {
      let config = {
        HOST: process.env.WAZUH_INDEXER_HOST,
        PORT: process.env.WAZUH_INDEXER_PORT,
        USERNAME: process.env.WAZUH_USERNAME,
        PASSWORD: process.env.WAZUH_PASSWORD,
      };
      config = validateConfig(config);
      insertData(formatted, config);
    } else {
      const outputPath = path.resolve(output);
      try {
        fs.writeFileSync(outputPath, formatted);
        console.error(
          `Saved ${docsArray.length} documents to ${outputPath} in ${format} format`,
        );
      } catch (error) {
        console.error('Error saving to file:', error);
      }
    }
  } else {
    process.stdout.write(formatted + '\n');
  }
}
