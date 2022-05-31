import React, { Component } from 'react';
import { connect } from 'react-redux';

// Wazuh components
import WzLayoutOverview from './layout-overview';
import { withUserAuthorizationPrompt, withGlobalBreadcrumb } from '../../../../../../components/common/hocs';
import { compose } from 'redux';
import { resourceDictionary } from '../utils/ruleset-handler';
import { SECTION_DECODERS_NAME, SECTION_DECODERS_KEY } from '../utils/constants';


class WzDecodersOverview extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showWarningRestart: false
    }
  }

  updateRestartManagers(showWarningRestart){
    this.setState({ showWarningRestart });
  }

  render() {
    const { section } = this.props.state;
    const { clusterStatus } = this.props;
    return (
      <WzLayoutOverview 
        section={section}
        sectionName={SECTION_DECODERS_NAME}
        clusterStatus={clusterStatus}
      />
    );
  }
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
      { text: SECTION_DECODERS_NAME}
    ];
  }),
  withUserAuthorizationPrompt((props) => [
    { action: `${SECTION_DECODERS_KEY}:read`, resource: resourceDictionary[SECTION_DECODERS_KEY].permissionResource('*') }
  ])
)(WzDecodersOverview);
