/*
 * Wazuh app - React component for show configuration of Office 365 module.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useMemo } from 'react';
import WzNoConfig from '../util-components/no-config';
import withWzConfig from '../util-hocs/wz-config';
import { wodleBuilder } from '../utils/builders';
import { compose } from 'redux';
import WzTabSelector, { WzTabSelectorTab } from '../util-components/tab-selector';
import { isString } from '../utils/utils';
import { withGuard } from '../../../../../../components/common/hocs';
import { HELP_LINKS, OFFICE_365, WMODULES_WMODULES } from './constants';
import { GeneralTab } from './components/general-tab/general-tab';
import { ApiAuthTab } from './components/api-auth-tab/api-auth-tab';
import { SubscriptionTab } from './components/SubscriptionTab/SubscriptionTab';

interface IWzConfigOffice365 {
  currentConfig: {};
  agent: { id: string | number };
  updateBadge: () => void;
  updateConfigurationSection: () => void;
}
const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export const WzConfigurationOffice365: React.FunctionComponent<IWzConfigOffice365> = withWzConfig(
  sections
)(({ currentConfig, updateBadge, ...props }) => {
  const wodleConfiguration = useMemo(() => wodleBuilder(currentConfig, OFFICE_365), [
    currentConfig,
  ]);

  useEffect(() => {
    updateBadge(
      currentConfig &&
        wodleConfiguration &&
        wodleConfiguration[OFFICE_365] &&
        wodleConfiguration[OFFICE_365].enabled === 'yes'
    );
  }, [currentConfig]);

  return (
    <WzTabSelector>
      <WzTabSelectorTab label="General">
        <GeneralTabWrapped
          wodleConfiguration={wodleConfiguration}
          currentConfig={currentConfig}
          {...props}
        />
      </WzTabSelectorTab>
      <WzTabSelectorTab label="Credentials">
        <ApiAuthTabWrapped
          wodleConfiguration={wodleConfiguration}
          currentConfig={currentConfig}
          {...props}
        />
      </WzTabSelectorTab>
      <WzTabSelectorTab label="Subscriptions">
        <SubscriptionTabWrapped
          wodleConfiguration={wodleConfiguration}
          currentConfig={currentConfig}
          {...props}
        />
      </WzTabSelectorTab>
    </WzTabSelector>
  );
});

const tabWrapper = compose(
  withGuard(
    ({ currentConfig }) =>
      currentConfig[WMODULES_WMODULES] && isString(currentConfig[WMODULES_WMODULES]),
    ({ currentConfig }) => <WzNoConfig error={currentConfig[WMODULES_WMODULES]} help={HELP_LINKS} />
  ),
  withGuard(
    ({ wodleConfiguration }) => !wodleConfiguration[OFFICE_365],
    (props) => <WzNoConfig error="not-present" help={HELP_LINKS} />
  )
);

const GeneralTabWrapped = tabWrapper(GeneralTab);
const ApiAuthTabWrapped = tabWrapper(ApiAuthTab);
const SubscriptionTabWrapped = tabWrapper(SubscriptionTab);
