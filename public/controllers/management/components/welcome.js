/*
 * Wazuh app - React component for building the management welcome screen.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiTitle,
  EuiPage
} from '@elastic/eui';

import {
  updateManagementSection,
} from '../../../redux/actions/managementActions';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { connect } from 'react-redux';

class WelcomeScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  switchSection(section) {
    this.props.switchTab(section, true);
    this.props.updateManagementSection(section);
  }

  render() {
    return (
      <WzReduxProvider>
        <EuiPage style={{padding:0}}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiPanel>
                <EuiTitle size="s">
                  <h2>Administration</h2>
                </EuiTitle>
                <EuiSpacer size="s" />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      className='homSynopsis__card'
                      icon={<EuiIcon size="xl" type="indexRollupApp" color='primary' />}
                      title="Ruleset"
                      onClick={() => this.switchSection('ruleset')}
                      description="Manage your Wazuh cluster ruleset."
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      className='homSynopsis__card'
                      icon={<EuiIcon size="xl" type="usersRolesApp" color='primary' />}
                      title="Groups"
                      onClick={() => this.switchSection('groups')}
                      description="Manage your agent groups."
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      className='homSynopsis__card'
                      icon={<EuiIcon size="xl" type="devToolsApp" color='primary' />}
                      title="Configuration"
                      onClick={() => this.switchSection('configuration')}
                      description="Manage your Wazuh cluster configuration."
                    />
                  </EuiFlexItem>
                  <EuiFlexItem />
                </EuiFlexGroup>
              </EuiPanel>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiPanel>
                <EuiTitle size="s">
                  <h2>Status and reports</h2>
                </EuiTitle>
                <EuiSpacer size="s" />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      className='homSynopsis__card'
                      icon={<EuiIcon size="xl" type="uptimeApp" color='primary' />}
                      title="Status"
                      onClick={() => this.switchSection('status')}
                      description="Manage your Wazuh cluster status."
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      className='homSynopsis__card'
                      icon={<EuiIcon size="xl" type="indexPatternApp" color='primary' />}
                      title="Cluster"
                      onClick={() => this.switchSection('monitoring')}
                      description="Visualize your Wazuh cluster."
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      className='homSynopsis__card'
                      icon={<EuiIcon size="xl" type="filebeatApp" color='primary' />}
                      title="Logs"
                      onClick={() => this.switchSection('logs')}
                      description="Logs from your Wazuh cluster."
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiCard
                      layout="horizontal"
                      className='homSynopsis__card'
                      icon={<EuiIcon size="xl" type="reportingApp" color='primary' />}
                      title="Reporting"
                      onClick={() => this.switchSection('reporting')}
                      description="Check your stored Wazuh reports."
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPage>
      </WzReduxProvider>
    );
  }
}

WelcomeScreen.propTypes = {
  switchTab: PropTypes.func
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateManagementSection: section => dispatch(updateManagementSection(section)),
  }
};

export default connect(null, mapDispatchToProps)(WelcomeScreen);