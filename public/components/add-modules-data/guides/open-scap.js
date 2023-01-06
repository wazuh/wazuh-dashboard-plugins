/*
 * Wazuh app - OpenSCAP interactive extension guide
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

const openName = i18n.translate('wazuh.components.addModule.guide.openName', {
  defaultMessage: 'OpenSCAP',
});
const openWodleName = i18n.translate(
  'wazuh.components.addModule.guide.openWodleName',
  {
    defaultMessage: 'open-scap',
  },
);
const openDescp = i18n.translate('wazuh.components.addModule.guide.openDescp', {
  defaultMessage: 'Configuration options of the OpenSCAP wodle.',
});
const openCate = i18n.translate('wazuh.components.addModule.guide.openCate', {
  defaultMessage: 'Auditing and policy monitoring',
});
const title = i18n.translate('wazuh.components.addModule.guide.titleSetting', {
  defaultMessage: 'Settings',
});
const disName = i18n.translate('wazuh.components.addModule.guide.disName', {
  defaultMessage: 'disabled',
});
const disDescp = i18n.translate('wazuh.components.addModule.guide.disable.oscap', {
  defaultMessage: 'Disables the OpenSCAP wodle.',
});

const timeName = i18n.translate('wazuh.components.addModule.guide.timeName', {
  defaultMessage: 'timeout',
});
const timeDescp = i18n.translate('wazuh.components.addModule.guide.timeDescp', {
  defaultMessage: 'Timeout for each evaluation in seconds',
});
const timePlace = i18n.translate('wazuh.components.addModule.guide.timePlace', {
  defaultMessage: 'Time in seconds',
});
const timeError = i18n.translate('wazuh.components.addModule.guide.timeError', {
  defaultMessage: 'A positive number (seconds)',
});

const intervalName = i18n.translate('wazuh.components.addModule.guide.intervalName', {
  defaultMessage: 'interval',
});
const intervalDescp = i18n.translate(
  'wazuh.components.addModule.guide.intervalDescp.openScap',
  {
    defaultMessage: 'Interval between OpenSCAP executions.',
  },
);
const intervalPlace = i18n.translate(
  'wazuh.components.addModule.guide.intervalPlace1',
  {
    defaultMessage: 'Time in format <number><time unit suffix>, e.g.: 1d',
  },
);
const intervalError = i18n.translate(
  'wazuh.components.addModule.guide.oscap.intervalError',
  {
    defaultMessage:
      'A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days).',
  },
);
const intervalDefault = i18n.translate(
  'wazuh.components.addModule.guide.intervalDefault',
  {
    defaultMessage: '1d',
  },
);
const scanName = i18n.translate('wazuh.components.addModule.guide.scanName', {
  defaultMessage: 'scan-on-start',
});
const scanDescp = i18n.translate('wazuh.components.addModule.guide.scanDescp', {
  defaultMessage: 'Run evaluation immediately when service is started.',
});
const title1 = i18n.translate('wazuh.components.addModule.guide.title.content', {
  defaultMessage: 'Content',
});
const title1Descp = i18n.translate('wazuh.components.addModule.guide.defineEvaluation', {
  defaultMessage: 'Define evaluation.',
});
const contentFileName = i18n.translate(
  'wazuh.components.addModule.guide.contentFileName',
  {
    defaultMessage: 'content',
  },
);
const contentFileDescp = i18n.translate(
  'wazuh.components.addModule.guide.contentFileDescp.defineEvaluation',
  {
    defaultMessage: 'Define an evaluation.',
  },
);
const contentFileError = i18n.translate(
  'wazuh.components.addModule.guide.contentFileError',
  {
    defaultMessage: 'Any directory or file name.',
  },
);
const typeName = i18n.translate('wazuh.components.addModule.guide.typeName', {
  defaultMessage: 'type',
});
const typeDescp = i18n.translate('wazuh.components.addModule.guide.typeDescp', {
  defaultMessage: 'Select content type: xccdf or oval.',
});
const text1 = i18n.translate('wazuh.components.addModule.guide.oscap', {
  defaultMessage: 'xccdf',
});
const text2 = i18n.translate('wazuh.components.addModule.guide.oscap.oval', {
  defaultMessage: 'oval',
});
const pathName = i18n.translate('wazuh.components.addModule.guide.pathName', {
  defaultMessage: 'path',
});
const pathDescp = i18n.translate('wazuh.components.addModule.guide.pathDescp.oscap', {
  defaultMessage: 'Use the specified policy file (DataStream, XCCDF or OVAL).',
});
const pathPlace = i18n.translate('wazuh.components.addModule.guide.policyFile', {
  defaultMessage: 'Policy file',
});
const pathError = i18n.translate('wazuh.components.addModule.guide.pathError', {
  defaultMessage: 'Use the specified policy file',
});
const evaTimeName = i18n.translate('wazuh.components.addModule.guide.evaTimeName', {
  defaultMessage: 'timeout',
});
const evaTimeDescp = i18n.translate('wazuh.components.addModule.guide.evaTimeDescp', {
  defaultMessage:
    'Timeout for the evaluation (in seconds).Use of this attribute overwrites the generic timeout.',
});
const evaTimePlace = i18n.translate('wazuh.components.addModule.guide.evaTimePlace', {
  defaultMessage: 'Time in seconds',
});
const evaTimeError = i18n.translate('wazuh.components.addModule.guide.oscap.evaTimeError', {
  defaultMessage: 'A positive number',
});
const xccName = i18n.translate('wazuh.components.addModule.guide.xccName', {
  defaultMessage: 'xccdf-id',
});
const xccDescp = i18n.translate('wazuh.components.addModule.guide.xccDescp', {
  defaultMessage: 'XCCDF id.',
});
const xccPlace = i18n.translate('wazuh.components.addModule.guide.xccPlace', {
  defaultMessage: 'XCCDF id',
});
const ovalName = i18n.translate('wazuh.components.addModule.guide.ovalName', {
  defaultMessage: 'oval-id',
});
const ovalDescp = i18n.translate('wazuh.components.addModule.guide.ovalDescp', {
  defaultMessage: 'OVAL id.',
});
const ovalPlace = i18n.translate('wazuh.components.addModule.guide.ovalPlace', {
  defaultMessage: 'OVAL id',
});
const dataName = i18n.translate('wazuh.components.addModule.guide.dataName', {
  defaultMessage: 'datastream-id',
});
const dataDescp = i18n.translate('wazuh.components.addModule.guide.dataDescp', {
  defaultMessage: 'Datastream id.',
});
const dataPlace = i18n.translate('wazuh.components.addModule.guide.dataPlace', {
  defaultMessage: 'Datastream id',
});
const cpeName = i18n.translate('wazuh.components.addModule.guide.cpeName', {
  defaultMessage: 'cpe',
});
const cpeDescp = i18n.translate('wazuh.components.addModule.guide.cpeDescp', {
  defaultMessage: 'CPE dictionary file.',
});
const cpePlace = i18n.translate('wazuh.components.addModule.guide.cpePlace', {
  defaultMessage: '/var/ossec/wodles/oscap/content',
});
const cpeError = i18n.translate('wazuh.components.addModule.guide.cpeError', {
  defaultMessage: 'CPE dictionary file.',
});
const cpeDefault = i18n.translate('wazuh.components.addModule.guide.cpeDefault', {
  defaultMessage: '/var/ossec/wodles/oscap/content',
});
const profileName = i18n.translate('wazuh.components.addModule.guide.profileName', {
  defaultMessage: 'profile',
});
const profileDescp = i18n.translate('wazuh.components.addModule.guide.profileDescp', {
  defaultMessage: 'Select profile.',
});
const profilePlace = i18n.translate('wazuh.components.addModule.guide.profilePlace', {
  defaultMessage: 'Profile',
});
export default {
  id: 'oscap',
  name: openName,
  wodle_name: openWodleName,
  description: openDescp,
  category: openCate,
  documentation_link: webDocumentationLink(
    'user-manual/reference/ossec-conf/wodle-openscap.html',
  ),
  icon: 'securityApp',
  avaliable_for_manager: true,
  avaliable_for_agent: true,
  steps: [
    {
      title: title,
      description: '',
      elements: [
        {
          name: disName,
          description: disDescp,
          type: 'switch',
          required: true,
        },
        {
          name: timeName,
          description: timeDescp,
          type: 'input-number',
          required: true,
          placeholder: timePlace,
          values: { min: 1 },
          default_value: 1800,
          validate_error_message: timeError,
        },
        {
          name: intervalName,
          description: intervalDescp,
          type: 'input',
          required: true,
          placeholder: intervalPlace,
          default_value: intervalDefault,
          validate_error_message: intervalError,
          validate_regex: /^[1-9]\d*[s|m|h|d]$/,
        },
        {
          name: scanName,
          description: scanDescp,
          type: 'switch',
          required: true,
          default_value: true,
        },
      ],
    },
    {
      title: title1,
      description: title1Descp,
      elements: [
        {
          name: contentFileName,
          description: contentFileDescp,
          removable: true,
          required: true,
          repeatable: true,
          repeatable_insert_first: true,
          repeatable_insert_first_properties: {
            removable: false,
          },
          validate_error_message: contentFileError,
          show_attributes: true,
          attributes: [
            {
              name: typeName,
              description: typeDescp,
              type: 'select',
              required: true,
              values: [
                { value: 'xccdf ', text: text1 },
                { value: 'oval', text: text2 },
              ],
              default_value: 'xccdf',
            },
            {
              name: pathName,
              description: pathDescp,
              type: 'input',
              required: true,
              placeholder: pathPlace,
              default_value: '/var/ossec/wodles/oscap/content',
              validate_error_message: pathError,
            },
            {
              name: evaTimeName,
              description: evaTimeDescp,
              type: 'input-number',
              placeholder: evaTimePlace,
              values: { min: 1 },
              default_value: 1800,
              validate_error_message: evaTimeError,
            },
            {
              name: xccName,
              description: xccDescp,
              type: 'input',
              placeholder: xccPlace,
            },
            {
              name: ovalName,
              description: ovalDescp,
              type: 'input',
              placeholder: ovalPlace,
            },
            {
              name: dataName,
              description: dataDescp,
              type: 'input',
              placeholder: dataPlace,
            },
            {
              name: cpeName,
              description: cpeDescp,
              type: 'input',
              placeholder: cpePlace,
              default_value: cpeDefault,
              validate_error_message: cpeError,
            },
          ],
          show_options: true,
          options: [
            {
              name: profileName,
              description: profileDescp,
              type: 'input',
              placeholder: profilePlace,
              repeatable: true,
              removable: true,
              required: true,
              repeatable_insert_first: true,
              repeatable_insert_first_properties: {
                removable: false,
              },
            },
          ],
        },
      ],
    },
  ],
};
