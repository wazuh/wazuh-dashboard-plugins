/*
 * Wazuh app - React component for building the status stats
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiIcon,
} from '@elastic/eui';
import { formatUIDate } from '../../../../../react-services/time-service';
import { connect } from 'react-redux';
import { API_NAME_AGENT_STATUS } from '../../../../../../common/constants';
import { agentStatusLabelByAgentStatus } from '../../../../../../common/services/wz_agent_status';
import { i18n } from '@kbn/i18n';

export class WzStatusAgentInfo extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { agentInfo } = this.props.state;
    const status = agentInfo.status;
    let operatingSystem = false;
    if (status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED && agentInfo.os) {
      operatingSystem = agentInfo.os.name
        ? agentInfo.os.name + agentInfo.os.version
        : agentInfo.os.uname
        ? agentInfo.os.uname
        : '-';
    }

    const greyStyle = {
      color: 'grey',
    };

    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size='m'>
                  <h2>
                    {i18n.translate(
                      'controllers.mnage.comp.confi.groups.status.agent.agent',
                      {
                        defaultMessage: 'Last registered agent',
                      },
                    )}
                  </h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            {i18n.translate(
              'controllers.mnage.comp.confi.groups.status.agent.Name',
              {
                defaultMessage: 'Name',
              },
            )}
          </EuiFlexItem>
          <EuiFlexItem style={greyStyle}>{agentInfo.name}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            {i18n.translate(
              'controllers.mnage.comp.confi.groups.status.agent.ID',
              {
                defaultMessage: 'ID',
              },
            )}
          </EuiFlexItem>
          <EuiFlexItem style={greyStyle}>{agentInfo.id}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            {i18n.translate(
              'controllers.mnage.comp.confi.groups.status.agent.Status',
              {
                defaultMessage: 'Status',
              },
            )}
          </EuiFlexItem>
          <EuiFlexItem style={{ ...greyStyle }}>
            {agentStatusLabelByAgentStatus(agentInfo.status)}
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            {i18n.translate(
              'controllers.mnage.comp.confi.groups.status.agent.IPAddress',
              {
                defaultMessage: 'IP Address',
              },
            )}
          </EuiFlexItem>
          <EuiFlexItem style={greyStyle}>{agentInfo.ip}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            {i18n.translate(
              'controllers.mnage.comp.confi.groups.status.agent.Dateadded',
              {
                defaultMessage: 'Date added',
              },
            )}
          </EuiFlexItem>
          <EuiFlexItem style={greyStyle}>
            {formatUIDate(agentInfo.dateAdd)}
          </EuiFlexItem>
        </EuiFlexGroup>
        {status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED && (
          <div>
            <EuiFlexGroup>
              <EuiFlexItem>
                {i18n.translate(
                  'controllers.mnage.comp.confi.groups.status.agent.Version',
                  {
                    defaultMessage: 'Version',
                  },
                )}
              </EuiFlexItem>
              <EuiFlexItem style={greyStyle}>
                {agentInfo.version || '-'}
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                {i18n.translate(
                  'controllers.mnage.comp.confi.groups.status.agent.alive',
                  {
                    defaultMessage: 'Last keep alive',
                  },
                )}
              </EuiFlexItem>
              <EuiFlexItem style={greyStyle}>
                {formatUIDate(agentInfo.lastKeepAlive)}
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>
                {i18n.translate(
                  'controllers.mnage.comp.confi.groups.status.agent.Operatingsystem',
                  {
                    defaultMessage: 'Operating system',
                  },
                )}
              </EuiFlexItem>
              <EuiFlexItem style={greyStyle}>
                {operatingSystem || '-'}
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        )}
      </EuiPanel>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.statusReducers,
  };
};

export default connect(mapStateToProps)(WzStatusAgentInfo);
