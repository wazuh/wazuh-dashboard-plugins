import React, { useState } from 'react';
import { connect } from 'react-redux';

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
import { SECTION_DECODERS_KEY } from '../../common/constants';
import '../../common/layout-overview.scss';
import DecodersTable from '../components/decoders-table';
import WzReloadClusterManagerCallout from '../../../../../../components/common/reload-cluster-manager-callout';
import { decoders } from '../../../../../../utils/applications';

function WzDecodersOverview(props) {
  const [showWarningRestart, setShowWarningRestart] = useState(false);
  return (
    <EuiPage style={{ background: 'transparent' }}>
      <EuiPanel>
        {showWarningRestart && (
          <>
            <EuiSpacer size='s' />
            <WzReloadClusterManagerCallout
              onReloaded={() => setShowWarningRestart(false)}
              onReloadedError={() => setShowWarningRestart(true)}
            />
            <EuiSpacer size='s' />
          </>
        )}

        <EuiFlexGroup>
          <EuiFlexItem>
            <DecodersTable
              {...props}
              updateReloadClusterManager={() => setShowWarningRestart(true)}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPage>
  );
}

export default compose(
  withGlobalBreadcrumb(props => {
    return [{ text: decoders.breadcrumbLabel }];
  }),
  withUserAuthorizationPrompt(props => [
    {
      action: `${SECTION_DECODERS_KEY}:read`,
      resource:
        resourceDictionary[SECTION_DECODERS_KEY].permissionResource('*'),
    },
  ]),
)(WzDecodersOverview);
