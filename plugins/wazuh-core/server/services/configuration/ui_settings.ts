import { UiSettingsParams } from "opensearch-dashboards/server";
import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';
import { 
  HIDE_MANAGER_ALERTS_SETTING,
  ALERTS_SAMPLE_PREFIX,
  CHECKS_API,
  CHECKS_FIELDS,
  CHECKS_MAX_BUCKETS,
  CHECKS_META_FIELDS,
  CHECKS_PATTERN,
  CHECKS_SETUP,
  CHECKS_TEMPLATE,
  CHECKS_TIMEFILTER,
  CONFIG_UI_API_EDITABLE,
  CRON_PREFIX,
  CUSTOMIZATION_ENABLED,
  ENROLLMENT_DNS,
  ENROLLMENT_PASSWORD,
  IP_IGNORE,
  IP_SELECTOR,
  REQUEST_TIMEOUT,
  WAZUH_SAMPLE_ALERT_PREFIX,
  WAZUH_STATISTICS_DEFAULT_PREFIX,
  WAZUH_UPDATES_DISABLED} from "../../../common/constants";

export const uiSettings: Record<string, UiSettingsParams> = {
  [HIDE_MANAGER_ALERTS_SETTING]: {
    name: i18n.translate('wazuhCore.advancedSettings.hideManagerAlerts', {
      defaultMessage: 'Hide manager alerts',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.hideManagerAlertsText', {
      defaultMessage: 'Hide the alerts of the manager in every dashboard.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [ALERTS_SAMPLE_PREFIX]: {
    name: i18n.translate('wazuhCore.advancedSettings.alertsSamplePrefix', {
      defaultMessage: 'Sample alerts prefix',
    }),
    type: 'string',
    value: WAZUH_SAMPLE_ALERT_PREFIX,
    description: i18n.translate('wazuhCore.advancedSettings.alertsSamplePrefixText', {
      defaultMessage: 'Define the index name prefix of sample alerts. It must match the template used by the index pattern to avoid unknown fields in dashboards.',
    }),
    category: ['wazuhCore'],
    schema: schema.string()
  },

  [CHECKS_API]: {
    name: i18n.translate('wazuhCore.advancedSettings.checksApi', {
      defaultMessage: 'API connection',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.checksApiText', {
      defaultMessage: 'Enable or disable the API health check when opening the app.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CHECKS_FIELDS]: {
    name: i18n.translate('wazuhCore.advancedSettings.checksFields', {
      defaultMessage: 'Known fields',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.checksFieldsText', {
      defaultMessage:  'Enable or disable the known fields health check when opening the app.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CHECKS_MAX_BUCKETS]: {
    name: i18n.translate('wazuhCore.advancedSettings.checksMaxBuckets', {
      defaultMessage: 'Set max buckets to 200000',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.checksMaxBucketsText', {
      defaultMessage:'Change the default value of the plugin platform max buckets configuration.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CHECKS_META_FIELDS]: {
    name: i18n.translate('wazuhCore.advancedSettings.checksMetaFields', {
      defaultMessage: 'Remove meta fields',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.checksMetaFieldsText', {
      defaultMessage: 'Change the default value of the plugin platform metaField configuration.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CHECKS_PATTERN]: {
    name: i18n.translate('wazuhCore.advancedSettings.checksPattern', {
      defaultMessage: 'Index pattern',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.checksPatternText', {
      defaultMessage: 'Enable or disable the index pattern health check when opening the app.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CHECKS_SETUP]: {
    name: i18n.translate('wazuhCore.advancedSettings.checksSetup', {
      defaultMessage: 'API version',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.checksSetupText', {
      defaultMessage: 'Enable or disable the setup health check when opening the app.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CHECKS_TEMPLATE]: {
    name: i18n.translate('wazuhCore.advancedSettings.checksTemplate', {
      defaultMessage: 'Index template',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.checksTemplateText', {
      defaultMessage: 'Enable or disable the template health check when opening the app.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CHECKS_TIMEFILTER]: {
    name: i18n.translate('wazuhCore.advancedSettings.checksTimefilter', {
      defaultMessage: 'Set time filter to 24h',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.checksTimefilterText', {
      defaultMessage:  'Change the default value of the plugin platform timeFilter configuration.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CONFIG_UI_API_EDITABLE]: {
    name: i18n.translate('wazuhCore.advancedSettings.uiApiEditable', {
      defaultMessage: 'Configuration UI editable',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.uiApiEditableText', {
      defaultMessage: 'Enable or disable the ability to edit the configuration from UI or API endpoints. When disabled, this can only be edited from the configuration file, the related API endpoints are disabled, and the UI is inaccessible.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [CRON_PREFIX]: {
    name: i18n.translate('wazuhCore.advancedSettings.cronPrefix', {
      defaultMessage: 'Cron prefix',
    }),
    type: 'string',
    value: WAZUH_STATISTICS_DEFAULT_PREFIX,
    description: i18n.translate('wazuhCore.advancedSettings.cronPrefixText', {
      defaultMessage: 'Define the index prefix of predefined jobs.',
    }),
    category: ['wazuhCore'],
    schema: schema.string()
  },
  [CUSTOMIZATION_ENABLED]: {
    name: i18n.translate('wazuhCore.advancedSettings.customizationEnabled', {
      defaultMessage: 'Status',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.customizationEnabledText', {
      defaultMessage: 'Enable or disable the customization.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [ENROLLMENT_DNS]: {
    name: i18n.translate('wazuhCore.advancedSettings.enrollmentDns', {
      defaultMessage: 'Enrollment DNS',
    }),
    type: 'string',
    value: '',
    description: i18n.translate('wazuhCore.advancedSettings.enrollmentDnsText', {
      defaultMessage: 'Specifies the Wazuh registration server, used for the agent enrollment.',
    }),
    category: ['wazuhCore'],
    schema: schema.string()
  },
  [ENROLLMENT_PASSWORD]: {
    name: i18n.translate('wazuhCore.advancedSettings.enrollmentPassword', {
      defaultMessage: 'Enrollment password',
    }),
    type: 'string',
    value: '',
    description: i18n.translate('wazuhCore.advancedSettings.enrollmentPasswordText', {
      defaultMessage: 'Specifies the password used to authenticate during the agent enrollment.',
    }),
    category: ['wazuhCore'],
    schema: schema.string()
  },
  [IP_IGNORE]: {
    name: i18n.translate('wazuhCore.advancedSettings.ipIgnore', {
      defaultMessage: 'Index pattern ignore',
    }),
    type: 'array',
    value: [],
    description: i18n.translate('wazuhCore.advancedSettings.ipIgnoreText', {
      defaultMessage: 'Disable certain index pattern names from being available in index pattern selector.',
    }),
    category: ['wazuhCore'],
    schema: schema.arrayOf(schema.string())
  },
  [IP_SELECTOR]: {
    name: i18n.translate('wazuhCore.advancedSettings.ipSelector', {
      defaultMessage: 'IP selector',
    }),
    type: 'boolean',
    value: true,
    description: i18n.translate('wazuhCore.advancedSettings.ipSelectorText', {
      defaultMessage: 'Define if the user is allowed to change the selected index pattern directly from the top menu bar.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [WAZUH_UPDATES_DISABLED]: {
    name: i18n.translate('wazuhCore.advancedSettings.wazuhUpdatesDisabled', {
      defaultMessage: 'Check updates',
    }),
    type: 'boolean',
    value: false,
    description: i18n.translate('wazuhCore.advancedSettings.wazuhUpdatesDisabledText', {
      defaultMessage: 'Define if the check updates service is active.',
    }),
    category: ['wazuhCore'],
    schema: schema.boolean()
  },
  [REQUEST_TIMEOUT]: {
    name: i18n.translate('wazuhCore.advancedSettings.requestTimeout', {
      defaultMessage: 'Request timeout',
    }),
    type: 'number',
    value: 20000,
    description: i18n.translate('wazuhCore.advancedSettings.requestTimeoutText', {
      defaultMessage: 'Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.',
    }),
    category: ['wazuhCore'],
    schema: schema.number()
  }
}