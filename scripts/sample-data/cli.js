#!/usr/bin/env node

const { generateSampleDataWithDataset } = require('./lib/index');
const path = require('path');
const fs = require('fs');

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
let outputFile = null;
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
