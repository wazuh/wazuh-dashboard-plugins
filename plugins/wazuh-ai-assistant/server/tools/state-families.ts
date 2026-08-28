import { FIELD_CATALOG, isKnownField } from '../../common/field-catalog';

/**
 * Single source of truth for the `wazuh-states-*` CURRENT-STATE surfaces: one entry per physical
 * index, carrying everything the three consumers need to reach it.
 *
 * WHY ONE FILE. A state surface is only usable when it is BOTH namable and discoverable: an index
 * `search_wazuh_data`'s enum can name but whose fields `get_field_values` cannot enumerate is
 * unanswerable, and a field that can be enumerated on an index the enum cannot name is unreachable.
 * Keeping the two lists separate risks widening one without the other, leaving the surface broken
 * either way. The enum (`generic-query-families.ts`), the field-discovery route
 * (`get-field-values.ts`'s `FIELD_LOCATIONS`) and the aggregation allowlist (`guardrails.ts`) all
 * derive from the rows below so they cannot drift apart.
 *
 * A single wildcard entry is not a substitute for per-index entries: `wazuh-states-*` fans out over
 * every state index at once and the returned sample is dominated by whichever family has the most
 * documents, so a family-scoped question comes back with the requested fields empty.
 *
 * `aggFields` IS CURATED, NOT MECHANICALLY DERIVED, and must stay that way. `FIELD_CATALOG` is the
 * authority on which fields EXIST -- every path below is filtered through it at module load (see
 * `STATE_FAMILY_UNKNOWN_FIELDS`), so a platform-side rename turns into a failing test rather than a
 * phantom allowlist entry -- but it says nothing about whether a terms aggregation on a field is
 * SAFE or even legal. Taking a family's whole catalog list would pull in `message`,
 * `process.command_line`, `file.path` and every `*.hash.*`: a terms agg on a `text` mapping is a
 * hard 400 ("Fielddata is disabled"), which the model can only read as an opaque failure. Every
 * path below was verified with a real `terms` aggregation rather than assumed keyword-mapped -- the
 * same evidence bar `guardrails.ts`'s `AGG_FIELD_ALLOWLIST` sets for its own entries.
 */
export interface StateFamily {
  /** `common/field-catalog.ts` key documenting this index's fields -- the existence authority for
   * every path in `aggFields`/`signatureFields`. */
  catalogFamily: string;
  /** The exact `index_pattern` value offered through `search_wazuh_data`'s enum AND the index
   * `get_field_values` aggregates on. One string, one place: an enum value the field-discovery
   * route cannot reach (or vice versa) is the drift this file exists to prevent. Trailing `*`
   * matches the literal every typed tool already uses for these indices (e.g.
   * `get-agent-os.ts`'s `wazuh-states-inventory-system*`). */
  pattern: string;
  /** `get_field_values`' own `index_family` vocabulary for this surface (snake_case, mirrors that
   * tool's existing "findings"/"events"/"sca" labels). `undefined` when the family opens no
   * field-discovery route (`aggFields` empty). */
  toolFamily?: string;
  /** Short, user-vocabulary description of what this index holds -- the first half of the
   * generated enum label. */
  summary: string;
  /** The 2-4 fields that IDENTIFY this surface, quoted in the enum label so the model can pick the
   * right family from the parameter description alone instead of aiming the wildcard at all
   * eighteen and hoping its family dominates the sample. */
  signatureFields: readonly string[];
  /** Typed tool that owns this surface, when one does. Named in the label so opening the family to
   * the escape hatch never turns into routing competition -- see `generic-query-families.ts`'s own
   * "never competes with a typed tool for routing" rule, which this makes explicit per family
   * instead of relying on the family simply being absent from the enum. */
  typedTool?: string;
  /** Aggregation-safe fields to open for `get_field_values` on this surface. Empty means "no
   * field-discovery route" (the typed tool covers every question worth asking here). */
  aggFields: readonly string[];
}

/**
 * Every `wazuh-states-*` index, in the order they are presented to the model: the surfaces NO
 * typed tool owns first, then the ones a typed tool already covers, each naming that tool.
 */
const DECLARED_STATE_FAMILIES: StateFamily[] = [
  // --- Surfaces with no typed tool -----------------------------------------------------------
  {
    catalogFamily: 'inventory.users',
    pattern: 'wazuh-states-inventory-users*',
    toolFamily: 'inventory_users',
    summary: 'local user accounts per host',
    signatureFields: ['user.name', 'user.type', 'user.shell', 'user.groups'],
    aggFields: [
      'user.name',
      'user.type',
      'user.shell',
      // Numeric GIDs on this schema, not group NAMES -- resolve a name through the groups family
      // below.
      'user.groups',
      'login.status',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.groups',
    pattern: 'wazuh-states-inventory-groups*',
    toolFamily: 'inventory_groups',
    summary: 'local groups and their members',
    signatureFields: ['group.name', 'group.id', 'group.users'],
    aggFields: [
      'group.name',
      'group.id',
      'group.users',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.services',
    pattern: 'wazuh-states-inventory-services*',
    toolFamily: 'inventory_services',
    summary:
      'systemd units and Windows services, one document per service per host',
    signatureFields: [
      'service.name',
      'service.state',
      'service.enabled',
      'service.start_type',
    ],
    aggFields: [
      'service.name',
      'service.state',
      'service.sub_state',
      'service.enabled',
      'service.start_type',
      'service.type',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.hardware',
    pattern: 'wazuh-states-inventory-hardware*',
    toolFamily: 'inventory_hardware',
    summary: 'CPU/memory/serial hardware inventory',
    signatureFields: ['host.cpu.name', 'host.cpu.cores', 'host.memory.total'],
    aggFields: [
      'host.cpu.name',
      'host.cpu.cores',
      'host.memory.total',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.interfaces',
    pattern: 'wazuh-states-inventory-interfaces*',
    toolFamily: 'inventory_interfaces',
    summary: 'network interfaces and their link state',
    signatureFields: ['interface.name', 'interface.state', 'interface.type'],
    aggFields: [
      'interface.name',
      'interface.state',
      'interface.type',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.networks',
    pattern: 'wazuh-states-inventory-networks*',
    toolFamily: 'inventory_networks',
    summary: 'per-interface IP addressing',
    signatureFields: ['network.ip', 'network.netmask', 'network.dhcp'],
    aggFields: [
      'network.ip',
      'network.netmask',
      // 0/1 on this schema, not "enabled"/"disabled".
      'network.dhcp',
      'network.type',
      'interface.name',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.protocols',
    pattern: 'wazuh-states-inventory-protocols*',
    toolFamily: 'inventory_protocols',
    summary:
      'routing/protocol configuration -- this is where the DEFAULT GATEWAY lives',
    signatureFields: ['network.gateway', 'network.type', 'interface.name'],
    aggFields: [
      'network.gateway',
      'network.dhcp',
      'network.type',
      'interface.name',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.browser_extensions',
    pattern: 'wazuh-states-inventory-browser-extensions*',
    toolFamily: 'inventory_browser_extensions',
    summary: 'installed browser extensions',
    signatureFields: [
      // There is no `browser.extension.name` on this schema: the extension's own name is
      // `package.name`, and `browser.name` is the BROWSER (Chrome/Safari).
      'package.name',
      'package.version',
      'browser.name',
      'package.enabled',
    ],
    aggFields: [
      'package.name',
      'package.version',
      'package.enabled',
      'browser.name',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'fim.windows_registry_keys',
    pattern: 'wazuh-states-fim-registry-keys*',
    toolFamily: 'fim_registry_keys',
    summary: 'monitored Windows registry KEYS (the containers)',
    signatureFields: ['registry.hive', 'registry.key', 'registry.owner'],
    aggFields: [
      'registry.hive',
      'registry.key',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'fim.windows_registry_values',
    pattern: 'wazuh-states-fim-registry-values*',
    toolFamily: 'fim_registry_values',
    summary: 'monitored Windows registry VALUES (the entries under a key)',
    signatureFields: ['registry.value', 'registry.data.type', 'registry.key'],
    aggFields: [
      'registry.value',
      'registry.data.type',
      'registry.hive',
      'registry.key',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },

  // --- Surfaces a typed tool already owns -----------------------------------------------------
  // Listed anyway: the alternative to a scoped pattern here is not the typed tool, it is the
  // `wazuh-states-*` wildcard, which the model reaches with no reminder that a typed tool exists at
  // all. Each label below names the owning tool, so opening the family strengthens routing rather
  // than competing with it.
  {
    catalogFamily: 'inventory.system',
    pattern: 'wazuh-states-inventory-system*',
    toolFamily: 'inventory_system',
    summary: 'per-host OS identity, one document per agent',
    signatureFields: ['host.os.name', 'host.os.version', 'host.architecture'],
    typedTool: 'get_agent_inventory (kind "os")',
    aggFields: [
      'host.os.name',
      'host.os.platform',
      'host.os.version',
      'host.architecture',
      'host.hostname',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.packages',
    pattern: 'wazuh-states-inventory-packages*',
    toolFamily: 'inventory_packages',
    summary: 'installed software packages',
    signatureFields: ['package.name', 'package.version', 'package.type'],
    typedTool: 'get_agent_inventory (kind "packages")',
    aggFields: [
      'package.name',
      'package.version',
      'package.type',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.processes',
    pattern: 'wazuh-states-inventory-processes*',
    toolFamily: 'inventory_processes',
    summary: 'running processes and their parents',
    signatureFields: ['process.name', 'process.pid', 'process.parent.pid'],
    typedTool: 'get_agent_inventory (kind "processes")',
    aggFields: [
      'process.name',
      'process.state',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.ports',
    pattern: 'wazuh-states-inventory-ports*',
    toolFamily: 'inventory_ports',
    summary:
      "open/listening sockets -- a LISTENER's own port is source.port with interface.state " +
      '"listening"; destination.port is the far end and is 0 on a listener',
    signatureFields: ['source.port', 'interface.state', 'network.transport'],
    typedTool: 'get_agent_inventory (kind "ports")',
    aggFields: [
      // The model filters `destination.port` for "is this port exposed" questions
      // and gets 0 rows, because on this schema every listener carries its port in `source.port`
      // and `destination.port: 0`. Both are opened so the model can SEE that distribution instead
      // of inferring absence from the wrong field.
      'source.port',
      'destination.port',
      'interface.state',
      'network.transport',
      'process.name',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'inventory.hotfixes',
    pattern: 'wazuh-states-inventory-hotfixes*',
    toolFamily: 'inventory_hotfixes',
    summary: 'installed Windows hotfixes (KB numbers)',
    signatureFields: ['package.hotfix.name'],
    typedTool: 'get_agent_inventory (kind "hotfixes")',
    aggFields: ['package.hotfix.name', 'wazuh.agent.id', 'wazuh.agent.name'],
  },
  {
    catalogFamily: 'fim.files',
    pattern: 'wazuh-states-fim-files*',
    summary: 'FIM file state (monitored files, owners, hashes)',
    signatureFields: ['file.path', 'file.owner', 'file.hash.sha256'],
    typedTool: 'get_fim_files',
    // No field-discovery route: every field worth enumerating here is either unbounded free text
    // (`file.path`) or already surfaced by get_fim_files' own digest columns.
    aggFields: [],
  },
  {
    catalogFamily: 'sca',
    pattern: 'wazuh-states-sca*',
    toolFamily: 'sca',
    summary: 'SCA / benchmark check results',
    signatureFields: ['check.id', 'check.result', 'policy.name'],
    typedTool: 'get_sca_checks / get_sca_results',
    aggFields: [
      'check.id',
      'check.result',
      'check.name',
      'policy.id',
      'policy.name',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
  {
    catalogFamily: 'vulnerabilities',
    pattern: 'wazuh-states-vulnerabilities*',
    toolFamily: 'vulnerabilities',
    summary: 'per-agent vulnerability state (CVE x package x host)',
    signatureFields: [
      'vulnerability.id',
      'vulnerability.severity',
      'package.name',
    ],
    typedTool: 'get_vulnerabilities / get_vulnerabilities_by_agent',
    aggFields: [
      'vulnerability.id',
      'vulnerability.severity',
      'package.name',
      'wazuh.agent.id',
      'wazuh.agent.name',
    ],
  },
];

/**
 * Every declared field path that `FIELD_CATALOG` does NOT know for its own family -- i.e. a path
 * this file claims exists but the generated WCS catalog says does not. Such a path is DROPPED from
 * the derived lists below (an allowlist entry for a field the platform renamed away can only ever
 * produce an empty aggregation the model has to interpret), and `state-families.test.ts` asserts
 * this array is empty so the drop is loud rather than silent.
 */
export const STATE_FAMILY_UNKNOWN_FIELDS: ReadonlyArray<{
  catalogFamily: string;
  field: string;
}> = DECLARED_STATE_FAMILIES.flatMap(family =>
  [...family.signatureFields, ...family.aggFields]
    .filter(field => !isKnownField(family.catalogFamily, field))
    .map(field => ({ catalogFamily: family.catalogFamily, field })),
);

/** Every declared `catalogFamily` that `FIELD_CATALOG` does not carry at all -- the coarser half of
 * the same drift check (a whole family renamed, not one field). */
export const STATE_FAMILY_UNKNOWN_CATALOG_FAMILIES: ReadonlyArray<string> =
  DECLARED_STATE_FAMILIES.map(family => family.catalogFamily).filter(
    catalogFamily => FIELD_CATALOG[catalogFamily] === undefined,
  );

/** The declared families with every catalog-unknown field filtered out -- the list every consumer
 * reads. */
export const STATE_FAMILIES: ReadonlyArray<StateFamily> =
  DECLARED_STATE_FAMILIES.map(family => ({
    ...family,
    signatureFields: family.signatureFields.filter(field =>
      isKnownField(family.catalogFamily, field),
    ),
    aggFields: family.aggFields.filter(field =>
      isKnownField(family.catalogFamily, field),
    ),
  }));

/** Flat, deduplicated, sorted union of every state family's `aggFields` -- folded into
 * `guardrails.ts`'s `AGG_FIELD_ALLOWLIST` (that Set is flat and index-agnostic, so a field opened
 * for one family is opened for every index carrying the same path; `get_field_values`' own
 * `FIELD_LOCATIONS` is what actually decides which index a given field is aggregated on). */
export const STATE_AGG_FIELDS: ReadonlyArray<string> = [
  ...new Set(STATE_FAMILIES.flatMap(family => family.aggFields)),
].sort();

/** `"pattern" (label)` material for `search_wazuh_data`'s enum: the summary, the signature fields
 * that let the model tell one family from another, and the owning typed tool where there is one. */
export function stateFamilyLabel(family: StateFamily): string {
  const fields =
    family.signatureFields.length > 0
      ? ` -- ${family.signatureFields.join(', ')}`
      : '';
  const typed = family.typedTool ? `; PREFER ${family.typedTool}` : '';
  return `${family.summary}${fields}${typed}`;
}
