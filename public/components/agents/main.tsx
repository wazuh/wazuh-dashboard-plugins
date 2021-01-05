import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  EuiPage,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTabs,
  EuiTab,
  EuiPanel,
  EuiEmptyPrompt,
  EuiSpacer,
} from '@elastic/eui';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../common/hocs';
import { compose } from 'redux';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../util/constants';
import { updateSecuritySection } from '../../redux/actions/securityActions';
import {AgentsPreview} from '../../controllers/agent/components/agents-preview';
import {AgentsTable} from '../../controllers/agent/components/agents-table';

export const WzAgents = compose(
  withReduxProvider,
  withGlobalBreadcrumb([{ text: '' }, { text: 'Agents' }]),
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(() => {
 
  return (
    <>
      <AgentsPreview></AgentsPreview>
      <AgentsTable></AgentsTable>
    </>
  );
});