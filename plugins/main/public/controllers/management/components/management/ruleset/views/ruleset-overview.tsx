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
import WzRestartClusterManagerCallout from '../../../../../../components/common/restart-cluster-manager-callout';
import { rules } from '../../../../../../utils/applications';

function WzRulesetOverview(props) {
  const [showWarningRestart, setShowWarningRestart] = useState(false);

  const updateRestartManagers = showWarningRestart => {
    setShowWarningRestart(showWarningRestart);
  };

  return (
    <EuiPage style={{ background: 'transparent' }}>
      <EuiPanel>
        {showWarningRestart && (
          <>
            <EuiSpacer size='s' />
            <WzRestartClusterManagerCallout
              onRestarted={() => updateRestartManagers(false)}
              onRestartedError={() => updateRestartManagers(true)}
            />
            <EuiSpacer size='s' />
          </>
        )}

        <EuiFlexGroup>
          <EuiFlexItem>
            <RulesetTable
              {...props}
              updateRestartClusterManager={showWarningRestart =>
                updateRestartManagers(showWarningRestart)
              }
            />
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
