function createCLI(name, description, usage, options) {
  const logger = require('./logger').create([name]);

  function help() {
    console.log(`${name} - Help
${description}

Usage: ${usage}

Options:
${options
  .map(
    option => `${[
      option.long ? '--' + option.long : '',
      option.short ? '-' + option.short : '',
    ]
      .filter(v => v)
      .join(', ')}${option.help ? ' ' + option.help : ''}
  ${option.description}`,
  )
  .join('\n')}
`);
    process.exit(0);
  }

  /**
   *
   * @param {String[]} input Input parameters
   * @returns {Object} the configuration values
   */
  function parse(inputText) {
    if (!inputText) {
      help();
    }
    let configuration = {
      _unparsed: '',
    };
    const input = inputText.split(' ');
    // Parse the input parameters
    while (input.length) {
      // Extract the first parameter
      const [parameter] = input.splice(0, 1);

      const option = options.find(
        option =>
          parameter === '--' + option.long || parameter === '-' + option.short,
      );

      if (option) {
        configuration = {
          ...configuration,
          ...option.parse(parameter, input, { logger, option, help }),
        };
      } else {
        configuration._unparsed = [configuration._unparsed, parameter]
          .filter(v => v)
          .join(' ');
      }
    }
    // Review the required options
    const requiredOptionsMissing = options.filter(
      ({ required, long }) =>
        required && typeof configuration[long] === 'undefined',
    );

    if (requiredOptionsMissing.length) {
      console.log(
        `Missing options: ${requiredOptionsMissing
          .map(({ long }) => long)
          .join(', ')}
        `,
      );
      help();
      process.exit(1);
    }

    return configuration;
  }

  return {
    parse,
    help,
    logger,
  };
}

module.exports = createCLI;
