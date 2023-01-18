/*
 * Wazuh app - React component GeneralTab
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { renderValueYesThenEnabled } from '../../../utils/utils';
import WzConfigurationSettingsTabSelector from '../../../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../../../util-components/configuration-settings-group';
import { HELP_LINKS, OFFICE_365 } from '../../constants';
import { i18n } from '@kbn/i18n';

export type GeneralTableProps = {
  agent: { id: string };
  wodleConfiguration: any;
};

const mainSettings = [
  {
    field: 'enabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.office365.gernal.tab.status',
      {
        defaultMessage: 'Service status',
      },
    ),
    render: renderValueYesThenEnabled,
  },
  {
    field: 'only_future_events',
    label: i18n.translate(
      'wazuh.public.controller.management.config.office365.gernal.tab.collect',
      {
        defaultMessage:
          'Collect events generated since Wazuh manager is initialized',
      },
    ),
  },
  {
    field: 'interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.office365.gernal.tab.interval',
      {
        defaultMessage:
          'Interval between Office 365 wodle executions in seconds',
      },
    ),
  },
  {
    field: 'curl_max_size',
    label: i18n.translate(
      'wazuh.public.controller.management.config.office365.gernal.tab.max',
      {
        defaultMessage: 'Maximum size allowed for the Office 365 API response',
      },
    ),
  },
];

export const GeneralTab = ({
  agent,
  wodleConfiguration,
}: GeneralTableProps) => {
  return (
    <WzConfigurationSettingsTabSelector
      title={i18n.translate(
        'wazuh.public.controller.management.config.office365.gernal.tab.Mainsettings',
        {
          defaultMessage: 'Main settings',
        },
      )}
      description={i18n.translate(
        'wazuh.public.controller.management.config.office365.gernal.tab.configration',
        {
          defaultMessage: 'Configuration for the Office 365 module',
        },
      )}
      currentConfig={wodleConfiguration}
      minusHeight={agent.id === '000' ? 370 : 320}
      helpLinks={HELP_LINKS}
    >
      <WzConfigurationSettingsGroup
        config={wodleConfiguration[OFFICE_365]}
        items={mainSettings}
      />
    </WzConfigurationSettingsTabSelector>
  );
};
