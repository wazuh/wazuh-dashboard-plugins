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
import WzConfigurationSettingsHeader from '../../../util-components/configuration-settings-header';
import { HELP_LINKS, OFFICE_365 } from '../../constants';

export type SubscriptionTabProps = {
  agent: { id: string };
  wodleConfiguration: any;
};

export const SubscriptionTab = ({ agent, wodleConfiguration }: SubscriptionTabProps) => {
  const columns = [{ field: 'subscription', name: 'Name' }];

  return (
    <WzConfigurationSettingsHeader
      title="Subscriptions list"
      help={HELP_LINKS}
    >
      <EuiBasicTable
        columns={columns}
        items={wodleConfiguration[OFFICE_365].subscriptions.map((item) => ({ subscription: item }))}
      />
    </WzConfigurationSettingsHeader>
  );
};
