/**
 * Script to download and update template files from a public GitHub repository
 * This script updates the template.json files in each dataset
 *
 * Usage:
 *   node update-templates-sample-data.js [--branch=<branch-name>]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const params = {};

  args.forEach(arg => {
    if (arg.startsWith('--branch=')) {
      params.branch = arg.split('=')[1];
    }
  });

  return params;
};

// Read version from VERSION.json file
const getVersionInfo = () => {
  try {
    const versionPath = path.join(__dirname, '../../../../VERSION.json');
    const versionContent = fs.readFileSync(versionPath, 'utf8');
    return JSON.parse(versionContent);
  } catch (error) {
    console.error(`Error reading VERSION.json file: ${error.message}`);
    process.exit(1);
  }
};

// Determine branch based on version or command line argument
const getBranch = () => {
  const args = parseArgs();
  if (args.branch) {
    console.log(`Using specified branch: ${args.branch}`);
    return args.branch;
  }

  const versionInfo = getVersionInfo();
  const version = versionInfo.version;
  console.log(`Using version as branch: ${version}`);
  return version;
};

// Configuration
const config = {
  // GitHub repository base URL with dynamic branch
  githubRepoBaseUrl: `https://raw.githubusercontent.com/wazuh/wazuh-indexer-plugins/${getBranch()}/plugins/setup/src/main/resources`,
  // Local directory where datasets are located
  localDatasetDir: path.join(__dirname, '../../server/lib/sample-data/dataset'),
  // List of datasets to update (obtained from local directory)
  datasets: [],
  // Mapping from local dataset names to remote template filenames
  datasetToTemplateMapping: {
    'agents-monitoring': 'templates/monitoring.json',
    'server-statistics': 'templates/statistics.json',
    'states-fim-files': 'templates/states/fim-files.json',
    'states-fim-registry-keys': 'templates/states/fim-registry-keys.json',
    'states-fim-registry-values': 'templates/states/fim-registry-values.json',
    'states-sca': 'templates/states/sca.json',
    'states-vulnerabilities': 'templates/states/vulnerabilities.json',
    'states-inventory-packages': 'templates/states/inventory-packages.json',
    'states-inventory-processes': 'templates/states/inventory-processes.json',
    'states-inventory-system': 'templates/states/inventory-system.json',
    'states-inventory-networks': 'templates/states/inventory-networks.json',
    'states-inventory-ports': 'templates/states/inventory-ports.json',
    'states-inventory-hardware': 'templates/states/inventory-hardware.json',
    'states-inventory-hotfixes': 'templates/states/inventory-hotfixes.json',
    'states-inventory-interfaces': 'templates/states/inventory-interfaces.json',
    'states-inventory-groups': 'templates/states/inventory-groups.json',
    'states-inventory-users': 'templates/states/inventory-users.json',
    'states-inventory-services': 'templates/states/inventory-services.json',
    'states-inventory-protocols': 'templates/states/inventory-protocols.json',
    'states-inventory-browser-extensions':
      'templates/states/inventory-browser-extensions.json',
  },
  // WORKAROUND: This dataset is ignored due to issues with its template file (no existing in source repository). The wazuh-events dataset should be composed with the other wazuh-events related datasets in the future.
  ignore_datasets: ['wazuh-events'],
};

// Function to get the list of datasets
function getDatasets() {
  try {
    const items = fs.readdirSync(config.localDatasetDir);
    config.datasets = items.filter(item => {
      // Ignore specific datasets
      if (config.ignore_datasets.includes(item)) {
        return false;
      }
      const itemPath = path.join(config.localDatasetDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    console.log(`Found ${config.datasets.length} datasets to update.`);
  } catch (error) {
    console.error(`Error reading datasets directory: ${error.message}`);
    process.exit(1);
  }
}

// Function to download a file from GitHub
function downloadFile(dataset) {
  const templateFile = config.datasetToTemplateMapping[dataset];

  if (!templateFile) {
    return Promise.reject(
      new Error(
        `No template mapping found for dataset: ${dataset}. Add it to datasetToTemplateMapping in config.`,
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const url = `${config.githubRepoBaseUrl}/${templateFile}`;

    console.log(`Downloading: ${url}`);

    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Error downloading ${url}: ${response.statusCode}`));
          return;
        }

        let data = '';
        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {
          resolve(data);
        });
      })
      .on('error', error => {
        reject(error);
      });
  });
}

// Function to save the downloaded file
function saveFile(dataset, filename, content) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(config.localDatasetDir, dataset, filename);

    fs.writeFile(filePath, content, 'utf8', error => {
      if (error) {
        reject(error);
        return;
      }
      resolve(filePath);
    });
  });
}

// Main function to update templates
async function updateTemplates() {
  getDatasets();

  console.log('Starting templates update...');

  const results = {
    success: [],
    failed: [],
  };

  // Create an array of promises for all datasets
  const updatePromises = config.datasets.map(async dataset => {
    try {
      console.log(`\nProcessing dataset: ${dataset}`);

      // Check if template.json file exists in the dataset
      const templatePath = path.join(
        config.localDatasetDir,
        dataset,
        'template.json',
      );
      if (!fs.existsSync(templatePath)) {
        console.log(
          `The template.json file doesn't exist in ${dataset}, will try to download it.`,
        );
      }

      // Download template.json file from GitHub
      const content = await downloadFile(dataset);

      // Save the downloaded file
      await saveFile(dataset, 'template.json', content);

      console.log(`✅ Template updated for ${dataset}`);
      results.success.push(dataset);
    } catch (error) {
      console.error(`❌ Error updating ${dataset}: ${error.message}`);
      results.failed.push({ dataset, error: error.message });
    }
  });

  // Wait for all promises to resolve
  await Promise.all(updatePromises);

  // Show summary
  console.log('\n===== UPDATE SUMMARY =====');
  console.log(`✅ Successfully updated datasets: ${results.success.length}`);
  console.log(`❌ Datasets with errors: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nError details:');
    results.failed.forEach(item => {
      console.log(`- ${item.dataset}: ${item.error}`);
    });
    throw new Error('Some datasets failed to update.');
  }
}

// Execute the main function
updateTemplates().catch(error => {
  console.error(`General error: ${error.message}`);
  process.exit(1);
});
