/*
 * Wazuh app - React component SubscriptionTab
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
import { EuiBasicTable } from '@elastic/eui';
import WzConfigurationSettingsTabSelector from '../../../util-components/configuration-settings-tab-selector';
import { HELP_LINKS, OFFICE_365 } from '../../constants';
import { i18n } from '@kbn/i18n';

export type SubscriptionTabProps = {
  agent: { id: string };
  wodleConfiguration: any;
};

export const SubscriptionTab = ({
  agent,
  wodleConfiguration,
}: SubscriptionTabProps) => {
  const columns = [
    {
      field: 'subscription',
      name: i18n.translate(
        'wazuh.public.controller.management.config.office365.subscription.tab.Name',
        {
          defaultMessage: 'Name',
        },
      ),
    },
  ];

  return (
    <WzConfigurationSettingsTabSelector
      title={i18n.translate(
        'wazuh.public.controller.management.config.office365.subscription.listtab.Subscriptionslist',
        {
          defaultMessage: 'Subscriptions list',
        },
      )}
      currentConfig={wodleConfiguration}
      minusHeight={agent.id === '000' ? 370 : 320}
      helpLinks={HELP_LINKS}
    >
      <EuiBasicTable
        columns={columns}
        items={wodleConfiguration[OFFICE_365].subscriptions.map(item => ({
          subscription: item,
        }))}
      />
    </WzConfigurationSettingsTabSelector>
  );
};
