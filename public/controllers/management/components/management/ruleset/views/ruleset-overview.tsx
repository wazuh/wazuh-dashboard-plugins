import React, { useState } from 'react';
import { connect } from 'react-redux';

// Wazuh components
import WzLayoutOverview from './layout-overview';
import { withUserAuthorizationPrompt, withGlobalBreadcrumb } from '../../../../../../components/common/hocs';
import { compose } from 'redux';
import { resourceDictionary } from '../utils/ruleset-handler';
import { SECTION_RULES_NAME, SECTION_RULES_KEY } from '../utils/constants';


function WzRulesetOverview(props) {

  const [showWarningRestart, setShowWarningRestart] = useState(false);
  const updateRestartManagers = (showWarningRestart) => {
    setShowWarningRestart(showWarningRestart);
  }

  const { section } = props.state;
  const { clusterStatus } = props;
  return <WzLayoutOverview section={ section } sectionName = { SECTION_RULES_NAME } clusterStatus = { clusterStatus } />;
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
