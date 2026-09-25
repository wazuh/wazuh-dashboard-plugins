const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

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
 * Redacts the credentials in a curl argument list before logging, so the
 * username:password passed to -u never lands in the log file.
 * @param {string[]} curlArgs the argument array passed to curl
 * @returns {string} a shell-like, credential-free representation
 */
function redactCurlArgs(curlArgs) {
  const redacted = curlArgs.map((arg, i) => {
    // The value following a "-u" flag is "user:pass"; mask it.
    if (i > 0 && curlArgs[i - 1] === '-u') {
      return '***:***';
    }
    return arg;
  });
  return 'curl ' + redacted.map(arg => `'${arg}'`).join(' ');
}

/**
 * Checks whether an index already exists in the indexer.
 * @param {string} indexName index to check
 * @param {Object} config object with the configuration: SERVER_ADDRESS, USERNAME, PASSWORD
 * @returns {boolean} true if the index exists, false otherwise
 */
function checkIndexExists(indexName, config) {
  const { SERVER_ADDRESS, USERNAME, PASSWORD } = config;
  const url = `${SERVER_ADDRESS}/${indexName}`;

  const result = spawnSync(
    'curl',
    [
      '-s',
      '-k',
      '-o',
      '/dev/null',
      '-w',
      '%{http_code}',
      '-u',
      `${USERNAME}:${PASSWORD}`,
      '-X',
      'HEAD',
      url,
    ],
    { encoding: 'utf-8' },
  );

  return result.stdout === '200';
}

/**
 * Finds an index template registered in the indexer that governs an index name
 * and creates data streams.
 *
 * The indexer rejects a plain index creation for such a name ("use create data
 * stream api instead"), and it does not need one: writing to the name creates
 * the data stream with that template's mappings, which is what the dashboard
 * expects.
 * @param {string} indexName index the documents are going to be written to
 * @param {Object} config object with the configuration: SERVER_ADDRESS, USERNAME, PASSWORD
 * @returns {string|null} name of the matching data stream template, null if there is none
 */
function findDataStreamTemplate(indexName, config) {
  const { SERVER_ADDRESS, USERNAME, PASSWORD } = config;

  const result = spawnSync(
    'curl',
    [
      '-s',
      '-k',
      '-u',
      `${USERNAME}:${PASSWORD}`,
      `${SERVER_ADDRESS}/_index_template`,
    ],
    { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 20 },
  );

  if (result.error) {
    return null;
  }

  try {
    const { index_templates: templates = [] } = JSON.parse(result.stdout);

    const match = templates.find(
      ({ index_template: template }) =>
        template.data_stream &&
        (template.index_patterns || []).some(pattern =>
          new RegExp(
            `^${pattern
              .replace(/[.+^${}()|[\]\\]/g, '\\$&')
              .replace(/\*/g, '.*')}$`,
          ).test(indexName),
        ),
    );

    return match ? match.name : null;
  } catch {
    return null;
  }
}

/**
 * Creates an index using the settings/mappings declared in a dataset's
 * template.json, so the index schema matches what the dashboard expects
 * instead of relying on dynamic mapping.
 * @param {string} indexName index to create
 * @param {Object} templateBody {settings, mappings} object to use as the index body
 * @param {Object} config object with the configuration: SERVER_ADDRESS, USERNAME, PASSWORD
 * @param {string} logPath full path of the log file to append this creation to
 * @returns {boolean} true if the index was created successfully
 */
function createIndex(indexName, templateBody, config, logPath) {
  const { SERVER_ADDRESS, USERNAME, PASSWORD } = config;
  const url = `${SERVER_ADDRESS}/${indexName}`;
  const body = JSON.stringify(templateBody);

  // The body goes in a file, not in an argument: a findings template is over
  // 300 KB and Linux caps a single argument at 128 KB, so passing it with -d
  // fails with E2BIG before curl runs.
  const tmpFile = path.join(
    os.tmpdir(),
    `wazuh-sample-data-index-${Date.now()}.json`,
  );
  fs.writeFileSync(tmpFile, body);

  const curlArgs = [
    '-s',
    '-k',
    '-u',
    `${USERNAME}:${PASSWORD}`,
    '-X',
    'PUT',
    url,
    '-H',
    'Content-Type: application/json',
    '--data-binary',
    `@${tmpFile}`,
  ];

  log(logPath, `\nCreating index ${indexName} from template.json\n`);
  log(logPath, `${redactCurlArgs(curlArgs)}\n\n${body}\n`);

  const result = spawnSync('curl', curlArgs, {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 20,
  });

  fs.unlinkSync(tmpFile);

  if (result.error) {
    console.error(`Error creating index ${indexName}:`, result.error.message);
    log(
      logPath,
      `\nError creating index ${indexName}: ${result.error.message}\n`,
    );
    return false;
  }

  log(logPath, `\nResponse:\n${result.stdout}\n`);

  try {
    const response = JSON.parse(result.stdout);
    if (response.error) {
      console.error(
        `Failed to create index ${indexName}:`,
        response.error.reason || response.error,
      );
      return false;
    }
  } catch (error) {
    console.error(
      `Could not parse curl response for index creation:`,
      result.stdout,
    );
    return false;
  }

  console.error(`Index ${indexName} created`);
  return true;
}

/**
 * Validates if the index exists, if not, it creates one using the template.json (or dynamic mapping if there is no template).
 *
 * @param {Array} entries array of {doc, index, dataset}
 * @param {Object} config object with the configuration: SERVER_ADDRESS, USERNAME, PASSWORD
 * @param {string} logPath full path of the log file to append this to
 * @param {(dataset: string) => (Object|null)} getTemplate resolves a dataset name to its {settings, mappings} template, or null if it has none
 */
function ensureIndicesExist(entries, config, logPath, getTemplate) {
  const seen = new Set();
  for (const entry of entries) {
    const idx = entry.index;
    if (!idx || seen.has(idx)) continue;
    seen.add(idx);

    if (checkIndexExists(idx, config)) {
      continue;
    }

    const dataStreamTemplate = findDataStreamTemplate(idx, config);
    if (dataStreamTemplate) {
      console.error(
        `Index ${idx} is governed by the data stream template ${dataStreamTemplate}. ` +
          'The indexer creates it with that template on the first write.',
      );
      continue;
    }

    const templateBody = entry.dataset && getTemplate(entry.dataset);
    if (templateBody) {
      // Inserting into an index the indexer then creates by dynamic mapping
      // gives the dashboard an index it cannot aggregate (compliance and
      // other keyword fields come out as text), so stop instead.
      if (!createIndex(idx, templateBody, config, logPath)) {
        throw new Error(
          `Index ${idx} could not be created from the template of dataset ` +
            `'${entry.dataset}'. Nothing was inserted: an index created by ` +
            'dynamic mapping instead of the template does not work in the ' +
            `dashboard. See ${logPath} for the response.`,
        );
      }
    } else {
      console.error(
        `No template.json found for dataset '${entry.dataset}'. Index ${idx} will be created by the indexer with dynamic mapping.`,
      );
    }
  }
}

/**
 * Inserts using curl the data directly to the defined host.
 * Used by --output insert
 * It will append to a single log file per CLI execution, inside ./logs.
 * @param {string} data string with ndsjon format build by bulk-api
 * @param {Object} config object with the configuration: SERVER_ADDRESS, USERNAME, PASSWORD
 * @param {string} logPath full path of the log file to append this insert to
 * @param {number} batchNumber current batch number (1-indexed)
 * @param {number} totalBatches total number of batches for this run
 * @returns {Array} list of failed items ({_id, status, reason}) for this batch, empty if none or on curl failure
 */
function insertData(data, config, logPath, batchNumber, totalBatches) {
  const { SERVER_ADDRESS, USERNAME, PASSWORD } = config;
  const url = `${SERVER_ADDRESS}/_bulk`;

  const tmpFile = path.join(
    os.tmpdir(),
    `wazuh-sample-data-${Date.now()}.ndjson`,
  );
  fs.writeFileSync(tmpFile, data);

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
    `@${tmpFile}`,
  ];

  log(
    logPath,
    `\n${'='.repeat(60)}\nBatch ${batchNumber}/${totalBatches}\n${'='.repeat(
      60,
    )}\n`,
  );

  // Log the curl command with credentials redacted, followed by the payload.
  log(logPath, `${redactCurlArgs(curlArgs)}\n\n${data}\n`);

  const result = spawnSync('curl', curlArgs, {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 20,
  });

  fs.unlinkSync(tmpFile);

  if (result.error) {
    console.error('Error running curl:', result.error.message);
    log(logPath, `\nError running curl: ${result.error.message}\n`);
    return [];
  }

  if (result.status !== 0) {
    console.error(`curl exited with code ${result.status}:`, result.stderr);
    log(
      logPath,
      `\ncurl exited with code ${result.status}:\n${result.stderr}\n`,
    );
    return [];
  }

  log(logPath, `\nResponse:\n${result.stdout}\n`);

  try {
    const response = JSON.parse(result.stdout);
    const failedItems = response.errors
      ? response.items.filter(item => (item.create || item.index)?.error)
      : [];
    console.error(
      failedItems.length
        ? `Inserted with ${failedItems.length} error(s) out of ${response.items.length} documents`
        : `Successfully inserted ${response.items.length} documents`,
    );
    return failedItems.map(item => {
      const action = item.create || item.index;
      return {
        _id: action._id,
        status: action.status,
        reason: action.error.reason,
      };
    });
  } catch (error) {
    console.error('Could not parse curl response:', result.stdout);
    return [];
  }
}

/**
 * Validates that the configuration is complete and prompts the user for
 * missing values.
 * @param {Object} config empty object or with the configuration:
 *                        SERVER_ADDRESS, USERNAME, PASSWORD
 * @returns {Object} Will return the configuration completed in case it was
 *                   missing something.
 */
function validateConfig(config) {
  const defaults = { SERVER_ADDRESS: 'https://localhost:9200' };

  for (const key of ['SERVER_ADDRESS', 'USERNAME', 'PASSWORD']) {
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

module.exports = {
  log,
  redactCurlArgs,
  checkIndexExists,
  createIndex,
  findDataStreamTemplate,
  ensureIndicesExist,
  insertData,
  validateConfig,
  prompt,
};
