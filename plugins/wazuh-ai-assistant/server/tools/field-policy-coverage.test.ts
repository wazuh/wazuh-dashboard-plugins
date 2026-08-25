import assert from 'node:assert/strict';
import { listToolDefinitions } from './registry';
import { FIELD_POLICY_DEFAULTS, FieldPolicyEntry } from './privacy';

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
  'wazuh.rule.id',
  'wazuh.rule.level',
  'wazuh.rule.title',
  'wazuh.rule.mitre.technique.id',
  'wazuh.rule.mitre.technique.name',
  // The integration/channel taxonomy word a finding carries (already a visible table column on
  // every finding-hits tool; added to their model-facing sample columns by explain-wave phase 7).
  // A curated Wazuh enum, exactly like `wazuh.rule.level`, never analyst/attacker free text.
  'wazuh.integration.category',
  // Aggregation-bucket shape (get_top_rules and the *_summary tools).
  'key',
  'doc_count',
  // Sampled-label-spread sub-aggs (issue #8921): `cardinality`/`filter` sub-agg counters merged
  // into a bucket row by digest.ts's existing metric-/filter-sub-agg branches — aggregation
  // counters over already-classified fields (wazuh.rule.title/wazuh.rule.level/
  // wazuh.agent.name), never analyst/attacker-supplied free text themselves.
  'distinct_title_count',
  'distinct_name_count',
  'distinct_level_count',
  'high_or_critical',
  // os.* / architecture / vendor / version: OS/package metadata, not identifiers.
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
  // where "name" DOES mean a hostname (get_agents) have their own scoped FIELD_POLICY_DEFAULTS
  // entry that is checked first and wins, so this blanket allowance never overrides those.
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
  // Security Analytics content (get_rules, get_threat_intel_components): vendor-curated
  // rule/pipeline configuration metadata, not analyst- or attacker-supplied data.
  'document.name',
  'document.level',
  'document.status',
  'document.enabled',
  'document.mitre.technique.id',
  'document.tags',
  'document.logsource.product',
  'document.logsource.category',
  'document.metadata.title',
  'document.metadata.module',
  'document.category',
  'document.mode',
  'document.enrichments',
  'document.index_discarded_events',
  'document.index_unclassified_events',
  'space.name',
  // Security Analytics detector config (get_detectors): admin/vendor-configured metadata.
  'detector.name',
  'detector.detector_type',
  'detector.enabled',
  'detector.source',
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

/**
 * Coverage check for one field on one tool. `requireExplicitEntry` must be `true` whenever the
 * field is read by a `deriveColumns` tool (executor.ts threads `ToolDefinition.deriveColumns` into
 * `applyFieldPolicy`'s `isEscapeHatch` parameter): for such a tool, "no FIELD_POLICY_DEFAULTS
 * entry" means FAIL-CLOSED anonymize at runtime, the OPPOSITE of what an omission means for a
 * static-schema tool (allow-by-omission, `isEscapeHatch: false`). `KNOWN_SAFE_STRUCTURAL_FIELDS`
 * only ever certifies "this field needs no entry under the ALLOW-by-omission default" — it is a
 * structural-shape guess (counts, IDs, enums), never a reviewed privacy decision — so it must NOT
 * be allowed to satisfy coverage for a field whose actual runtime default is anonymize: a field
 * that merely "looks harmless" is not the same thing as a field someone actually decided should
 * reach the provider un-anonymized. This is precisely the gap that let `get_agent_inventory`'s
 * `package.vendor` (a distributor string that routinely embeds a maintainer email address) ship
 * with no real policy entry: `KNOWN_SAFE_STRUCTURAL_FIELDS` satisfied the OLD version of this
 * check, making the test green while the field had never actually been reviewed — it happened to
 * come out anonymized only because `applyFieldPolicy`'s fail-closed default did so by accident, a
 * property this test could not see because it applied the SAME "known-safe" exemption regardless
 * of which default an unlisted field would actually get at runtime. See the mechanism self-test
 * below, and privacy.ts's `package.vendor` entry for the resulting fix.
 */
function isFieldCovered(
  field: string,
  toolName: string,
  policy: FieldPolicyEntry[],
  requireExplicitEntry: boolean,
): boolean {
  if (hasPolicyEntry(field, toolName, policy)) {
    return true;
  }
  return !requireExplicitEntry && KNOWN_SAFE_STRUCTURAL_FIELDS.has(field);
}

test('every T1 non-deriveColumns tool digest column is privacy-classified or explicitly allowlisted', () => {
  const failures: string[] = [];
  for (const def of listToolDefinitions()) {
    if (def.tier !== 'T1' || def.deriveColumns) {
      continue;
    }
    for (const field of def.digest.sampleColumns) {
      // `requireExplicitEntry: false` — this loop only ever reaches non-deriveColumns tools (see
      // the `continue` above), where an unlisted field allows-by-omission and the structural
      // allowlist is exactly the right signal that the omission is safe.
      if (!isFieldCovered(field, def.spec.name, FIELD_POLICY_DEFAULTS, false)) {
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

test('every breakdownDimensions field is privacy-classified or explicitly allowlisted', () => {
  // `digest.breakdownDimensions` is a second model-facing data path: synthetic breakdown BUCKET
  // KEYS are values of these fields and leave through the digest exactly like sampleColumns
  // values do (executor.ts's identity-map path routes them through the same applyFieldPolicy
  // pass). Unlike the sampleColumns loop above this includes deriveColumns tools too — the
  // dimensions list is static and declared, so there is no reason to leave it to the
  // fail-closed runtime default when it can be reviewed here. For a deriveColumns tool
  // specifically, `requireExplicitEntry: true` means the structural allowlist cannot substitute
  // for that review (see `isFieldCovered`'s doc comment) — the field needs a REAL
  // FIELD_POLICY_DEFAULTS entry, because omitting one there does not mean "allow", it means
  // "anonymize with nobody having decided that's correct".
  const failures: string[] = [];
  // Without this guard the loop passes vacuously if no registered tool declared
  // breakdownDimensions at all (e.g. the field got renamed) -- same standard as the
  // registry-sweep guards in agg-representability-coverage.test.ts/window-recount.test.ts.
  let checkedCount = 0;
  for (const def of listToolDefinitions()) {
    for (const field of def.digest.breakdownDimensions ?? []) {
      checkedCount += 1;
      if (
        !isFieldCovered(
          field,
          def.spec.name,
          FIELD_POLICY_DEFAULTS,
          // A `deriveColumns` tool takes the fail-closed path, where a test-only
          // KNOWN_SAFE_STRUCTURAL_FIELDS entry is the OPPOSITE of "will be allowed" — such a field
          // needs a real policy entry. See isFieldCovered's doc comment.
          !!def.deriveColumns,
        )
      ) {
        failures.push(`${def.spec.name}/${field}`);
      }
    }
  }
  assert.ok(
    checkedCount > 0,
    'no registered tool declared breakdownDimensions -- this test would pass vacuously',
  );
  assert.deepEqual(
    failures,
    [],
    `breakdownDimensions field(s) with no FIELD_POLICY_DEFAULTS entry and no structural ` +
      `allowlist entry: ${failures.join(', ')}`,
  );
});

test('isFieldCovered mechanism: an unclassified field is correctly flagged as NOT covered', () => {
  // Regression-guard sanity check for the helper itself: a field that is neither a
  // FIELD_POLICY_DEFAULTS entry nor a known-safe structural field must fail coverage — this is
  // what makes the test above fail loudly if a future PR adds a digest column and forgets both.
  // `requireExplicitEntry: false` throughout this test — these are all the allow-by-omission
  // (non-deriveColumns) semantics; the deriveColumns/`requireExplicitEntry: true` distinction has
  // its own test below.
  assert.equal(
    isFieldCovered(
      'data.totally_new_field',
      'get_critical_findings',
      FIELD_POLICY_DEFAULTS,
      false,
    ),
    false,
  );
  // Sanity check the positive cases too, so a change to KNOWN_SAFE_STRUCTURAL_FIELDS/
  // FIELD_POLICY_DEFAULTS that accidentally drops an entry is itself caught here.
  assert.equal(
    isFieldCovered(
      'wazuh.agent.host.ip',
      'get_critical_findings',
      FIELD_POLICY_DEFAULTS,
      false,
    ),
    true,
  );
  assert.equal(
    isFieldCovered(
      'wazuh.rule.tags',
      'get_compliance_alerts',
      FIELD_POLICY_DEFAULTS,
      false,
    ),
    true,
  );
  assert.equal(
    isFieldCovered('name', 'get_agent_packages', FIELD_POLICY_DEFAULTS, false),
    true,
  );
  assert.equal(
    isFieldCovered('name', 'get_agents', FIELD_POLICY_DEFAULTS, false),
    true,
  );
});

test("isFieldCovered mechanism: KNOWN_SAFE_STRUCTURAL_FIELDS does not satisfy a deriveColumns tool's fail-closed requirement", () => {
  // Mechanism self-test for the exact defect this file's `requireExplicitEntry` parameter fixes
  // (see `isFieldCovered`'s doc comment): `get_agent_inventory` sets `deriveColumns: true`, which
  // makes executor.ts pass `isEscapeHatch: true` into `applyFieldPolicy` — an UNLISTED field there
  // is FAIL-CLOSED anonymized at runtime, not allowed through. 'vendor' (the bare structural word,
  // deliberately NOT 'package.vendor' — which now has its own real FIELD_POLICY_DEFAULTS entry
  // and would pass either way, masking this test's point) sits in KNOWN_SAFE_STRUCTURAL_FIELDS but
  // has no FIELD_POLICY_DEFAULTS entry of its own anywhere. If `isFieldCovered` ever regresses to
  // ignoring `requireExplicitEntry` (i.e. back to the pre-fix behavior that let `package.vendor`
  // ship unreviewed), this assertion flips to `true` and fails — that IS the regression this test
  // exists to catch.
  assert.equal(
    isFieldCovered(
      'vendor',
      'get_agent_inventory',
      FIELD_POLICY_DEFAULTS,
      true,
    ),
    false,
  );
  // The identical field/tool/policy inputs ARE covered when `requireExplicitEntry` is false — this
  // pins that the structural allowlist still does its intended job for a tool whose unlisted
  // fields allow-by-omission (the pre-existing, still-correct semantics for every non-deriveColumns
  // tool), so the fix above narrows the exemption rather than deleting it.
  assert.equal(
    isFieldCovered(
      'vendor',
      'get_agent_inventory',
      FIELD_POLICY_DEFAULTS,
      false,
    ),
    true,
  );
  // A field with a REAL FIELD_POLICY_DEFAULTS entry (package.vendor's own fix) is covered
  // regardless of `requireExplicitEntry`: an explicit, reviewed policy decision is exactly what
  // the distinction demands, so it must never be penalized by it.
  assert.equal(
    isFieldCovered(
      'package.vendor',
      'get_agent_inventory',
      FIELD_POLICY_DEFAULTS,
      true,
    ),
    true,
  );
});
