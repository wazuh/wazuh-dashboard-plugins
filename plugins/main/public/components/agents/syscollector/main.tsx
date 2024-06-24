/*
 * Wazuh app - Integrity monitoring components
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
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withGuard,
} from '../../common/hocs';
import { SyscollectorInventory } from './inventory';
import { compose } from 'redux';
import { endpointSummary } from '../../../utils/applications';
import NavigationService from '../../../react-services/navigation-service';
import { PromptNoSelectedAgent } from '../prompts';
import { getCore } from '../../../kibana-services';
import { EuiLink } from '@elastic/eui';
import { RedirectAppLinks } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

export const MainSyscollector = compose(
  withErrorBoundary,
  withGlobalBreadcrumb(({ agent }) => {
    return [
      {
        text: endpointSummary.breadcrumbLabel,
        href: NavigationService.getInstance().getUrlForApp(endpointSummary.id, {
          path: `#/agents-preview`,
        }),
      },
      { agent },
      {
        text: 'Inventory Data',
      },
    ];
  }),
  withGuard(
    props => !(props.agent && props.agent.id),
    () => (
      <>
        <PromptNoSelectedAgent
          body={
            <>
              You need to select an agent or return to
              <RedirectAppLinks application={getCore().application}>
                <EuiLink
                  aria-label='go to Endpoint summary'
                  href={`${endpointSummary.id}#/agents-preview`}
                >
                  Endpoint summary
                </EuiLink>
              </RedirectAppLinks>
            </>
          }
        />
      </>
    ),
  ),
)(SyscollectorInventory);
