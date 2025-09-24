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
import { SECTION_CDBLIST_KEY } from '../../common/constants';
import CDBListsTable from '../components/cdblists-table';
import '../../common/layout-overview.scss';
import WzReloadClusterCallout from '../../../../../../components/common/reload-cluster-callout';
import { cdbLists } from '../../../../../../utils/applications';

function WzCDBListsOverview(props) {
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
            <CDBListsTable
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
    return [{ text: cdbLists.breadcrumbLabel }];
  }),
  withUserAuthorizationPrompt(props => [
    {
      action: `${SECTION_CDBLIST_KEY}:read`,
      resource: resourceDictionary[SECTION_CDBLIST_KEY].permissionResource('*'),
    },
  ]),
)(WzCDBListsOverview);
