#!/usr/bin/env node

const {
  generateSampleDataWithDataset,
  getDatasetIndex,
  getDatasetTemplate,
} = require('./lib/index');
const { batch, formats } = require('./lib/output-formats');
const {
  log,
  ensureIndicesExist,
  insertData,
  validateConfig,
} = require('./lib/curl-indexer');
const path = require('path');
const fs = require('fs');

const INSERT_BATCH_SIZE = 500; // docs per curl call when --output insert is used

// Get avalible datasets
const datasets = fs
  .readdirSync(
    path.join(__dirname, '../../plugins/main/server/lib/sample-data/dataset'),
  )
  .filter(file => !file.startsWith('.') && !file.endsWith('.js'));

const findings_datasets = datasets.filter(file => file.startsWith('findings'));

// Default document generation parameters
const defaultDocumentGenerationParams = {
  cluster: {
    name: 'wazuh',
    node: 'node01',
  },
};

const args = process.argv.slice(2);
const usage = `
Usage: node cli.js (--dataset <name> | --all | --all-findings) [options]

There are two kinds of dataset, both used the same way from this CLI:

  - Synthesized (e.g. states-fim-files, metrics-agents): generate fresh random
    documents on every call.
  - Pre-generated findings (prefixed findings-, e.g. findings-aws):
    load documents from a findings.json, reajust their timestamps and inject
    the cluster params. --count cycles over the base documents.

Each dataset may declare a default index (DATASET_INDEX in its main.js). For
bulk-api, the index is resolved as: --index (if given) wins for every dataset;
otherwise each dataset uses its own default. If neither is available for a
dataset, that dataset errors out.

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
                        Requires SAMPLE_DATA_SERVER_ADDRESS, SAMPLE_DATA_USERNAME and
                        SAMPLE_DATA_USER_PASSWORD environment variables to be set; any
                        missing value will trigger an interactive prompt.
                        Before inserting, each target index is created (if it
                        doesn't exist yet) using the settings/mappings from its
                        dataset's template.json, when one is declared.
  --format <format>     Output format (default: ndjson)
                        Available formats: ${Object.keys(formats).join(', ')}
  --index <name>        Index name for bulk-api format. Overrides each dataset's
                        default index. Required only if a dataset has no default.
  --param-cluster-name <name>  Set the cluster name (default: ${
    defaultDocumentGenerationParams.cluster.name
  })
  --param-cluster-node <name>  Set the cluster node (default: ${
    defaultDocumentGenerationParams.cluster.node
  })
  --help               Show this help message

Examples:
  node cli.js --dataset states-fim-files --count 500
  node cli.js --dataset findings-aws --count 20
  node cli.js --dataset findings-sca --format bulk-api
  node cli.js --all --count 50 --output all.ndjson
  node cli.js --all-findings --output insert
`;

/**
 * Example POST curl:
 * curl -k -u USERNAME:PASSWORD -X POST "SAMPLE_DATA_SERVER_ADDRESS/_bulk" -H "Content-Type: application/x-ndjson" --data-binary "@bulk-data.json"
 *
 * Exampl DELETE curl:
 * curl -u USERNAME:PASSWORD -k -H "Content-Type: application/json"   -XPOST "SAMPLE_DATA_SERVER_ADDRESS/INDEX_PATTERN/_delete_by_query?conflicts=proceed"   -d '{"query"{"match_all": {}}}'
 */

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
  console.error(
    'Error: choose a source: --dataset <name>, --all or --all-findings',
  );
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

// Resolve the target datasets up front so indices can be validated before
// generating anything.
const targets = all ? datasets : all_findings ? findings_datasets : [dataset];

// For bulk-api, resolve each dataset's index (--index wins; otherwise the
// dataset's own default) and fail early listing every dataset with no index.
if (format === 'bulk-api') {
  const missing = [];
  for (const name of targets) {
    if (!(index || getDatasetIndex(name))) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    console.error(
      `Error: no index for bulk-api on: ${missing.join(', ')}. ` +
        `Pass --index, or declare DATASET_INDEX in each dataset's main.js.`,
    );
    console.log(usage);
    process.exit(1);
  }
}

// Generation. Each entry keeps its resolved index alongside the document.
const entries = [];
try {
  for (const name of targets) {
    const resolvedIndex = index || getDatasetIndex(name) || null;
    for (let i = 0; i < count; i++) {
      entries.push({
        doc: generateSampleDataWithDataset(name, {
          ...documentGenerationParams,
          index: i,
        }),
        index: resolvedIndex,
        dataset: name,
      });
    }
  }
} catch (error) {
  console.error('Error generating documents:', error);
  process.exit(1);
}

function handleResult(result) {
  if (!result || result.length === 0) {
    console.log('No documents were generated');
    return;
  }

  const docsArray = Array.isArray(result) ? result : [result];

  const formatted =
    format === 'bulk-api'
      ? formats['bulk-api'].run(result)
      : formats.ndjson.run(result);

  if (output) {
    if (output === 'insert') {
      let config = {
        SERVER_ADDRESS: process.env.SAMPLE_DATA_SERVER_ADDRESS,
        USERNAME: process.env.SAMPLE_DATA_USERNAME,
        PASSWORD: process.env.SAMPLE_DATA_USER_PASSWORD,
      };
      config = validateConfig(config);

      const date = new Date().toISOString().replace(/[:.]/g, '-');
      const logPath = path.join(
        __dirname,
        'logs',
        `cli_sample_data_insert_${date}.log`,
      );

      ensureIndicesExist(docsArray, config, logPath, getDatasetTemplate);

      const batches = batch(docsArray, INSERT_BATCH_SIZE);
      const allFailed = [];

      batches.forEach((batchDocs, i) => {
        console.error(
          `Inserting batch ${i + 1}/${batches.length} (${
            batchDocs.length
          } documents)...`,
        );
        const batchFormatted = formats['bulk-api'].run(batchDocs, index);
        const failed = insertData(
          batchFormatted,
          config,
          logPath,
          i + 1,
          batches.length,
        );
        allFailed.push(...failed);
      });

      if (allFailed.length > 0) {
        console.error(
          `\n${allFailed.length} document(s) failed to insert. See the log for details.`,
        );

        const errorLines = allFailed
          .map(item => `${item._id} | ${item.status} | ${item.reason}`)
          .join('\n');

        log(
          logPath,
          `\n${'='.repeat(60)}\nErrors Summary: ${
            allFailed.length
          } document(s) failed\n${'='.repeat(60)}\n${errorLines}\n`,
        );
      }

      console.error(`\nFull log saved to ${logPath}`);
      return;
    } else {
      const outputPath = path.resolve(output);
      try {
        fs.writeFileSync(outputPath, formatted);
        console.error(
          `Saved ${result.length} documents to ${outputPath} in ${format} format`,
        );
      } catch (error) {
        console.error('Error saving to file:', error);
      }
    }
  } else {
    process.stdout.write(formatted + '\n');
  }
}

// Output
handleResult(entries);
