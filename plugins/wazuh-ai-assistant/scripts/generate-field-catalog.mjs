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
 * catalog tools actually query (see `server/tools/router.ts`'s TOOL_CATEGORY): the "stateless"
 * events/findings pair, the inventory
 * subsets get-agent-inventory.ts and future tools read, sca, vulnerabilities, and the fim subset.
 * The KEY here is the FIELD_CATALOG key used at runtime -- keep it stable, tools reference it by
 * name.
 */
const FAMILIES = [
  { key: 'events.main', path: 'wcs/stateless/events/main/docs/fields.csv' },
  {
    key: 'events.findings',
    path: 'wcs/stateless/events/findings/docs/fields.csv',
  },
  {
    key: 'inventory.system',
    path: 'wcs/stateful/inventory/system/docs/fields.csv',
  },
  {
    key: 'inventory.packages',
    path: 'wcs/stateful/inventory/packages/docs/fields.csv',
  },
  {
    key: 'inventory.ports',
    path: 'wcs/stateful/inventory/ports/docs/fields.csv',
  },
  {
    key: 'inventory.processes',
    path: 'wcs/stateful/inventory/processes/docs/fields.csv',
  },
  {
    key: 'inventory.hotfixes',
    path: 'wcs/stateful/inventory/hotfixes/docs/fields.csv',
  },
  {
    key: 'inventory.users',
    path: 'wcs/stateful/inventory/users/docs/fields.csv',
  },
  {
    key: 'inventory.groups',
    path: 'wcs/stateful/inventory/groups/docs/fields.csv',
  },
  {
    key: 'inventory.networks',
    path: 'wcs/stateful/inventory/networks/docs/fields.csv',
  },
  {
    key: 'inventory.interfaces',
    path: 'wcs/stateful/inventory/interfaces/docs/fields.csv',
  },
  {
    key: 'inventory.services',
    path: 'wcs/stateful/inventory/services/docs/fields.csv',
  },
  {
    key: 'inventory.hardware',
    path: 'wcs/stateful/inventory/hardware/docs/fields.csv',
  },
  {
    key: 'inventory.protocols',
    path: 'wcs/stateful/inventory/protocols/docs/fields.csv',
  },
  {
    key: 'inventory.browser_extensions',
    path: 'wcs/stateful/inventory/browser-extensions/docs/fields.csv',
  },
  { key: 'sca', path: 'wcs/stateful/sca/docs/fields.csv' },
  {
    key: 'vulnerabilities',
    path: 'wcs/stateful/vulnerabilities/docs/fields.csv',
  },
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

/** Quote-aware CSV ROW splitter, run over the WHOLE file text rather than pre-split lines (code
 * review B6): the previous version ran `csvText.split(/\r?\n/)` BEFORE this quote-aware splitter,
 * so a `Description`/`Example` cell containing an embedded newline (common in ECS-derived CSVs)
 * silently broke one row into two and shifted every column index -- the malformed halves usually
 * failed the `indexed !== 'true'` check and were just dropped, so real fields vanished from the
 * catalog with no error. This version treats a `\r?\n` as a row terminator ONLY when not currently
 * inside a quoted field, exactly like `,` is treated as a field terminator only outside quotes.
 * Handles the WCS `Example`/`Description` columns' embedded commas and `""`-escaped quotes. Not a
 * general CSV parser: sufficient for this fixed 9-column schema (see the file header this
 * generator writes for the expected column order). */
function splitCsvRows(csvText) {
  const rows = [];
  let fields = [];
  let current = '';
  let inQuotes = false;
  let rowHasContent = false;
  const endField = () => {
    fields.push(current);
    current = '';
  };
  const endRow = () => {
    endField();
    rows.push(fields);
    fields = [];
    rowHasContent = false;
  };
  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csvText[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      rowHasContent = true;
    } else if (ch === ',') {
      endField();
      rowHasContent = true;
    } else if (ch === '\r') {
      // Swallow bare CR; the following (or standalone) \n below ends the row.
    } else if (ch === '\n') {
      if (rowHasContent || current.length > 0 || fields.length > 0) {
        endRow();
      }
    } else {
      current += ch;
      rowHasContent = true;
    }
  }
  if (rowHasContent || current.length > 0 || fields.length > 0) {
    endRow();
  }
  return rows;
}

/** Parses one WCS `fields.csv` into a sorted list of PATHS, indexed fields only (a field with
 * `Indexed=false` cannot be filtered/aggregated, so it is out of scope for a "does this field
 * exist and is it queryable" catalog). Columns: ECS_Version, Indexed, Field_Set, Field, Type,
 * Level, Normalization, Example, Description. `Type` is read (required to validate the header
 * shape) but not carried into the output: the generated catalog's only production consumer is a
 * boolean "does this path exist" lookup (`isKnownField`/`field-drift-canary.ts`), and nothing
 * else reads `type`. Dropping it keeps the compressed catalog at ~0.85% of the ~2.4 MB footprint
 * gate instead of ~1.10%. */
function parseFieldsCsv(csvText) {
  const rows = splitCsvRows(csvText).filter(
    row => row.length > 1 || row[0] !== '',
  );
  const [header, ...dataRows] = rows;
  const indexedIdx = header.indexOf('Indexed');
  const fieldIdx = header.indexOf('Field');
  const typeIdx = header.indexOf('Type');
  if (indexedIdx === -1 || fieldIdx === -1 || typeIdx === -1) {
    throw new Error(
      `Unexpected WCS CSV header (missing Indexed/Field/Type): ${header.join(
        ',',
      )}`,
    );
  }
  const paths = [];
  const seen = new Set();
  for (const cells of dataRows) {
    const indexed = cells[indexedIdx];
    const path = cells[fieldIdx];
    if (!path || indexed !== 'true') {
      continue;
    }
    if (seen.has(path)) {
      continue;
    }
    seen.add(path);
    paths.push(path);
  }
  // Code review B7: `localeCompare` ordering varies by ICU locale, so regenerating this file on a
  // different machine could produce a large spurious diff across all 5,000+ entries. A plain
  // codepoint comparison is locale-independent and stable across machines/CI.
  paths.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return paths;
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
      notFetched.push({
        key: family.key,
        path: family.path,
        error: String(error),
      });
    }
  }

  if (notFetched.length > 0) {
    process.stderr.write(
      `\nERROR: ${notFetched.length} family/families could not be fetched -- refusing to write a ` +
        'truncated catalog:\n',
    );
    for (const failure of notFetched) {
      process.stderr.write(
        `  - ${failure.key} (${failure.path}): ${failure.error}\n`,
      );
    }
    // Code review B4: this generator's own doc comment for `fetchCsv` promises it "fails loudly
    // rather than silently writing a truncated catalog", but the previous version wrote the file
    // anyway and only set `process.exitCode` afterwards -- a transient network blip during a
    // regeneration would silently drop a whole family from the committed catalog, leaving a
    // plausible-looking diff for a reviewer to approve. Return BEFORE `writeFileSync` instead.
    process.exitCode = 1;
    return;
  }

  const generatedDate = new Date().toISOString().slice(0, 10);
  const totalFields = Object.values(catalog).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  const familyEntries = Object.entries(catalog)
    .map(([key, paths]) => {
      const rows = paths
        .map(path => `      ${JSON.stringify(path)},`)
        .join('\n');
      return `  ${JSON.stringify(key)}: [\n${rows}\n  ],`;
    })
    .join('\n');

  const output = `/**
 * Generated by scripts/generate-field-catalog.mjs -- DO NOT hand-edit.
 *
 * Source: wazuh/wazuh-indexer-plugins, branch ${REF}, wcs/**\\/docs/fields.csv (Wazuh Common
 * Schema). Regenerated: ${generatedDate}. Regenerate with: node scripts/generate-field-catalog.mjs
 * (from plugins/wazuh-ai-assistant/).
 *
 * Only Indexed=true fields are included (Indexed=false can never be filtered/aggregated, so is
 * out of scope for a "does this field exist and is it queryable" catalog). Keys match the index
 * families the catalog tools query.
 * PATHS ONLY (no type/descriptions), to keep this file's footprint small: the only production
 * consumer is a boolean existence lookup (\`isKnownField\`, \`field-drift-canary.ts\`'s live-mapping
 * diff).
 */

export const FIELD_CATALOG: Record<string, ReadonlyArray<string>> = {
${familyEntries}
};

/**
 * KNOWN PLATFORM GAP: ECS \`host.os.*\`/\`host.name\` are mapped on
 * \`wazuh-events-v5*\`/\`wazuh-findings-v5*\` but LARGELY UNPOPULATED (\`host.os.platform\` was only 7%
 * populated on one live environment -- corrected from an earlier "zero buckets" claim, which was
 * stale). The POPULATED twin is \`wazuh.agent.host.os.*\` (and
 * \`wazuh.agent.host.name\`) -- \`wazuh.integration.category\`/\`.name\` are fully populated on the same
 * documents, so this is a field-population gap, not a data gap.
 *
 * Tools/prompts should route OS-name/OS-platform questions on events/findings to the aliased
 * (\`wazuh.agent.host.*\`) field until the platform fix ships. Intentionally small and explicit
 * rather than a generic rewrite rule -- only the confirmed-largely-empty paths are listed.
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
  const paths = FIELD_CATALOG[family];
  if (!paths) {
    return false;
  }
  if (paths.includes(path)) {
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
    `\nWrote ${outPath} -- ${
      Object.keys(catalog).length
    } families, ${totalFields} fields.\n`,
  );
}

main();
