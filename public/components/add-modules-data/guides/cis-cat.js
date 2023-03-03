/*
 * Wazuh app - CIS-CAT interactive interactive extension guide
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
const cisName = i18n.translate('wazuh.components.addModule.guide.cisName', {
  defaultMessage: 'CIS-CAT',
});
const cisWodleName = i18n.translate('wazuh.components.addModule.guide.cisWodleName', {
  defaultMessage: 'cis-cat',
});
const cisDescp = i18n.translate('wazuh.components.addModule.guide.cisDescp', {
  defaultMessage: 'Configuration options of the CIS-CAT wodle.',
});
const cisCate = i18n.translate('wazuh.components.addModule.guide.cisCate', {
  defaultMessage: 'Auditing and policy monitoring',
});
const callOutWar = i18n.translate('wazuh.components.addModule.guide.ciscat.callOutWar', {
  defaultMessage:
    'CIS-CAT is not installed by default. It is a proprietary software that you have to obtain for using this module.',
});
const title = i18n.translate('wazuh.components.addModule.guide.titleSetting', {
  defaultMessage: 'Settings',
});
const disName = i18n.translate('wazuh.components.addModule.guide.disName', {
  defaultMessage: 'disabled',
});
const disDescp = i18n.translate('wazuh.components.addModule.guide.disableCiscat', {
  defaultMessage: 'Disables the CIS-CAT wodle.',
});
const timeName = i18n.translate('wazuh.components.addModule.guide.timeName', {
  defaultMessage: 'timeout',
});
const timeDescp = i18n.translate('wazuh.components.addModule.guide.timeDescpSpecified', {
  defaultMessage:
    'Timeout for each evaluation. In case the execution takes longer that the specified timeout, it stops.',
});
const timePlace = i18n.translate('wazuh.components.addModule.guide.timePlace', {
  defaultMessage: 'Time in seconds',
});
const timeError = i18n.translate('wazuh.components.addModule.guide.timeError', {
  defaultMessage: 'A positive number (seconds)',
});
const javaName = i18n.translate('wazuh.components.addModule.guide.javaName', {
  defaultMessage: 'java_path',
});
const javaDescp = i18n.translate('wazuh.components.addModule.guide.javaDescp', {
  defaultMessage:
    'Define where Java is located. If this parameter is not set, the wodle will search for the Java location in the default environment variable $PATH.',
});
const javaPlace = i18n.translate('wazuh.components.addModule.guide.javaPlace', {
  defaultMessage: 'Java location',
});
const javaWar = i18n.translate('wazuh.components.addModule.guide.jawaWar', {
  defaultMessage:
    'For this field, it can be set a full path or a relative path. Whether you specify a relative path, it concatenates to the Wazuh installation path. ciscat_path has the same behavior.',
});
const cisPathName = i18n.translate('wazuh.components.addModule.guide.cisPathName', {
  defaultMessage: 'ciscat_path',
});
const cisPathDescp = i18n.translate('wazuh.components.addModule.guide.cisPathDescp', {
  defaultMessage: 'Define where CIS-CAT is located.',
});
const cisPathPlace = i18n.translate('wazuh.components.addModule.guide.cisPathPlace', {
  defaultMessage: 'CIS-CAT location',
});
const cisPathError = i18n.translate('wazuh.components.addModule.guide.cisPathError', {
  defaultMessage: 'Any valid path.',
});
const scanName = i18n.translate('wazuh.components.addModule.guide.scanName', {
  defaultMessage: 'scan-on-start',
});
const scanDescp = i18n.translate('wazuh.components.addModule.guide.scanDescp', {
  defaultMessage: 'Run evaluation immediately when service is started.',
});
const intervalName = i18n.translate('wazuh.components.addModule.guide.intervalName', {
  defaultMessage: 'interval',
});
const intervalDescp = i18n.translate(
  'wazuh.components.addModule.guide.intervalDescp.cisCat',
  {
    defaultMessage:
      'Interval between CIS-CAT executions.The interval option is conditioned by the following described options day, wday and time. If none of these options are set, the interval can take any allowed value.',
  },
);
const intervalPlace = i18n.translate(
  'wazuh.components.addModule.guide.intervalPlace1',
  {
    defaultMessage: 'Time in format <number><time unit suffix>, e.g.: 1d',
  },
);
const intervalError = i18n.translate(
  'wazuh.components.addModule.guide.ciscat.intervalError',
  {
    defaultMessage:
      'A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days), w (weeks), M (months). e.g: 1d',
  },
);
const intervalDefault = i18n.translate(
  'wazuh.components.addModule.guide.intervalDefault',
  {
    defaultMessage: '1d',
  },
);
const dayName = i18n.translate('wazuh.components.addModule.guide.dayName', {
  defaultMessage: 'day',
});
const dayDescp = i18n.translate('wazuh.components.addModule.guide.dayDescp', {
  defaultMessage: 'Day of the month to run the CIS-CAT scan.',
});
const dayInfo = i18n.translate('wazuh.components.addModule.guide.dayInfo', {
  defaultMessage:
    'When the day option is set, the interval value must be a multiple of months. By default, the interval is set to a month.',
});
const wDayName = i18n.translate('wazuh.components.addModule.guide.wDayName', {
  defaultMessage: 'wday',
});
const wDayDescp = i18n.translate('wazuh.components.addModule.guide.wDayDescp', {
  defaultMessage:
    'Day of the week to run the CIS-CAT scan. This option is not compatible with the day option.',
});
const wDayInfo = i18n.translate('wazuh.components.addModule.guide.wDayInfo', {
  defaultMessage:
    'When the wday option is set, the interval value must be a multiple of weeks. By default, the interval is set to a week.',
});
const weakDaysName = i18n.translate('wazuh.components.addModule.guide.weakDaysName', {
  defaultMessage: 'sunday',
});
const weakDays1Name = i18n.translate(
  'wazuh.components.addModule.guide.weakDays1Name',
  {
    defaultMessage: 'monday',
  },
);
const weakDays2Name = i18n.translate(
  'wazuh.components.addModule.guide.weakDays2Name',
  {
    defaultMessage: 'tuesday',
  },
);
const weakDays3Name = i18n.translate(
  'wazuh.components.addModule.guide.weakDays3Name',
  {
    defaultMessage: 'wednesday',
  },
);
const weakDays4Name = i18n.translate(
  'wazuh.components.addModule.guide.weakDays4Name',
  {
    defaultMessage: 'thursday',
  },
);
const weakDays5Name = i18n.translate(
  'wazuh.components.addModule.guide.weakDays5Name',
  {
    defaultMessage: 'friday',
  },
);
const weakDays6Name = i18n.translate(
  'wazuh.components.addModule.guide.weakDays6Name',
  {
    defaultMessage: 'saturday',
  },
);
const wDayPlace = i18n.translate('wazuh.components.addModule.guide.wDayPlace', {
  defaultMessage: 'Day of the month [1..31]',
});
const wDayError = i18n.translate('wazuh.components.addModule.guide.wDayError', {
  defaultMessage: 'sunday',
});
const wDayDefault = i18n.translate('wazuh.components.addModule.guide.wDayDefault', {
  defaultMessage: 'Day of the month [1..31]',
});
const timeDayName = i18n.translate('wazuh.components.addModule.guide.timeDayName', {
  defaultMessage: 'time',
});
const timeDayDescp = i18n.translate('wazuh.components.addModule.guide.timeDayDescp', {
  defaultMessage:
    'Time of the day to run the scan. It has to be represented in the format hh:mm.',
});
const timeDayPlace = i18n.translate('wazuh.components.addModule.guide.timeDayPlace', {
  defaultMessage: 'Time of day',
});
const timeDayError = i18n.translate('wazuh.components.addModule.guide.timeDayError', {
  defaultMessage: 'Time of day in hh:mm format',
});
const title1 = i18n.translate('wazuh.components.addModule.guide.title.content', {
  defaultMessage: 'Content',
});
const title1Descp = i18n.translate('wazuh.components.addModule.guide.defineEvaluations', {
  defaultMessage: 'Define an evaluation.',
});
const contentFileName = i18n.translate(
  'wazuh.components.addModule.guide.contentFileName',
  {
    defaultMessage: 'content',
  },
);
const contentFileDescp = i18n.translate(
  'wazuh.components.addModule.guide.contentFileDescp.evaluation',
  {
    defaultMessage:
      'Define an evaluation. At present, you can only run assessments for XCCDF policy files.',
  },
);
const contentFileError = i18n.translate(
  'wazuh.components.addModule.guide.contentFileError',
  {
    defaultMessage: 'Any directory or file name.',
  },
);
const selContentName = i18n.translate(
  'wazuh.components.addModule.guide.selContentName',
  {
    defaultMessage: 'type',
  },
);
const selContentDescp = i18n.translate(
  'wazuh.components.addModule.guide.selContentDescp',
  {
    defaultMessage: 'Select content type.',
  },
);
const selContentDefault = i18n.translate(
  'wazuh.components.addModule.guide.selContentDefault',
  {
    defaultMessage: 'xccdf',
  },
);
const policyName = i18n.translate('wazuh.components.addModule.guide.policyName', {
  defaultMessage: 'path',
});
const policyDescp = i18n.translate('wazuh.components.addModule.guide.policyDescp', {
  defaultMessage: 'Use the specified policy file.',
});
const policyInfo = i18n.translate('wazuh.components.addModule.guide.policyInfo', {
  defaultMessage:
    'The path attribute can be filled in with the whole path where the benchmark files are located, or with a relative path to the CIS-CAT tool location.',
});
const policyPlace = i18n.translate('wazuh.components.addModule.guide.policyPlace', {
  defaultMessage: 'Path where the benchmark files are located',
});
const policyError = i18n.translate('wazuh.components.addModule.guide.policyError', {
  defaultMessage: 'Path where the benchmark files are located',
});
const evaTimeName = i18n.translate('wazuh.components.addModule.guide.evaTimeName', {
  defaultMessage: 'timeout',
});
const evaTimeDescp = i18n.translate('wazuh.components.addModule.guide.evaTimeDescp', {
  defaultMessage:
    'Timeout for the evaluation (in seconds).Use of this attribute overwrites the generic timeout.',
});
const evaTimeError = i18n.translate('wazuh.components.addModule.guide.ciscat.evaTimeError', {
  defaultMessage: 'A positive number (seconds)',
});
const selProfileName = i18n.translate(
  'wazuh.components.addModule.guide.selProfileName',
  {
    defaultMessage: 'profile',
  },
);
const selProfileDescp = i18n.translate(
  'wazuh.components.addModule.guide.selProfileDescp',
  {
    defaultMessage: 'Select profile.',
  },
);
const selProfileError = i18n.translate(
  'wazuh.components.addModule.guide.selProfileError',
  {
    defaultMessage: 'A valid profile.',
  },
);
const selProfilePlace = i18n.translate(
  'wazuh.components.addModule.guide.selProfilePlace',
  {
    defaultMessage: 'Profile',
  },
);
export default {
  id: 'ciscat',
  name: cisName,
  wodle_name: cisWodleName,
  description: cisDescp,
  category: cisCate,
  documentation_link: webDocumentationLink(
    'user-manual/reference/ossec-conf/wodle-ciscat.html',
  ),
  icon: 'securityApp',
  callout_warning: callOutWar,
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
          name: javaName,
          description: javaDescp,
          warning: javaWar,
          type: 'input',
          placeholder: javaPlace,
        },
        {
          name: cisPathName,
          description: cisPathDescp,
          type: 'input',
          required: true,
          placeholder: cisPathPlace,
          validate_error_message: cisPathError,
        },
        {
          name: scanName,
          description: scanDescp,
          type: 'switch',
        },
        {
          name: intervalName,
          description: intervalDescp,
          type: 'input',
          default_value: intervalDefault,
          placeholder: intervalPlace,
          validate_error_message: intervalError,
          validate_regex: /^[1-9]\d*[s|m|h|d|w|M]$/,
        },
        {
          name: dayName,
          description: dayDescp,
          info: dayInfo,
          type: 'select',
          values: [
            { value: '1', text: '1' },
            { value: '2', text: '2' },
            { value: '3', text: '3' },
            { value: '4', text: '4' },
            { value: '5', text: '5' },
            { value: '6', text: '6' },
            { value: '7', text: '7' },
            { value: '8', text: '8' },
            { value: '9', text: '9' },
            { value: '10', text: '10' },
            { value: '11', text: '11' },
            { value: '12', text: '12' },
            { value: '13', text: '13' },
            { value: '14', text: '14' },
            { value: '15', text: '15' },
            { value: '16', text: '16' },
            { value: '17', text: '17' },
            { value: '18', text: '18' },
            { value: '19', text: '19' },
            { value: '20', text: '20' },
            { value: '21', text: '21' },
            { value: '22', text: '22' },
            { value: '23', text: '23' },
            { value: '24', text: '24' },
            { value: '25', text: '25' },
            { value: '26', text: '26' },
            { value: '27', text: '27' },
            { value: '28', text: '28' },
            { value: '29', text: '29' },
            { value: '30', text: '30' },
            { value: '31', text: '31' },
          ],
          default_value: '1',
        },
        {
          name: wDayName,
          description: wDayDescp,
          info: wDayInfo,
          type: 'select',
          values: [
            { value: 'sunday', text: weakDaysName },
            { value: 'monday', text: weakDays1Name },
            { value: 'tuesday', text: weakDays2Name },
            { value: 'wednesday', text: weakDays3Name },
            { value: 'thursday', text: weakDays4Name },
            { value: 'friday', text: weakDays5Name },
            { value: 'saturday', text: weakDays6Name },
          ],
          default_value: wDayDefault,
          placeholder: wDayPlace,
          validate_error_message: wDayError,
        },
        {
          name: timeDayName,
          description: timeDayDescp,
          type: 'input',
          placeholder: timeDayPlace,
          validate_error_message: timeDayError,
          validate_regex: /^(((0[0-9])|(1[0-9])|(2[0-4])):[0-5][0-9])$/,
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
          removable: false,
          required: true,
          validate_error_message: contentFileError,
          show_attributes: true,
          show_options: true,
          attributes: [
            {
              name: selContentName,
              description: selContentDescp,
              type: 'input',
              required: true,
              default_value: selContentDefault,
              field_read_only: true,
            },
            {
              name: policyName,
              description: policyDescp,
              info: policyInfo,
              type: 'input',
              required: true,
              placeholder: policyPlace,
              validate_error_message: policyError,
            },
            {
              name: evaTimeName,
              description: evaTimeDescp,
              type: 'input-number',
              values: { min: 1 },
              default_value: 1800,
              validate_error_message: evaTimeError,
            },
          ],
          options: [
            {
              name: selProfileName,
              description: selProfileDescp,
              type: 'input',
              required: true,
              placeholder: selProfilePlace,
              validate_error_message: selProfileError,
            },
          ],
        },
      ],
    },
  ],
};
