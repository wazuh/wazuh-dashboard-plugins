import React from 'react';

// Eui components
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiPage } from '@elastic/eui';

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
import { decoders } from '../../../../../../utils/applications';

function WzDecodersOverview(props) {
  return (
    <EuiPage style={{ background: 'transparent' }}>
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <DecodersTable {...props} />
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
