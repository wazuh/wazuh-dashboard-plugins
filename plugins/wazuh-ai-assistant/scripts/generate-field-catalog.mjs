#!/usr/bin/env node
/**
 * Regenerates `common/field-catalog.ts` from the Wazuh Common Schema (WCS) field CSVs published
 * in `wazuh/wazuh-indexer-plugins` (branch `5.0.0`, `wcs/**\/docs/fields.csv`).
 *
 * Run manually: `node scripts/generate-field-catalog.mjs` from `plugins/wazuh-ai-assistant/`.
 * This is a COMMITTED-SOURCE generator, not a build step: it is never invoked from package.json,
 * webpack, or CI -- the file it writes is checked in and reviewed like any other source file, per
 * this repo's "no build-step additions" constraint. Requires the GitHub CLI (`gh`) authenticated
 * against a GitHub account with read access to `wazuh/wazuh-indexer-plugins` -- the same tool this
 * plugin's own AI-assisted workflows already rely on, so no new dependency is introduced.
 *
 * Zero npm dependencies: CSV parsing is a small hand-written, quote-aware splitter (the WCS CSVs
 * embed JSON examples with commas/quotes in the `Example`/`Description` columns), and the GitHub
 * fetch shells out to `gh api` via `child_process.execFileSync` rather than pulling in an HTTP or
 * GitHub-API client library.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = 'wazuh/wazuh-indexer-plugins';
const REF = '5.0.0';

/**
 * One entry per family we generate a catalog bucket for, matched to the index families the
 * catalog tools actually query (see AI/plan/phase0-ground-truth.md's Tool catalog section and
 * `server/tools/router.ts`'s TOOL_CATEGORY): the "stateless" events/findings pair, the inventory
 * subsets get-agent-inventory.ts and future tools read, sca, vulnerabilities, and the fim subset.
 * The KEY here is the FIELD_CATALOG key used at runtime -- keep it stable, tools reference it by
 * name.
 */
const FAMILIES = [
  { key: 'events.main', path: 'wcs/stateless/events/main/docs/fields.csv' },
  { key: 'events.findings', path: 'wcs/stateless/events/findings/docs/fields.csv' },
  { key: 'inventory.system', path: 'wcs/stateful/inventory/system/docs/fields.csv' },
  { key: 'inventory.packages', path: 'wcs/stateful/inventory/packages/docs/fields.csv' },
  { key: 'inventory.ports', path: 'wcs/stateful/inventory/ports/docs/fields.csv' },
  { key: 'inventory.processes', path: 'wcs/stateful/inventory/processes/docs/fields.csv' },
  { key: 'inventory.hotfixes', path: 'wcs/stateful/inventory/hotfixes/docs/fields.csv' },
  { key: 'inventory.users', path: 'wcs/stateful/inventory/users/docs/fields.csv' },
  { key: 'inventory.groups', path: 'wcs/stateful/inventory/groups/docs/fields.csv' },
  { key: 'inventory.networks', path: 'wcs/stateful/inventory/networks/docs/fields.csv' },
  { key: 'inventory.interfaces', path: 'wcs/stateful/inventory/interfaces/docs/fields.csv' },
  { key: 'inventory.services', path: 'wcs/stateful/inventory/services/docs/fields.csv' },
  { key: 'inventory.hardware', path: 'wcs/stateful/inventory/hardware/docs/fields.csv' },
  { key: 'inventory.protocols', path: 'wcs/stateful/inventory/protocols/docs/fields.csv' },
  {
    key: 'inventory.browser_extensions',
    path: 'wcs/stateful/inventory/browser-extensions/docs/fields.csv',
  },
  { key: 'sca', path: 'wcs/stateful/sca/docs/fields.csv' },
  { key: 'vulnerabilities', path: 'wcs/stateful/vulnerabilities/docs/fields.csv' },
  { key: 'fim.files', path: 'wcs/stateful/fim/files/docs/fields.csv' },
  {
    key: 'fim.windows_registry_keys',
    path: 'wcs/stateful/fim/windows-registry-keys/docs/fields.csv',
  },
  {
    key: 'fim.windows_registry_values',
    path: 'wcs/stateful/fim/windows-registry-values/docs/fields.csv',
  },
];

/** Fetches one file's raw content from the repo/ref above via `gh api`, base64-decoded. Throws
 * with the family key attached on failure so a partial fetch fails loudly rather than silently
 * writing a truncated catalog. */
function fetchCsv(path) {
  const b64 = execFileSync(
    'gh',
    ['api', `repos/${REPO}/contents/${path}?ref=${REF}`, '--jq', '.content'],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 },
  );
  return Buffer.from(b64.trim(), 'base64').toString('utf8');
}

/** Quote-aware CSV line splitter -- handles the WCS `Example`/`Description` columns' embedded
 * commas and `""`-escaped quotes. Not a general CSV parser: sufficient for this fixed 9-column
 * schema (see the file header this generator writes for the expected column order). */
function splitCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/** Parses one WCS `fields.csv` into `{ path, type }` entries, indexed fields only (a field with
 * `Indexed=false` cannot be filtered/aggregated, so it is out of scope for a "does this field
 * exist and is it queryable" catalog). Columns: ECS_Version, Indexed, Field_Set, Field, Type,
 * Level, Normalization, Example, Description. */
function parseFieldsCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.length > 0);
  const [header, ...rows] = lines;
  const columns = splitCsvLine(header);
  const indexedIdx = columns.indexOf('Indexed');
  const fieldIdx = columns.indexOf('Field');
  const typeIdx = columns.indexOf('Type');
  if (indexedIdx === -1 || fieldIdx === -1 || typeIdx === -1) {
    throw new Error(
      `Unexpected WCS CSV header (missing Indexed/Field/Type): ${header}`,
    );
  }
  const entries = [];
  const seen = new Set();
  for (const row of rows) {
    const cells = splitCsvLine(row);
    const indexed = cells[indexedIdx];
    const path = cells[fieldIdx];
    const type = cells[typeIdx];
    if (!path || indexed !== 'true') {
      continue;
    }
    if (seen.has(path)) {
      continue;
    }
    seen.add(path);
    entries.push({ path, type: type || 'unknown' });
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return entries;
}

function main() {
  const catalog = {};
  const notFetched = [];
  for (const family of FAMILIES) {
    process.stderr.write(`Fetching ${family.path} ...\n`);
    try {
      const csvText = fetchCsv(family.path);
      catalog[family.key] = parseFieldsCsv(csvText);
    } catch (error) {
      notFetched.push({ key: family.key, path: family.path, error: String(error) });
    }
  }

  if (notFetched.length > 0) {
    process.stderr.write(
      `\nWARNING: ${notFetched.length} family/families could not be fetched -- catalog will be ` +
        'incomplete:\n',
    );
    for (const failure of notFetched) {
      process.stderr.write(`  - ${failure.key} (${failure.path}): ${failure.error}\n`);
    }
  }

  const generatedDate = new Date().toISOString().slice(0, 10);
  const totalFields = Object.values(catalog).reduce((sum, list) => sum + list.length, 0);

  const familyEntries = Object.entries(catalog)
    .map(([key, entries]) => {
      const rows = entries
        .map(e => `      { path: ${JSON.stringify(e.path)}, type: ${JSON.stringify(e.type)} },`)
        .join('\n');
      return `  ${JSON.stringify(key)}: [\n${rows}\n  ],`;
    })
    .join('\n');

  const output = `/**
 * Generated by scripts/generate-field-catalog.mjs -- DO NOT hand-edit.
 *
 * Source: wazuh/wazuh-indexer-plugins, branch ${REF}, wcs/**\\/docs/fields.csv
 * (Wazuh Common Schema). Regenerated: ${generatedDate}.
 * Regenerate with: node scripts/generate-field-catalog.mjs (from plugins/wazuh-ai-assistant/).
 *
 * Only fields with Indexed=true are included (Indexed=false fields exist in WCS but can never be
 * filtered/aggregated in the indexer, so they are out of scope for a "does this field exist and
 * is it queryable" catalog). Keys match the index families the catalog tools query -- see
 * AI/plan/phase0-ground-truth.md's Tool catalog section for the family -> tool mapping. Path +
 * type only (no descriptions) to keep this file's footprint small.
 */

export interface FieldCatalogEntry {
  path: string;
  type: string;
}

export const FIELD_CATALOG: Record<string, ReadonlyArray<FieldCatalogEntry>> = {
${familyEntries}
};

/**
 * KNOWN PLATFORM BUG (filed; see AI/plan/phase0-ground-truth.md's "Surprises" #1 and
 * AI/plan/qa-rules-decoders-rootcause.md for the live reproduction): ECS \`host.os.*\`/\`host.name\`
 * are defined in WCS and mapped on \`wazuh-events-v5*\`/\`wazuh-findings-v5*\`, but return ZERO
 * buckets on every document on this platform version -- confirmed live via terms aggs on both an
 * events and a findings index (1,815+ and 219,317+ docs, 0 buckets on \`host.os.name\` and
 * \`host.os.platform\`). The POPULATED twin for the same data is \`wazuh.agent.host.os.*\` (and
 * \`wazuh.agent.host.name\`) -- \`wazuh.integration.category\`/\`.name\` are fully populated on the
 * exact same documents, proving this is a field-population gap, not a data gap.
 *
 * Tools and prompts should route OS-name/OS-platform questions on events/findings to the aliased
 * (\`wazuh.agent.host.*\`) field until the platform fix ships -- filtering/aggregating on the bare
 * ECS path will silently return nothing. This map is intentionally small and explicit rather than
 * a generic rewrite rule: only the confirmed-empty paths are listed.
 */
export const FIELD_ALIASES: Record<string, Record<string, string>> = {
  'events.main': {
    'host.os.name': 'wazuh.agent.host.os.name',
    'host.os.platform': 'wazuh.agent.host.os.platform',
    'host.os.version': 'wazuh.agent.host.os.version',
    'host.os.family': 'wazuh.agent.host.os.family',
    'host.name': 'wazuh.agent.host.name',
  },
  'events.findings': {
    'host.os.name': 'wazuh.agent.host.os.name',
    'host.os.platform': 'wazuh.agent.host.os.platform',
    'host.os.version': 'wazuh.agent.host.os.version',
    'host.os.family': 'wazuh.agent.host.os.family',
    'host.name': 'wazuh.agent.host.name',
  },
};

/** True when \`path\` is a known, indexed field for \`family\` -- either directly in
 * \`FIELD_CATALOG[family]\` or a known alias source for it (see \`FIELD_ALIASES\`). Returns \`false\`
 * for an unknown family (fails closed: an unrecognized family has no known fields by definition). */
export function isKnownField(family: string, path: string): boolean {
  const entries = FIELD_CATALOG[family];
  if (!entries) {
    return false;
  }
  if (entries.some(entry => entry.path === path)) {
    return true;
  }
  return Object.prototype.hasOwnProperty.call(FIELD_ALIASES[family] ?? {}, path);
}

/** Resolves \`path\` to the field that is actually POPULATED for \`family\` -- the alias target when
 * one exists (see \`FIELD_ALIASES\`' doc comment), else \`path\` unchanged. */
export function resolveFieldAlias(family: string, path: string): string {
  return FIELD_ALIASES[family]?.[path] ?? path;
}

/** Total indexed field count across every family -- exported for the generator's own footprint
 * reporting and for a test to assert the catalog is neither empty nor absurdly large. */
export const FIELD_CATALOG_TOTAL_FIELDS = ${totalFields};
`;

  const outPath = join(__dirname, '..', 'common', 'field-catalog.ts');
  writeFileSync(outPath, output, 'utf8');
  process.stderr.write(
    `\nWrote ${outPath} -- ${Object.keys(catalog).length} families, ${totalFields} fields.\n`,
  );
  if (notFetched.length > 0) {
    process.exitCode = 1;
  }
}

main();
