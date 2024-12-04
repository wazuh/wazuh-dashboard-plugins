import { UiSettingsParams } from "opensearch-dashboards/server";
import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';
import { WAZUH_SAMPLE_ALERT_PREFIX } from "../common/constants";

const HIDE_MANAGER_ALERTS_SETTING = 'hideManagerAlerts';
const ALERTS_SAMPLE_PREFIX = 'alerts.sample.prefix';
// Checks
const CHECKS_API = 'checks.api';
const CHECKS_FIELDS = 'checks.fields';
const CHECKS_MAX_BUCKETS = 'checks.max_buckets';
const CHECKS_META_FIELDS = 'checks.meta_fields';
const CHECKS_PATTERN = 'checks.pattern';
const CHECKS_SETUP = 'checks.setup';
const CHECKS_TEMPLATE = 'checks.template';
const CHECKS_TIMEFILTER = 'checks.timefilter';

const CONFIG_UI_API_EDITABLE = 'configuration.ui_api_editable';

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
    }
}