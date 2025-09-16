import React, { useState } from 'react';

// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiSpacer,
} from '@elastic/eui';

// Wazuh components
import {
  withUserAuthorizationPrompt,
  withGlobalBreadcrumb,
} from '../../../../../../components/common/hocs';
import { compose } from 'redux';
import { resourceDictionary } from '../../common/resources-handler';
import { SECTION_RULES_KEY } from '../../common/constants';
import RulesetTable from '../components/ruleset-table';
import '../../common/layout-overview.scss';
import { rules } from '../../../../../../utils/applications';
import WzReloadClusterCallout from '../../../../../../components/common/reload-cluster-manager-callout';

function WzRulesetOverview(props) {
  const [showWarningRestart, setShowWarningRestart] = useState(false);

  return (
    <EuiPage style={{ background: 'transparent' }}>
      <EuiPanel>
        {showWarningRestart && (
          <>
            <EuiSpacer size='s' />
            <WzReloadClusterCallout
              onReloaded={() => setShowWarningRestart(false)}
              onReloadedError={() => setShowWarningRestart(true)}
            />
            <EuiSpacer size='s' />
          </>
        )}
        <EuiFlexGroup>
          <EuiFlexItem>
            <RulesetTable
              {...props}
              updateReloadClusterManager={() => setShowWarningRestart(true)}
            />{' '}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPage>
  );
}

export default compose(
  withGlobalBreadcrumb(props => {
    return [{ text: rules.breadcrumbLabel }];
  }),
  withUserAuthorizationPrompt(props => [
    {
      action: `${SECTION_RULES_KEY}:read`,
      resource: resourceDictionary[SECTION_RULES_KEY].permissionResource('*'),
    },
  ]),
)(WzRulesetOverview);
