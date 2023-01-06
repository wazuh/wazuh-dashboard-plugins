/*
 * Wazuh app - Vulnerabilites extension guide
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';

const vulnerabilitiesName = i18n.translate(
  'wazuh.components.addModule.guide.vulnerabilitiesName',
  {
    defaultMessage: 'Vulnerabilities',
  },
);
const vulnerabilitiesTag = i18n.translate(
  'wazuh.components.addModule.guide.vulnerabilitiesTag',
  {
    defaultMessage: 'vulnerabilities-detector',
  },
);
const vulnerabilitiesDescp = i18n.translate(
  'wazuh.components.addModule.guide.vulnerabilitiesDescp',
  {
    defaultMessage: 'Configuration options for vulnerabilities.',
  },
);
const vulnerabilitiesCate = i18n.translate(
  'wazuh.components.addModule.guide.vulnerabilitiesCate',
  {
    defaultMessage: 'Threat detection and response',
  },
);

const title = i18n.translate('wazuh.components.addModule.guide.titleSetting', {
  defaultMessage: 'Settings',
});
const enabledName = i18n.translate('wazuh.components.addModule.guide.enabledName', {
  defaultMessage: 'enabled',
});
const enableModule = i18n.translate('wazuh.components.addModule.guide.enableModule', {
  defaultMessage: 'Enables the module.',
});
const intervalName = i18n.translate('wazuh.components.addModule.guide.intervalName', {
  defaultMessage: 'interval',
});
const intervalDescp = i18n.translate(
  'wazuh.components.addModule.guide.intervalDescp.vulnerability',
  {
    defaultMessage: 'Time between vulnerabilities scans..',
  },
);
const intervalPlace = i18n.translate(
  'wazuh.components.addModule.guide.intervalPlace',
  {
    defaultMessage: 'Time in format <number><time unit suffix>',
  },
);
const intervalDefault = i18n.translate(
  'wazuh.components.addModule.guide.intervalDefault5',
  {
    defaultMessage: '5m',
  },
);
const intervalError = i18n.translate(
  'wazuh.components.addModule.guide.vul.intervalError',
  {
    defaultMessage:
      'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
  },
);
const runStartName = i18n.translate('wazuh.components.addModule.guide.runStartName', {
  defaultMessage: 'run_on_start',
});
const runStartDescp = i18n.translate(
  'wazuh.components.addModule.guide.runStartDescp',
  {
    defaultMessage:
      'Runs updates and vulnerabilities scans immediately when service is started.',
  },
);
const ignoreName = i18n.translate('wazuh.components.addModule.guide.ignoreTime', {
  defaultMessage: 'ignore_time',
});
const ignoreDescp = i18n.translate('wazuh.components.addModule.guide.ignoreDescp.vul', {
  defaultMessage:
    'Time during which vulnerabilities that have already been alerted will be ignored.',
});
const ignorePlace = i18n.translate('wazuh.components.addModule.guide.ignorePlace.vul', {
  defaultMessage: 'Time in format <number><time unit suffix>',
});
const ignoreDefault = i18n.translate(
  'wazuh.components.addModule.guide.ignoreDefault',
  {
    defaultMessage: '6h',
  },
);
const ignoreError = i18n.translate('wazuh.components.addModule.guide.ignoreError', {
  defaultMessage:
    'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
});
const title1 = i18n.translate('wazuh.components.addModule.guide.providers', {
  defaultMessage: 'Providers',
});
const title1Descp = i18n.translate('wazuh.components.addModule.guide.vulnerabilityUpdate', {
  defaultMessage: 'Define providers of vulnerability updates.',
});
const providerName = i18n.translate('wazuh.components.addModule.guide.providerName', {
  defaultMessage: 'provider',
});
const providerDescp = i18n.translate(
  'wazuh.components.addModule.guide.providerDescp',
  {
    defaultMessage: 'Configuration block to specify vulnerability updates.',
  },
);
const defineName = i18n.translate('wazuh.components.addModule.guide.defineName', {
  defaultMessage: 'name',
});
const defineDescp = i18n.translate('wazuh.components.addModule.guide.defineDescp', {
  defaultMessage: 'Defines a vulnerability information provider.',
});
const text1 = i18n.translate('wazuh.components.addModule.guide.vulnerability.canonical', {
  defaultMessage: 'canonical',
});
const text2 = i18n.translate('wazuh.components.addModule.guide.debian', {
  defaultMessage: 'debian',
});
const text3 = i18n.translate('wazuh.components.addModule.guide.redhat', {
  defaultMessage: 'redhat',
});
const text4 = i18n.translate('wazuh.components.addModule.guide.vulnerability.nvd', {
  defaultMessage: 'nvd',
});
const providerDefaultVal = i18n.translate(
  'wazuh.components.addModule.guide.providerDefaultVal',
  {
    defaultMessage: 'canonical',
  },
);
const enabledDescp = i18n.translate('wazuh.components.addModule.guide.enabledDescp', {
  defaultMessage: 'Enables the vulnerability provider update.',
});
const osName = i18n.translate('wazuh.components.addModule.guide.osName', {
  defaultMessage: 'os',
});
const osDescp = i18n.translate('wazuh.components.addModule.guide.osDescp', {
  defaultMessage: 'Feed to update.',
});
const text5 = i18n.translate('wazuh.components.addModule.guide.vul.canonical', {
  defaultMessage: 'canonical',
});
const text6 = i18n.translate('wazuh.components.addModule.guide.text6', {
  defaultMessage: 'trusty',
});
const text7 = i18n.translate('wazuh.components.addModule.guide.text7', {
  defaultMessage: 'bionic',
});
const text8 = i18n.translate('wazuh.components.addModule.guide.text8', {
  defaultMessage: 'wheez',
});
const text9 = i18n.translate('wazuh.components.addModule.guide.text9', {
  defaultMessage: 'canonical',
});
const text10 = i18n.translate('wazuh.components.addModule.guide.text10', {
  defaultMessage: 'stretch',
});
const text11 = i18n.translate('wazuh.components.addModule.guide.text11', {
  defaultMessage: 'redhat',
});
const text12 = i18n.translate('wazuh.components.addModule.guide.text12', {
  defaultMessage: 'buster',
});
const preciseDefaultVal = i18n.translate(
  'wazuh.components.addModule.guide.preciseDefaultVal',
  {
    defaultMessage: 'precise',
  },
);
const updateName = i18n.translate('wazuh.components.addModule.guide.updateName', {
  defaultMessage: 'update_interval',
});
const updateDescp = i18n.translate('wazuh.components.addModule.guide.updateDescp', {
  defaultMessage:
    'How often the vulnerability database is updated. It has priority over the update_interval option of the provider block.',
});
const updateError = i18n.translate('wazuh.components.addModule.guide.updateError', {
  defaultMessage:
    'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
});
const urlName = i18n.translate('wazuh.components.addModule.guide.urlName', {
  defaultMessage: 'url',
});
const urlDescp = i18n.translate('wazuh.components.addModule.guide.urlDescp', {
  defaultMessage: 'Defines the link to an alternative OVAL files.',
});
const urlPlace = i18n.translate('wazuh.components.addModule.guide.urlPlace', {
  defaultMessage:
    'Link to download the OVAL file obtained from Canonical or Debian.',
});
const pathName = i18n.translate('wazuh.components.addModule.guide.pathName', {
  defaultMessage: 'path',
});
const pathDescp = i18n.translate('wazuh.components.addModule.guide.pathDescp.vul', {
  defaultMessage: 'Defines the path to an alternative OVAL file.',
});
const portName = i18n.translate('wazuh.components.addModule.guide.portName', {
  defaultMessage: 'port',
});
const portDescp = i18n.translate('wazuh.components.addModule.guide.portDescp', {
  defaultMessage: 'Defines the connection port when using the url attribute.',
});
const portError = i18n.translate('wazuh.components.addModule.guide.portError', {
  defaultMessage: 'A valid port.',
});
const allowName = i18n.translate('wazuh.components.addModule.guide.allowName', {
  defaultMessage: 'allow',
});
const allowDescp = i18n.translate('wazuh.components.addModule.guide.allowDescp', {
  defaultMessage: 'Defines compatibility with unsupported systems.',
});
const allowError = i18n.translate('wazuh.components.addModule.guide.allowError', {
  defaultMessage: 'A valid operating system not supported by default.',
});
const updateIntervalName = i18n.translate(
  'wazuh.components.addModule.guide.updateIntervalName',
  {
    defaultMessage: 'update_interval',
  },
);
const updateIntervalDescp = i18n.translate(
  'wazuh.components.addModule.guide.updateIntervalDescp',
  {
    defaultMessage:
      'How often the vulnerabilities of the provider are updated. It can be overwritten by the attribute with the same name of <os>.',
  },
);
const updateIntervalPlace = i18n.translate(
  'wazuh.components.addModule.guide.updateIntervalPlace',
  {
    defaultMessage:
      'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
  },
);
const updateIntervalError = i18n.translate(
  'wazuh.components.addModule.guide.updateIntervalError',
  {
    defaultMessage:
      'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
  },
);
const updateIntervalDefault = i18n.translate(
  'wazuh.components.addModule.guide.updateIntervalDefault',
  {
    defaultMessage: '1h',
  },
);
const updateFromName = i18n.translate(
  'wazuh.components.addModule.guide.updateFromName',
  {
    defaultMessage: 'update_from_year',
  },
);
const updateFromDescp = i18n.translate(
  'wazuh.components.addModule.guide.updateFromDescp',
  {
    defaultMessage: 'Year from which the provider will be updated.',
  },
);
const updateFromPlace = i18n.translate(
  'wazuh.components.addModule.guide.updateFromPlace',
  {
    defaultMessage: 'Year from which the provider will be updated.',
  },
);
const updateFromError = i18n.translate(
  'wazuh.components.addModule.guide.updateFromError',
  {
    defaultMessage: 'Year from which the provider will be updated.',
  },
);
const updateFromDefault = i18n.translate(
  'wazuh.components.addModule.guide.updateFromDefault',
  {
    defaultMessage: '2010',
  },
);
const defineAllowName = i18n.translate(
  'wazuh.components.addModule.guide.defineAllowName',
  {
    defaultMessage: 'allow',
  },
);
const defineAllowDescp = i18n.translate(
  'wazuh.components.addModule.guide.defineAllowDescp',
  {
    defaultMessage: 'Defines compatibility with unsupported systems.',
  },
);
const replaceOsName = i18n.translate(
  'wazuh.components.addModule.guide.replaceOsName',
  {
    defaultMessage: 'replaced_os',
  },
);
const replaceOsDescp = i18n.translate(
  'wazuh.components.addModule.guide.replaceOsDescp',
  {
    defaultMessage:
      'Defines the version of Red Hat that will replace the unsupported system.',
  },
);
const replaceOsPlace = i18n.translate(
  'wazuh.components.addModule.guide.replaceOsPlace',
  {
    defaultMessage:
      'A numeric value that in substitution with the tag forms a valid link.',
  },
);
const replaceOsError = i18n.translate(
  'wazuh.components.addModule.guide.replaceOsError',
  {
    defaultMessage:
      'A numeric value that in substitution with the tag forms a valid link.',
  },
);
const defineUrlName = i18n.translate(
  'wazuh.components.addModule.guide.defineUrlName',
  {
    defaultMessage: 'url',
  },
);
const defineUrlDescp = i18n.translate(
  'wazuh.components.addModule.guide.defineUrlDescp',
  {
    defaultMessage: 'Defines the link to an alternative feed files.',
  },
);
const defineUrlPlace = i18n.translate(
  'wazuh.components.addModule.guide.defineUrlPlace',
  {
    defaultMessage: 'Defines the link to an alternative feed files.',
  },
);
const startName = i18n.translate('wazuh.components.addModule.guide.startName', {
  defaultMessage: 'start',
});
const startDescp = i18n.translate('wazuh.components.addModule.guide.startDescp', {
  defaultMessage: 'Defines the first value which the tag will be substituted.',
});
const startPlace = i18n.translate('wazuh.components.addModule.guide.startPlace', {
  defaultMessage:
    'A numeric value that in substitution with the tag forms a valid link.',
});
const startError = i18n.translate('wazuh.components.addModule.guide.startError', {
  defaultMessage:
    'A numeric value that in substitution with the tag forms a valid link.',
});
const endName = i18n.translate('wazuh.components.addModule.guide.endName', {
  defaultMessage: 'end',
});
const endDescp = i18n.translate('wazuh.components.addModule.guide.endDescp', {
  defaultMessage: 'Defines the last which the tag will be substituted.',
});
const connectionPortName = i18n.translate(
  'wazuh.components.addModule.guide.connectionPortName',
  {
    defaultMessage: 'port',
  },
);
const connectionPortDescp = i18n.translate(
  'wazuh.components.addModule.guide.connectionPortDescp',
  {
    defaultMessage: 'Defines the connection port.',
  },
);
const connectionPortPlace = i18n.translate(
  'wazuh.components.addModule.guide.connectionPortPlace',
  {
    defaultMessage: 'A valid port.',
  },
);
const connectionPortError = i18n.translate(
  'wazuh.components.addModule.guide.connectionPortError',
  {
    defaultMessage: 'A valid port.',
  },
);
const allFeedName = i18n.translate('wazuh.components.addModule.guide.allFeedName', {
  defaultMessage: 'path',
});
const allFeedDescp = i18n.translate('wazuh.components.addModule.guide.allFeedDescp', {
  defaultMessage: 'Defines the path to an alternative feed files.',
});
const allFeedPlace = i18n.translate('wazuh.components.addModule.guide.allFeedPlace', {
  defaultMessage: 'A valid path.',
});

export default {
  id: 'vuls',
  xml_tag: vulnerabilitiesTag,
  name: vulnerabilitiesName,
  description: vulnerabilitiesDescp,
  category: vulnerabilitiesCate,
  documentation_link: webDocumentationLink(
    'user-manual/reference/ossec-conf/vuln-detector.html',
  ),
  icon: 'securityApp',
  avaliable_for_manager: true,
  steps: [
    {
      title: title,
      description: '',
      elements: [
        {
          name: enabledName,
          description: enableModule,
          type: 'switch',
          required: true,
        },
        {
          name: intervalName,
          description: intervalDescp,
          type: 'input',
          required: true,
          default_value: intervalDefault,
          placeholder: intervalPlace,
          validate_error_message: ignoreError,
          validate_regex: /^[1-9]\d*[s|m|h|d]$/,
        },
        {
          name: runStartName,
          description: runStartDescp,
          type: 'switch',
          required: true,
          default_value: true,
        },
        {
          name: ignoreName,
          description: ignoreDescp,
          type: 'input',
          default_value: ignoreDefault,
          placeholder: ignorePlace,
          validate_error_message: ignoreError,
          validate_regex: /^[1-9]\d*[s|m|h|d]$/,
        },
      ],
    },
    {
      title: title1,
      description: title1Descp,
      elements: [
        {
          name: providerName,
          description: providerDescp,
          repeatable: true,
          required: true,
          removable: true,
          repeatable_insert_first: true,
          repeatable_insert_first_properties: {
            removable: false,
          },
          attributes: [
            {
              name: defineName,
              description: defineDescp,
              type: 'select',
              required: true,
              values: [
                { value: 'canonical', text: text1 },
                { value: 'debian', text: text2 },
                { value: 'redhat', text: text3 },
                { value: 'nvd', text: text4 },
              ],
              default_value: providerDefaultVal,
            },
          ],
          show_options: true,
          options: [
            {
              name: enabledName,
              description: enabledDescp,
              type: 'switch',
              required: true,
            },
            {
              name: osName,
              description: osDescp,
              type: 'select',
              info: `For canonical: ()`,

              repeatable: true,
              removable: true,
              required: true,
              values: [
                { value: 'precise', text: text5 },
                { value: 'trusty', text: text6 },
                { value: 'xenial', text: text7 },
                { value: 'bionic', text: text8 },
                { value: 'wheezy', text: text9 },
                { value: 'jessie', text: text10 },
                { value: 'stretch', text: text11 },
                { value: 'buster', text: text12 },
              ],
              default_value: preciseDefaultVal,
              attributes: [
                {
                  name: updateName,
                  description: updateDescp,
                  type: 'input',
                  validate_error_message: updateError,
                  validate_regex: /^[1-9]\d*[s|m|h|d]$/,
                },
                {
                  name: urlName,
                  description: urlDescp,
                  type: 'input',
                  placeholder: urlPlace,
                },
                {
                  name: pathName,
                  description: pathDescp,
                  type: 'input',
                  placeholder: '',
                },
                {
                  name: portName,
                  description: portDescp,
                  type: 'input-number',
                  values: { min: 0 },
                  default_value: '',
                  validate_error_message: portError,
                },
                {
                  name: allowName,
                  description: allowDescp,
                  info: `You can find a guide on how to set it up ${webDocumentationLink(
                    'user-manual/capabilities/vulnerability-detection/allow_os.html',
                  )}`,
                  type: 'input',
                  validate_error_message: allowError,
                },
              ],
            },
            {
              name: updateIntervalName,
              description: updateIntervalDescp,
              type: 'input',
              default_value: updateIntervalDefault,
              placeholder: updateIntervalPlace,
              validate_error_message: updateIntervalError,
              validate_regex: /^[1-9]\d*[s|m|h|d]$/,
            },
            {
              name: updateFromName,
              description: updateFromDescp,
              default_value: updateFromDefault,
              type: 'input',
              placeholder: updateFromPlace,
              validate_regex: /^([1-9]\d{3})$/,
              validate_error_message: updateFromError,
            },
            {
              name: defineAllowName,
              description: defineAllowDescp,
              attributes: [
                {
                  name: replaceOsName,
                  description: replaceOsDescp,
                  type: 'input',
                  placeholder: replaceOsPlace,
                  validate_error_message: replaceOsError,
                },
              ],
            },
            {
              name: defineUrlName,
              description: defineUrlDescp,
              type: 'input',
              placeholder: defineUrlPlace,
              attributes: [
                {
                  name: startName,
                  description: startDescp,
                  type: 'input-number',
                  values: { min: 0 },
                  default_value: '',
                  placeholder: startPlace,
                  validate_error_message: startError,
                },
                {
                  name: endName,
                  description: enabledDescp,
                  type: 'input-number',
                  values: { min: 0 },
                  default_value: '',
                  placeholder: startPlace,
                  validate_error_message: startError,
                },
                {
                  name: connectionPortName,
                  description: connectionPortDescp,
                  type: 'input-number',
                  values: { min: 0 },
                  placeholder: connectionPortPlace,
                  validate_error_message: connectionPortError,
                },
              ],
            },
            {
              name: allFeedName,
              description: allFeedDescp,
              type: 'input',
              placeholder: allFeedPlace,
            },
          ],
        },
      ],
    },
  ],
};
