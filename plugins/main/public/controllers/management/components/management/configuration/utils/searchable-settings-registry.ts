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
import { i18n } from '@osd/i18n';

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
        f.ignore_if_missing
          ? i18n.translate(
              'wazuh.configuration.settingsRegistry.logCollectionJournaldFilterIgnoreIfMissing',
              {
                defaultMessage: '{field}: {expression} (ignore if missing)',
                values: {
                  field: String(f.field),
                  expression: String(f.expression),
                },
              },
            )
          : `${f.field}: ${f.expression}`,
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
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.remoteDaemonReference',
      {
        defaultMessage: 'Remote daemon reference',
      },
    ),
    href: 'user-manual/manager/reference.html#daemons',
  },
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.remoteConfigurationReference',
      {
        defaultMessage: 'Remote configuration reference',
      },
    ),
    href: 'user-manual/manager/wazuh-manager-services.html#agent-connection-service',
  },
];

const POLICY_MONITORING_HELP: HelpLink[] = [
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.malwareDetection',
      {
        defaultMessage: 'Malware detection',
      },
    ),
    href: 'user-manual/capabilities/malware-detection/index.html',
  },
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.securityConfigurationAssessment',
      {
        defaultMessage: 'Security Configuration Assessment',
      },
    ),
    href: 'user-manual/capabilities/sec-config-assessment/how-to-configure.html',
  },
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.rootcheckReference',
      {
        defaultMessage: 'Rootcheck reference',
      },
    ),
    href: 'user-manual/reference/ossec-conf/rootcheck.html',
  },
];

const FIM_HELP: HelpLink[] = [
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.integrityMonitoringDocumentation',
      {
        defaultMessage: 'Integrity monitoring documentation',
      },
    ),
    href: 'user-manual/capabilities/file-integrity/index.html',
  },
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.syscheckReference',
      {
        defaultMessage: 'Syscheck reference',
      },
    ),
    href: 'user-manual/capabilities/file-integrity/how-to-configure-fim.html',
  },
];

const LOG_COLLECTION_HELP: HelpLink[] = [
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.logDataCollectionDocumentation',
      {
        defaultMessage: 'Log data collection documentation',
      },
    ),
    href: 'user-manual/capabilities/log-data-collection/index.html',
  },
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.commandMonitoring',
      {
        defaultMessage: 'Command monitoring',
      },
    ),
    href: 'user-manual/capabilities/command-monitoring/index.html',
  },
  {
    text: i18n.translate(
      'wazuh.configuration.settingsHelpLinks.localfileReference',
      {
        defaultMessage: 'Localfile reference',
      },
    ),
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
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.registrationServiceMainSettingsTitle',
      {
        defaultMessage: 'Main settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.registrationServiceMainSettingsDescription',
      {
        defaultMessage: 'General settings applied to the registration service',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.agentEnrollment',
          {
            defaultMessage: 'Agent enrollment',
          },
        ),
        href: 'user-manual/agent/agent-enrollment/index.html',
      },
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.registrationServiceReference',
          {
            defaultMessage: 'Registration service reference',
          },
        ),
        href: 'user-manual/manager/wazuh-manager-services.html#agent-enrollment-service',
      },
    ],
  },
  [configurationHeaderKey('registration-service', 'SSL settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.registrationServiceSslSettingsTitle',
      {
        defaultMessage: 'SSL settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.registrationServiceSslSettingsDescription',
      {
        defaultMessage:
          'Applied when the registration service uses SSL certificates',
      },
    ),
  },
  [configurationHeaderKey('cluster', 'Main settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.clusterMainSettingsTitle',
      {
        defaultMessage: 'Main settings',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.configuringACluster',
          {
            defaultMessage: 'Configuring a cluster',
          },
        ),
        href: 'installation-guide/wazuh-server/step-by-step.html#cluster-configuration-for-multi-node-deployment',
      },
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.clusterReference',
          {
            defaultMessage: 'Cluster reference',
          },
        ),
        href: 'user-manual/manager/wazuh-manager-services.html#cluster-service',
      },
    ],
  },
  [configurationHeaderKey('indexer', 'Main settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.indexerMainSettingsTitle',
      {
        defaultMessage: 'Main settings',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.indexerConfiguration',
          {
            defaultMessage: 'Indexer configuration',
          },
        ),
        href: 'user-manual/manager/wazuh-indexer-connector.html',
      },
    ],
  },
  [configurationHeaderKey('indexer', 'SSL settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.indexerSslSettingsTitle',
      {
        defaultMessage: 'SSL settings',
      },
    ),
  },
  [configurationHeaderKey('global-configuration', 'Global', 'logging')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationGlobalLoggingTitle',
      {
        defaultMessage: 'Logging settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationGlobalLoggingDescription',
      {
        defaultMessage: 'Internal logging configuration for the manager',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.loggingReference',
          {
            defaultMessage: 'Logging reference',
          },
        ),
        href: 'user-manual/manager/logging.html#configuration',
      },
    ],
  },
  [configurationHeaderKey('global-configuration', 'Global', 'agents')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationGlobalAgentsTitle',
      {
        defaultMessage: 'Agents settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationGlobalAgentsDescription',
      {
        defaultMessage: 'Time alert agents settings',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.agentsTimesReference',
          {
            defaultMessage: 'Agents times reference',
          },
        ),
        href: 'user-manual/agent/agent-enrollment/agent-life-cycle.html#agent-connection-states',
      },
    ],
  },
  [configurationHeaderKey('global-configuration', 'Remote', 'https')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationRemoteHttpsTitle',
      {
        defaultMessage: 'HTTPS settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationRemoteHttpsDescription',
      {
        defaultMessage:
          'Listener the agents use to communicate with the manager over HTTPS',
      },
    ),
    help: REMOTE_HELP,
  },
  [configurationHeaderKey('global-configuration', 'Remote', 'legacy')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationRemoteLegacyTitle',
      {
        defaultMessage: 'Legacy settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationRemoteLegacyDescription',
      {
        defaultMessage:
          'Listener kept for agents that still communicate over the legacy protocol',
      },
    ),
    help: REMOTE_HELP,
  },
  [configurationHeaderKey('global-configuration', 'Remote', 'agents')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationRemoteAgentsTitle',
      {
        defaultMessage: 'Agents settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationRemoteAgentsDescription',
      {
        defaultMessage:
          'Settings applied to the agents that connect to this manager',
      },
    ),
    help: REMOTE_HELP,
  },
  [configurationHeaderKey('global-configuration-agent', 'Main settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.globalConfigurationAgentMainSettingsTitle',
      {
        defaultMessage: 'Main settings',
      },
    ),
    // buildHelpLinks(agent) in the original always resolved to just this
    // one link regardless of the agent, so only this one is ported.
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.loggingReference',
          {
            defaultMessage: 'Logging reference',
          },
        ),
        href: 'user-manual/manager/logging.html#configuration',
      },
    ],
  },
  [configurationHeaderKey('vulnerabilities', 'Main settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.vulnerabilitiesMainSettingsTitle',
      {
        defaultMessage: 'Main settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.vulnerabilitiesMainSettingsDescription',
      {
        defaultMessage:
          'General settings applied to the vulnerability detector and its providers',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.vulnerabilityDetection',
          {
            defaultMessage: 'Vulnerability detection',
          },
        ),
        href: 'user-manual/capabilities/vulnerability-detection/index.html',
      },
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.vulnerabilityDetectorReference',
          {
            defaultMessage: 'Vulnerability detector reference',
          },
        ),
        href: 'user-manual/capabilities/vulnerability-detection/configuring-scans.html',
      },
    ],
  },
  [configurationHeaderKey('policy-monitoring', 'General')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.policyMonitoringGeneralTitle',
      {
        defaultMessage: 'All settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.policyMonitoringGeneralDescription',
      {
        defaultMessage: 'General settings for the rootcheck daemon',
      },
    ),
    help: POLICY_MONITORING_HELP,
  },
  [configurationHeaderKey('policy-monitoring', 'SCA')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.policyMonitoringScaTitle',
      {
        defaultMessage: 'Security configuration assessment status',
      },
    ),
    help: POLICY_MONITORING_HELP,
  },
  [configurationHeaderKey('client', 'Main settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.clientMainSettingsTitle',
      {
        defaultMessage: 'Main settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.clientMainSettingsDescription',
      {
        defaultMessage: 'Basic manager-agent communication settings',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.checkingConnectionWithManager',
          {
            defaultMessage: 'Checking connection with manager',
          },
        ),
        href: 'user-manual/agent/agent-management/agent-connection.html#checking-connection-with-the-wazuh-manager',
      },
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.clientReference',
          {
            defaultMessage: 'Client reference',
          },
        ),
        href: 'user-manual/agent/agent-enrollment/enrollment-methods/via-agent-configuration/index.html',
      },
    ],
  },
  [configurationHeaderKey('client', 'Server settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.clientServerSettingsTitle',
      {
        defaultMessage: 'Server settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.clientServerSettingsDescription',
      {
        defaultMessage: 'Manager the agent connects to',
      },
    ),
  },
  [configurationHeaderKey('client', 'Batch settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.clientBatchSettingsTitle',
      {
        defaultMessage: 'Batch settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.clientBatchSettingsDescription',
      {
        defaultMessage:
          'These settings determine how the agent batches the events it sends',
      },
    ),
  },
  [configurationHeaderKey('active-response-agent', 'Active response settings')]:
    {
      title: i18n.translate(
        'wazuh.configuration.settingsHeaders.activeResponseAgentActiveResponseSettingsTitle',
        {
          defaultMessage: 'Active response settings',
        },
      ),
      description: i18n.translate(
        'wazuh.configuration.settingsHeaders.activeResponseAgentActiveResponseSettingsDescription',
        {
          defaultMessage:
            'Find here all the Active response settings for this agent',
        },
      ),
      help: [
        {
          text: i18n.translate(
            'wazuh.configuration.settingsHelpLinks.activeResponseDocumentation',
            {
              defaultMessage: 'Active response documentation',
            },
          ),
          href: 'user-manual/capabilities/active-response/index.html',
        },
        {
          text: i18n.translate(
            'wazuh.configuration.settingsHelpLinks.activeResponseReference',
            {
              defaultMessage: 'Active response reference',
            },
          ),
          href: 'user-manual/reference/ossec-conf/active-response.html',
        },
      ],
    },
  [configurationHeaderKey('inventory', 'Main settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.inventoryMainSettingsTitle',
      {
        defaultMessage: 'Main settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.inventoryMainSettingsDescription',
      {
        defaultMessage: 'General settings applied to all the scans',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.systemInventory',
          {
            defaultMessage: 'System inventory',
          },
        ),
        href: 'user-manual/capabilities/system-inventory/index.html',
      },
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.syscollectorModuleReference',
          {
            defaultMessage: 'Syscollector module reference',
          },
        ),
        href: 'user-manual/capabilities/system-inventory/configuration.html#wazuh-agent-configuration',
      },
    ],
  },
  [configurationHeaderKey('inventory', 'Scan settings')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.inventoryScanSettingsTitle',
      {
        defaultMessage: 'Scan settings',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.inventoryScanSettingsDescription',
      {
        defaultMessage: 'Specific inventory scans to collect',
      },
    ),
  },
  [configurationHeaderKey('integrity-monitoring', 'General')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringGeneralTitle',
      {
        defaultMessage: 'General',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringGeneralDescription',
      {
        defaultMessage: 'The settings shown below are applied globally',
      },
    ),
    help: FIM_HELP,
  },
  [configurationHeaderKey('integrity-monitoring', 'Synchronization')]: {
    // Verbatim original typo -- ported faithfully, not "fixed".
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringSynchronizationTitle',
      {
        defaultMessage: 'Syncronization',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringSynchronizationDescription',
      {
        defaultMessage: 'Database synchronization settings',
      },
    ),
    help: FIM_HELP,
  },
  [configurationHeaderKey('integrity-monitoring', 'Files limit')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringFilesLimitTitle',
      {
        defaultMessage: 'Files limit',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringFilesLimitDescription',
      {
        defaultMessage: 'Limit the maximum files in the FIM database',
      },
    ),
    help: FIM_HELP,
  },
  [configurationHeaderKey('integrity-monitoring', 'Registries limit')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringRegistriesLimitTitle',
      {
        defaultMessage: 'Registries limit',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringRegistriesLimitDescription',
      {
        defaultMessage: 'Limit the maximum registries in the FIM database',
      },
    ),
    help: FIM_HELP,
  },
  [configurationHeaderKey('integrity-monitoring', 'Who-data')]: {
    title: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringWhoDataTitle',
      {
        defaultMessage: 'Who-data',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsHeaders.integrityMonitoringWhoDataDescription',
      {
        defaultMessage:
          'Settings for the underlying who-data (Audit) monitoring',
      },
    ),
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
  'force.after_registration_time': i18n.translate(
    'wazuh.configuration.settingsRegistry.registrationServiceForceAfterRegistrationTimeInfo',
    {
      defaultMessage:
        'Agent replacement only occurs when the time elapsed since registration (in seconds) exceeds this value.',
    },
  ),
  'force.key_mismatch': i18n.translate(
    'wazuh.configuration.settingsRegistry.registrationServiceForceKeyMismatchInfo',
    {
      defaultMessage:
        'Avoid re-registering agents that already have valid keys.',
    },
  ),
  'force.disconnected_time.enabled': i18n.translate(
    'wazuh.configuration.settingsRegistry.registrationServiceForceDisconnectedTimeEnabledInfo',
    {
      defaultMessage:
        'Agent replacement only applies to agents disconnected for longer than the configured duration.',
    },
  ),
  'force.disconnected_time.value': i18n.translate(
    'wazuh.configuration.settingsRegistry.registrationServiceForceDisconnectedTimeValueInfo',
    {
      defaultMessage:
        'Number of seconds an agent must be disconnected before it can be replaced.',
    },
  ),
};

export const searchableSettingsRegistry: SearchableSettingEntry[] = [
  // --- Registration Service (manager-only, regular request) ---
  ...(
    [
      [
        'disabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceDisabledLabel',
          {
            defaultMessage: 'Service status',
          },
        ),
        renderValueNoThenEnabled,
      ],
      [
        'port',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServicePortLabel',
          {
            defaultMessage: 'Listen to connections at port',
          },
        ),
      ],
      [
        'use_source_ip',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceUseSourceIpLabel',
          {
            defaultMessage: "Use client's source IP address",
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'use_password',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceUsePasswordLabel',
          {
            defaultMessage: 'Use a password to register agents',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'purge',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServicePurgeLabel',
          {
            defaultMessage: 'Purge agents list on removal',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'limit_maxagents',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceLimitMaxagentsLabel',
          {
            defaultMessage: 'Limit registration to max agents',
          },
        ),
      ],
      [
        'force.enabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceForceEnabledLabel',
          {
            defaultMessage: 'Force registration on existing IP',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'force.after_registration_time',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceForceAfterRegistrationTimeLabel',
          {
            defaultMessage: 'Min seconds since registration',
          },
        ),
      ],
      [
        'force.key_mismatch',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceForceKeyMismatchLabel',
          {
            defaultMessage: 'Re-register only on key mismatch',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'force.disconnected_time.enabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceForceDisconnectedTimeEnabledLabel',
          {
            defaultMessage: 'Replace only disconnected agents',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'force.disconnected_time.value',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceForceDisconnectedTimeValueLabel',
          {
            defaultMessage: 'Seconds an agent is disconnected',
          },
        ),
      ],
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
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceSslSslVerifyHostLabel',
          {
            defaultMessage: 'Verify host when a CA certificate is specified',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'ssl_agent_ca',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceSslSslAgentCaLabel',
          {
            defaultMessage: 'Path to the CA certificate used to verify clients',
          },
        ),
      ],
      [
        'ssl_auto_negotiate',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceSslSslAutoNegotiateLabel',
          {
            defaultMessage: 'Auto-select the SSL negotiation method',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'ssl_manager_ca',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceSslSslManagerCaLabel',
          {
            defaultMessage: 'CA certificate location',
          },
        ),
      ],
      [
        'ssl_manager_cert',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceSslSslManagerCertLabel',
          {
            defaultMessage: 'Server SSL certificate location',
          },
        ),
      ],
      [
        'ssl_manager_key',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceSslSslManagerKeyLabel',
          {
            defaultMessage: 'Server SSL key location',
          },
        ),
      ],
      [
        'ciphers',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.registrationServiceSslCiphersLabel',
          {
            defaultMessage: 'Use the following SSL ciphers',
          },
        ),
      ],
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
      [
        'name',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clusterNameLabel',
          {
            defaultMessage: 'Cluster name',
          },
        ),
      ],
      [
        'node_name',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clusterNodeNameLabel',
          {
            defaultMessage: 'Node name',
          },
        ),
      ],
      [
        'node_type',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clusterNodeTypeLabel',
          {
            defaultMessage: 'Node type',
          },
        ),
      ],
      [
        'nodes',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clusterNodesLabel',
          {
            defaultMessage: 'Master node IP address',
          },
        ),
      ],
      [
        'port',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clusterPortLabel',
          {
            defaultMessage: 'Port to listen to cluster communications',
          },
        ),
      ],
      [
        'bind_addr',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clusterBindAddrLabel',
          {
            defaultMessage: 'IP address to listen to cluster communications',
          },
        ),
      ],
      [
        'hidden',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clusterHiddenLabel',
          {
            defaultMessage: 'Hide cluster information in alerts',
          },
        ),
        renderValueBooleanYesNo,
      ],
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.indexerHostsLabel',
      {
        defaultMessage: 'Hosts',
      },
    ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.indexerSslCertificateAuthoritiesLabel',
      {
        defaultMessage: 'Certificate authorities',
      },
    ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.indexerSslCertificateLabel',
      {
        defaultMessage: 'Certificate',
      },
    ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.indexerSslKeyLabel',
      {
        defaultMessage: 'Key',
      },
    ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.globalConfigurationLoggingLogFormatLabel',
      {
        defaultMessage: 'Log format',
      },
    ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.globalConfigurationGlobalAgentsDisconnectionTimeLabel',
      {
        defaultMessage:
          'Time after which the manager considers an agent as disconnected since its last keepalive',
      },
    ),
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
      [
        'https.port',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteHttpsPortLabel',
          {
            defaultMessage: 'Port',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'https.bind_addr',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteHttpsBindAddrLabel',
          {
            defaultMessage: 'Bind address',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'https.global_prefix',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteHttpsGlobalPrefixLabel',
          {
            defaultMessage: 'Global prefix',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'https.certificate',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteHttpsCertificateLabel',
          {
            defaultMessage: 'Certificate',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'https.key',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteHttpsKeyLabel',
          {
            defaultMessage: 'Key',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'legacy.enabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteLegacyEnabledLabel',
          {
            defaultMessage: 'Enabled',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'legacy.port',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteLegacyPortLabel',
          {
            defaultMessage: 'Port',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'legacy.protocol',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteLegacyProtocolLabel',
          {
            defaultMessage: 'Protocol',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'legacy.ipv6',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteLegacyIpv6Label',
          {
            defaultMessage: 'IPv6',
          },
        ),
        renderValueBooleanYesNo,
      ],
      [
        'legacy.local_ip',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteLegacyLocalIpLabel',
          {
            defaultMessage: 'Local IP address',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'legacy.queue_size',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteLegacyQueueSizeLabel',
          {
            defaultMessage: 'Queue size',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'legacy.rids_closing_time',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteLegacyRidsClosingTimeLabel',
          {
            defaultMessage: 'RIDs closing time',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'legacy.connection_overtake_time',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteLegacyConnectionOvertakeTimeLabel',
          {
            defaultMessage: 'Connection overtake time',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'agents.allow_higher_versions',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.globalConfigurationRemoteAgentsAllowHigherVersionsLabel',
          {
            defaultMessage: 'Allow higher versions',
          },
        ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.globalConfigurationAgentExecdLoggingPlainLabel',
      {
        defaultMessage: 'Write internal logs in plain text',
      },
    ),
    category: 'Global Configuration',
    goto: 'global-configuration-agent',
    tab: 'Main settings',
    appliesTo: 'agent',
    agentPath: 'execd.logging.plain',
    render: renderValueBooleanYesNo,
  },
  {
    id: 'global-configuration-agent.execd.logging.json',
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.globalConfigurationAgentExecdLoggingJsonLabel',
      {
        defaultMessage: 'Write internal logs in JSON format',
      },
    ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.vulnerabilitiesEnabledLabel',
      {
        defaultMessage: 'Enables the vulnerability detection module',
      },
    ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.vulnerabilitiesFeedUpdateIntervalLabel',
      {
        defaultMessage: 'Time interval for periodic feed updates',
      },
    ),
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
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringDisabledLabel',
          {
            defaultMessage: 'Policy monitoring service status',
          },
        ),
        renderValueNoThenEnabled,
      ],
      [
        'base_directory',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringBaseDirectoryLabel',
          {
            defaultMessage: 'Base directory',
          },
        ),
      ],
      [
        'scanall',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringScanallLabel',
          {
            defaultMessage: 'Scan the entire system',
          },
        ),
      ],
      [
        'frequency',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringFrequencyLabel',
          {
            defaultMessage: 'Frequency (in seconds) to run the scan',
          },
        ),
      ],
      [
        'check_dev',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringCheckDevLabel',
          {
            defaultMessage: 'Check /dev path',
          },
        ),
      ],
      [
        'check_if',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringCheckIfLabel',
          {
            defaultMessage: 'Check network interfaces',
          },
        ),
      ],
      [
        'check_pids',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringCheckPidsLabel',
          {
            defaultMessage: 'Check processes IDs',
          },
        ),
      ],
      [
        'check_ports',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringCheckPortsLabel',
          {
            defaultMessage: 'Check network ports',
          },
        ),
      ],
      [
        'check_sys',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringCheckSysLabel',
          {
            defaultMessage: 'Check anomalous system objects',
          },
        ),
      ],
      [
        'skip_nfs',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringSkipNfsLabel',
          {
            defaultMessage: 'Skip scan on CIFS/NFS mounts',
          },
        ),
      ],
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.policyMonitoringIgnoreTitle',
      {
        defaultMessage: 'Ignored paths',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.policyMonitoringIgnoreDescription',
      {
        defaultMessage:
          'These files and directories are ignored from the rootcheck scan',
      },
    ),
    help: POLICY_MONITORING_HELP,
    // A block declared once is reported as a bare value rather than a
    // one-element list, so both shapes must resolve to an array here.
    agentExtract: content => {
      const value = get(content, 'fim.rootcheck.ignore');
      return Array.isArray(value) ? value : value ? [value] : [];
    },
    itemLabel: item => String(item),
    itemFields: [
      {
        field: '',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringIgnoreItemValueLabel',
          {
            defaultMessage: 'Path',
          },
        ),
      },
    ],
  },
  {
    kind: 'list',
    id: 'policy-monitoring.ignore-sregex',
    category: 'Policy monitoring',
    tab: 'Ignored',
    goto: 'policy-monitoring',
    appliesTo: 'agent',
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.policyMonitoringIgnoreSregexTitle',
      {
        defaultMessage: 'Ignored path patterns',
      },
    ),
    help: POLICY_MONITORING_HELP,
    agentExtract: content => {
      const value = get(content, 'fim.rootcheck.ignore_sregex');
      return Array.isArray(value) ? value : value ? [value] : [];
    },
    itemLabel: item => String(item),
    itemFields: [
      {
        field: '',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringIgnoreSregexItemValueLabel',
          {
            defaultMessage: 'Sregex',
          },
        ),
      },
    ],
  },

  // --- Policy monitoring > SCA tab (agent-only, wodle) ---
  ...(
    [
      [
        'enabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringScaEnabledLabel',
          {
            defaultMessage: 'Security configuration assessment status',
          },
        ),
        renderValueYesThenEnabled,
      ],
      [
        'interval',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringScaIntervalLabel',
          {
            defaultMessage: 'Interval',
          },
        ),
      ],
      [
        'scan_on_start',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringScaScanOnStartLabel',
          {
            defaultMessage: 'Scan on start',
          },
        ),
      ],
      [
        'skip_nfs',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringScaSkipNfsLabel',
          {
            defaultMessage: 'Skip nfs',
          },
        ),
      ],
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.policyMonitoringScaPoliciesTitle',
      {
        defaultMessage: 'Policies',
      },
    ),
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
    itemFields: [
      {
        field: 'policy',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.policyMonitoringScaPoliciesItemPolicyLabel',
          {
            defaultMessage: 'Name',
          },
        ),
      },
    ],
  },

  // --- Communication / client (agent-only) ---
  ...(
    [
      [
        'remote_conf',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clientRemoteConfLabel',
          {
            defaultMessage: 'Remote configuration is enabled',
          },
        ),
      ],
      [
        'auto_restart',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clientAutoRestartLabel',
          {
            defaultMessage:
              'Auto-restart the agent when receiving valid configuration from manager',
          },
        ),
      ],
      [
        'notify_time',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clientNotifyTimeLabel',
          {
            defaultMessage:
              'Time (in seconds) between agent checkings to the manager',
          },
        ),
      ],
      [
        'time-reconnect',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clientTimeReconnectLabel',
          {
            defaultMessage: 'Time (in seconds) before attempting to reconnect',
          },
        ),
      ],
      [
        'config-profile',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clientConfigProfileLabel',
          {
            defaultMessage: 'Configuration profiles',
          },
        ),
      ],
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.clientEndpointLabel',
      {
        defaultMessage: 'Endpoint',
      },
    ),
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
      [
        'size',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clientBatchSizeLabel',
          {
            defaultMessage: 'Maximum size of a batch',
          },
        ),
      ],
      [
        'interval',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.clientBatchIntervalLabel',
          {
            defaultMessage: 'Maximum time to wait before sending a batch',
          },
        ),
      ],
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
      [
        'disabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.activeResponseAgentDisabledLabel',
          {
            defaultMessage: 'Active response status',
          },
        ),
        renderValueNoThenEnabled,
      ],
      [
        'repeated_offenders',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.activeResponseAgentRepeatedOffendersLabel',
          {
            defaultMessage:
              'List of timeouts (in minutes) for repeated offenders',
          },
        ),
      ],
      [
        'ca_store',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.activeResponseAgentCaStoreLabel',
          {
            defaultMessage: 'Use the following list of root CA certificates',
          },
        ),
      ],
      [
        'ca_verification',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.activeResponseAgentCaVerificationLabel',
          {
            defaultMessage: 'Validate WPKs using root CA certificate',
          },
        ),
      ],
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
      [
        'disabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryDisabledLabel',
          {
            defaultMessage: 'Syscollector integration status',
          },
        ),
        renderValueNoThenEnabled,
      ],
      [
        'interval',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryIntervalLabel',
          {
            defaultMessage: 'Interval between system scans',
          },
        ),
      ],
      [
        'scan-on-start',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanOnStartLabel',
          {
            defaultMessage: 'Scan on start',
          },
        ),
      ],
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
      [
        'hardware',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanHardwareLabel',
          {
            defaultMessage: 'Scan hardware info',
          },
        ),
      ],
      [
        'processes',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanProcessesLabel',
          {
            defaultMessage: 'Scan current processes',
          },
        ),
      ],
      [
        'os',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanOsLabel',
          {
            defaultMessage: 'Scan operating system info',
          },
        ),
      ],
      [
        'packages',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanPackagesLabel',
          {
            defaultMessage: 'Scan installed packages',
          },
        ),
      ],
      [
        'network',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanNetworkLabel',
          {
            defaultMessage: 'Scan network interfaces',
          },
        ),
      ],
      [
        'ports',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanPortsLabel',
          {
            defaultMessage: 'Scan listening network ports',
          },
        ),
      ],
      [
        'ports_all',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanPortsAllLabel',
          {
            defaultMessage: 'Scan all network ports',
          },
        ),
      ],
      [
        'groups',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanGroupsLabel',
          {
            defaultMessage: 'Scan groups',
          },
        ),
      ],
      [
        'users',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanUsersLabel',
          {
            defaultMessage: 'Scan users',
          },
        ),
      ],
      [
        'services',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanServicesLabel',
          {
            defaultMessage: 'Scan services',
          },
        ),
      ],
      [
        'browser_extensions',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanBrowserExtensionsLabel',
          {
            defaultMessage: 'Scan browser extensions',
          },
        ),
      ],
      [
        'sync_max_eps',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.inventoryScanSyncMaxEpsLabel',
          {
            defaultMessage: 'Maximum event reporting throughput',
          },
        ),
      ],
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
      [
        'disabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralDisabledLabel',
          {
            defaultMessage: 'Integrity monitoring status',
          },
        ),
        renderValueNoThenEnabled,
      ],
      [
        'frequency',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralFrequencyLabel',
          {
            defaultMessage: 'Interval (in seconds) to run the integrity scan',
          },
        ),
      ],
      [
        'scan_time',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralScanTimeLabel',
          {
            defaultMessage: 'Time of day to run integrity scans',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'scan_day',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralScanDayLabel',
          {
            defaultMessage: 'Day of the week to run integrity scans',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'scan_on_start',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralScanOnStartLabel',
          {
            defaultMessage: 'Scan on start',
          },
        ),
      ],
      [
        'skip_nfs',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralSkipNfsLabel',
          {
            defaultMessage: 'Skip scan on CIFS/NFS mounts',
          },
        ),
      ],
      [
        'skip_dev',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralSkipDevLabel',
          {
            defaultMessage: 'Skip scan of /dev directory',
          },
        ),
      ],
      [
        'skip_sys',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralSkipSysLabel',
          {
            defaultMessage: 'Skip scan of /sys directory',
          },
        ),
      ],
      [
        'skip_proc',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralSkipProcLabel',
          {
            defaultMessage: 'Skip scan of /proc directory',
          },
        ),
      ],
      [
        'remove_old_diff',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralRemoveOldDiffLabel',
          {
            defaultMessage: 'Remove old local snapshots',
          },
        ),
        renderValueOrYes,
      ],
      [
        'restart_audit',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralRestartAuditLabel',
          {
            defaultMessage: 'Restart the Audit daemon',
          },
        ),
      ],
      [
        'windows_audit_interval',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralWindowsAuditIntervalLabel',
          {
            defaultMessage: "Interval (in seconds) to check directories' SACLs",
          },
        ),
        renderValueOrDefault('300'),
      ],
      [
        'prefilter_cmd',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralPrefilterCmdLabel',
          {
            defaultMessage: 'Command to prevent prelinking',
          },
        ),
        renderValueOrNoValue,
      ],
      [
        'max_eps',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralMaxEpsLabel',
          {
            defaultMessage: 'Maximum event reporting throughput',
          },
        ),
      ],
      [
        'process_priority',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralProcessPriorityLabel',
          {
            defaultMessage: 'Process priority',
          },
        ),
      ],
      [
        'database',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringGeneralDatabaseLabel',
          {
            defaultMessage: 'Database type',
          },
        ),
      ],
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
      [
        'enabled',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringSynchronizationEnabledLabel',
          {
            defaultMessage: 'Synchronization status',
          },
        ),
        renderValueYesThenEnabled,
      ],
      [
        'max_interval',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringSynchronizationMaxIntervalLabel',
          {
            defaultMessage: 'Maximum interval (in seconds) between every sync',
          },
        ),
      ],
      [
        'interval',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringSynchronizationIntervalLabel',
          {
            defaultMessage: 'Interval (in seconds) between every sync',
          },
        ),
      ],
      [
        'response_timeout',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringSynchronizationResponseTimeoutLabel',
          {
            defaultMessage: 'Response timeout (in seconds)',
          },
        ),
      ],
      [
        'queue_size',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringSynchronizationQueueSizeLabel',
          {
            defaultMessage: 'Queue size of the manager responses',
          },
        ),
      ],
      [
        'max_eps',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringSynchronizationMaxEpsLabel',
          {
            defaultMessage: 'Maximum message throughput',
          },
        ),
      ],
      [
        'thread_pool',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringSynchronizationThreadPoolLabel',
          {
            defaultMessage: 'Number of threads',
          },
        ),
      ],
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringFileLimitEnabledLabel',
      {
        defaultMessage: 'File limit status',
      },
    ),
    category: 'Integrity monitoring',
    tab: 'Files limit',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    agentPath: 'fim.syscheck.file_limit.enabled',
    render: renderValueYesThenEnabled,
  },
  {
    id: 'integrity-monitoring.file-limit.entries',
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringFileLimitEntriesLabel',
      {
        defaultMessage: 'Maximum number of files to monitor',
      },
    ),
    category: 'Integrity monitoring',
    tab: 'Files limit',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    agentPath: 'fim.syscheck.file_limit.entries',
  },
  {
    id: 'integrity-monitoring.registry-limit.enabled',
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryLimitEnabledLabel',
      {
        defaultMessage: 'Registry limit status',
      },
    ),
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
    label: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryLimitEntriesLabel',
      {
        defaultMessage: 'Maximum number of registries values to monitor',
      },
    ),
    category: 'Integrity monitoring',
    tab: 'Registries limit',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    platform: 'windows',
    agentPath: 'fim.syscheck.registry_limit.entries',
  },
  ...(
    [
      [
        'restart_audit',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringWhoDataRestartAuditLabel',
          {
            defaultMessage: 'Restart audit',
          },
        ),
      ],
      [
        'startup_healthcheck',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringWhoDataStartupHealthcheckLabel',
          {
            defaultMessage: 'Startup healthcheck',
          },
        ),
      ],
      [
        'provider',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringWhoDataProviderLabel',
          {
            defaultMessage: 'Provider',
          },
        ),
      ],
      [
        'queue_size',
        i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringWhoDataQueueSizeLabel',
          {
            defaultMessage: 'Queue size',
          },
        ),
      ],
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringNodiffTitle',
      {
        defaultMessage: 'No diff directories',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringNodiffDescription',
      {
        defaultMessage: "These files won't have their diff calculated",
      },
    ),
    help: FIM_HELP,
    agentPath: 'fim.syscheck.nodiff',
    itemLabel: item => String(item),
    itemFields: [
      {
        field: '',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringNodiffItemValueLabel',
          {
            defaultMessage: 'Path',
          },
        ),
      },
    ],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.ignore',
    category: 'Integrity monitoring',
    tab: 'Ignored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringIgnoreTitle',
      {
        defaultMessage: 'Ignored paths',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringIgnoreDescription',
      {
        defaultMessage:
          'These files and directories are ignored from the integrity scan',
      },
    ),
    help: FIM_HELP,
    agentPath: 'fim.syscheck.ignore',
    itemLabel: item => String(item),
    itemFields: [
      {
        field: '',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringIgnoreItemValueLabel',
          {
            defaultMessage: 'Path',
          },
        ),
      },
    ],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.ignore-sregex',
    category: 'Integrity monitoring',
    tab: 'Ignored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringIgnoreSregexTitle',
      {
        defaultMessage: 'Ignored path patterns',
      },
    ),
    help: FIM_HELP,
    agentPath: 'fim.syscheck.ignore_sregex',
    itemLabel: item => String(item),
    itemFields: [
      {
        field: '',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringIgnoreSregexItemValueLabel',
          {
            defaultMessage: 'Sregex',
          },
        ),
      },
    ],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.registry-ignore',
    category: 'Integrity monitoring',
    tab: 'Ignored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    platform: 'windows',
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryIgnoreTitle',
      {
        defaultMessage: 'Ignored registry entries',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryIgnoreDescription',
      {
        defaultMessage:
          'A list of registry entries that will be ignored (Windows only)',
      },
    ),
    help: FIM_HELP,
    agentPath: 'fim.syscheck.registry_ignore',
    itemLabel: item => (item as { entry?: string })?.entry ?? '',
    itemFields: [
      {
        field: 'entry',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryIgnoreItemEntryLabel',
          {
            defaultMessage: 'Entry',
          },
        ),
      },
      {
        field: 'arch',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryIgnoreItemArchLabel',
          {
            defaultMessage: 'Arch',
          },
        ),
      },
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryIgnoreSregexTitle',
      {
        defaultMessage: 'Ignored registry entry patterns',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryIgnoreSregexDescription',
      {
        defaultMessage:
          'A list of registry entry patterns that will be ignored (Windows only)',
      },
    ),
    help: FIM_HELP,
    agentPath: 'fim.syscheck.registry_ignore_sregex',
    itemLabel: item => (item as { entry?: string })?.entry ?? '',
    itemFields: [
      {
        field: 'entry',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryIgnoreSregexItemEntryLabel',
          {
            defaultMessage: 'Entry Sregex',
          },
        ),
      },
      {
        field: 'arch',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryIgnoreSregexItemArchLabel',
          {
            defaultMessage: 'Arch',
          },
        ),
      },
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringWhoDataAuditKeyTitle',
      {
        defaultMessage: 'Who-data audit keys',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringWhoDataAuditKeyDescription',
      {
        defaultMessage:
          'Server will include in its FIM baseline those events being monitored by Audit using audit_key.',
      },
    ),
    help: FIM_HELP,
    agentPath: 'fim.syscheck.whodata.audit_key',
    itemLabel: item => String(item),
    itemFields: [
      {
        field: '',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringWhoDataAuditKeyItemValueLabel',
          {
            defaultMessage: 'Key',
          },
        ),
      },
    ],
  },
  {
    kind: 'list',
    id: 'integrity-monitoring.directories',
    category: 'Integrity monitoring',
    tab: 'Monitored',
    goto: 'integrity-monitoring',
    appliesTo: 'agent',
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesTitle',
      {
        defaultMessage: 'Monitored directories',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesDescription',
      {
        defaultMessage: 'These directories are included on the integrity scan',
      },
    ),
    help: FIM_HELP,
    agentPath: 'fim.syscheck.directories',
    itemLabel: item => (item as { dir?: string })?.dir ?? '',
    itemFields: [
      {
        field: 'dir',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemDirLabel',
          {
            defaultMessage: 'Selected item',
          },
        ),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemRealtimeLabel',
          {
            defaultMessage: 'Enable realtime monitoring',
          },
        ),
        render: renderOptsIncludes('realtime'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckWhodataLabel',
          {
            defaultMessage: 'Enable auditing (who-data)',
          },
        ),
        render: renderOptsIncludes('check_whodata'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemReportChangesLabel',
          {
            defaultMessage: 'Report file changes',
          },
        ),
        render: renderOptsIncludes('report_changes'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckAllLabel',
          {
            defaultMessage: 'Perform all checksums',
          },
        ),
        render: renderOptsIncludes('check_all'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckSumLabel',
          {
            defaultMessage: 'Check sums (MD5 & SHA1)',
          },
        ),
        render: renderOptsIncludes('check_sum'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckMd5sumLabel',
          {
            defaultMessage: 'Check MD5 sum',
          },
        ),
        render: renderOptsIncludes('check_md5sum'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckSha1sumLabel',
          {
            defaultMessage: 'Check SHA1 sum',
          },
        ),
        render: renderOptsIncludes('check_sha1sum'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckSha256sumLabel',
          {
            defaultMessage: 'Check SHA256 sum',
          },
        ),
        render: renderOptsIncludes('check_sha256sum'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckSizeLabel',
          {
            defaultMessage: 'Check files size',
          },
        ),
        render: renderOptsIncludes('check_size'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckOwnerLabel',
          {
            defaultMessage: 'Check files owner',
          },
        ),
        render: renderOptsIncludes('check_owner'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckGroupLabel',
          {
            defaultMessage: 'Check files groups',
          },
        ),
        render: renderOptsIncludes('check_group'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckPermLabel',
          {
            defaultMessage: 'Check files permissions',
          },
        ),
        render: renderOptsIncludes('check_perm'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckMtimeLabel',
          {
            defaultMessage: 'Check files modification time',
          },
        ),
        render: renderOptsIncludes('check_mtime'),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemCheckInodeLabel',
          {
            defaultMessage: 'Check files inodes',
          },
        ),
        render: renderOptsIncludes('check_inode'),
      },
      {
        field: 'restrict',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemRestrictLabel',
          {
            defaultMessage: 'Restrict to files containing this string',
          },
        ),
      },
      {
        field: 'tags',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemTagsLabel',
          {
            defaultMessage: 'Custom tags for alerts',
          },
        ),
      },
      {
        field: 'recursion_level',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemRecursionLevelLabel',
          {
            defaultMessage: 'Recursion level',
          },
        ),
      },
      {
        field: 'opts',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringDirectoriesItemFollowSymbolicLinkLabel',
          {
            defaultMessage: 'Follow symbolic link',
          },
        ),
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryTitle',
      {
        defaultMessage: 'Monitored registry entries',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryDescription',
      {
        defaultMessage:
          'A list of registry entries that will be monitored (Windows only)',
      },
    ),
    help: FIM_HELP,
    agentPath: 'fim.syscheck.registry',
    itemLabel: item => (item as { entry?: string })?.entry ?? '',
    itemFields: [
      {
        field: 'entry',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryItemEntryLabel',
          {
            defaultMessage: 'Entry',
          },
        ),
      },
      {
        field: 'arch',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.integrityMonitoringRegistryItemArchLabel',
          {
            defaultMessage: 'Arch',
          },
        ),
      },
    ],
  },

  // --- Commands (agent-only) ---
  {
    kind: 'list',
    id: 'commands.command',
    category: 'Commands',
    goto: 'commands',
    appliesTo: 'agent',
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.commandsCommandTitle',
      {
        defaultMessage: 'Command definitions',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.commandsCommandDescription',
      {
        defaultMessage: 'Find here all the currently defined commands',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.commandModuleReference',
          {
            defaultMessage: 'Command module reference',
          },
        ),
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
      {
        field: 'disabled',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemDisabledLabel',
          {
            defaultMessage: 'Command status',
          },
        ),
      },
      {
        field: 'tag',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemTagLabel',
          {
            defaultMessage: 'Command name',
          },
        ),
      },
      {
        field: 'command',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemCommandLabel',
          {
            defaultMessage: 'Command to execute',
          },
        ),
      },
      {
        field: 'interval',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemIntervalLabel',
          {
            defaultMessage: 'Interval between executions',
          },
        ),
      },
      {
        field: 'run_on_start',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemRunOnStartLabel',
          {
            defaultMessage: 'Run on start',
          },
        ),
      },
      {
        field: 'ignore_output',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemIgnoreOutputLabel',
          {
            defaultMessage: 'Ignore command output',
          },
        ),
      },
      {
        field: 'timeout',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemTimeoutLabel',
          {
            defaultMessage: 'Timeout (in seconds) to wait for execution',
          },
        ),
      },
      {
        field: 'verify_md5',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemVerifyMd5Label',
          {
            defaultMessage: 'Verify MD5 sum',
          },
        ),
      },
      {
        field: 'verify_sha1',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemVerifySha1Label',
          {
            defaultMessage: 'Verify SHA1 sum',
          },
        ),
      },
      {
        field: 'verify_sha256',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemVerifySha256Label',
          {
            defaultMessage: 'Verify SHA256 sum',
          },
        ),
      },
      {
        field: 'skip_verification',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.commandsCommandItemSkipVerificationLabel',
          {
            defaultMessage: 'Ignore checksum verification',
          },
        ),
      },
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionLogsTitle',
      {
        defaultMessage: 'Logs files',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionLogsDescription',
      {
        defaultMessage: 'List of log files that will be analyzed',
      },
    ),
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
      {
        field: 'logformat',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemLogformatLabel',
          {
            defaultMessage: 'Log format',
          },
        ),
      },
      {
        field: 'file',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemFileLabel',
          {
            defaultMessage: 'Log location',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'only-future-events',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemOnlyFutureEventsLabel',
          {
            defaultMessage: 'Only receive logs occured after start',
          },
        ),
      },
      {
        field: 'reconnect_time',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemReconnectTimeLabel',
          {
            defaultMessage:
              'Time in seconds to try to reconnect with Windows Event Channel when it has fallen',
          },
        ),
      },
      {
        field: 'query',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemQueryLabel',
          {
            defaultMessage: 'Filter logs using this XPATH query',
          },
        ),
        render: renderValueOrNoValue,
      },
      // NOTE: log-collection-logs.js labels this the same as
      // `only-future-events` -- ported faithfully.
      {
        field: 'labels',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemLabelsLabel',
          {
            defaultMessage: 'Only receive logs occured after start',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'target',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemTargetLabel',
          {
            defaultMessage: 'Redirect output to this socket',
          },
        ),
        render: renderLogCollectionTarget,
      },
      {
        field: 'ignore',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemIgnoreLabel',
          {
            defaultMessage:
              'If the expression matches, the log will be ignored',
          },
        ),
        render: renderArrayObjectField,
      },
      {
        field: 'restrict',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionLogsItemRestrictLabel',
          {
            defaultMessage:
              'The log will only be processed if the expression matches',
          },
        ),
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionWindowsEventsTitle',
      {
        defaultMessage: 'Windows events logs',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionWindowsEventsDescription',
      {
        defaultMessage: 'List of Windows logs that will be processed',
      },
    ),
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
      {
        field: 'logformat',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionWindowsEventsItemLogformatLabel',
          {
            defaultMessage: 'Log format',
          },
        ),
      },
      {
        field: 'channel',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionWindowsEventsItemChannelLabel',
          {
            defaultMessage: 'Channel',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'query',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionWindowsEventsItemQueryLabel',
          {
            defaultMessage: 'Query',
          },
        ),
        render: renderQueryValue,
      },
      {
        field: 'only-future-events',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionWindowsEventsItemOnlyFutureEventsLabel',
          {
            defaultMessage: 'Only future events',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'reconnect_time',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionWindowsEventsItemReconnectTimeLabel',
          {
            defaultMessage: 'Reconnect Time',
          },
        ),
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionMacosEventsTitle',
      {
        defaultMessage: 'macOS events logs',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionMacosEventsDescription',
      {
        defaultMessage: 'List of macOS logs that will be processed',
      },
    ),
    help: LOG_COLLECTION_HELP,
    agentExtract: localfileBucket(item => item.logformat === 'macos'),
    itemLabel: item => {
      const localfile = item as { logformat?: string; target?: string[] };
      return `${localfile.logformat} - ${renderLogCollectionTarget(
        localfile.target,
      )}`;
    },
    itemFields: [
      {
        field: 'logformat',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionMacosEventsItemLogformatLabel',
          {
            defaultMessage: 'Log format',
          },
        ),
      },
      {
        field: 'query',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionMacosEventsItemQueryLabel',
          {
            defaultMessage: 'Query value',
          },
        ),
        render: renderQueryValue,
      },
      {
        field: 'query.level',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionMacosEventsItemQueryLevelLabel',
          {
            defaultMessage: 'Query level',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'query.type',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionMacosEventsItemQueryTypeLabel',
          {
            defaultMessage: 'Query type',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'ignore_binaries',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionMacosEventsItemIgnoreBinariesLabel',
          {
            defaultMessage: 'Ignore binaries',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'only-future-events',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionMacosEventsItemOnlyFutureEventsLabel',
          {
            defaultMessage: 'Only future events',
          },
        ),
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionJournaldTitle',
      {
        defaultMessage: 'Journald events logs',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionJournaldDescription',
      {
        defaultMessage: 'List of journald logs that will be processed',
      },
    ),
    help: LOG_COLLECTION_HELP,
    agentExtract: localfileBucket(item => item.logformat === 'journald'),
    itemLabel: item => {
      const localfile = item as { logformat?: string; target?: string[] };
      return `${localfile.logformat} - ${renderLogCollectionTarget(
        localfile.target,
      )}`;
    },
    itemFields: [
      {
        field: 'logformat',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionJournaldItemLogformatLabel',
          {
            defaultMessage: 'Log format',
          },
        ),
      },
      {
        field: 'only-future-events',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionJournaldItemOnlyFutureEventsLabel',
          {
            defaultMessage: 'Only future events',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'filters_disabled',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionJournaldItemFiltersDisabledLabel',
          {
            defaultMessage: 'Filters Disabled',
          },
        ),
        render: renderValueOrDefault('true'),
      },
      {
        field: 'filters',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionJournaldItemFiltersLabel',
          {
            defaultMessage: 'Filters',
          },
        ),
        render: renderFilters,
        info: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionJournaldItemFiltersInfo',
          {
            defaultMessage:
              'The configuration filters within the same group are processed with an AND logic operator. Whereas the different filter groups are processed with an OR like logic operator.',
          },
        ),
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionCommandsTitle',
      {
        defaultMessage: 'Command monitoring',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionCommandsDescription',
      {
        defaultMessage:
          'All output from these commands will be read as one or more log messages depending on whether command or full_command is used',
      },
    ),
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
      {
        field: 'logformat',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionCommandsItemLogformatLabel',
          {
            defaultMessage: 'Log format',
          },
        ),
      },
      {
        field: 'command',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionCommandsItemCommandLabel',
          {
            defaultMessage: 'Run this command',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'alias',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionCommandsItemAliasLabel',
          {
            defaultMessage: 'Command alias',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'frequency',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionCommandsItemFrequencyLabel',
          {
            defaultMessage: 'Interval between command executions',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'target',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionCommandsItemTargetLabel',
          {
            defaultMessage: 'Redirect output to this socket',
          },
        ),
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
    title: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionSocketsTitle',
      {
        defaultMessage: 'Output sockets',
      },
    ),
    description: i18n.translate(
      'wazuh.configuration.settingsRegistry.logCollectionSocketsDescription',
      {
        defaultMessage: 'Define custom outputs to send log data',
      },
    ),
    help: [
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.usingMultipleOutputs',
          {
            defaultMessage: 'Using multiple outputs',
          },
        ),
        href: 'user-manual/capabilities/log-data-collection/monitoring-log-files.html',
      },
      {
        text: i18n.translate(
          'wazuh.configuration.settingsHelpLinks.socketReference',
          {
            defaultMessage: 'Socket reference',
          },
        ),
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
      {
        field: 'name',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionSocketsItemNameLabel',
          {
            defaultMessage: 'Socket name',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'location',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionSocketsItemLocationLabel',
          {
            defaultMessage: 'Socket location',
          },
        ),
        render: renderValueOrNoValue,
      },
      {
        field: 'mode',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionSocketsItemModeLabel',
          {
            defaultMessage: 'UNIX socket protocol',
          },
        ),
        render: renderValueOrDefault('udp'),
      },
      {
        field: 'prefix',
        label: i18n.translate(
          'wazuh.configuration.settingsRegistry.logCollectionSocketsItemPrefixLabel',
          {
            defaultMessage: 'Prefix to place before the message',
          },
        ),
        render: renderValueOrNoValue,
      },
    ],
  },
];
