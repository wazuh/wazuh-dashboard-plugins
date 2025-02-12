(async function () {
  /* Utility inspect */
  function inspect(obj) {
    console.error(
      require('util').inspect(obj, {
        showHidden: false,
        depth: null,
        colors: true,
      }),
    );
  }
  // Constants
  const OUTPUT_FILE_ENDPOINTS = 'endpoints.json';
  const OUTPUT_FILE_SECURITY_ACTIONS = 'security-actions.json';

  // Define the CLI information
  const cliName = 'API data extractor';
  const cliDescription = `Extract the API data

Some warning messages are sent to stderr.`;
  const cliFilePath = process.argv[1];

  // Default configuration
  const defaultConfiguration = {
    displayConfiguration: false,
    displayExamples: false,
    displayHelp: false,
    format: 'plugin',
    output: 'stdout',
  };

  // Current configuration
  const configuration = {
    ...defaultConfiguration,
  };

  // Define the formats
  const formats = {
    plugin: {
      description: 'Plugin',
      run: async (run, configuration) => {
        return await run(configuration);
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
    file: {
      description: 'file.',
      check: function (configuration) {
        if (!configuration.outputDirectory) {
          console.error(
            `output directory is not defined. Use --output-directory <output-directory>.`,
          );
          process.exit(1);
        }
      },
      run: (data, configuration) => {
        /**
         * Save content to file
         * @param {String} filename
         * @param {String} content
         */
        function saveContentToFile(filename, content) {
          const fs = require('fs');
          const path = require('path');

          // Target file path
          const directoryPath = path.join(
            configuration.outputDirectory,
            filename,
          );

          // Write file
          fs.writeFile(directoryPath, content, function (error, data) {
            if (error) {
              console.error(
                `An error appeared saving the output file "${directoryPath}":`,
                error,
              );
              process.exit(1);
            }
            console.log(`File was created! Path: ${directoryPath}`);
          });
        }

        // Save API endpoints data
        saveContentToFile(
          OUTPUT_FILE_ENDPOINTS,
          JSON.stringify(data.endpoints, null, 2),
        );

        // Save API security actions data
        saveContentToFile(
          OUTPUT_FILE_SECURITY_ACTIONS,
          JSON.stringify(data.securityActions, null, 2),
        );
      },
    },
  };

  /**
   * Display the CLI help
   */
  function displayHelp() {
    console.log(`${cliName} - Help
${cliDescription}

Usage: node ${cliFilePath} --spec <URL OpenAPI file/local file in POJO> [options]

Options:
  --display-configuration                             Display the configuration. Log to sterr.
  --examples                                          Display examples of usage.
  --help                                              Display the help.
  --format <format>                                   Set the format. Default: ${
    defaultConfiguration.format
  }.
    <format> is one of:
${Object.keys(formats)
  .sort()
  .map(formatID => `      ${formatID}: ${formats[formatID].description}`)
  .join('\n')}
  --output <output>                                   Set the output. Default: ${
    defaultConfiguration.output
  }.
    <output> is one of:
${Object.keys(outputs)
  .sort()
  .map(outputID => `      ${outputID}: ${outputs[outputID].description}`)
  .join('\n')}
  --output-directory <directory>                      Set the directory.
  --spec <URL OpenAPI file/local file in POJO>        Define the specification file.
`);
  }

  /**
   * Display the examples
   */
  function displayExamples() {
    // TODO: examples
    console.log(`
- Get API data from URL spec file and save to files (API branch main). Run from project root path.
node ${cliFilePath} --spec https://raw.githubusercontent.com/wazuh/wazuh/main/api/api/spec/spec.yaml --output file --output-directory common/api-info

- Get API data from URL spec file using the plugin version and save to files. Run from project root path.
node ${cliFilePath} --spec https://raw.githubusercontent.com/wazuh/wazuh/$(node -e \"console.log(require('./package.json').version.split('.').splice(0,2).join('.'))\")/api/api/spec/spec.yaml --output file --output-directory common/api-info

- Unused: Get API data from spec file and print to stdout (API branch main). Run from project root path.
node ${cliFilePath} --spec https://raw.githubusercontent.com/wazuh/wazuh/main/api/api/spec/spec.yaml --output stdout

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
        case '--format':
          // Set the format
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
              } is not a allowed. Allowed values: ${Object.keys(formats).join(
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
        case '--output-directory': {
          // Set the output directory
          const outputDirectory =
            typeof consoleInputParameters[0] === 'string' &&
            consoleInputParameters[0]
              ? consoleInputParameters[0]
              : null;
          if (outputDirectory) {
            const path = require('path');
            configuration.outputDirectory = path.resolve(outputDirectory);
            consoleInputParameters.splice(0, 1);
          } else {
            console.error(
              `Output directory value ${consoleInputParameters[0]} is not a allowed.`,
            );
            process.exit(1);
          }
          break;
        }
        case '--spec': {
          // Set the API specification file
          const specFile =
            typeof consoleInputParameters[0] === 'string'
              ? consoleInputParameters[0]
              : null;
          if (specFile) {
            configuration.spec = specFile;
            consoleInputParameters.splice(0, 1);
          }
          break;
        }
        default: {
        }
      }
    }

    // Display the configuration
    if (configuration.displayConfiguration) {
      console.error(configuration); // Send to stderr. This does the configuration can be displayed and redirect the stdout output to a file
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

    if (!configuration.spec) {
      console.error('API spec file is not defined.');
      process.exit(1);
    }

    /* eslint-disable no-inner-declarations*/
    // Define a function to extract the data
    function extractDataEndpoints(spec, configuration) {
      const apiVersionShort = spec.info.version
        .split('.')
        .splice(0, 2)
        .join('.');

      /**
       * Replaces the endpoint parameter from {parameter} to :parameter
       * @param {string} endpointPath
       * @returns
       */
      function formatEndpointPath(endpointPath) {
        return endpointPath.replace(/\{([^}]+)\}/g, (capture, group) => {
          return `:${group}`;
        });
      }

      /**
       * Generates the documentation link for the API operation
       * @param {String} operationId
       * @returns
       */
      function generateEndpointDocumentationLink(operationId) {
        return `https://documentation.wazuh.com/${apiVersionShort}/user-manual/api/reference.html#operation/${operationId}`;
      }

      /**
       * Extract the in key from the endpoint data
       * @param {*} param0
       * @returns
       */
      function formatEndpointParameters({ in: typeParam, ...endpointData }) {
        return endpointData;
      }

      /**
       * Alphabetical sorting
       * @param {string} a
       * @param {string} b
       * @returns
       */
      function sortAlphabetical(a, b) {
        if (a > b) {
          return 1;
        } else if (a < b) {
          return -1;
        }
        return 0;
      }

      /**
       * Alphabetical sorting by name property
       * @param {*} a
       * @param {*} b
       * @returns
       */
      function sortAlphabeticalByNameProp(a, b) {
        return sortAlphabetical(a.name, b.name);
      }

      const endpoints = Object.entries(spec.paths).reduce(
        (accum, [endpointPath, endpointData]) => {
          Object.keys(endpointData).forEach(httpMethod => {
            const httpMethodUppercase = httpMethod.toUpperCase();
            const endpointMethodData = endpointData[httpMethod];
            const { description, summary, tags } = endpointMethodData;

            const endpointMethodParameters =
              endpointMethodData.parameters || [];

            const name = formatEndpointPath(endpointPath);
            const documentation = generateEndpointDocumentationLink(
              endpointMethodData.__originalOperationId, // original operation ID
            );
            // Endpoint path parameters
            const args = endpointMethodParameters
              .filter(parameter => parameter.in === 'path')
              .map(formatEndpointParameters)
              .sort(sortAlphabeticalByNameProp)
              .map(item => ({ ...item, name: `:${item.name}` }));

            // Endpoint query parameters
            const query = endpointMethodParameters
              .filter(parameter => parameter.in === 'query')
              .map(formatEndpointParameters)
              .sort(sortAlphabeticalByNameProp);

            // Endpoint body parameters
            const body =
              endpointMethodData.requestBody &&
              endpointMethodData.requestBody.content &&
              endpointMethodData.requestBody.content['application/json'] &&
              endpointMethodData.requestBody.content['application/json']
                .schema &&
              endpointMethodData.requestBody.content['application/json'].schema
                .properties
                ? {
                    ...endpointMethodData.requestBody.content[
                      'application/json'
                    ].schema,
                  }
                : null;

            //Wazuh prefix is removed due issue [#6155](https://github.com/wazuh/wazuh-dashboard-plugins/pull/6155)

            accum[httpMethodUppercase] = [
              ...accum[httpMethodUppercase],
              {
                name,
                documentation,
                description: description.replace(/Wazuh/g, 'Server'),
                summary: summary.replace(/Wazuh/g, 'Server'),
                tags,
                ...(args.length ? { args } : {}),
                ...(query.length
                  ? {
                      query: query.map(({ ...params }) => ({
                        ...params,
                        ...(params.description
                          ? {
                              description: params.description.replace(
                                /Wazuh/g,
                                'Server',
                              ),
                            }
                          : {}),
                      })),
                    }
                  : {}),
                ...(body ? { body: [body] } : {}),
              },
            ];
          });
          return accum;
        },
        ['GET', 'PUT', 'POST', 'DELETE'].reduce(
          (accum, httpMethod) => ({ ...accum, [httpMethod]: [] }),
          {},
        ),
      );

      return Object.entries(endpoints).map(([httpMethod, endpointsData]) => ({
        method: httpMethod,
        endpoints: endpointsData.sort(sortAlphabeticalByNameProp),
      }));
    }

    function extractDataSecurityActions(spec, configuration) {
      /* Replicate the logic of GET /security/actions endpoint response
        Based on https://github.com/wazuh/wazuh/blob/v4.4.3/framework/wazuh/security.py#L1090-L1105
      */
      let data = {};
      for (const path in spec.paths) {
        const pathData = spec.paths[path];
        for (const method in pathData) {
          const payload = pathData[method];
          if (payload['x-rbac-actions']) {
            for (const rbacAction in payload['x-rbac-actions']) {
              const action = payload['x-rbac-actions'][rbacAction]['$$ref']
                .split('/')
                .slice(-1)[0];
              if (!data[action]) {
                const { $$ref, ...rest } =
                  payload['x-rbac-actions'][rbacAction];
                if (rest.resources) {
                  rest.resources = rest.resources.map(
                    resource => resource['$$ref'].split('/').slice(-1)[0],
                  );
                }
                data[action] = rest;
              }
              if (!data[action]['related_endpoints']) {
                data[action]['related_endpoints'] = [];
              }
              data[action]['related_endpoints'].push(
                `${method.toUpperCase()} ${path}`,
              );
            }
          }
        }
      }
      return data;
    }

    /**
     * Get the API spec
     * @param {*} configuration
     * @param {*} swaggerClientExtraOptions
     * @returns
     */
    async function getAPISpec(configuration, swaggerClientExtraOptions = {}) {
      let spec;

      try {
        const options = configuration.spec.startsWith('http')
          ? { url: configuration.spec }
          : { spec: require(configuration.spec) };

        spec = await require('swagger-client').resolve({
          ...options,
          ...swaggerClientExtraOptions,
        });
      } catch (error) {
        console.error(error);
        process.exit(1);
      }

      if (!spec) {
        console.error('The spec can not be loaded.');
        process.exit(1);
      }
      return spec;
    }

    async function getDataAPISpecWithExtractor(
      extractor,
      configuration,
      swaggerClientExtraOptions,
    ) {
      const spec = await getAPISpec(configuration, swaggerClientExtraOptions);
      return extractor(spec.spec, configuration);
    }

    async function getDataAPISpec(configuration) {
      /* The API spec file is obtained one time for each resource because the `$$ref` key is needed
        for a resource and should be removed to the another one.
      */
      return {
        endpoints: await getDataAPISpecWithExtractor(
          extractDataEndpoints,
          configuration,
          { allowMetaPatches: false }, // This removes the meta property $$ref
        ),
        securityActions: await getDataAPISpecWithExtractor(
          extractDataSecurityActions,
          configuration,
          { allowMetaPatches: true },
        ),
      };
    }

    // Check output is valid
    if (!outputs[configuration.output]) {
      console.error(
        `Output is not valid: Allowed output: ${Object.keys(outputs).join(
          ', ',
        )}`,
      );
      process.exit(1);
    }

    if (outputs[configuration.output].check) {
      outputs[configuration.output].check(configuration);
    }

    // Output
    // Run the selected output
    outputs[configuration.output].run(
      // Run the selected formatter. Create and format the data
      await formats[configuration.format].run(getDataAPISpec, configuration),
      configuration,
    );
  } catch (error) {
    console.error(`An unexpected error: ${error}. ${error.stack}`);
    process.exit(1);
  }
})();
