import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { listToolDefinitions } from './registry';
import { FIELD_POLICY_DEFAULTS, FieldPolicyEntry } from './privacy';
import { RETIRED_FIELD_MAP } from '../../common/wazuh-fields';

/**
 * Guard test for the rule ("a new field without a privacy classification
 * is a LEAK when privacy is on"): every `digest.sampleColumns` entry of every T1, non-`deriveColumns`
 * catalog tool must either have an explicit `server/tools/privacy.ts` `FIELD_POLICY_DEFAULTS` entry
 * (any action — 'allow'/'anonymize'/'never' all count as "reviewed") or be a known-safe STRUCTURAL
 * field (counts, IDs, curated taxonomy words, enums) that was never analyst-supplied data. Nothing
 * here is exempt by default: a tool's sampleColumns field that matches neither list fails the test,
 * which is the intended regression guard — a future PR that adds a digest column and forgets the
 * privacy entry must break this, not silently ship a leak.
 *
 * `deriveColumns` tools (search_wazuh_data) are excluded on purpose: their columns are
 * chosen per-response from arbitrary fields, not a static declared list this test can enumerate —
 * that escape hatch is guarded separately by `privacy.ts`'s `isEscapeHatch` fail-closed default
 * (see `applyFieldPolicy`'s doc comment), not by this per-field allowlist mechanism.
 */

/**
 * Structural fields that are safe to send to the model regardless of tool: counts, IDs, Wazuh's own
 * curated enums/taxonomy words, and other fields that were never analyst/attacker-supplied free
 * text. Kept as a flat (non-tool-scoped) set — every one of these is equally safe in every tool it
 * appears in today. A field belonging here is exempt from needing a `FIELD_POLICY_DEFAULTS` entry;
 * everything else must be classified there instead of added here.
 */
const KNOWN_SAFE_STRUCTURAL_FIELDS = new Set<string>([
  // Timestamps / rule metadata (curated by the Wazuh ruleset, not analyst/attacker input).
  'timestamp',
  '@timestamp',
  'rule.id',
  'rule.level',
  'rule.description',
  'rule.mitre.technique',
  // Wazuh 5.0 wazuh.* renames of the above (issue #8802 / Slice A): added ahead of the Slice B
  // catalog-tool rename so this allowlist is ready to cover the renamed digest columns once they
  // land, without removing the still-in-use bare entries during the transition.
  'wazuh.rule.id',
  'wazuh.rule.level',
  'wazuh.rule.description',
  'wazuh.rule.mitre.technique.id',
  'wazuh.rule.mitre.technique.name',
  // Aggregation-bucket shape (get_top_rules and the *_summary tools).
  'key',
  'doc_count',
  // agent.os.name / os.* / architecture / vendor / version: OS/package metadata, not identifiers.
  'agent.os.name',
  // wazuh.agent.host.os.name is agent.os.name's real Wazuh 5.0 home (NOT a naive
  // wazuh.agent.os.name prefix — see common/wazuh-fields.ts).
  'wazuh.agent.host.os.name',
  'os.name',
  'os.version',
  'architecture',
  'version',
  'vendor',
  // Syscollector/network structural fields (ports/process metadata; ip/name look-alikes are
  // covered by FIELD_POLICY_DEFAULTS' tool-scoped entries instead, see get_agent_ports/local.ip).
  // remote.port is the same kind of bare port number as local.port, not an identifier.
  'local.port',
  'remote.port',
  'protocol',
  'process',
  'pid',
  'state',
  'cmd',
  'id',
  'status',
  'disconnection_time',
  // SCA policy summary fields.
  'policy_id',
  'pass',
  'fail',
  'score',
  // FIM path/event-type fields (file paths, not analyst-identifying data by themselves).
  'syscheck.path',
  'syscheck.event',
  // Vulnerability catalog fields (CVE ids/severities/package coordinates — public CVE data).
  'vulnerability.id',
  'vulnerability.severity',
  'package.name',
  'package.version',
  'data.vulnerability.cve',
  'data.vulnerability.severity',
  // Generic "name" recurs across several Manager-API tools (package/process/policy name) with no
  // tool-scoped policy entry because it is deliberately NOT anonymized there (see privacy.ts's
  // comment on get_agent_packages/name, get_agent_processes/name, get_sca_results/name) — tools
  // where "name" DOES mean a hostname (get_active_agents, get_disconnected_agents) have their own
  // scoped FIELD_POLICY_DEFAULTS entry that is checked first and wins, so this blanket allowance
  // never overrides those.
  'name',
  // Wazuh 5.0 ECS structural fields: OS/package metadata,
  // bare port numbers/enums, process metadata, SCA-summary counters, and FIM file metadata —
  // none analyst/attacker-supplied identifiers (the identifier-bearing ECS fields host.hostname/
  // source.ip/destination.ip/process.command_line/file.owner have FIELD_POLICY_DEFAULTS entries
  // instead).
  'host.os.name',
  'host.os.version',
  'host.architecture',
  'package.vendor',
  'source.port',
  'destination.port',
  'network.transport',
  'process.name',
  'process.pid',
  'process.state',
  'policy.name',
  'passed',
  'failed',
  'not_applicable',
  'file.path',
  'file.mtime',
  'file.size',
]);

/** Replica of privacy.ts's private `resolveFieldEntry`: a tool-scoped entry ("tool/field") wins over
 * a plain one; a plain entry may prefix-match via a trailing ".*". Kept local to this test (rather
 * than exporting the private helper from privacy.ts) since this is the only other place that needs
 * the same resolution semantics. */
function hasPolicyEntry(
  field: string,
  toolName: string,
  policy: FieldPolicyEntry[],
): boolean {
  const scopedKey = `${toolName}/${field}`;
  if (policy.some(entry => entry.field === scopedKey)) {
    return true;
  }
  return policy.some(entry => {
    if (entry.field.includes('/')) {
      return false;
    }
    if (entry.field.endsWith('.*')) {
      const prefix = entry.field.slice(0, -2);
      return field === prefix || field.startsWith(`${prefix}.`);
    }
    return entry.field === field;
  });
}

function isFieldCovered(
  field: string,
  toolName: string,
  policy: FieldPolicyEntry[],
): boolean {
  return (
    hasPolicyEntry(field, toolName, policy) ||
    KNOWN_SAFE_STRUCTURAL_FIELDS.has(field)
  );
}

test('every T1 non-deriveColumns tool digest column is privacy-classified or explicitly allowlisted', () => {
  const failures: string[] = [];
  for (const def of listToolDefinitions()) {
    if (def.tier !== 'T1' || def.deriveColumns) {
      continue;
    }
    for (const field of def.digest.sampleColumns) {
      if (!isFieldCovered(field, def.spec.name, FIELD_POLICY_DEFAULTS)) {
        failures.push(`${def.spec.name}/${field}`);
      }
    }
  }
  assert.deepEqual(
    failures,
    [],
    `digest column(s) with no FIELD_POLICY_DEFAULTS entry and no structural allowlist entry: ${failures.join(
      ', ',
    )}`,
  );
});

test('isFieldCovered mechanism: an unclassified field is correctly flagged as NOT covered', () => {
  // Regression-guard sanity check for the helper itself: a field that is neither a
  // FIELD_POLICY_DEFAULTS entry nor a known-safe structural field must fail coverage — this is
  // what makes the test above fail loudly if a future PR adds a digest column and forgets both.
  assert.equal(
    isFieldCovered(
      'data.totally_new_field',
      'get_critical_alerts',
      FIELD_POLICY_DEFAULTS,
    ),
    false,
  );
  // Sanity check the positive cases too, so a change to KNOWN_SAFE_STRUCTURAL_FIELDS/
  // FIELD_POLICY_DEFAULTS that accidentally drops an entry is itself caught here.
  assert.equal(
    isFieldCovered(
      'wazuh.agent.host.ip',
      'get_critical_alerts',
      FIELD_POLICY_DEFAULTS,
    ),
    true,
  );
  assert.equal(
    isFieldCovered(
      'wazuh.rule.tags',
      'get_pci_dss_alerts',
      FIELD_POLICY_DEFAULTS,
    ),
    true,
  );
  assert.equal(
    isFieldCovered('name', 'get_agent_packages', FIELD_POLICY_DEFAULTS),
    true,
  );
  assert.equal(
    isFieldCovered('name', 'get_active_agents', FIELD_POLICY_DEFAULTS),
    true,
  );
});

/**
 * Regression guard for issue #8802 (update-index-references): every field the AI assistant
 * queries the Indexer with must resolve to a field actually populated in Wazuh 5.0
 * `wazuh-findings-v5*`/`wazuh-events-v5*` documents. A retired bare `rule.*`/`agent.*` literal
 * (see `RETIRED_FIELD_MAP` in `common/wazuh-fields.ts`) silently produces a query that matches
 * nothing — a wrong answer with no error.
 *
 * This scans the SOURCE of `server/tools/catalog/*.ts` (excluding test files), `digest.ts`, and
 * `guardrails.ts` for a quoted literal matching one of the retired keys. Slices B/C have renamed
 * the catalog tools/guardrails off the retired vocabulary, so this is now a permanent green
 * regression guard: it must keep passing, and any future PR that reintroduces a retired bare
 * `rule.*`/`agent.*` literal should fail it loudly. Do NOT weaken this test to make a future
 * regression pass.
 */
function findRetiredFieldLiteralOccurrences(): string[] {
  const catalogDir = path.join(__dirname, 'catalog');
  const filesToScan: string[] = fs
    .readdirSync(catalogDir)
    .filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map(name => path.join(catalogDir, name));
  filesToScan.push(path.join(__dirname, 'digest.ts'));
  filesToScan.push(path.join(__dirname, 'guardrails.ts'));

  const retiredKeys = Object.keys(RETIRED_FIELD_MAP);
  const failures: string[] = [];

  for (const filePath of filesToScan) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const key of retiredKeys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const literalRe = new RegExp(`['"\`]${escaped}['"\`]`);
      if (literalRe.test(source)) {
        failures.push(`${path.relative(process.cwd(), filePath)}: '${key}'`);
      }
    }
  }
  return failures;
}

test('no retired bare rule.*/agent.* field literal survives in catalog/digest/guardrails source (permanent regression guard)', () => {
  const failures = findRetiredFieldLiteralOccurrences();
  assert.deepEqual(
    failures,
    [],
    `retired field literal(s) found — rename to the wazuh.* equivalent (see common/wazuh-fields.ts RETIRED_FIELD_MAP): ${failures.join(
      ', ',
    )}`,
  );
});
