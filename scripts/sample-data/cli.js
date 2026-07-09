#!/usr/bin/env node

const { generateSampleDataWithDataset, listDatasets } = require('./lib/index');
const path = require('path');
const fs = require('fs');

// Root of the sample-data module (holds ./dataset).
const SAMPLE_DATA_DIR = path.join(
  __dirname,
  '../../plugins/main/server/lib/sample-data',
);

// Available datasets: every folder under ./dataset containing a main.js,
// reported as a path relative to ./dataset. May be nested (e.g.
// "findings-aws/cloudtrail"). Synthesized datasets (states-*, metrics-*)
// generate fresh random documents; findings-* datasets load pre-generated
// documents from a findings.json and reajust them.
const datasets = listDatasets();

// Default alert generation parameters
const defaultAlertGenerationParams = {
  manager: {
    name: 'wazuh-manager',
  },
  cluster: {
    name: 'wazuh-cluster',
    node: 'wazuh-manager',
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
      // "create" (instead of "index") avoids silently overwriting existing
      // documents and keeps re-seeding idempotent when docs carry a
      // deterministic _id.
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

Seeds sample data from the ./dataset catalogue. Every dataset exposes a
generateDocument(params) and is referenced by its path relative to ./dataset.

There are two kinds of dataset, both used the same way from this CLI:

  - Synthesized (e.g. states-fim-files, metrics-agents): generate fresh random
    documents on every call.
  - Pre-generated findings (prefixed findings-, e.g. findings-aws/cloudtrail):
    load documents from a findings.json, reajust their timestamps and inject
    the manager/cluster params. --count cycles over the base documents.

Options:
  --dataset <name>     Dataset to use, path relative to ./dataset
                       (available: ${datasets.join(', ')})
  --all                Generate --count documents for EVERY dataset
  --count <number>     Number of documents to generate per dataset (default: 100)
  --output <file>      Output file to save the generated data (optional;
                       defaults to stdout)
  --format <format>    Output format (default: ndjson)
                       Available formats: ${Object.keys(formats).join(', ')}
  --index <name>       Index name for bulk-api format (required with bulk-api)
  --param-manager-name <name>  Set the manager name (default: ${
    defaultAlertGenerationParams.manager.name
  })
  --param-cluster-name <name>  Set the cluster name (default: ${
    defaultAlertGenerationParams.cluster.name
  })
  --param-cluster-node <name>  Set the cluster node (default: ${
    defaultAlertGenerationParams.cluster.node
  })
  --help               Show this help message

Examples:
  node cli.js --dataset states-fim-files --count 500
  node cli.js --dataset findings-aws/cloudtrail --count 20
  node cli.js --dataset findings-wazuh-sca --format bulk-api --index wazuh-alerts-sample
  node cli.js --all --count 50 --output all.ndjson
  node cli.js --dataset states-fim-files --param-manager-name my-manager
`;

// Argument parsing
let dataset = null;
let all = false;
let count = 100;
let outputFile = null;
let format = 'ndjson';
let index = null;
const alertGenerationParams = {
  manager: { ...defaultAlertGenerationParams.manager },
  cluster: { ...defaultAlertGenerationParams.cluster },
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help') {
    console.log(usage);
    process.exit(0);
  } else if (args[i] === '--dataset' && i + 1 < args.length) {
    dataset = args[i + 1];
    i++;
  } else if (args[i] === '--all') {
    all = true;
  } else if (args[i] === '--count' && i + 1 < args.length) {
    count = parseInt(args[i + 1], 10);
    if (isNaN(count)) {
      console.error('Error: count must be a number');
      console.log(usage);
      process.exit(1);
    }
    i++;
  } else if (args[i] === '--output' && i + 1 < args.length) {
    outputFile = args[i + 1];
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
  } else if (args[i] === '--index' && i + 1 < args.length) {
    index = args[i + 1];
    i++;
  } else if (args[i] === '--param-manager-name' && i + 1 < args.length) {
    alertGenerationParams.manager.name = args[i + 1];
    i++;
  } else if (args[i] === '--param-cluster-name' && i + 1 < args.length) {
    alertGenerationParams.cluster.name = args[i + 1];
    i++;
  } else if (args[i] === '--param-cluster-node' && i + 1 < args.length) {
    alertGenerationParams.cluster.node = args[i + 1];
    i++;
  }
}

// Validation
if (!dataset && !all) {
  console.error('Error: choose a source: --dataset <name> or --all');
  console.log(usage);
  process.exit(1);
}
if (dataset && all) {
  console.error('Error: --dataset and --all are mutually exclusive');
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
  const targets = all ? datasets : [dataset];
  for (const name of targets) {
    for (let i = 0; i < count; i++) {
      allDocs.push(
        generateSampleDataWithDataset(name, {
          ...alertGenerationParams,
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

  if (outputFile) {
    const outputPath = path.resolve(outputFile);
    try {
      fs.writeFileSync(outputPath, formatted);
      console.error(
        `Saved ${docsArray.length} documents to ${outputPath} in ${format} format`,
      );
    } catch (error) {
      console.error('Error saving to file:', error);
    }
  } else {
    process.stdout.write(formatted + '\n');
  }
}
