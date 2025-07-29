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
import { SECTION_RULES_KEY } from '../../common/constants';
import RulesetTable from '../components/ruleset-table';
import '../../common/layout-overview.scss';
import { rules } from '../../../../../../utils/applications';

function WzRulesetOverview(props) {
  return (
    <EuiPage style={{ background: 'transparent' }}>
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <RulesetTable {...props} />
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
