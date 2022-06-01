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
import { resourceDictionary } from '../utils/ruleset-handler';
import { SECTION_RULES_NAME, SECTION_RULES_KEY } from '../utils/constants';
import RulesetTable from '../tables/ruleset-table';
import './layout-overview.scss';
import WzRestartClusterManagerCallout from '../../../../../../components/common/restart-cluster-manager-callout';


function WzRulesetOverview(props) {

  const [showWarningRestart, setShowWarningRestart] = useState(false);

  const updateRestartManagers = (showWarningRestart) => {
    setShowWarningRestart(showWarningRestart);
  }
  
  // const tabs = [
  //   {
  //     id: false,
  //     name: 'Rules',
  //     disabled: false,
  //   },
  //   {
  //     id: true,
  //     name: 'Files',
  //     disabled: false,
  //   },
  // ];

  const { section, sectionName, clusterStatus, showingFiles } = props.state;
  // const { clusterStatus } = props;
  // return <WzLayoutOverview section={ section } sectionName = { SECTION_RULES_NAME } clusterStatus = { clusterStatus } />;
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
        <RulesetTable
          clusterStatus={clusterStatus}
          request={section}
          // title={sectionName}
          updateRestartClusterManager={(showWarningRestart) => updateRestartManagers(showWarningRestart)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>
</EuiPage>;

}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

export default compose(
  connect(
    mapStateToProps
  ),
  withGlobalBreadcrumb(props => {
    return [
      { text: '' },
      { text: 'Management', href: '#/manager' },
      { text: SECTION_RULES_NAME}
    ];
  }),
  withUserAuthorizationPrompt((props) => [
    { action: `${SECTION_RULES_KEY}:read`, resource: resourceDictionary[SECTION_RULES_KEY].permissionResource('*') }
  ])
)(WzRulesetOverview);
