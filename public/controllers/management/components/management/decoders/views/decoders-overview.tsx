import React, { useState } from 'react';
import { connect } from 'react-redux';

// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiSpacer
} from '@elastic/eui';

// Wazuh components
import { withUserAuthorizationPrompt, withGlobalBreadcrumb } from '../../../../../../components/common/hocs';
import { compose } from 'redux';
import { resourceDictionary } from '../../common/resources-handler';
import { SECTION_DECODERS_NAME, SECTION_DECODERS_KEY } from '../../common/constants';
import '../../common/layout-overview.scss';
import DecodersTable from '../components/decoders-table';
import WzRestartClusterManagerCallout from '../../../../../../components/common/restart-cluster-manager-callout';


function WzDecodersOverview(props) {

  const [showWarningRestart, setShowWarningRestart] = useState(false);

  const updateRestartManagers = (showWarningRestart) => {
    setShowWarningRestart(showWarningRestart);
  }
  

  const { clusterStatus } = props;
  return <EuiPage style={{ background: 'transparent' }}>
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
        <DecodersTable
          {...props}
          clusterStatus={clusterStatus}
          updateRestartClusterManager={(showWarningRestart) => updateRestartManagers(showWarningRestart)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>
</EuiPage>;

}

export default compose(
  withGlobalBreadcrumb(props => {
    return [
      { text: '' },
      { text: 'Management', href: '#/manager' },
      { text: SECTION_DECODERS_NAME}
    ];
  }),
  withUserAuthorizationPrompt((props) => [
    { action: `${SECTION_DECODERS_KEY}:read`, resource: resourceDictionary[SECTION_DECODERS_KEY].permissionResource('*') }
  ])
)(WzDecodersOverview);
