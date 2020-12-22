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
import { Redirect, Route, Router, Switch } from 'react-router-dom';
import { AppDependencies } from './types';
//import { WzMenuWrapper } from './components/wz-menu/wz-menu-wrapper';
//import { WzAgentSelectorWrapper } from './components/wz-agent-selector/wz-agent-selector-wrapper';
//import { ToastNotificationsModal } from './components/notifications/modal';
import { HealthCheck } from './components/health-check';
import { MainOverview } from './components/main-overview';
import { WzManagement } from './components/management/container/management-provider';
import { WzRulesetOverview } from './components/management/components/ruleset/ruleset-overview';
import { WzRuleInfo } from './components/management/components/ruleset/rule-info';
import WzRulesetEditor from './components/management/components/ruleset/ruleset-editor';
import WzDecoderInfo from './components/management/components/decoder/decoder-info';

const LANDING_PAGE_URL = '/overview';
const MANAGER_PAGE_URL = '/management';
const MANAGER_RULES_PAGE_URL = '/management/rules';
const MANAGER_RULES_ID_PAGE_URL = '/management/rules/:id';
const MANAGER_RULES_NEW_PAGE_URL = '/management/rules/new';
const MANAGER_RULES_VIEW_FILE_PAGE_URL = '/management/rules/view/:file';
const MANAGER_DECODERS_PAGE_URL = '/management/decoders';
const MANAGER_DECODERS_ID_PAGE_URL = '/management/decoders/:id';
const MANAGER_DECODERS_NEW_PAGE_URL = '/management/decoders/new';
const MANAGER_DECODERS_VIEW_FILE_PAGE_URL = '/management/decoders/view/:file';

export function AppRouter(props: AppDependencies) {
  return (
    <Router history={props.params.history}>
      <EuiPage>
        <EuiPageBody>
          <Switch>
            <Route path={LANDING_PAGE_URL} render={() => <MainOverview />} />
            <Route
              path={[
                MANAGER_RULES_VIEW_FILE_PAGE_URL,
                MANAGER_RULES_NEW_PAGE_URL,
                MANAGER_DECODERS_VIEW_FILE_PAGE_URL,
                MANAGER_DECODERS_NEW_PAGE_URL,
              ]}
              render={() => <WzRulesetEditor {...props} />}
            />
            <Route path={MANAGER_RULES_ID_PAGE_URL} render={() => <WzRuleInfo />} />
            <Route
              path={MANAGER_DECODERS_ID_PAGE_URL}
              render={() => <WzDecoderInfo {...props} />}
            />
            <Route
              path={MANAGER_RULES_PAGE_URL}
              render={() => <WzRulesetOverview {...props} section={'rules'} />}
            />
            <Route
              path={MANAGER_DECODERS_PAGE_URL}
              render={() => <WzRulesetOverview {...props} section={'decoders'} />}
            />
            <Route path={MANAGER_PAGE_URL} render={() => <WzManagement />} />
            <Route path="/health-check" render={() => <HealthCheck />} />
            <Redirect from="/" to={LANDING_PAGE_URL} />
          </Switch>
        </EuiPageBody>
        {/* <WzMenuWrapper/>
        <WzAgentSelectorWrapper/>
        <ToastNotificationsModal/> */}
      </EuiPage>
    </Router>
  );
}
