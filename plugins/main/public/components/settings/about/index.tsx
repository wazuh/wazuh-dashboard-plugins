/*
 * Wazuh app - React component for Settings > About
 *
 * Copyright (C) 2015-2023 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import React, { useState } from 'react';

import { EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import { compose } from 'redux';
import {
  withUserAuthorizationPrompt,
  withErrorBoundary,
  withReduxProvider,
} from '../../common/hocs';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../../common/constants';
import { SettingsAboutAppInfo } from './appInfo';
import { SettingsAboutBottomInfo } from './bottomInfo';
import { Update } from '../../../../../wazuh-check-updates/common/types';
import { getWazuhCheckUpdatesPlugin } from '../../../kibana-services';

interface SettingsAboutProvider {
  appInfo: {
    'app-version': string;
    installationDate: string;
    revision: string;
  };
  pluginAppName: string;
}
const SettingsAboutProvider = (props: SettingsAboutProvider) => {
  const { appInfo, pluginAppName } = props;

  const [currentUpdate, setCurrentUpdate] = useState<Update | undefined>();

  const { CurrentUpdateDetails } = getWazuhCheckUpdatesPlugin();

  return (
    <EuiPage paddingSize="m">
      <EuiPageBody>
        <SettingsAboutAppInfo appInfo={appInfo} setCurrentUpdate={setCurrentUpdate} />
        {currentUpdate ? (
          <>
            <EuiSpacer size="l" />
            <CurrentUpdateDetails currentUpdate={currentUpdate} />
          </>
        ) : null}
        <EuiSpacer size="l" />
        <SettingsAboutBottomInfo pluginAppName={pluginAppName} />
      </EuiPageBody>
    </EuiPage>
  );
};

export const SettingsAbout = compose(
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(SettingsAboutProvider);
