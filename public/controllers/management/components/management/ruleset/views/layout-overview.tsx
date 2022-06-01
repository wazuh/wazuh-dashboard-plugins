import React, { useState } from 'react';

// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiSpacer
} from '@elastic/eui';

// Wazuh components
import RulesetTable from '../tables/ruleset-table';
import './layout-overview.scss';
import WzRestartClusterManagerCallout from '../../../../../../components/common/restart-cluster-manager-callout';

export default function WzLayoutOverview(props) {

  const [showWarningRestart, setShowWarningRestart] = useState(false);

  const updateRestartManagers = (showWarning) => {
    setShowWarningRestart(showWarning);
  }


  const { section, sectionName, clusterStatus } = props;
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
              clusterStatus={clusterStatus}
              request={section}
              title={sectionName}
              updateRestartClusterManager={(showWarningRestart) => updateRestartManagers(showWarningRestart)}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPage>
  );
}
