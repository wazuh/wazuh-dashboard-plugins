#!/usr/bin/env node

const { generateSampleDataWithDataset } = require('./lib/index');
const path = require('path');
const fs = require('fs');

// Get available datasets first
const datasets = fs
  .readdirSync(
    path.join(__dirname, '../../plugins/main/server/lib/sample-data/dataset'),
  )
  .filter(file => !file.endsWith('.js'));

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

// Define the formats
const formats = {
  ndjson: {
    description: 'Format the alerts to ndjson. Each line is an alert.',
    run: alerts => {
      return alerts.map(item => JSON.stringify(item)).join('\n');
    },
  },
  'bulk-api': {
    description: 'Format the alerts to OpenSearch or Elasticsearch Bulk API.',
    run: (alerts, index) => {
      if (!index) {
        console.error(
          'Index is not defined. Use --index parameter with bulk-api format.',
        );
        process.exit(1);
      }
      return (
        alerts
          .map(
            alert =>
              `{"index": {"_index": "${index}"}}\n${JSON.stringify(alert)}`,
          )
          .join('\n') + '\n'
      );
    },
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const usage = `
Usage: node cli.js [options]

Options:
  --dataset <name>     Dataset name to use (required) (available datasets: ${datasets.join(
    ', ',
  )})
  --count <number>     Number of alerts to generate (default: 100)
  --output <file>      Output file to save the generated sample data (optional)
  --format <format>    Output format (default: ndjson)
                       Available formats: ${Object.keys(formats).join(', ')}
  --index <name>       Index name for bulk-api format (required when using bulk-api format)
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

Example:
  node cli.js --dataset states-fim-files --count 500
  node cli.js --dataset states-fim-files --count 500 --output sample-data.ndjson
  node cli.js --dataset states-fim-files --count 500 --format bulk-api --index wazuh-alerts --output bulk-data.json
  node cli.js --dataset states-fim-files --param-manager-name my-manager --param-cluster-name my-cluster
`;

// Parse arguments
let dataset = null;
let count = 100;
let outputFile = null;
let format = 'ndjson';
let index = null;
const alertGenerationParams = { ...defaultAlertGenerationParams };

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help') {
    console.log(usage);
    process.exit(0);
  } else if (args[i] === '--dataset' && i + 1 < args.length) {
    dataset = args[i + 1];
    i++;
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

// Validate required arguments
if (!dataset) {
  console.error('Error: --dataset is required');
  console.log(usage);
  process.exit(1);
}

// Validate index parameter when using bulk-api format
if (format === 'bulk-api' && !index) {
  console.error('Error: --index is required when using bulk-api format');
  console.log(usage);
  process.exit(1);
}

try {
  const resultOrPromise = [];

  for (let i = 0; i < count; i++) {
    resultOrPromise.push(
      generateSampleDataWithDataset(dataset, alertGenerationParams),
    );
  }

  // Check if the result is a Promise
  if (resultOrPromise && typeof resultOrPromise.then === 'function') {
    // Handle as Promise
    resultOrPromise
      .then(result => {
        handleResult(result);
      })
      .catch(error => {
        console.error('Error generating alerts:', error);
        process.exit(1);
      });
  } else {
    // Handle as direct result
    handleResult(resultOrPromise);
  }
} catch (error) {
  console.error('Error generating alerts:', error);
  process.exit(1);
}

// Function to handle the result
function handleResult(result) {
  // Check if result exists
  if (!result) {
    console.log('No alerts were generated');
    return;
  }

  // Ensure result is an array
  const alertsArray = Array.isArray(result) ? result : [result];

  // Save to file if output file is specified
  if (outputFile) {
    const outputPath = path.resolve(outputFile);

    try {
      // Format the data according to the selected format
      let formattedData;
      if (format === 'ndjson') {
        formattedData = formats.ndjson.run(alertsArray);
      } else if (format === 'bulk-api') {
        formattedData = formats['bulk-api'].run(alertsArray, index);
      }

      fs.writeFileSync(outputPath, formattedData);
      console.log(`Alerts saved to ${outputPath} in ${format} format`);
    } catch (error) {
      console.error('Error saving to file:', error);
      console.log('Result type:', typeof result);
      console.log(
        'Result structure:',
        JSON.stringify(result).substring(0, 200) + '...',
      );
    }
  } else {
    // Output to console in the selected format
    if (format === 'ndjson') {
      console.log(formats.ndjson.run(alertsArray));
    } else if (format === 'bulk-api') {
      console.log(formats['bulk-api'].run(alertsArray, index));
    }
  }
}
