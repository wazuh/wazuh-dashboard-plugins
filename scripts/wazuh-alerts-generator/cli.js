(function () {
  // Define the CLI information
  const cliName = 'Wazuh alerts generator';
  const cliDescription = 'Generates sample data of Wazuh alerts';
  const cliVersion = '2023.02.03.11.15';

  const cliFilePath = process.argv[1];

  // Default configuration
  const defaultConfiguration = {
    size: 1000,
    displayConfiguration: false,
    displayExamples: false,
    displayHelp: false,
    index: '',
    format: 'ndjson',
    output: 'stdout',
    alertGenerationParams: {
      manager: {
        name: 'wazuh-manager',
      },
      cluster: {
        name: 'wazuh-cluster',
        node: 'wazuh-manager',
      },
    },
  };

  // Current configuration
  const configuration = {
    ...defaultConfiguration,
    modules: {},
  };

  // Define the formats
  const formats = {
    ndjson: {
      description: 'Format the alerts to ndjson. Each line is an alert.',
      run: (createAlerts, configuration) => {
        return createAlerts(configuration).map(JSON.stringify).join('\n');
      },
    },
    'bulk-api': {
      description: 'Format the alerts to OpenSearch or Elasticsearch Bulk API.',
      run: (createAlerts, configuration) => {
        if (!configuration.index) {
          console.error('Index is not defined.');
          process.exit(1);
        }
        return createAlerts(configuration)
          .map(
            alert =>
              `{"index": {"_index": "${
                configuration.index
              }"}}\n${JSON.stringify(alert)}\n`,
          )
          .join('');
      },
    },
  };

  // Define the outputs
  const outputs = {
    stdout: {
      description: 'stdout.',
      run: (data, configuration) => {
        console.log(data);
      },
    },
  };

  // Define the alert modules
  const alertModules = {
    syscheck: { syscheck: true },
    aws: { aws: true },
    gcp: { gcp: true },
    authentication: { authentication: true },
    ssh: { ssh: true },
    apache: { apache: true },
    web: { web: true },
    windows: { windows: { service_control_manager: true } },
    github: { github: true },
    office: { office: true },
    rootcheck: { rootcheck: true },
    audit: { audit: true },
    openscap: { openscap: true },
    ciscat: { ciscat: true },
    vulnerabilities: { vulnerabilities: true },
    virustotal: { virustotal: true },
    osquery: { osquery: true },
    docker: { docker: true },
    mitre: { mitre: true },
    yara: { yara: true },
  };

  // Define the alert module categories
  const categoryAlertModules = {
    security: [
      'apache',
      'authentication',
      'aws',
      'gcp',
      'github',
      'office',
      'ssh',
      'syscheck',
      'web',
      'windows',
    ],
    'auditing-policy-monitoring': ['audit', 'ciscat', 'openscap', 'rootcheck'],
    'thread-detection': [
      'docker',
      'mitre',
      'osquery',
      'virustotal',
      'vulnerabilities',
    ],
  };

  function displayHelp() {
    console.log(`${cliName} (${cliVersion}) - Help
${cliDescription}

Usage: node ${cliFilePath} [options]

Options:
  --all-modules                                       Enable all the modules.
  --category-module-<category-module-id>              Enable the alerts generation of this category module.
    <category-module-id> is one of: ${Object.keys(categoryAlertModules)
      .sort()
      .join(', ')}. You can add multiple flags to enable more categories.
  --size <size>                                       Set the size of alerts to generate for each module. Default: ${
    defaultConfiguration.size
  }.
  --display-configuration                             Display the configuration. Log to sterr.
  --examples                                          Display examples of usage.
  --help                                              Display the help.
  --index <index>                                     Define the index used for some outputs (bulk-api).
  --format <format>                                   Set the format. Default: ${
    defaultConfiguration.format
  }.
    <format> is one of:
${Object.keys(formats)
  .sort()
  .map(formatID => `      ${formatID}: ${formats[formatID].description}`)
  .join('\n')}
  --module-<module-id>                                Enable the alerts generation of this module.
    <module-id> is one of: ${Object.keys(alertModules)
      .sort()
      .join(', ')}.  You can add multiple flags to enable more modules.
  --param-cluster-name <cluster-name>                 Set the cluster name. Default: ${
    defaultConfiguration.alertGenerationParams.cluster.name
  }.
  --param-cluster-node <cluster-node>                 Set the cluster node. Default: ${
    defaultConfiguration.alertGenerationParams.cluster.node
  }.
  --param-manager-name <manager-name>                 Set the manager name. Default: ${
    defaultConfiguration.alertGenerationParams.manager.name
  }.
  --output <output>                                   Set the output. Default: ${
    defaultConfiguration.output
  }.
    <output> is one of:
${Object.keys(outputs)
  .sort()
  .map(outputID => `      ${outputID}: ${outputs[outputID].description}`)
  .join('\n')}
`);
  }

  function displayExamples() {
    console.log(`
- Generate alerts for all the modules in ndjson format and save to a output.ndjson file
node ${cliFilePath} --all-modules > output.ndjson

- Generate alerts for all the modules in OpenSearch/Elasticsearch Bulk API format to a wazuh-alerts index and save to a output.ndjson file
node ${cliFilePath} --all-modules --format bulk-api --index wazuh-alerts > output.ndjson

- Generate alerts for AWS module and save to output.ndjson file
node ${cliFilePath} --module-aws > output.ndjson

- Generate alerts for AWS and GitHub modules, set the size of alerts for module and save to output.ndjson file
node ${cliFilePath} --module-aws --module-github --size 5000 > output.ndjson
`);
  }

  // Get the input parameters
  const consoleInputParameters = [...process.argv].slice(2);

  // Display the help information and exit if there is no parameters
  if (consoleInputParameters.length === 0) {
    displayHelp();
    process.exit(1);
  }

  try {
    // Parse the input parameters
    while (consoleInputParameters.length) {
      // Extract the first parameter
      const [parameter] = consoleInputParameters.splice(0, 1);

      // Compare the parameter
      switch (parameter) {
        case '--all-modules':
          // Enable all the modules
          configuration.modules = alertModules;
          break;
        case '--size':
          // Set the size of alerts to generate for each module
          const size =
            typeof consoleInputParameters[0] === 'string'
              ? Number(consoleInputParameters[0])
              : null;
          if (size && !isNaN(size)) {
            configuration.size = size;
            consoleInputParameters.splice(0, 1);
          } else {
            console.error(
              `Size value ${consoleInputParameters[0]} is not a number.`,
            );
            process.exit(1);
          }
          break;
        case '--display-configuration':
          // Display the configuration
          configuration.displayConfiguration = true;
          break;
        case '--examples':
          // Display the examples
          configuration.displayExamples = true;
          break;
        case '--help':
          // Display the configuration
          configuration.displayHelp = true;
          break;
        case '--index':
          // Set the index name used by some formats
          const index =
            typeof consoleInputParameters[0] === 'string'
              ? consoleInputParameters[0]
              : null;
          if (index) {
            configuration.index = index;
            consoleInputParameters.splice(0, 1);
          } else {
            console.error(
              `Index value ${consoleInputParameters[0]} is not defined.`,
            );
            process.exit(1);
          }
          break;
        case '--param-manager-name':
          // Set the index name used by some formats
          const managerName =
            typeof consoleInputParameters[0] === 'string'
              ? consoleInputParameters[0]
              : null;
          if (managerName) {
            configuration.alertGenerationParams = {
              ...configuration.alertGenerationParams,
              manager: {
                name: managerName,
              },
            };
            consoleInputParameters.splice(0, 1);
          } else {
            console.error(
              `Manager name value ${consoleInputParameters[0]} is not defined.`,
            );
            process.exit(1);
          }
          break;
        case '--param-cluster-name':
          // Set the index name used by some formats
          const clusterName =
            typeof consoleInputParameters[0] === 'string'
              ? consoleInputParameters[0]
              : null;
          if (clusterName) {
            configuration.alertGenerationParams = {
              ...configuration.alertGenerationParams,
              cluster: {
                ...(configuration.alertGenerationParams.cluster || {}),
                name: clusterName,
              },
            };
            consoleInputParameters.splice(0, 1);
          } else {
            console.error(
              `Cluster name value ${consoleInputParameters[0]} is not defined.`,
            );
            process.exit(1);
          }
          break;
        case '--param-cluster-node':
          // Set the index name used by some formats
          const clusterNode =
            typeof consoleInputParameters[0] === 'string'
              ? consoleInputParameters[0]
              : null;
          if (clusterNode) {
            configuration.alertGenerationParams = {
              ...configuration.alertGenerationParams,
              cluster: {
                ...(configuration.alertGenerationParams.cluster || {}),
                node: clusterNode,
              },
            };
            consoleInputParameters.splice(0, 1);
          } else {
            console.error(
              `Cluster node value ${consoleInputParameters[0]} is not defined.`,
            );
            process.exit(1);
          }
          break;
        case '--format':
          // Set the format of alerts
          const format =
            typeof consoleInputParameters[0] === 'string' &&
            formats[consoleInputParameters[0]]
              ? consoleInputParameters[0]
              : null;
          if (format) {
            configuration.format = format;
            consoleInputParameters.splice(0, 1);
          } else {
            console.error(
              `Format value ${
                consoleInputParameters[0]
              } is not a allowed.Allowed values: ${Object.keys(formats).join(
                ', ',
              )}`,
            );
            process.exit(1);
          }
          break;
        case '--output':
          // Set the output
          const output =
            typeof consoleInputParameters[0] === 'string' &&
            outputs[consoleInputParameters[0]]
              ? consoleInputParameters[0]
              : null;
          if (output) {
            configuration.output = output;
            consoleInputParameters.splice(0, 1);
          } else {
            console.error(
              `Output value ${
                consoleInputParameters[0]
              } is not a allowed. Allowed values: ${Object.keys(outputs).join(
                ', ',
              )}`,
            );
            process.exit(1);
          }
          break;
        default: {
        }
      }

      // Parse the module options: --module-<module-id>
      const enabledModule = parameter.match(/--module-([A-Za-z\-]+)/);
      const moduleID = enabledModule ? enabledModule[1] : null;
      if (moduleID && alertModules[moduleID]) {
        configuration.modules[moduleID] = { ...alertModules[moduleID] };
      }

      // Parse the category module options: --category-module-<category-module-id>
      const enabledCategoryModule = parameter.match(
        /--category-module-([A-Za-z\-]+)/,
      );
      const categoryModuleID = enabledCategoryModule
        ? enabledCategoryModule[1]
        : null;
      if (enabledCategoryModule && categoryAlertModules[categoryModuleID]) {
        categoryAlertModules[categoryModuleID].forEach(
          moduleID =>
            (configuration.modules[moduleID] = { ...alertModules[moduleID] }),
        );
      }
    }

    // Display the configuration
    if (configuration.displayConfiguration) {
      console.error(configuration); // Send to sterr. This does the configuration can be displayed and redirect the stdout output to a file
    }

    // Display the help
    if (configuration.displayHelp) {
      displayHelp();
      process.exit(0);
    }

    // Display the examples of usage
    if (configuration.displayExamples) {
      displayExamples();
      process.exit(0);
    }

    // Display the help and exit when there are not modules enabled
    if (Object.keys(configuration.modules).length === 0) {
      console.error('No modules enabled.');
      process.exit(1);
    }

    // Define a function to create the alerts according to the configuration
    function createAlerts(configuration) {
      const { generateAlerts } = require('./lib/index');
      return Object.keys(configuration.modules).reduce(
        (accum, module) => [
          ...accum,
          ...generateAlerts(
            { ...alertModules[module], ...configuration.alertGenerationParams },
            configuration.size,
          ),
        ],
        [],
      );
    }

    // Output
    outputs[configuration.output].run(
      // Run the selected output
      formats[configuration.format].run(createAlerts, configuration), // Run the selected formatter. Create and format the alerts
      configuration,
    );
  } catch (error) {
    console.error(`An unexpected error: ${error}`);
    process.exit(1);
  }
})();
