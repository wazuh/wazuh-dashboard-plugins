/*
 * Wazuh app - App Router
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { EuiPage, EuiPageBody } from '@elastic/eui';
import React from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
//import { WzMenuWrapper } from './components/wz-menu/wz-menu-wrapper';
//import { WzAgentSelectorWrapper } from './components/wz-agent-selector/wz-agent-selector-wrapper';
//import { ToastNotificationsModal } from './components/notifications/modal';
import { HealthCheck } from './components/health-check/health-check';
import { AppDependencies } from './types';

const LANDING_PAGE_URL = '/overview';

export function AppRouter(props: AppDependencies) {
  return (
    <Router history={props.params.history}>
      <EuiPage>
        <EuiPageBody>
          <Switch>
            <Route path={LANDING_PAGE_URL} render={() => <div>Hello World!</div>} />
            <Route path="/health-check" render={() => <HealthCheck {...props} />} />
            <Redirect exact from="/" to={LANDING_PAGE_URL} />
          </Switch>
        </EuiPageBody>
        {/* <WzMenuWrapper/>
        <WzAgentSelectorWrapper/>
        <ToastNotificationsModal/> */}
      </EuiPage>
    </Router>
  );
}
