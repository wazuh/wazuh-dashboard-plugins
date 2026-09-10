/*
 * Wazuh app - Registry of individually searchable configuration settings.
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { get } from 'lodash';

import {
  renderValueBooleanYesNo,
  renderValueNoThenEnabled,
  renderValueYesThenEnabled,
  renderValueOrNoValue,
  renderValueOrYes,
  renderValueOrDefault,
} from './utils';

/** How to source a field's raw value in the manager branch. Mirrors the two
 * shapes `withWzConfig`/`getCurrentConfig` already support, so the fetch
 * wrapper can dedupe/batch requests the same way across the whole registry. */
export type ManagerFieldSource =
  | { kind: 'regular'; component: string; configuration: string }
  | { kind: 'fullEndpoint'; key: string };

/** One doc link shown in a section/subsection's help popover
 * (`WzHelpButtonPopover`), verbatim from the original per-section
 * `helpLinks` arrays. */
export interface HelpLink {
  text: string;
  href: string;
}

export interface SearchableSettingField {
  kind?: 'field';
  /** Stable id, e.g. 'registration-service.port'. */
  id: string;
  label: string;
  description?: string;
  /** Matches a `configuration-settings.js` group entry's `name`. */
  category: string;
  /** Sub-grouping shown alongside the category in a result's breadcrumb --
   * an actual UI tab (e.g. 'Remote') or just a settings-group heading (e.g.
   * 'SSL settings') depending on how the section itself is laid out. */
  tab?: string;
  /** Only needed when one `tab` must render more than one separately
   * titled/helped header (currently only Global Configuration's `Global`
   * tab, which had two original sub-headers -- "Logging settings" and
   * "Agents settings" -- with different help links). Looked up together
   * with `tab` via `configurationHeaderKey`. */
  group?: string;
  /** Per-field help tooltip (`EuiIconTip`), verbatim from the original
   * section-local `info:` string, where one existed. */
  info?: string;
  /** Matches a `configuration-settings.js` group entry's `goto`, so a result
   * can jump back into the section it came from. */
  goto: string;
  appliesTo: 'manager' | 'agent';
  /** Restricts an agent-only field to agents reporting (or not reporting)
   * as Windows, e.g. registry-monitoring settings vs. Linux/macOS-only
   * who-data settings. Unset means it applies to every platform. */
  platform?: 'windows' | 'not-windows';
  manager?: {
    request: ManagerFieldSource;
    /** lodash-get path, resolved against the request's merged result. */
    path: string;
    /** Only needed when the request's result isn't a plain object the path
     * can walk directly (e.g. the wmodules array, keyed by wodle name). */
    unwrap?: (raw: unknown) => unknown;
  };
  /** lodash-get path into the agent report's `content`. */
  agentPath?: string;
  /** Only for cases a plain dot-path can't express (an array-or-object
   * field, a value nested through a wodle-style wrapper, etc). Exactly one
   * of `agentPath`/`agentExtract` is set on an `appliesTo: 'agent'` field. */
  agentExtract?: (content: Record<string, unknown>) => unknown;
  /** Reuses the exported, generic render helpers from ./utils -- never a
   * section-local one-off, except the two small copies below (documented). */
  render?: (value: unknown) => unknown;
}

/**
 * A dynamic, agent-only list of runtime-defined items (e.g. one entry per
 * monitored directory, per configured command). Rendered as one small
 * fixed-fields block per item, headed by `itemLabel` -- no per-item
 * "select to view" interaction, since everything is shown directly.
 */
export interface SearchableSettingList {
  kind: 'list';
  id: string;
  category: string;
  tab?: string;
  goto: string;
  appliesTo: 'agent';
  /** Restricts the list to agents reporting (or not reporting) as Windows.
   * Unset means it applies to every platform. */
  platform?: 'windows' | 'not-windows';
  /** Subsection heading, e.g. "Monitored directories", "Ignored files". */
  title: string;
  description?: string;
  /** A list has a 1:1 header:list correspondence already (via `title`/
   * `description` above), so its help doesn't need the `configurationHeaders`
   * lookup -- just set directly, verbatim from the original section's
   * `helpLinks`. */
  help?: HelpLink[];
  agentPath?: string;
  /** For a raw shape a plain path can't express (bare-value-or-array, two
   * possible field names, app-side filtering of one shared field). */
  agentExtract?: (content: Record<string, unknown>) => unknown[];
  itemLabel: (item: unknown, index: number) => string;
  itemFields: Array<{
    field: string;
    label: string;
    render?: (value: unknown) => unknown;
    info?: string;
  }>;
}

export type SearchableSettingEntry =
  | SearchableSettingField
  | SearchableSettingList;

const renderOptsIncludes = (key: string) => (value: unknown) =>
  Array.isArray(value) && value.includes(key) ? 'yes' : 'no';

/* log-collection helpers -- shared by every log-collection-* tab below. */
const renderLogCollectionTarget = (value: unknown) =>
  Array.isArray(value) ? value.join(', ') : 'agent';

const renderArrayObjectField = (value: unknown) => {
  if (!Array.isArray(value)) {
    return '-';
  }
  return value
    .map((entry: { value?: string; type?: string }) =>
      entry?.value?.concat(entry.type ? ` (${entry.type})` : ''),
    )
    .join(', ');
};

const renderQueryValue = (value: unknown) => {
  if (value === undefined) {
    return '-';
  }
  return typeof value === 'object'
    ? (value as { value?: unknown })?.value
    : value;
};

const renderFilters = (value: unknown) => {
  if (!Array.isArray(value)) {
    return '-';
  }
  return value
    .map(
      (f: {
        field?: string;
        expression?: string;
        ignore_if_missing?: unknown;
      }) =>
        `${f.field}: ${f.expression}${
          f.ignore_if_missing ? ' (ignore if missing)' : ''
        }`,
    )
    .join('; ');
};

/** The manager wraps a single reported block as a bare value rather than a
 * one-element list -- every log-collection tab (and this bucket splitter)
 * needs the same array-or-object-or-absent normalization. */
const toArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value
    : value
    ? [value as Record<string, unknown>]
    : [];

/** log-collection.js splits one shared `logcollector.localfile` field into
 * per-tab buckets by `logformat` -- this is app-side filtering, not a
 * distinct API field, so it has to be reproduced here rather than expressed
 * as a dot-path. */
const localfileBucket =
  (predicate: (item: Record<string, unknown>) => boolean) =>
  (content: Record<string, unknown>) =>
    toArray(get(content, 'logcollector.localfile')).filter(predicate);

const wodleUnwrap = (wodleKey: string) => (raw: unknown) => {
  const wmodules = (raw as { wmodules?: unknown })?.wmodules;
  if (!Array.isArray(wmodules)) {
    return undefined;
  }
  const entry = wmodules.find(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === 'object' && wodleKey in item,
  );
  return entry?.[wodleKey];
};

/* Duplicated from indexer-configuration.js: that file doesn't export these
(decision: no touching/exporting from the ~13 existing section components),
so the small amount of duplication is accepted here rather than exporting
section-local renderers. */
const renderCertificateAuthorities = (value: unknown): string => {
  if (!value || !Array.isArray(value)) {
    return '-';
  }
  const cas = value.flatMap(item =>
    typeof item === 'string' ? item : item?.ca ? item.ca : [],
  );
  return cas.length ? cas.join(', ') : '-';
};

const renderArrayValue = (value: unknown): string => {
  if (!value) {
    return '-';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'string') {
    return value;
  }
  return '-';
};

/** A subsection's header content: what the original section's
 * `WzConfigurationSettingsHeader` for that (category, tab, group) showed. */
export interface ConfigurationHeader {
  title: string;
  description?: string;
  help?: HelpLink[];
}

/** Composite key used both to populate and to look up `configurationHeaders`. */
export const configurationHeaderKey = (
  goto: string,
  tab?: string,
  group?: string,
) => `${goto}::${tab ?? ''}::${group ?? ''}`;

/* Help link sets shared verbatim by several tabs/sections in the original
implementation (each tab imported the same sibling `help-links.js`). */
const REMOTE_HELP: HelpLink[] = [
  {
    text: 'Remote daemon reference',
    href: 'user-manual/manager/reference.html#daemons',
  },
  {
    text: 'Remote configuration reference',
    href: 'user-manual/manager/wazuh-manager-services.html#agent-connection-service',
  },
];

const POLICY_MONITORING_HELP: HelpLink[] = [
  {
    text: 'Malware detection',
    href: 'user-manual/capabilities/malware-detection/index.html',
  },
  {
    text: 'Security Configuration Assessment',
    href: 'user-manual/capabilities/sec-config-assessment/how-to-configure.html',
  },
  {
    text: 'Rootcheck reference',
    href: 'user-manual/reference/ossec-conf/rootcheck.html',
  },
];

const FIM_HELP: HelpLink[] = [
  {
    text: 'Integrity monitoring documentation',
    href: 'user-manual/capabilities/file-integrity/index.html',
  },
  {
    text: 'Syscheck reference',
    href: 'user-manual/capabilities/file-integrity/how-to-configure-fim.html',
  },
];

const LOG_COLLECTION_HELP: HelpLink[] = [
  {
    text: 'Log data collection documentation',
    href: 'user-manual/capabilities/log-data-collection/index.html',
  },
  {
    text: 'Command monitoring',
    href: 'user-manual/capabilities/command-monitoring/index.html',
  },
  {
    text: 'Localfile reference',
    href: 'user-manual/reference/ossec-conf/localfile.html',
  },
];

/**
 * Header content (title/description/help) for every `SearchableSettingField`
 * subsection -- i.e. every (goto, tab, group) combination the registry below
 * groups fields into. List entries don't use this: they carry their own
 * `title`/`description`/`help` directly, since a list already has a 1:1
 * header:list correspondence.
 *
 * Where the original wrapped several sub-groups under one outer header
 * (e.g. registration-service's "Main settings" header wrapping both its own
 * fields and a nested, unhelped "SSL settings" group), only the first gets
 * `help`/a top-level `description` -- matching the original's own
 * granularity, not inventing help that was never there.
 */
export const configurationHeaders: Record<string, ConfigurationHeader> = {
  [configurationHeaderKey('registration-service', 'Main settings')]: {
    title: 'Main settings',
    description: 'General settings applied to the registration service',
    help: [
      {
        text: 'Agent enrollment',
        href: 'user-manual/agent/agent-enrollment/index.html',
      },
      {
        text: 'Registration service reference',
        href: 'user-manual/manager/wazuh-manager-services.html#agent-enrollment-service',
      },
    ],
  },
  [configurationHeaderKey('registration-service', 'SSL settings')]: {
    title: 'SSL settings',
    description: 'Applied when the registration service uses SSL certificates',
  },
  [configurationHeaderKey('cluster', 'Main settings')]: {
    title: 'Main settings',
    help: [
      {
        text: 'Configuring a cluster',
        href: 'installation-guide/wazuh-server/step-by-step.html#cluster-configuration-for-multi-node-deployment',
      },
      {
        text: 'Cluster reference',
        href: 'user-manual/manager/wazuh-manager-services.html#cluster-service',
      },
    ],
  },
  [configurationHeaderKey('indexer', 'Main settings')]: {
    title: 'Main settings',
    help: [
      {
        text: 'Indexer configuration',
        href: 'user-manual/manager/wazuh-indexer-connector.html',
      },
    ],
  },
  [configurationHeaderKey('indexer', 'SSL settings')]: {
    title: 'SSL settings',
  },
  [configurationHeaderKey('global-configuration', 'Global', 'logging')]: {
    title: 'Logging settings',
    description: 'Internal logging configuration for the manager',
    help: [
      {
        text: 'Logging reference',
        href: 'user-manual/manager/logging.html#configuration',
      },
    ],
  },
  [configurationHeaderKey('global-configuration', 'Global', 'agents')]: {
    title: 'Agents settings',
    description: 'Time alert agents settings',
    help: [
      {
        text: 'Agents times reference',
        href: 'user-manual/agent/agent-enrollment/agent-life-cycle.html#agent-connection-states',
      },
    ],
  },
  [configurationHeaderKey('global-configuration', 'Remote', 'https')]: {
    title: 'HTTPS settings',
    description:
      'Listener the agents use to communicate with the manager over HTTPS',
    help: REMOTE_HELP,
  },
  [configurationHeaderKey('global-configuration', 'Remote', 'legacy')]: {
    title: 'Legacy settings',
    description:
      'Listener kept for agents that still communicate over the legacy protocol',
    help: REMOTE_HELP,
  },
  [configurationHeaderKey('global-configuration', 'Remote', 'agents')]: {
    title: 'Agents settings',
    description: 'Settings applied to the agents that connect to this manager',
    help: REMOTE_HELP,
  },
  [configurationHeaderKey('global-configuration-agent', 'Main settings')]: {
    title: 'Main settings',
    // buildHelpLinks(agent) in the original always resolved to just this
    // one link regardless of the agent, so only this one is ported.
    help: [
      {
        text: 'Logging reference',
        href: 'user-manual/manager/logging.html#configuration',
      },
    ],
  },
  [configurationHeaderKey('vulnerabilities', 'Main settings')]: {
    title: 'Main settings',
    description:
      'General settings applied to the vulnerability detector and its providers',
    help: [
      {
        text: 'Vulnerability detection',
        href: 'user-manual/capabilities/vulnerability-detection/index.html',
      },
      {
        text: 'Vulnerability detector reference',
        href: 'user-manual/capabilities/vulnerability-detection/configuring-scans.html',
      },
    ],
  },
  [configurationHeaderKey('policy-monitoring', 'General')]: {
    title: 'All settings',
    description: 'General settings for the rootcheck daemon',
    help: POLICY_MONITORING_HELP,
  },
  [configurationHeaderKey('policy-monitoring', 'SCA')]: {
    title: 'Security configuration assessment status',
    help: POLICY_MONITORING_HELP,
  },
  [configurationHeaderKey('client', 'Main settings')]: {
    title: 'Main settings',
    description: 'Basic manager-agent communication settings',
    help: [
      {
        text: 'Checking connection with manager',
        href: 'user-manual/agent/agent-management/agent-connection.html#checking-connection-with-the-wazuh-manager',
      },
      {
        text: 'Client reference',
        href: 'user-manual/agent/agent-enrollment/enrollment-methods/via-agent-configuration/index.html',
      },
    ],
  },
  [configurationHeaderKey('client', 'Server settings')]: {
    title: 'Server settings',
    description: 'Manager the agent connects to',
  },
  [configurationHeaderKey('client', 'Batch settings')]: {
    title: 'Batch settings',
    description:
      'These settings determine how the agent batches the events it sends',
  },
  [configurationHeaderKey('active-response-agent', 'Active response settings')]:
    {
      title: 'Active response settings',
      description: 'Find here all the Active response settings for this agent',
      help: [
        {
          text: 'Active response documentation',
          href: 'user-manual/capabilities/active-response/index.html',
        },
        {
          text: 'Active response reference',
          href: 'user-manual/reference/ossec-conf/active-response.html',
        },
      ],
    },
  [configurationHeaderKey('inventory', 'Main settings')]: {
    title: 'Main settings',
    description: 'General settings applied to all the scans',
    help: [
      {
        text: 'System inventory',
        href: 'user-manual/capabilities/system-inventory/index.html',
      },
      {
        text: 'Syscollector module reference',
        href: 'user-manual/capabilities/system-inventory/configuration.html#wazuh-agent-configuration',
      },
    ],
  },
  [configurationHeaderKey('inventory', 'Scan settings')]: {
    title: 'Scan settings',
    description: 'Specific inventory scans to collect',
  },
  [configurationHeaderKey('integrity-monitoring', 'General')]: {
    title: 'General',
    description: 'The settings shown below are applied globally',
    help: FIM_HELP,
  },
  [configurationHeaderKey('integrity-monitoring', 'Synchronization')]: {
    // Verbatim original typo -- ported faithfully, not "fixed".
    title: 'Syncronization',
    description: 'Database synchronization settings',
    help: FIM_HELP,
  },
  [configurationHeaderKey('integrity-monitoring', 'Files limit')]: {
    title: 'Files limit',
    description: 'Limit the maximum files in the FIM database',
    help: FIM_HELP,
  },
  [configurationHeaderKey('integrity-monitoring', 'Registries limit')]: {
    title: 'Registries limit',
    description: 'Limit the maximum registries in the FIM database',
    help: FIM_HELP,
  },
  [configurationHeaderKey('integrity-monitoring', 'Who-data')]: {
    title: 'Who-data audit keys',
    description:
      'Server will include in its FIM baseline those events being monitored by Audit using audit_key.',
    help: FIM_HELP,
  },
};

/**
 * Every setting shown on the Configuration page -- manager and agent -- is
 * driven by this registry: it backs both the default grouped-by-category
 * display and the search box that filters it in place. Covers every
 * section `configuration-settings.js` links to, as `kind: 'field'`
 * (default, a fixed scalar) or `kind: 'list'` (a dynamic, runtime-defined
 * list of items, e.g. one entry per monitored directory or configured
 * command).
 *
 * Not covered, by design:
 * - `edit-configuration` (raw XML editor, an unrelated fetch/render path,
 *   reached via its own "Edit configuration" button rather than a category).
 * - Per-item search *inside* a list is not a thing -- a list's items are
 *   all shown directly and matched individually when searching, but there
 *   is no further drill-down.
 *
 * Manager-only fields (cluster, indexer, registration-service, global's
 * Remote tab) have no agent equivalent and simply won't appear on an
 * agent's Configuration page -- an intentional scope boundary, not a bug.
 */
/** The 4 `info` tooltips registration-service's `mainSettings` had. */
const REGISTRATION_SERVICE_INFO: Partial<Record<string, string>> = {
  'force.after_registration_time':
    'Agent replacement only occurs when the time elapsed since registration (in seconds) exceeds this value.',
  'force.key_mismatch':
    'Avoid re-registering agents that already have valid keys.',
  'force.disconnected_time.enabled':
    'Agent replacement only applies to agents disconnected for longer than the configured duration.',
  'force.disconnected_time.value':
    'Number of seconds an agent must be disconnected before it can be replaced.',
};

export const searchableSettingsRegistry: SearchableSettingEntry[] = [
  // --- Registration Service (manager-only, regular request) ---
  ...(
    [
      ['disabled', 'Service status', renderValueNoThenEnabled],
      ['port', 'Listen to connections at port'],
      [
        'use_source_ip',
        "Use client's source IP address",
        renderValueBooleanYesNo,
      ],
      [
        'use_password',
        'Use a password to register agents',
        renderValueBooleanYesNo,
      ],
      ['purge', 'Purge agents list on removal', renderValueBooleanYesNo],
      ['limit_maxagents', 'Limit registration to max agents'],
      [
        'force.enabled',
        'Force registration on existing IP',
        renderValueBooleanYesNo,
      ],
      ['force.after_registration_time', 'Min seconds since registration'],
      [
        'force.key_mismatch',
        'Re-register only on key mismatch',
        renderValueBooleanYesNo,
      ],
      [
        'force.disconnected_time.enabled',
        'Replace only disconnected agents',
        renderValueBooleanYesNo,
      ],
      ['force.disconnected_time.value', 'Seconds an agent is disconnected'],
    ] as const
  ).map(([field, label, render]) => ({
    id: `registration-service.${field}`,
    label,
    category: 'Registration Service',
    tab: 'Main settings',
    goto: 'registration-service',
    appliesTo: 'manager' as const,
    manager: {
      request: {
        kind: 'regular' as const,
        component: 'auth',
        configuration: 'auth',
      },
      path: `auth.${field}`,
    },
    ...(render ? { render } : {}),
    ...(REGISTRATION_SERVICE_INFO[field]
      ? { info: REGISTRATION_SERVICE_INFO[field] }
      : {}),
  })),
  ...(
    [
      [
        'ssl_verify_host',
        'Verify host when a CA certificate is specified',
        renderValueBooleanYesNo,
      ],
      ['ssl_agent_ca', 'Path to the CA certificate used to verify clients'],
      [
        'ssl_auto_negotiate',
        'Auto-select the SSL negotiation method',
        renderValueBooleanYesNo,
      ],
      ['ssl_manager_ca', 'CA certificate location'],
      ['ssl_manager_cert', 'Server SSL certificate location'],
      ['ssl_manager_key', 'Server SSL key location'],
      ['ciphers', 'Use the following SSL ciphers'],
    ] as const
  ).map(([field, label, render]) => ({
    id: `registration-service.ssl.${field}`,
    label,
    category: 'Registration Service',
    tab: 'SSL settings',
    goto: 'registration-service',
    appliesTo: 'manager' as const,
    manager: {
      request: {
        kind: 'regular' as const,
        component: 'auth',
        configuration: 'auth',
      },
      path: `auth.${field}`,
    },
    ...(render ? { render } : {}),
  })),

  // --- Cluster (manager-only, full-endpoint) ---
  ...(
    [
      ['name', 'Cluster name'],
      ['node_name', 'Node name'],
      ['node_type', 'Node type'],
      ['nodes', 'Master node IP address'],
      ['port', 'Port to listen to cluster communications'],
      ['bind_addr', 'IP address to listen to cluster communications'],
      ['hidden', 'Hide cluster information in alerts', renderValueBooleanYesNo],
    ] as const
  ).map(([field, label, render]) => ({
    id: `cluster.${field}`,
    label,
    category: 'Cluster',
    tab: 'Main settings',
    goto: 'cluster',
    appliesTo: 'manager' as const,
    manager: {
      request: { kind: 'fullEndpoint' as const, key: 'cluster' },
      path: field,
    },
    ...(render ? { render } : {}),
  })),

  // --- Indexer (manager-only, full-endpoint) ---
  {
    id: 'indexer.hosts',
    label: 'Hosts',
    category: 'Indexer',
    tab: 'Main settings',
    goto: 'indexer',
    appliesTo: 'manager',
    manager: {
      request: { kind: 'fullEndpoint', key: 'indexer' },
      path: 'hosts',
    },
  },
  {
    id: 'indexer.ssl.certificate_authorities',
    label: 'Certificate authorities',
    category: 'Indexer',
    tab: 'SSL settings',
    goto: 'indexer',
    appliesTo: 'manager',
    manager: {
      request: { kind: 'fullEndpoint', key: 'indexer' },
      path: 'ssl.certificate_authorities',
    },
    render: renderCertificateAuthorities,
  },
  {
    id: 'indexer.ssl.certificate',
    label: 'Certificate',
    category: 'Indexer',
    tab: 'SSL settings',
    goto: 'indexer',
    appliesTo: 'manager',
    manager: {
      request: { kind: 'fullEndpoint', key: 'indexer' },
      path: 'ssl.certificate',
    },
    render: renderArrayValue,
  },
  {
    id: 'indexer.ssl.key',
    label: 'Key',
    category: 'Indexer',
    tab: 'SSL settings',
    goto: 'indexer',
    appliesTo: 'manager',
    manager: {
      request: { kind: 'fullEndpoint', key: 'indexer' },
      path: 'ssl.key',
    },
    render: renderArrayValue,
  },

  // --- Global Configuration > Global tab (manager, full-endpoint) ---
  {
    id: 'global-configuration.logging.log_format',
    label: 'Log format',
    category: 'Global Configuration',
    tab: 'Global',
    group: 'logging',
    goto: 'global-configuration',
    appliesTo: 'manager',
    manager: {
      request: { kind: 'fullEndpoint', key: 'logging' },
      path: 'log_format',
    },
  },
  {
    id: 'global-configuration.global.agents_disconnection_time',
    label:
      'Time after which the manager considers an agent as disconnected since its last keepalive',
    category: 'Global Configuration',
    tab: 'Global',
    group: 'agents',
    goto: 'global-configuration',
    appliesTo: 'manager',
    manager: {
      request: { kind: 'fullEndpoint', key: 'global' },
      path: 'agents_disconnection_time',
    },
    render: renderValueOrNoValue,
  },

  // --- Global Configuration > Remote tab (manager-only, regular request) ---
  ...(
    [
      ['https.port', 'Port', renderValueOrNoValue],
      ['https.bind_addr', 'Bind address', renderValueOrNoValue],
      ['https.global_prefix', 'Global prefix', renderValueOrNoValue],
      ['https.certificate', 'Certificate', renderValueOrNoValue],
      ['https.key', 'Key', renderValueOrNoValue],
      ['legacy.enabled', 'Enabled', renderValueBooleanYesNo],
      ['legacy.port', 'Port', renderValueOrNoValue],
      ['legacy.protocol', 'Protocol', renderValueOrNoValue],
      ['legacy.ipv6', 'IPv6', renderValueBooleanYesNo],
      ['legacy.local_ip', 'Local IP address', renderValueOrNoValue],
      ['legacy.queue_size', 'Queue size', renderValueOrNoValue],
      ['legacy.rids_closing_time', 'RIDs closing time', renderValueOrNoValue],
      [
        'legacy.connection_overtake_time',
        'Connection overtake time',
        renderValueOrNoValue,
      ],
      [
        'agents.allow_higher_versions',
        'Allow higher versions',
        renderValueBooleanYesNo,
      ],
    ] as const
  ).map(([field, label, render]) => ({
    id: `global-configuration.remote.${field}`,
    label,
    category: 'Global Configuration',
    tab: 'Remote',
    // The 3 original sub-headers (HTTPS/Legacy/Agents settings) map 1:1 to
    // the field's own prefix.
    group: field.split('.')[0],
    goto: 'global-configuration',
    appliesTo: 'manager' as const,
    manager: {
      request: {
        kind: 'regular' as const,
        component: 'request',
        configuration: 'remote',
      },
      // The service normalizes `request-remote`'s `remote` (array-or-object,
      // per global-configuration-remote.js:105-107) to a plain object before
      // this path is resolved.
      path: `remote.${field}`,
    },
    render,
  })),

  // --- Global Configuration (agent tab -- a different set of fields than
  // the manager's Global tab, not a shared/dual-sourced one) ---
  {
    id: 'global-configuration-agent.execd.logging.plain',
    label: 'Write internal logs in plain text',
    category: 'Global Configuration',
    goto: 'global-configuration-agent',
    tab: 'Main settings',
    appliesTo: 'agent',
    agentPath: 'execd.logging.plain',
    render: renderValueBooleanYesNo,
  },
  {
    id: 'global-configuration-agent.execd.logging.json',
    label: 'Write internal logs in JSON format',
    category: 'Global Configuration',
    goto: 'global-configuration-agent',
    tab: 'Main settings',
    appliesTo: 'agent',
    agentPath: 'execd.logging.json',
    render: renderValueBooleanYesNo,
  },

  // --- Vulnerabilities (manager-only, wodle inside a shared regular request) ---
  {
    id: 'vulnerabilities.enabled',
    label: 'Enables the vulnerability detection module',
    category: 'Vulnerabilities',
    goto: 'vulnerabilities',
    tab: 'Main settings',
    appliesTo: 'manager',
    manager: {
      request: {
        kind: 'regular',
        component: 'wmodules',
        configuration: 'wmodules',
      },
      path: 'enabled',
      unwrap: wodleUnwrap('vulnerability-detection'),
    },
    render: renderValueYesThenEnabled,
  },
  {
    id: 'vulnerabilities.feed-update-interval',
    label: 'Time interval for periodic feed updates',
    category: 'Vulnerabilities',
    goto: 'vulnerabilities',
    tab: 'Main settings',
    appliesTo: 'manager',
    manager: {
      request: {
        kind: 'regular',
        component: 'wmodules',
        configuration: 'wmodules',
      },
      path: 'feed-update-interval',
      unwrap: wodleUnwrap('vulnerability-detection'),
    },
  },

  // --- Policy monitoring > General tab (agent-only, fixed fields) ---
  ...(
    [
      [
        'disabled',
        'Policy monitoring service status',
        renderValueNoThenEnabled,
      ],
      ['base_directory', 'Base directory'],
      ['scanall', 'Scan the entire system'],
      ['frequency', 'Frequency (in seconds) to run the scan'],
      ['check_dev', 'Check /dev path'],
      ['check_if', 'Check network interfaces'],
      ['check_pids', 'Check processes IDs'],
      ['check_ports', 'Check network ports'],
      ['check_sys', 'Check anomalous system objects'],
      ['skip_nfs', 'Skip scan on CIFS/NFS mounts'],
    ] as const
  ).map(([field, label, render]) => ({
    id: `policy-monitoring.${field}`,
    label,
    category: 'Policy monitoring',
    tab: 'General',
    goto: 'policy-monitoring',
    appliesTo: 'agent' as const,
    agentPath: `fim.rootcheck.${field}`,
    ...(render ? { render } : {}),
  })),
  {
    kind: 'list',
    id: 'policy-monitoring.ignore',
    category: 'Policy monitoring',
    tab: 'Ignored',
    goto: 'policy-monitoring',
    appliesTo: 'agent',
    title: 'Ignored paths',
    description:
      'These files and directories are ignored from the rootcheck scan',
    help: POLICY_MONITORING_HELP,
    // A block declared once is reported as a bare value rather than a
    // one-element list, so both shapes must resolve to an array here.
    agentExtract: content => {
      const value = get(content, 'fim.rootcheck.ignore');
      return Array.isArray(value) ? value : value ? [value] : [];
    },
    itemLabel: item => String(item),
    itemFields: [{ field: '', label: 'Path' }],
  },
  {
    kind: 'list',
    id: 'policy-monitoring.ignore-sregex',
    category: 'Policy monitoring',
    tab: 'Ignored',
    goto: 'policy-monitoring',
    appliesTo: 'agent',
    title: 'Ignored path patterns',
    help: POLICY_MONITORING_HELP,
    agentExtract: content => {
      const value = get(content, 'fim.rootcheck.ignore_sregex');
      return Array.isArray(value) ? value : value ? [value] : [];
    },
    itemLabel: item => String(item),
    itemFields: [{ field: '', label: 'Sregex' }],
  },

  // --- Policy monitoring > SCA tab (agent-only, wodle) ---
  ...(
    [
      [
        'enabled',
        'Security configuration assessment status',
        renderValueYesThenEnabled,
      ],
      ['interval', 'Interval'],
      ['scan_on_start', 'Scan on start'],
      ['skip_nfs', 'Skip nfs'],
    ] as const
  ).map(([field, label, render]) => ({
    id: `policy-monitoring.sca.${field}`,
    label,
    category: 'Policy monitoring',
    tab: 'SCA',
    goto: 'policy-monitoring',
    appliesTo: 'agent' as const,
    agentPath: `sca.${field}`,
    ...(render ? { render } : {}),
  })),
  {
    kind: 'list',
    id: 'policy-monitoring.sca.policies',
    category: 'Policy monitoring',
    tab: 'SCA',
    goto: 'policy-monitoring',
    appliesTo: 'agent',
    title: 'Policies',
    // A policy is reported as `{ policy: <path> }`, a bare path string, or
    // (if none are enabled) absent entirely -- see policy-monitoring-sca.js's
    // buildPolicyItems.
    agentExtract: content => {
      const policies = get(content, 'sca.policies');
      const reported = Array.isArray(policies)
        ? policies
        : policies
        ? [policies]
        : [];
      return reported.map(entry =>
        typeof entry === 'string' ? { policy: entry } : entry,
      );
    },
    itemLabel: item => (item as { policy?: string })?.policy ?? '',
    itemFields: [{ field: 'policy', label: 'Name' }],
  },

  // --- Communication / client (agent-only) ---
  ...(
    [
      ['remote_conf', 'Remote configuration is enabled'],
      [
        'auto_restart',
        'Auto-restart the agent when receiving valid configuration from manager',
      ],
      [
        'notify_time',
        'Time (in seconds) between agent checkings to the manager',
      ],
      ['time-reconnect', 'Time (in seconds) before attempting to reconnect'],
      ['config-profile', 'Configuration profiles'],
    ] as const
  ).map(([field, label]) => ({
    id: `client.${field}`,
    label,
    category: 'Communication',
    tab: 'Main settings',
    goto: 'client',
    appliesTo: 'agent' as const,
    agentPath: `agent.agent.${field}`,
  })),
  {
    id: 'client.endpoint',
    label: 'Endpoint',
    category: 'Communication',
    tab: 'Server settings',
    goto: 'client',
    appliesTo: 'agent',
    // `manager` arrives as a single object or a one-element array (5.0.0
    // allows only one <manager> block) -- see client.js's readManager.
    agentExtract: content => {
      const agentBlock = content?.agent as
        | { agent?: { manager?: unknown } }
        | undefined;
      const clientConfig = agentBlock?.agent as
        | { manager?: unknown }
        | undefined;
      const manager = (
        Array.isArray(clientConfig?.manager)
          ? clientConfig?.manager[0]
          : clientConfig?.manager
      ) as { endpoint?: unknown } | undefined;
      return manager?.endpoint;
    },
    render: renderValueOrNoValue,
  },
  ...(
    [
      ['size', 'Maximum size of a batch'],
      ['interval', 'Maximum time to wait before sending a batch'],
    ] as const
  ).map(([field, label]) => ({
    id: `client.batch.${field}`,
    label,
    category: 'Communication',
    tab: 'Batch settings',
    goto: 'client',
    appliesTo: 'agent' as const,
    agentPath: `agent.agent.batch.${field}`,
    render: renderValueOrNoValue,
  })),

  // --- Active response (agent-only; no configuration-settings.js row today) ---
  ...(
    [
      ['disabled', 'Active response status', renderValueNoThenEnabled],
      [
        'repeated_offenders',
        'List of timeouts (in minutes) for repeated offenders',
      ],
      ['ca_store', 'Use the following list of root CA certificates'],
      ['ca_verification', 'Validate WPKs using root CA certificate'],
    ] as const
  ).map(([field, label, render]) => ({
    id: `active-response-agent.${field}`,
    label,
    category: 'Active response',
    tab: 'Active response settings',
    goto: 'active-response-agent',
    appliesTo: 'agent' as const,
    agentPath: `execd.active-response.${field}`,
    ...(render ? { render } : {}),
  })),

  // --- Inventory data (agent-only) ---
  ...(
    [
      ['disabled', 'Syscollector integration status', renderValueNoThenEnabled],
      ['interval', 'Interval between system scans'],
      ['scan-on-start', 'Scan on start'],
    ] as const
  ).map(([field, label, render]) => ({
    id: `inventory.${field}`,
    label,
    category: 'Inventory data',
    tab: 'Main settings',
    goto: 'inventory',
    appliesTo: 'agent' as const,
    agentPath: `syscollector.${field}`,
    ...(render ? { render } : {}),
  })),
  ...(
    [
      ['hardware', 'Scan hardware info'],
      ['processes', 'Scan current processes'],
      ['os', 'Scan operating system info'],
      ['packages', 'Scan installed packages'],
      ['network', 'Scan network interfaces'],
      ['ports', 'Scan listening network ports'],
      ['ports_all', 'Scan all network ports'],
      ['groups', 'Scan groups'],
      ['users', 'Scan users'],
      ['services', 'Scan services'],
      ['browser_extensions', 'Scan browser extensions'],
      ['sync_max_eps', 'Maximum event reporting throughput'],
    ] as const
  ).map(([field, label]) => ({
    id: `inventory.scan.${field}`,
    label,
    category: 'Inventory data',
    tab: 'Scan settings',
    goto: 'inventory',
    appliesTo: 'agent' as const,
    agentPath: `syscollector.${field}`,
  })),

  // --- Integrity monitoring: fixed-field tabs (agent-only) ---
  ...(
    [
      ['disabled', 'Integrity monitoring status', renderValueNoThenEnabled],
      ['frequency', 'Interval (in seconds) to run the integrity scan'],
      ['scan_time', 'Time of day to run integrity scans', renderValueOrNoValue],
      [
        'scan_day',
        'Day of the week to run integrity scans',
        renderValueOrNoValue,
      ],
      ['scan_on_start', 'Scan on start'],
      ['skip_nfs', 'Skip scan on CIFS/NFS mounts'],
      ['skip_dev', 'Skip scan of /dev directory'],
      ['skip_sys', 'Skip scan of /sys directory'],
      ['skip_proc', 'Skip scan of /proc directory'],
      ['remove_old_diff', 'Remove old local snapshots', renderValueOrYes],
      ['restart_audit', 'Restart the Audit daemon'],
      [
        'windows_audit_interval',
        "Interval (in seconds) to check directories' SACLs",
        renderValueOrDefault('300'),
      ],
      ['prefilter_cmd', 'Command to prevent prelinking', renderValueOrNoValue],
      ['max_eps', 'Maximum event reporting throughput'],
      ['process_priority', 'Process priority'],
      ['database', 'Database type'],
      // `auto_ignore`/`alert_new_files` are manager-only (`when: 'manager'`
      // in integrity-monitoring-general.js) and deliberately omitted here.
    ] as const
  ).map(([field, label, render]) => ({
    id: `integrity-monitoring.general.${field}`,
    label,
    category: 'Integrity monitoring',
    tab: 'General',
    goto: 'integrity-monitoring',
    appliesTo: 'agent' as const,
    agentPath: `fim.syscheck.${field}`,
    ...(render ? { render } : {}),
  })),
  ...(
    [
      ['enabled', 'Synchronization status', renderValueYesThenEnabled],
      ['max_interval', 'Maximum interval (in seconds) between every sync'],
      ['interval', 'Interval (in seconds) between every sync'],
      ['response_timeout', 'Response timeout (in seconds)'],
      ['queue_size', 'Queue size of the manager responses'],
      ['max_eps', 'Maximum message throughput'],
      ['thread_pool', 'Number of threads'],
    ] as const
  ).map(([field, label, render]) => ({
    id: `integrity-monitoring.synchronization.${field}`,
    label,
    category: 'Integrity monitoring',
    tab: 'Synchronization',
    goto: 'integrity-monitoring',
    appliesTo: 'agent' as const,
    agentPath: `fim.syscheck.synchronization.${field}`,
    ...(render ? { render } : {}),
  })),
  {
    id: 'integrity-monitoring.file-limit.enabled',
    label: 'File limit status',
    category: 'Integrity monitoring',
    tab: 'Files limit',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    agentPath: 'fim.syscheck.file_limit.enabled',
    render: renderValueYesThenEnabled,
  },
  {
    id: 'integrity-monitoring.file-limit.entries',
    label: 'Maximum number of files to monitor',
    category: 'Integrity monitoring',
    tab: 'Files limit',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    agentPath: 'fim.syscheck.file_limit.entries',
  },
  {
    id: 'integrity-monitoring.registry-limit.enabled',
    label: 'Registry limit status',
    category: 'Integrity monitoring',
    tab: 'Registries limit',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    platform: 'windows',
    agentPath: 'fim.syscheck.registry_limit.enabled',
    render: renderValueYesThenEnabled,
  },
  {
    id: 'integrity-monitoring.registry-limit.entries',
    label: 'Maximum number of registries values to monitor',
    category: 'Integrity monitoring',
    tab: 'Registries limit',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    platform: 'windows',
    agentPath: 'fim.syscheck.registry_limit.entries',
  },
  ...(
    [
      ['restart_audit', 'Restart audit'],
      ['startup_healthcheck', 'Startup healthcheck'],
      ['provider', 'Provider'],
      ['queue_size', 'Queue size'],
    ] as const
  ).map(([field, label]) => ({
    id: `integrity-monitoring.who-data.${field}`,
    label,
    category: 'Integrity monitoring',
    tab: 'Who-data',
    goto: 'integrity-monitoring',
    appliesTo: 'agent' as const,
    platform: 'not-windows' as const,
    agentPath: `fim.syscheck.whodata.${field}`,
  })),
  {
    kind: 'list',
    id: 'integrity-monitoring.nodiff',
    category: 'Integrity monitoring',
    tab: 'No diff',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    title: 'No diff directories',
    description: "These files won't have their diff calculated",
    help: FIM_HELP,
    agentPath: 'fim.syscheck.nodiff',
    itemLabel: item => String(item),
    itemFields: [{ field: '', label: 'Path' }],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.ignore',
    category: 'Integrity monitoring',
    tab: 'Ignored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    title: 'Ignored paths',
    description:
      'These files and directories are ignored from the integrity scan',
    help: FIM_HELP,
    agentPath: 'fim.syscheck.ignore',
    itemLabel: item => String(item),
    itemFields: [{ field: '', label: 'Path' }],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.ignore-sregex',
    category: 'Integrity monitoring',
    tab: 'Ignored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    title: 'Ignored path patterns',
    help: FIM_HELP,
    agentPath: 'fim.syscheck.ignore_sregex',
    itemLabel: item => String(item),
    itemFields: [{ field: '', label: 'Sregex' }],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.registry-ignore',
    category: 'Integrity monitoring',
    tab: 'Ignored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    platform: 'windows',
    title: 'Ignored registry entries',
    description:
      'A list of registry entries that will be ignored (Windows only)',
    help: FIM_HELP,
    agentPath: 'fim.syscheck.registry_ignore',
    itemLabel: item => (item as { entry?: string })?.entry ?? '',
    itemFields: [
      { field: 'entry', label: 'Entry' },
      { field: 'arch', label: 'Arch' },
    ],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.registry-ignore-sregex',
    category: 'Integrity monitoring',
    tab: 'Ignored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    platform: 'windows',
    title: 'Ignored registry entry patterns',
    description:
      'A list of registry entry patterns that will be ignored (Windows only)',
    help: FIM_HELP,
    agentPath: 'fim.syscheck.registry_ignore_sregex',
    itemLabel: item => (item as { entry?: string })?.entry ?? '',
    itemFields: [
      { field: 'entry', label: 'Entry Sregex' },
      { field: 'arch', label: 'Arch' },
    ],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.who-data.audit_key',
    category: 'Integrity monitoring',
    tab: 'Who-data',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    platform: 'not-windows',
    title: 'Who-data audit keys',
    description:
      'Server will include in its FIM baseline those events being monitored by Audit using audit_key.',
    help: FIM_HELP,
    agentPath: 'fim.syscheck.whodata.audit_key',
    itemLabel: item => String(item),
    itemFields: [{ field: '', label: 'Key' }],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.directories',
    category: 'Integrity monitoring',
    tab: 'Monitored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    title: 'Monitored directories',
    description: 'These directories are included on the integrity scan',
    help: FIM_HELP,
    agentPath: 'fim.syscheck.directories',
    itemLabel: item => (item as { dir?: string })?.dir ?? '',
    itemFields: [
      { field: 'dir', label: 'Selected item' },
      {
        field: 'opts',
        label: 'Enable realtime monitoring',
        render: renderOptsIncludes('realtime'),
      },
      {
        field: 'opts',
        label: 'Enable auditing (who-data)',
        render: renderOptsIncludes('check_whodata'),
      },
      {
        field: 'opts',
        label: 'Report file changes',
        render: renderOptsIncludes('report_changes'),
      },
      {
        field: 'opts',
        label: 'Perform all checksums',
        render: renderOptsIncludes('check_all'),
      },
      {
        field: 'opts',
        label: 'Check sums (MD5 & SHA1)',
        render: renderOptsIncludes('check_sum'),
      },
      {
        field: 'opts',
        label: 'Check MD5 sum',
        render: renderOptsIncludes('check_md5sum'),
      },
      {
        field: 'opts',
        label: 'Check SHA1 sum',
        render: renderOptsIncludes('check_sha1sum'),
      },
      {
        field: 'opts',
        label: 'Check SHA256 sum',
        render: renderOptsIncludes('check_sha256sum'),
      },
      {
        field: 'opts',
        label: 'Check files size',
        render: renderOptsIncludes('check_size'),
      },
      {
        field: 'opts',
        label: 'Check files owner',
        render: renderOptsIncludes('check_owner'),
      },
      {
        field: 'opts',
        label: 'Check files groups',
        render: renderOptsIncludes('check_group'),
      },
      {
        field: 'opts',
        label: 'Check files permissions',
        render: renderOptsIncludes('check_perm'),
      },
      {
        field: 'opts',
        label: 'Check files modification time',
        render: renderOptsIncludes('check_mtime'),
      },
      {
        field: 'opts',
        label: 'Check files inodes',
        render: renderOptsIncludes('check_inode'),
      },
      { field: 'restrict', label: 'Restrict to files containing this string' },
      { field: 'tags', label: 'Custom tags for alerts' },
      { field: 'recursion_level', label: 'Recursion level' },
      {
        field: 'opts',
        label: 'Follow symbolic link',
        render: renderOptsIncludes('follow_symbolic_link'),
      },
    ],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.registry',
    category: 'Integrity monitoring',
    tab: 'Monitored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    platform: 'windows',
    title: 'Monitored registry entries',
    description:
      'A list of registry entries that will be monitored (Windows only)',
    help: FIM_HELP,
    agentPath: 'fim.syscheck.registry',
    itemLabel: item => (item as { entry?: string })?.entry ?? '',
    itemFields: [
      { field: 'entry', label: 'Entry' },
      { field: 'arch', label: 'Arch' },
    ],
  },

  // --- Commands (agent-only) ---
  {
    kind: 'list',
    id: 'commands.command',
    category: 'Commands',
    goto: 'commands',
    appliesTo: 'agent',
    title: 'Command definitions',
    description: 'Find here all the currently defined commands',
    help: [
      {
        text: 'Command module reference',
        href: 'user-manual/capabilities/command-monitoring/configuration.html',
      },
    ],
    agentExtract: content => {
      const reported = get(content, 'command');
      if (!reported || typeof reported === 'string') {
        return [];
      }
      return Array.isArray(reported) ? reported : [reported];
    },
    itemLabel: item => {
      const command = item as { tag?: string; command?: string };
      return command.tag || command.command || '';
    },
    itemFields: [
      // NOTE: commands.js's own `disabled` entry is missing its `render:`
      // key too (`renderValueNoThenEnabled` is never actually wired) --
      // ported faithfully rather than "fixed" as a side effect of this change.
      { field: 'disabled', label: 'Command status' },
      { field: 'tag', label: 'Command name' },
      { field: 'command', label: 'Command to execute' },
      { field: 'interval', label: 'Interval between executions' },
      { field: 'run_on_start', label: 'Run on start' },
      { field: 'ignore_output', label: 'Ignore command output' },
      { field: 'timeout', label: 'Timeout (in seconds) to wait for execution' },
      { field: 'verify_md5', label: 'Verify MD5 sum' },
      { field: 'verify_sha1', label: 'Verify SHA1 sum' },
      { field: 'verify_sha256', label: 'Verify SHA256 sum' },
      { field: 'skip_verification', label: 'Ignore checksum verification' },
    ],
  },

  // --- Log collection (agent-only; each tab is a bucket of the same
  // shared `logcollector.localfile` field, split by `logformat`) ---
  {
    kind: 'list',
    id: 'log-collection.logs',
    category: 'Log collection',
    tab: 'Logs',
    goto: 'log-collection',
    appliesTo: 'agent',
    title: 'Logs files',
    description: 'List of log files that will be analyzed',
    help: LOG_COLLECTION_HELP,
    agentExtract: localfileBucket(item => typeof item.file !== 'undefined'),
    itemLabel: item => {
      const localfile = item as {
        file?: string;
        alias?: string;
        logformat?: string;
        target?: string[];
      };
      return (
        localfile.file ||
        localfile.alias ||
        `${localfile.logformat}${
          localfile.target ? ` - ${localfile.target.join(', ')}` : ''
        }`
      );
    },
    itemFields: [
      { field: 'logformat', label: 'Log format' },
      { field: 'file', label: 'Log location', render: renderValueOrNoValue },
      {
        field: 'only-future-events',
        label: 'Only receive logs occured after start',
      },
      {
        field: 'reconnect_time',
        label:
          'Time in seconds to try to reconnect with Windows Event Channel when it has fallen',
      },
      {
        field: 'query',
        label: 'Filter logs using this XPATH query',
        render: renderValueOrNoValue,
      },
      // NOTE: log-collection-logs.js labels this the same as
      // `only-future-events` -- ported faithfully.
      {
        field: 'labels',
        label: 'Only receive logs occured after start',
        render: renderValueOrNoValue,
      },
      {
        field: 'target',
        label: 'Redirect output to this socket',
        render: renderLogCollectionTarget,
      },
      {
        field: 'ignore',
        label: 'If the expression matches, the log will be ignored',
        render: renderArrayObjectField,
      },
      {
        field: 'restrict',
        label: 'The log will only be processed if the expression matches',
        render: renderArrayObjectField,
      },
    ],
  },
  {
    kind: 'list',
    id: 'log-collection.windows-events',
    category: 'Log collection',
    tab: 'Windows Events',
    goto: 'log-collection',
    appliesTo: 'agent',
    platform: 'windows',
    title: 'Windows events logs',
    description: 'List of Windows logs that will be processed',
    help: LOG_COLLECTION_HELP,
    agentExtract: localfileBucket(
      item =>
        item.logformat === 'eventchannel' || item.logformat === 'eventlog',
    ),
    itemLabel: item => {
      const localfile = item as {
        channel?: string;
        logformat?: string;
        target?: string[];
      };
      return !localfile.channel
        ? `${localfile.logformat} - ${renderLogCollectionTarget(
            localfile.target,
          )}`
        : `${localfile.channel} (${localfile.logformat})`;
    },
    itemFields: [
      { field: 'logformat', label: 'Log format' },
      { field: 'channel', label: 'Channel', render: renderValueOrNoValue },
      { field: 'query', label: 'Query', render: renderQueryValue },
      {
        field: 'only-future-events',
        label: 'Only future events',
        render: renderValueOrNoValue,
      },
      {
        field: 'reconnect_time',
        label: 'Reconnect Time',
        render: renderValueOrNoValue,
      },
    ],
  },
  {
    kind: 'list',
    id: 'log-collection.macos-events',
    category: 'Log collection',
    tab: 'macOS Events',
    goto: 'log-collection',
    appliesTo: 'agent',
    title: 'macOS events logs',
    description: 'List of macOS logs that will be processed',
    help: LOG_COLLECTION_HELP,
    agentExtract: localfileBucket(item => item.logformat === 'macos'),
    itemLabel: item => {
      const localfile = item as { logformat?: string; target?: string[] };
      return `${localfile.logformat} - ${renderLogCollectionTarget(
        localfile.target,
      )}`;
    },
    itemFields: [
      { field: 'logformat', label: 'Log format' },
      { field: 'query', label: 'Query value', render: renderQueryValue },
      {
        field: 'query.level',
        label: 'Query level',
        render: renderValueOrNoValue,
      },
      {
        field: 'query.type',
        label: 'Query type',
        render: renderValueOrNoValue,
      },
      {
        field: 'ignore_binaries',
        label: 'Ignore binaries',
        render: renderValueOrNoValue,
      },
      {
        field: 'only-future-events',
        label: 'Only future events',
        render: renderValueOrNoValue,
      },
    ],
  },
  {
    kind: 'list',
    id: 'log-collection.journald',
    category: 'Log collection',
    tab: 'Journald',
    goto: 'log-collection',
    appliesTo: 'agent',
    title: 'Journald events logs',
    description: 'List of journald logs that will be processed',
    help: LOG_COLLECTION_HELP,
    agentExtract: localfileBucket(item => item.logformat === 'journald'),
    itemLabel: item => {
      const localfile = item as { logformat?: string; target?: string[] };
      return `${localfile.logformat} - ${renderLogCollectionTarget(
        localfile.target,
      )}`;
    },
    itemFields: [
      { field: 'logformat', label: 'Log format' },
      {
        field: 'only-future-events',
        label: 'Only future events',
        render: renderValueOrNoValue,
      },
      {
        field: 'filters_disabled',
        label: 'Filters Disabled',
        render: renderValueOrDefault('true'),
      },
      {
        field: 'filters',
        label: 'Filters',
        render: renderFilters,
        info: 'The configuration filters within the same group are processed with an AND logic operator. Whereas the different filter groups are processed with an OR like logic operator.',
      },
    ],
  },
  {
    kind: 'list',
    id: 'log-collection.commands',
    category: 'Log collection',
    tab: 'Commands',
    goto: 'log-collection',
    appliesTo: 'agent',
    title: 'Command monitoring',
    description:
      'All output from these commands will be read as one or more log messages depending on whether command or full_command is used',
    help: LOG_COLLECTION_HELP,
    agentExtract: localfileBucket(
      item => item.logformat === 'command' || item.logformat === 'full_command',
    ),
    itemLabel: item => {
      const localfile = item as {
        file?: string;
        alias?: string;
        logformat?: string;
        target?: string[];
      };
      return (
        localfile.file ||
        localfile.alias ||
        `${localfile.logformat}${
          localfile.target ? ` - ${localfile.target.join(', ')}` : ''
        }`
      );
    },
    itemFields: [
      { field: 'logformat', label: 'Log format' },
      {
        field: 'command',
        label: 'Run this command',
        render: renderValueOrNoValue,
      },
      { field: 'alias', label: 'Command alias', render: renderValueOrNoValue },
      {
        field: 'frequency',
        label: 'Interval between command executions',
        render: renderValueOrNoValue,
      },
      {
        field: 'target',
        label: 'Redirect output to this socket',
        render: renderLogCollectionTarget,
      },
    ],
  },
  {
    kind: 'list',
    id: 'log-collection.sockets',
    category: 'Log collection',
    tab: 'Sockets',
    goto: 'log-collection',
    appliesTo: 'agent',
    title: 'Output sockets',
    description: 'Define custom outputs to send log data',
    help: [
      {
        text: 'Using multiple outputs',
        href: 'user-manual/capabilities/log-data-collection/monitoring-log-files.html',
      },
      {
        text: 'Socket reference',
        href: 'user-manual/reference/ossec-conf/socket.html',
      },
    ],
    agentExtract: content => {
      const target = get(content, 'logcollector.target');
      if (Array.isArray(target)) {
        return target;
      }
      const socket = get(content, 'logcollector.socket');
      return Array.isArray(socket) ? socket : [];
    },
    itemLabel: item => (item as { name?: string })?.name ?? '',
    itemFields: [
      { field: 'name', label: 'Socket name', render: renderValueOrNoValue },
      {
        field: 'location',
        label: 'Socket location',
        render: renderValueOrNoValue,
      },
      {
        field: 'mode',
        label: 'UNIX socket protocol',
        render: renderValueOrDefault('udp'),
      },
      {
        field: 'prefix',
        label: 'Prefix to place before the message',
        render: renderValueOrNoValue,
      },
    ],
  },
];
