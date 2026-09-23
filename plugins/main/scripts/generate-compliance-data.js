/**
 * Generates the regulatory compliance definition files in
 * common/compliance-requirements/ from the source-verified catalogs in
 * wazuh/intelligence-data (compliance-catalogs/).
 *
 * Each catalog is a schema-validated JSON document holding the complete
 * framework as its standard body defines it: one entry per control with an
 * `id`, a `title`, an optional `description`, and a top-level `aliases` map
 * bridging Wazuh ruleset compliance tag values to control ids.
 *
 * The generated files keep `title` and `description` as separate fields so the
 * plugin can compose them as it needs (see common/compliance-requirements/
 * requirement-text.ts).
 *
 * intelligence-data is a private repository, so fetching needs a token:
 * GITHUB_TOKEN, GH_TOKEN, or an authenticated `gh` CLI. Use
 * --catalog-directory to build from a local checkout instead.
 *
 * Some warning messages are sent to stderr.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Constants
const CATALOG_REPOSITORY = 'wazuh/intelligence-data';
const CATALOG_PATH = 'compliance-catalogs';
const TYPES_MODULE = './types';
const TYPE_NAME = 'ComplianceRequirement';

// Catalog file <-> plugin definition file. `constant` is the exported binding
// the plugin imports; changing any of these is a breaking change for
// public/components/overview/compliance-table.
const FRAMEWORKS = [
  {
    framework: 'pci_dss',
    file: 'pci-requirements.ts',
    constant: 'pciRequirementsFile',
    title: 'PCI DSS',
  },
  {
    framework: 'gdpr',
    file: 'gdpr-requirements.ts',
    constant: 'gdprRequirementsFile',
    title: 'GDPR',
  },
  {
    framework: 'hipaa',
    file: 'hipaa-requirements.ts',
    constant: 'hipaaRequirementsFile',
    title: 'HIPAA',
  },
  {
    framework: 'nist_800_53',
    file: 'nist-requirements.ts',
    constant: 'nistRequirementsFile',
    title: 'NIST 800-53',
  },
  {
    framework: 'nist_800_171',
    file: 'nist-171-requirements.ts',
    constant: 'nist171RequirementsFile',
    title: 'NIST 800-171',
  },
  {
    framework: 'tsc',
    file: 'tsc-requirements.ts',
    constant: 'tscRequirementsFile',
    title: 'TSC',
  },
  {
    framework: 'iso_27001',
    file: 'iso27001-requirements.ts',
    constant: 'iso27001RequirementsFile',
    title: 'ISO 27001',
  },
  {
    framework: 'cmmc',
    file: 'cmmc-requirements.ts',
    constant: 'cmmcRequirementsFile',
    title: 'CMMC',
  },
  {
    framework: 'nis2',
    file: 'nis2-requirements.ts',
    constant: 'nis2RequirementsFile',
    title: 'NIS2',
  },
  {
    framework: 'fedramp',
    file: 'fedramp-requirements.ts',
    constant: 'fedrampRequirementsFile',
    title: 'FedRAMP',
  },
];

// Define the CLI information
const cliName = 'Compliance data generator';
const cliDescription = `Generate the regulatory compliance requirement definitions

Some warning messages are sent to stderr.`;
const cliFilePath = process.argv[1];

// Default configuration
const defaultConfiguration = {
  catalogDirectory: null,
  check: false,
  displayConfiguration: false,
  displayExamples: false,
  displayHelp: false,
  frameworks: null,
  output: 'stdout',
  outputDirectory: null,
  ref: 'main',
  rulesetDirectory: null,
};

/**
 * Display the CLI help
 */
function displayHelp() {
  console.log(`${cliName} - Help
${cliDescription}

Usage: node ${cliFilePath} [options]

Options:
  --catalog-directory <directory>   Read the catalogs from a local checkout of the
                                    intelligence-data repository instead of fetching them.
                                    The directory holds the <framework>.json files.
  --check                           Do not write. Exit 1 when a generated file differs from
                                    the one on disk. Intended for CI.
  --display-configuration           Display the configuration. Log to stderr.
  --examples                        Display examples of usage.
  --framework <framework>           Only generate this framework. Repeatable. One of:
                                    ${FRAMEWORKS.map(
                                      ({ framework }) => framework,
                                    ).join(', ')}.
  --help                            Display this help.
  --output <output>                 Define the output: stdout (default) or file.
  --output-directory <directory>    Directory to write the definition files to.
                                    Required when --output is file.
  --ref <git ref>                   Branch, tag or commit of ${CATALOG_REPOSITORY}. Default: main.
  --ruleset-directory <directory>   Also report the compliance tag values used by a Wazuh
                                    ruleset (a ruleset/sca directory) that no catalog entry
                                    resolves. Log to stderr.
`);
}

/**
 * Display examples of usage
 */
function displayExamples() {
  console.log(`${cliName} - Examples

Regenerate every definition file:
  node ${cliFilePath} --output file --output-directory common/compliance-requirements

Preview one framework:
  node ${cliFilePath} --framework gdpr

Fail when the committed files are out of date:
  node ${cliFilePath} --check --output-directory common/compliance-requirements

Report the ruleset tags no catalog entry resolves:
  node ${cliFilePath} --framework gdpr --ruleset-directory ../../../wazuh/ruleset/sca
`);
}

/**
 * Parse the command line arguments
 * @param {Array<String>} argv
 * @returns {Object} configuration
 */
function parseArguments(argv) {
  const configuration = { ...defaultConfiguration };

  const requireValue = (option, value) => {
    if (typeof value === 'undefined') {
      console.error(`${option} expects a value.`);
      process.exit(1);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];

    switch (argument) {
      case '--catalog-directory':
        configuration.catalogDirectory = requireValue(argument, argv[++index]);
        break;
      case '--check':
        configuration.check = true;
        break;
      case '--display-configuration':
        configuration.displayConfiguration = true;
        break;
      case '--examples':
        configuration.displayExamples = true;
        break;
      case '--framework': {
        const framework = requireValue(argument, argv[++index]);

        if (!FRAMEWORKS.some(item => item.framework === framework)) {
          console.error(
            `Unknown framework "${framework}". Expected one of: ${FRAMEWORKS.map(
              item => item.framework,
            ).join(', ')}.`,
          );
          process.exit(1);
        }
        configuration.frameworks = [
          ...(configuration.frameworks || []),
          framework,
        ];
        break;
      }
      case '--help':
        configuration.displayHelp = true;
        break;
      case '--output':
        configuration.output = requireValue(argument, argv[++index]);
        break;
      case '--output-directory':
        configuration.outputDirectory = requireValue(argument, argv[++index]);
        break;
      case '--ref':
        configuration.ref = requireValue(argument, argv[++index]);
        break;
      case '--ruleset-directory':
        configuration.rulesetDirectory = requireValue(argument, argv[++index]);
        break;
      default:
        console.error(`Unknown option "${argument}". Use --help.`);
        process.exit(1);
    }
  }

  if (!['stdout', 'file'].includes(configuration.output)) {
    console.error(`Unknown output "${configuration.output}".`);
    process.exit(1);
  }

  if (
    (configuration.output === 'file' || configuration.check) &&
    !configuration.outputDirectory
  ) {
    console.error(
      'output directory is not defined. Use --output-directory <output-directory>.',
    );
    process.exit(1);
  }

  return configuration;
}

/**
 * Resolve a token able to read the private catalog repository
 * @returns {String} token
 */
function resolveToken() {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  if (process.env.GH_TOKEN) {
    return process.env.GH_TOKEN;
  }

  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    console.error(
      `Could not resolve a GitHub token. ${CATALOG_REPOSITORY} is private: export GITHUB_TOKEN, ` +
        'authenticate the gh CLI, or use --catalog-directory with a local checkout.',
    );
    process.exit(1);
  }
}

/**
 * Get a catalog, from the local directory when configured, else from GitHub
 * @param {String} framework
 * @param {Object} configuration
 * @returns {Object} catalog
 */
async function getCatalog(framework, configuration) {
  if (configuration.catalogDirectory) {
    const filePath = path.join(
      configuration.catalogDirectory,
      `${framework}.json`,
    );

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error(`Could not read the catalog "${filePath}":`, error.message);
      process.exit(1);
    }
  }

  const url = `https://api.github.com/repos/${CATALOG_REPOSITORY}/contents/${CATALOG_PATH}/${framework}.json?ref=${encodeURIComponent(
    configuration.ref,
  )}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.raw',
      Authorization: `Bearer ${resolveToken()}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    console.error(
      `Could not fetch the catalog "${framework}" (HTTP ${response.status}): ${url}`,
    );
    process.exit(1);
  }

  return await response.json();
}

/**
 * Build the entries of a definition file: every control of the catalog, keyed
 * by its identifier in the notation the standard uses.
 * @param {Object} catalog
 * @returns {Object} entries
 */
function buildEntries(catalog) {
  return Object.fromEntries(
    catalog.controls.map(({ id, title, description }) => [
      id,
      description ? { title, description } : { title },
    ]),
  );
}

/**
 * Build the alias map of a definition file: the catalog bridge from ruleset
 * compliance tag values to control identifiers, minus the aliases whose target
 * does not exist (reported, never emitted).
 * @param {Object} catalog
 * @param {Object} entries
 * @returns {Object} aliases
 */
function buildAliases(catalog, entries) {
  return Object.fromEntries(
    Object.entries(catalog.aliases || {}).filter(([alias, id]) => {
      if (!entries[id]) {
        console.error(
          `[${catalog.framework}] alias "${alias}" targets the unknown control "${id}". Skipped.`,
        );
        return false;
      }
      return true;
    }),
  );
}

/**
 * Render an object literal as TypeScript source. Values are emitted with
 * JSON.stringify and normalized to the code style by prettier afterwards.
 * @param {Object} object
 * @param {Function} renderValue
 * @returns {String} source
 */
function renderObject(object, renderValue) {
  return Object.entries(object)
    .map(([key, value]) => `${JSON.stringify(key)}: ${renderValue(value)},`)
    .join('\n');
}

/**
 * Build the content of a definition file
 * @param {Object} definition
 * @param {Object} catalog
 * @returns {String} content
 */
function buildFileContent(definition, catalog) {
  const entries = buildEntries(catalog);
  const aliases = buildAliases(catalog, entries);
  const year = new Date().getFullYear();

  const header = `/*
 * Wazuh app - Module for ${definition.title} requirements
 * Copyright (C) 2015-${year} Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/*
 * This file is generated by scripts/generate-compliance-data.js. Do not edit it
 * by hand: edit the catalog in ${CATALOG_REPOSITORY} and regenerate.
 *
 * Framework: ${catalog.framework}
 * Edition: ${catalog.edition}
 * Source: ${catalog.source_name}
 * Controls: ${catalog.total_controls}
 */
import { ${TYPE_NAME} } from '${TYPES_MODULE}';
`;

  const renderRequirement = ({ title, description }) =>
    description
      ? `{ title: ${JSON.stringify(title)}, description: ${JSON.stringify(
          description,
        )} }`
      : `{ title: ${JSON.stringify(title)} }`;

  if (!Object.keys(aliases).length) {
    return `${header}
export const ${definition.constant}: Record<string, ${TYPE_NAME}> = {
${renderObject(entries, renderRequirement)}
};
`;
  }

  return `${header}
const controls: Record<string, ${TYPE_NAME}> = {
${renderObject(entries, renderRequirement)}
};

/*
 * Bridge from the compliance tag values the Wazuh ruleset uses to the control
 * identifiers above. Both notations resolve to the same requirement.
 */
const aliases: Record<string, string> = {
${renderObject(aliases, id => JSON.stringify(id))}
};

export const ${definition.constant}: Record<string, ${TYPE_NAME}> = {
  ...controls,
  ...Object.fromEntries(
    Object.entries(aliases).map(([alias, id]) => [alias, controls[id]]),
  ),
};
`;
}

/**
 * Format the content with the plugin prettier configuration
 * @param {String} content
 * @param {String} filePath
 * @returns {String} content
 */
function format(content, filePath) {
  const prettier = require('prettier');
  const options = prettier.resolveConfig.sync(filePath) || {};

  return prettier.format(content, { ...options, parser: 'typescript' });
}

/**
 * Collect the distinct compliance tag values a ruleset sca directory uses
 * @param {String} directory
 * @returns {Object} tags by framework
 */
function collectRulesetTags(directory) {
  const tags = {};
  const pattern = new RegExp(
    `^\\s*-?\\s*(${FRAMEWORKS.map(({ framework }) => framework).join(
      '|',
    )}):\\s*\\[(.*)\\]\\s*$`,
  );

  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (/\.ya?ml$/.test(entry.name)) {
        for (const line of fs.readFileSync(entryPath, 'utf8').split('\n')) {
          const match = pattern.exec(line);

          if (match) {
            const [, framework, values] = match;

            tags[framework] = tags[framework] || new Set();
            for (const value of values.matchAll(/"([^"]*)"/g)) {
              tags[framework].add(value[1]);
            }
          }
        }
      }
    }
  };

  walk(directory);

  return tags;
}

/**
 * Report the ruleset tag values no entry of the generated definition resolves
 * @param {Object} definition
 * @param {Object} entries
 * @param {Set} tags
 */
function reportRulesetTags(definition, entries, tags) {
  if (!tags) {
    console.error(`[${definition.framework}] the ruleset uses no tag.`);
    return;
  }

  const unresolved = [...tags].filter(tag => !entries[tag]).sort();

  console.error(
    `[${definition.framework}] ruleset tags: ${tags.size}, unresolved: ${unresolved.length}` +
      (unresolved.length ? `: ${unresolved.join(', ')}` : '.'),
  );
}

/**
 * Generate the definition files
 * @param {Object} configuration
 */
async function run(configuration) {
  const definitions = FRAMEWORKS.filter(
    ({ framework }) =>
      !configuration.frameworks || configuration.frameworks.includes(framework),
  );
  const rulesetTags = configuration.rulesetDirectory
    ? collectRulesetTags(configuration.rulesetDirectory)
    : null;
  let outdated = 0;

  for (const definition of definitions) {
    const catalog = await getCatalog(definition.framework, configuration);

    if (catalog.framework !== definition.framework) {
      console.error(
        `The catalog of "${definition.framework}" declares the framework "${catalog.framework}".`,
      );
      process.exit(1);
    }

    if (catalog.controls.length !== catalog.total_controls) {
      console.error(
        `[${catalog.framework}] total_controls is ${catalog.total_controls} but the catalog holds ` +
          `${catalog.controls.length} controls.`,
      );
    }

    const content = format(
      buildFileContent(definition, catalog),
      path.join(configuration.outputDirectory || '.', definition.file),
    );

    if (rulesetTags) {
      reportRulesetTags(
        definition,
        {
          ...buildEntries(catalog),
          ...(catalog.aliases || {}),
        },
        rulesetTags[definition.framework],
      );
    }

    if (configuration.check) {
      const filePath = path.join(
        configuration.outputDirectory,
        definition.file,
      );
      const current = fs.existsSync(filePath)
        ? fs.readFileSync(filePath, 'utf8')
        : null;

      if (current !== content) {
        outdated++;
        console.error(`Out of date: ${filePath}`);
      }
      continue;
    }

    if (configuration.output === 'file') {
      const filePath = path.join(
        configuration.outputDirectory,
        definition.file,
      );

      fs.writeFileSync(filePath, content);
      console.log(
        `File was created! Path: ${filePath} (${catalog.total_controls} controls, ` +
          `${Object.keys(catalog.aliases || {}).length} aliases)`,
      );
    } else {
      console.log(content);
    }
  }

  if (configuration.check) {
    if (outdated) {
      console.error(
        `${outdated} definition file(s) are out of date. Run: yarn generate:compliance-data`,
      );
      process.exit(1);
    }
    console.log('Every definition file is up to date.');
  }
}

async function main() {
  const configuration = parseArguments(process.argv.slice(2));

  if (configuration.displayHelp) {
    displayHelp();
    return;
  }

  if (configuration.displayExamples) {
    displayExamples();
    return;
  }

  if (configuration.displayConfiguration) {
    console.error(require('util').inspect(configuration, { depth: null }));
  }

  await run(configuration);
}

main();
