/*
 * Wazuh app - Osquery interactive extension guide
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
const disName = i18n.translate('wazuh.components.addModule.guide.disName', {
  defaultMessage: 'disabled',
});
const disDescp = i18n.translate('wazuh.components.addModule.guide.disable.osquery', {
  defaultMessage: 'Disable the  wodle.',
});
const osqueryName = i18n.translate('wazuh.components.addModule.guide.osqueryName', {
  defaultMessage: 'Osquery',
});
const osqueryWodleName = i18n.translate(
  'wazuh.components.addModule.guide.osqueryWodleName',
  {
    defaultMessage: 'osquery',
  },
);
const osqueryDescp = i18n.translate('wazuh.components.addModule.guide.osqueryDescp', {
  defaultMessage: 'Configuration options of the osquery wodle.',
});
const osqueryCate = i18n.translate('wazuh.components.addModule.guide.osqueryCate', {
  defaultMessage: 'Threat detection and response',
});
const callOutWar = i18n.translate('wazuh.components.addModule.guide.osquery.callOutWar', {
  defaultMessage:
    'Osquery is not installed by default. It is an open source software that you have to obtain for using this module.',
});
const title = i18n.translate('wazuh.components.addModule.guide.titleSetting', {
  defaultMessage: 'Settings',
});
const daemonName = i18n.translate('wazuh.components.addModule.guide.daemonName', {
  defaultMessage: 'run_daemon',
});
const daemonDescp = i18n.translate('wazuh.components.addModule.guide.daemonDescp', {
  defaultMessage:
    'Makes the module run osqueryd as a subprocess or lets the module monitor the results log without running Osquery.',
});
const binPathName = i18n.translate('wazuh.components.addModule.guide.binPathName', {
  defaultMessage: 'bin_path',
});
const binPathDescp = i18n.translate('wazuh.components.addModule.guide.binPathDescp', {
  defaultMessage:
    'Full path to the folder that contains the osqueryd executable.',
});
const binPathPlace = i18n.translate('wazuh.components.addModule.guide.binPathPlace', {
  defaultMessage: 'Any valid path.',
});
const logPathName = i18n.translate('wazuh.components.addModule.guide.logPathName', {
  defaultMessage: 'log_path',
});
const logPathDescp = i18n.translate('wazuh.components.addModule.guide.logPathDescp', {
  defaultMessage: 'Full path to the results log written by Osquery.',
});
const logPathPlace = i18n.translate('wazuh.components.addModule.guide.logPathPlace', {
  defaultMessage: 'Any valid path.',
});
const logPathError = i18n.translate('wazuh.components.addModule.guide.logPathError', {
  defaultMessage: 'Any valid path.',
});
const configPathName = i18n.translate(
  'wazuh.components.addModule.guide.configPathName',
  {
    defaultMessage: 'config_path',
  },
);
const configPathDescp = i18n.translate(
  'wazuh.components.addModule.guide.configPathDescp',
  {
    defaultMessage:
      'Path to the Osquery configuration file. This path can be relative to the folder where the Wazuh agent is running.',
  },
);
const configPathPlace = i18n.translate(
  'wazuh.components.addModule.guide.configPathPlace',
  {
    defaultMessage: 'Path to the Osquery configuration file',
  },
);
const labelName = i18n.translate('wazuh.components.addModule.guide.labelName', {
  defaultMessage: 'add_labels',
});
const labelDescp = i18n.translate('wazuh.components.addModule.guide.labelDescp', {
  defaultMessage: 'Add the agent labels defined as decorators.',
});
const title1 = i18n.translate('wazuh.components.addModule.guide.packs', {
  defaultMessage: 'Packs',
});
const title1Descp = i18n.translate('wazuh.components.addModule.guide.queryPack', {
  defaultMessage:
    'Add a query pack to the configuration. This option can be defined multiple times.',
});
const packName = i18n.translate('wazuh.components.addModule.guide.packName', {
  defaultMessage: 'pack',
});
const packDescp = i18n.translate('wazuh.components.addModule.guide.packDescp', {
  defaultMessage: 'Add a query pack to the configuration.',
});
const packPlace = i18n.translate('wazuh.components.addModule.guide.packPlace', {
  defaultMessage: 'Path to pack configuration file',
});
const packError = i18n.translate('wazuh.components.addModule.guide.packError', {
  defaultMessage: 'Path to pack configuration file',
});
const namePackName = i18n.translate('wazuh.components.addModule.guide.namePackName', {
  defaultMessage: 'name',
});
const namePackDescp = i18n.translate(
  'wazuh.components.addModule.guide.namePackDescp',
  {
    defaultMessage: 'Full path to the results log written by Osquery.',
  },
);
const namePackPlace = i18n.translate(
  'wazuh.components.addModule.guide.namePackPlace',
  {
    defaultMessage: 'Name for this pack',
  },
);
const namePackError = i18n.translate(
  'wazuh.components.addModule.guide.namePackError',
  {
    defaultMessage: 'Name for this pack',
  },
);
export default {
  id: 'osquery',
  name: osqueryName,
  wodle_name: osqueryWodleName,
  description: osqueryDescp,
  category: osqueryCate,
  documentation_link: webDocumentationLink(
    'user-manual/reference/ossec-conf/wodle-osquery.html',
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
          name: daemonName,
          description: daemonDescp,
          type: 'switch',
          required: true,
          default_value: true,
        },
        {
          name: binPathName,
          description: binPathDescp,
          type: 'input',
          required: true,
          placeholder: binPathPlace,
          default_value_linux: '',
          default_value_windows: 'C:\\Program Files\\osquery\\osqueryd',
        },
        {
          name: logPathName,
          description: logPathDescp,
          type: 'input',
          required: true,
          placeholder: logPathPlace,
          default_value_linux: '/var/log/osquery/osqueryd.results.log',
          default_value_windows:
            'C:\\Program Files\\osquery\\log\\osqueryd.results.log',
          validate_error_message: logPathError,
        },
        {
          name: configPathName,
          description: configPathDescp,
          type: 'input',
          required: true,
          placeholder: configPathPlace,
          default_value_linux: '/etc/osquery/osquery.conf',
          default_value_windows: 'C:\\Program Files\\osquery\\osquery.conf',
        },
        {
          name: labelName,
          description: labelDescp,
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
          name: packName,
          description: packDescp,
          type: 'input',
          placeholder: packPlace,
          default_value: '',
          removable: true,
          repeatable: true,
          required: true,
          validate_error_message: packError,
          show_attributes: true,
          attributes: [
            {
              name: namePackName,
              description: namePackDescp,
              type: 'input',
              required: true,
              placeholder: namePackPlace,
              default_value: '',
              validate_error_message: namePackError,
            },
          ],
        },
      ],
    },
  ],
};
