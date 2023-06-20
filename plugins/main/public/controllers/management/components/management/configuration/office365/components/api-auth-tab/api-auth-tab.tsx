/*
 * Wazuh app - React component ApiAuthTab
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useMemo } from 'react';
import WzConfigurationSettingsTabSelector from '../../../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsListSelector from '../../../util-components/configuration-settings-list-selector';
import { settingsListBuilder } from '../../../utils/builders';
import { HELP_LINKS, OFFICE_365 } from '../../constants';

export type ApiAuthProps = {
  agent: { id: string };
  wodleConfiguration: any;
};

const columns = [
  { field: 'tenant_id', label: 'Tenant Id' },
  { field: 'client_id', label: 'Client Id' },
  { field: 'client_secret', label: 'Client Secret' },
  { field: 'client_secret_path', label: 'Client Secret Path' },
];

export const ApiAuthTab = ({ agent, wodleConfiguration }: ApiAuthProps) => {
  
  const credentials = useMemo(() => settingsListBuilder(
    wodleConfiguration[OFFICE_365].api_auth,
    'tenant_id'
  ), [wodleConfiguration]);

  return (
    <WzConfigurationSettingsTabSelector
      title="Credentials for the authentication with the API"
      currentConfig={wodleConfiguration}
      minusHeight={agent.id === '000' ? 370 : 320}
      helpLinks={HELP_LINKS}
    >
      <WzConfigurationSettingsListSelector
        items={credentials}
        settings={columns}
      />
    </WzConfigurationSettingsTabSelector>
  );
};
