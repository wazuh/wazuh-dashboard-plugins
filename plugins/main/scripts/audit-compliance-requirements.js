/**
 * Audits the static compliance-requirement definition files in
 * common/compliance-requirements/*.ts against the real, unique compliance
 * codes present in a Wazuh indexer, and reports any code found in the
 * index that is missing from the local file.
 *
 * Two independent sources are checked per framework:
 *   - findings (wazuh-findings-v5*): fast, server-side terms aggregation,
 *     run against 3 candidate field paths (compliance.<x>, rule.compliance.<x>,
 *     check.compliance.<x>) since it's unconfirmed which one a given
 *     deployment actually populates.
 *   - rules content (wazuh-threatintel-rules): best-effort. The `compliance`
 *     field isn't in this index's current mapping, so it can't be
 *     aggregated server-side; every rule document is scrolled and its raw
 *     `_source` is inspected client-side instead. The exact `_source` path
 *     is a guess (see extractRuleCompliance) until verified against real
 *     content — use --dump-sample to check it by hand.
 *
 * This script only reports. It does not modify the *.ts files.
 */
const fs = require('fs');
const path = require('path');

// TLS certificate verification is always skipped: self-signed certs are the
// norm for Wazuh indexer deployments. This must be set before any fetch call.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const REQUIREMENTS_DIR = path.resolve(
  __dirname,
  '../common/compliance-requirements',
);

// Mirrors WAZUH_MODULES_ID from common/constants.ts. `key` is the raw
// compliance-object key used in index field paths; keep in sync if that
// enum changes.
const FRAMEWORKS = {
  'pci-dss': { key: 'pci_dss', file: 'pci-requirements.ts' },
  gdpr: { key: 'gdpr', file: 'gdpr-requirements.ts' },
  hipaa: { key: 'hipaa', file: 'hipaa-requirements.ts' },
  'nist-800-53': { key: 'nist_800_53', file: 'nist-requirements.ts' },
  'nist-800-171': { key: 'nist_800_171', file: 'nist-171-requirements.ts' },
  tsc: { key: 'tsc', file: 'tsc-requirements.ts' },
  cmmc: { key: 'cmmc', file: 'cmmc-requirements.ts' },
  fedramp: { key: 'fedramp', file: 'fedramp-requirements.ts' },
  'iso-27001': { key: 'iso_27001', file: 'iso27001-requirements.ts' },
  nis2: { key: 'nis2', file: 'nis2-requirements.ts' },
};

// Candidate field paths for compliance data on a findings document.
// `wazuh.rule.compliance.<x>` is the confirmed, populated path (verified
// against a live wazuh-findings-v5* index). The other three are kept as a
// fallback in case some deployment/version populates a different path.
const FINDINGS_FIELD_PATHS = [
  { id: 'wazuh.rule.compliance', field: key => `wazuh.rule.compliance.${key}` },
  { id: 'compliance', field: key => `compliance.${key}` },
  { id: 'rule.compliance', field: key => `rule.compliance.${key}` },
  { id: 'check.compliance', field: key => `check.compliance.${key}` },
];

const defaultConfiguration = {
  host: process.env.WAZUH_INDEXER_HOST || 'https://localhost:9200',
  username: process.env.WAZUH_INDEXER_USERNAME || 'admin',
  password: process.env.WAZUH_INDEXER_PASSWORD || 'admin',
  indexPattern: 'wazuh-findings-v5*',
  rulesIndex: 'wazuh-threatintel-rules',
  rulesScrollSize: 500,
  dumpSample: 0,
  source: 'both',
  size: 1000,
  from: null,
  to: null,
  outputFile: null,
  frameworks: [],
};

function displayHelp() {
  console.log(`
Audit compliance-requirements definition files against a real Wazuh indexer.

Usage:
  node scripts/audit-compliance-requirements.js [options]

Options:
  --host <url>                 Indexer base URL. Default: ${
    defaultConfiguration.host
  }
                                (env: WAZUH_INDEXER_HOST)
  --username <user>            Basic auth username. Default: ${
    defaultConfiguration.username
  }
                                (env: WAZUH_INDEXER_USERNAME)
  --password <pass>            Basic auth password. Default: ${
    defaultConfiguration.password
  }
                                (env: WAZUH_INDEXER_PASSWORD)
  --source <findings|rules|both>
                                Which source(s) to check. Default: ${
                                  defaultConfiguration.source
                                }
  --index-pattern <pattern>    Findings index pattern. Default: ${
    defaultConfiguration.indexPattern
  }
                                (source: findings)
  --size <n>                   Terms aggregation bucket size per framework
                                per field path. Default: ${
                                  defaultConfiguration.size
                                }
                                (source: findings)
  --from <date>                Restrict findings to on/after this date (ISO 8601).
                                (source: findings)
  --to <date>                  Restrict findings to on/before this date (ISO 8601).
                                (source: findings)
  --rules-index <pattern>      Rules content index. Default: ${
    defaultConfiguration.rulesIndex
  }
                                (source: rules)
  --rules-scroll-size <n>      Documents per scroll page. Default: ${
    defaultConfiguration.rulesScrollSize
  }
                                (source: rules)
  --dump-sample <n>            Print the raw _source of the first <n> scanned
                                rule documents, to verify where the
                                "compliance" field actually lives. Default: ${
                                  defaultConfiguration.dumpSample
                                }
                                (source: rules)
  --framework <id>             Restrict to one framework id. Repeatable.
                                Default: all of ${Object.keys(FRAMEWORKS).join(
                                  ', ',
                                )}
  --output-file <path>         Also write the full result as JSON to this path.
  --help                       Display this help.

TLS certificate verification is always skipped (self-signed certs are the
norm for Wazuh indexer deployments).

Examples:
  node scripts/audit-compliance-requirements.js
  node scripts/audit-compliance-requirements.js --source findings --framework gdpr
  node scripts/audit-compliance-requirements.js --source rules --dump-sample 3
`);
}

function parseArguments(argv) {
  const configuration = { ...defaultConfiguration, frameworks: [] };
  const parameters = [...argv];

  while (parameters.length) {
    const [parameter] = parameters.splice(0, 1);

    switch (parameter) {
      case '--help':
        displayHelp();
        process.exit(0);
        break;
      case '--host':
        configuration.host = parameters.splice(0, 1)[0];
        break;
      case '--username':
        configuration.username = parameters.splice(0, 1)[0];
        break;
      case '--password':
        configuration.password = parameters.splice(0, 1)[0];
        break;
      case '--source': {
        const source = parameters.splice(0, 1)[0];
        if (!['findings', 'rules', 'both'].includes(source)) {
          console.error(
            `Unknown source "${source}". Allowed values: findings, rules, both`,
          );
          process.exit(1);
        }
        configuration.source = source;
        break;
      }
      case '--index-pattern':
        configuration.indexPattern = parameters.splice(0, 1)[0];
        break;
      case '--rules-index':
        configuration.rulesIndex = parameters.splice(0, 1)[0];
        break;
      case '--rules-scroll-size':
        configuration.rulesScrollSize = Number(parameters.splice(0, 1)[0]);
        break;
      case '--dump-sample':
        configuration.dumpSample = Number(parameters.splice(0, 1)[0]);
        break;
      case '--framework': {
        const framework = parameters.splice(0, 1)[0];
        if (!FRAMEWORKS[framework]) {
          console.error(
            `Unknown framework "${framework}". Allowed values: ${Object.keys(
              FRAMEWORKS,
            ).join(', ')}`,
          );
          process.exit(1);
        }
        configuration.frameworks.push(framework);
        break;
      }
      case '--size':
        configuration.size = Number(parameters.splice(0, 1)[0]);
        break;
      case '--from':
        configuration.from = parameters.splice(0, 1)[0];
        break;
      case '--to':
        configuration.to = parameters.splice(0, 1)[0];
        break;
      case '--output-file':
        configuration.outputFile = parameters.splice(0, 1)[0];
        break;
      default:
        console.error(`Unknown option "${parameter}". Use --help for usage.`);
        process.exit(1);
    }
  }

  if (!configuration.frameworks.length) {
    configuration.frameworks = Object.keys(FRAMEWORKS);
  }

  return configuration;
}

// Extracts the top-level keys of a `export const xRequirementsFile = {...}`
// object from its raw source, without executing/importing the TypeScript
// file. Keys sit on their own 2-space-indented line; longer indentation
// belongs to a wrapped description value, not a key.
function extractLocalKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const keyPattern = /^ {2}'?([A-Za-z0-9_.()-]+)'?\s*:/gm;
  const keys = new Set();
  let match;
  while ((match = keyPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

function authHeader(configuration) {
  const auth = Buffer.from(
    `${configuration.username}:${configuration.password}`,
  ).toString('base64');
  return { Authorization: `Basic ${auth}` };
}

function baseUrl(configuration) {
  return configuration.host.replace(/\/$/, '');
}

// --- Source A: findings, server-side terms aggregation over 3 field paths ---

function buildFindingsQuery(configuration, key) {
  const query =
    configuration.from || configuration.to
      ? {
          range: {
            '@timestamp': {
              ...(configuration.from ? { gte: configuration.from } : {}),
              ...(configuration.to ? { lte: configuration.to } : {}),
            },
          },
        }
      : { match_all: {} };

  const aggs = {};
  FINDINGS_FIELD_PATHS.forEach(({ id, field }) => {
    aggs[id] = {
      terms: {
        field: field(key),
        size: configuration.size,
      },
    };
  });

  return { size: 0, query, aggs };
}

async function fetchFindingsForFramework(configuration, key) {
  const url = `${baseUrl(configuration)}/${configuration.indexPattern}/_search`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(configuration),
    },
    body: JSON.stringify(buildFindingsQuery(configuration, key)),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  const body = await response.json();

  const byPath = {};
  FINDINGS_FIELD_PATHS.forEach(({ id }) => {
    const aggregation = body?.aggregations?.[id];
    const buckets = aggregation?.buckets || [];
    byPath[id] = {
      buckets: buckets.map(bucket => ({
        key: bucket.key,
        count: bucket.doc_count,
      })),
      truncated: Boolean(aggregation?.sum_other_doc_count),
    };
  });

  return byPath;
}

function printFindingsReport(frameworkId, localKeys, byPath, size) {
  console.log(`\n=== ${frameworkId} — findings ===`);
  const report = {};

  FINDINGS_FIELD_PATHS.forEach(({ id }) => {
    const { buckets, truncated } = byPath[id];
    const foundKeys = buckets.map(bucket => bucket.key);
    const missing = foundKeys.filter(key => !localKeys.has(key));

    console.log(`\n  [${id}] ${foundKeys.length} unique code(s) found`);
    if (truncated) {
      console.log(
        `    WARNING: truncated at --size ${size}. Re-run with a larger --size for a complete picture.`,
      );
    }
    buckets
      .slice()
      .sort((a, b) => b.count - a.count)
      .forEach(bucket => {
        const flag = localKeys.has(bucket.key) ? '' : '  <-- MISSING locally';
        console.log(`    ${bucket.key} (${bucket.count})${flag}`);
      });
    if (!buckets.length) {
      console.log('    (none)');
    }

    report[id] = { foundInIndex: buckets, missingFromFile: missing };
  });

  return report;
}

// --- Source B: rules content, best-effort client-side scroll ---

// Where the `compliance` object might live on a rule document's raw
// _source. Neither path is confirmed against a real document yet - the
// index mapping doesn't include `compliance` at all (dynamic mapping is
// disabled), so this is inferred from the mapping's `document.*` nesting
// convention. Verify with --dump-sample once real rules content exists.
function extractRuleCompliance(source) {
  return source?.document?.compliance || source?.compliance || null;
}

async function scrollRules(configuration) {
  const url = `${baseUrl(configuration)}/${
    configuration.rulesIndex
  }/_search?scroll=1m`;
  const perFrameworkCodes = new Map();
  const samples = [];
  let documentsScanned = 0;
  let documentsWithComplianceField = 0;
  let scrollId = null;

  try {
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(configuration),
      },
      body: JSON.stringify({
        size: configuration.rulesScrollSize,
        query: { match_all: {} },
        _source: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${body}`);
    }

    let body = await response.json();
    scrollId = body._scroll_id;
    let hits = body?.hits?.hits || [];

    while (hits.length) {
      hits.forEach(hit => {
        documentsScanned += 1;
        if (samples.length < configuration.dumpSample) {
          samples.push(hit._source);
        }
        const compliance = extractRuleCompliance(hit._source);
        if (compliance && typeof compliance === 'object') {
          documentsWithComplianceField += 1;
          Object.entries(compliance).forEach(([frameworkKey, codes]) => {
            if (!Array.isArray(codes)) return;
            if (!perFrameworkCodes.has(frameworkKey)) {
              perFrameworkCodes.set(frameworkKey, new Set());
            }
            const set = perFrameworkCodes.get(frameworkKey);
            codes.forEach(code => set.add(code));
          });
        }
      });

      response = await fetch(`${baseUrl(configuration)}/_search/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(configuration),
        },
        body: JSON.stringify({ scroll: '1m', scroll_id: scrollId }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `${response.status} ${response.statusText}: ${errorBody}`,
        );
      }

      body = await response.json();
      scrollId = body._scroll_id;
      hits = body?.hits?.hits || [];
    }
  } finally {
    if (scrollId) {
      try {
        await fetch(`${baseUrl(configuration)}/_search/scroll`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(configuration),
          },
          body: JSON.stringify({ scroll_id: scrollId }),
        });
      } catch {
        // Best effort: the scroll will expire on its own after 1m anyway.
      }
    }
  }

  return {
    perFrameworkCodes,
    samples,
    documentsScanned,
    documentsWithComplianceField,
  };
}

function printRulesSamples(samples) {
  if (!samples.length) return;
  console.log('\n=== rules — sample raw _source documents ===');
  samples.forEach((source, index) => {
    console.log(`\n--- sample ${index + 1} ---`);
    console.log(JSON.stringify(source, null, 2));
  });
}

function printRulesReport(frameworkId, key, localKeys, scrollResult) {
  const { perFrameworkCodes, documentsScanned, documentsWithComplianceField } =
    scrollResult;
  const codes = perFrameworkCodes.get(key) || new Set();
  const foundKeys = [...codes];
  const missing = foundKeys.filter(code => !localKeys.has(code));

  console.log(`\n=== ${frameworkId} — rules content (best-effort) ===`);
  console.log(
    `  ${foundKeys.length} unique code(s) found across ${documentsScanned} scanned rule document(s).`,
  );
  if (documentsScanned > 0 && documentsWithComplianceField === 0) {
    console.log(
      '  WARNING: no scanned document had a "compliance" field at the guessed _source path ' +
        '(document.compliance or compliance). The path guess is likely wrong for this ' +
        'deployment — re-run with --dump-sample 3 to inspect a real document and fix ' +
        'extractRuleCompliance() in this script accordingly.',
    );
  }
  console.log(
    foundKeys.length ? `  ${foundKeys.sort().join(', ')}` : '  (none)',
  );
  console.log(`  Missing from local file (${missing.length}):`);
  console.log(missing.length ? `  ${missing.join(', ')}` : '  (none)');

  return {
    foundInIndex: foundKeys,
    missingFromFile: missing,
    documentsScanned,
    documentsWithComplianceField,
  };
}

async function main() {
  const configuration = parseArguments(process.argv.slice(2));
  const results = {};
  let hadError = false;

  const localKeysByFramework = {};
  configuration.frameworks.forEach(frameworkId => {
    const { file } = FRAMEWORKS[frameworkId];
    localKeysByFramework[frameworkId] = extractLocalKeys(
      path.join(REQUIREMENTS_DIR, file),
    );
  });

  const checkFindings =
    configuration.source === 'findings' || configuration.source === 'both';
  const checkRules =
    configuration.source === 'rules' || configuration.source === 'both';

  if (checkFindings) {
    for (const frameworkId of configuration.frameworks) {
      const { key } = FRAMEWORKS[frameworkId];
      results[frameworkId] = results[frameworkId] || {};
      try {
        const byPath = await fetchFindingsForFramework(configuration, key);
        results[frameworkId].findings = printFindingsReport(
          frameworkId,
          localKeysByFramework[frameworkId],
          byPath,
          configuration.size,
        );
      } catch (error) {
        hadError = true;
        console.error(`\n=== ${frameworkId} — findings ===`);
        console.error(`Failed to query findings: ${error.message}`);
      }
    }
  }

  if (checkRules) {
    try {
      const scrollResult = await scrollRules(configuration);
      printRulesSamples(scrollResult.samples);

      configuration.frameworks.forEach(frameworkId => {
        const { key } = FRAMEWORKS[frameworkId];
        results[frameworkId] = results[frameworkId] || {};
        results[frameworkId].rules = printRulesReport(
          frameworkId,
          key,
          localKeysByFramework[frameworkId],
          scrollResult,
        );
      });
    } catch (error) {
      hadError = true;
      console.error('\n=== rules content ===');
      console.error(`Failed to scroll rules index: ${error.message}`);
    }
  }

  if (configuration.outputFile) {
    fs.writeFileSync(
      configuration.outputFile,
      JSON.stringify(results, null, 2),
    );
    console.log(`\nWrote JSON results to ${configuration.outputFile}`);
  }

  process.exit(hadError ? 1 : 0);
}

main();
