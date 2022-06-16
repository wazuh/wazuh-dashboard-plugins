import React, { useState } from 'react';
import { connect } from 'react-redux';

// Wazuh components
import WzLayoutOverview from './layout-overview';
import { withUserAuthorizationPrompt, withGlobalBreadcrumb } from '../../../../../../components/common/hocs';
import { compose } from 'redux';
import { resourceDictionary } from '../../common/ruleset-handler';
import { SECTION_CDBLIST_NAME, SECTION_CDBLIST_KEY } from '../../common/constants';


function WzCDBListOverview(props) {

  const [showWarningRestart, setShowWarningRestart] = useState(false);
  const updateRestartManagers = (showWarningRestart) => {
    setShowWarningRestart(showWarningRestart);
  }

  const { section } = props.state;
  const { clusterStatus } = props;
  return <WzLayoutOverview section={ section } sectionName = { SECTION_CDBLIST_NAME } clusterStatus = { clusterStatus } />;
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
      { text: SECTION_CDBLIST_NAME}
    ];
  }),
  withUserAuthorizationPrompt((props) => [
    { action: `${SECTION_CDBLIST_KEY}:read`, resource: resourceDictionary[SECTION_CDBLIST_KEY].permissionResource('*') }
  ])
)(WzCDBListOverview);
