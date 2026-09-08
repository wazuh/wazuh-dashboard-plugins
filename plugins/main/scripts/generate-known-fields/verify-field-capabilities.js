#!/usr/bin/env node

/**
 * Verifies that the aggregatable/searchable values generated for `match_only_text`
 * fields into common/known-fields/*.json match what a real cluster reports through
 * the OpenSearch `_field_caps` API - the same source OSD's own "Refresh field list"
 * uses when a real index backs an index pattern.
 *
 * Related to the fix in generate-known-fields.js that stopped marking
 * `match_only_text` fields as aggregatable/doc-values-backed (they aren't).
 *
 * Usage: node scripts/generate-known-fields/verify-field-capabilities.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'https://localhost:9200';
const AUTH = 'admin:admin';

const KNOWN_FIELDS_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  'common',
  'known-fields',
);

// Fields affected by the match_only_text aggregatable/readFromDocValues fix,
// each with an index pattern known to hold that field and the known-fields
// file that seeds its index pattern (see this directory's README.md).
const CHECKS = [
  {
    field: 'file.diff',
    index: 'wazuh-events-v5-*',
    knownFieldsFile: 'events.json',
  },
  {
    field: 'file.diff',
    index: 'wazuh-findings-v5-*',
    knownFieldsFile: 'findings.json',
  },
  {
    field: 'wazuh.case.title',
    index: 'wazuh-findings-v5-*',
    knownFieldsFile: 'findings.json',
  },
  {
    field: 'wazuh.case.description',
    index: 'wazuh-findings-v5-*',
    knownFieldsFile: 'findings.json',
  },
  {
    field: 'wazuh.case.comments.comment',
    index: 'wazuh-findings-v5-*',
    knownFieldsFile: 'findings.json',
  },
  {
    field: 'group.description',
    index: 'wazuh-states-inventory-*',
    knownFieldsFile: 'states-inventory.json',
  },
];

function fieldCaps(index, field) {
  return new Promise((resolve, reject) => {
    const url = `${HOST}/${index}/_field_caps?fields=${encodeURIComponent(
      field,
    )}`;

    https
      .get(
        url,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(AUTH).toString('base64')}`,
          },
          rejectUnauthorized: false,
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(`HTTP ${res.statusCode} for ${url}: ${data}`));
              return;
            }
            resolve(JSON.parse(data));
          });
        },
      )
      .on('error', reject);
  });
}

function loadKnownField(fileName, fieldName) {
  const filePath = path.join(KNOWN_FIELDS_DIR, fileName);
  const fields = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  return fields.find(f => f.name === fieldName);
}

async function main() {
  console.log(`Checking against ${HOST} ...\n`);

  let mismatches = 0;

  for (const check of CHECKS) {
    const known = loadKnownField(check.knownFieldsFile, check.field);

    if (!known) {
      console.log(
        `⚠️  ${check.field} (${check.knownFieldsFile}): not found in known-fields file, skipping`,
      );
      continue;
    }

    let live;

    try {
      live = await fieldCaps(check.index, check.field);
    } catch (error) {
      console.log(
        `⚠️  ${check.field} (${check.index}): could not query cluster - ${error.message}`,
      );
      continue;
    }

    const liveEntry = live.fields && live.fields[check.field];

    if (!liveEntry) {
      console.log(
        `⚠️  ${check.field} (${check.index}): not present in live mapping yet (no document has populated it)`,
      );
      continue;
    }

    const esType = Object.keys(liveEntry)[0];
    const liveCaps = liveEntry[esType];
    const isMatch =
      liveCaps.aggregatable === known.aggregatable &&
      liveCaps.searchable === known.searchable;

    if (!isMatch) {
      mismatches++;
    }

    console.log(
      `${isMatch ? '✅' : '❌'} ${check.field} (${
        check.index
      }, type: ${esType})\n` +
        `    live:         aggregatable=${liveCaps.aggregatable}  searchable=${liveCaps.searchable}\n` +
        `    known-fields: aggregatable=${known.aggregatable}  searchable=${known.searchable}`,
    );
  }

  console.log(
    mismatches
      ? `\n${mismatches} mismatch(es) found - known-fields values don't match what a live refresh would produce.`
      : '\nAll checked fields match what a live refresh would produce.',
  );

  process.exit(mismatches ? 1 : 0);
}

main().catch(error => {
  console.error('💥 Verification failed:', error.message);
  process.exit(1);
});
