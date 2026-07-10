/*
 * Wazuh app - React component for building the status view
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
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { sortBy } from 'lodash';

import { connect } from 'react-redux';

const statusColors = {
  ok: '#00a69b',
  warn: '#ffd45c',
  error: '#ff645c',
};

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

export class WzStatusDaemons extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { listDaemons } = this.props.state;

    const textStyle = {
      marginLeft: '4px',
    };

    const generalStatus =
      listDaemons.find(({ key }) => key === 'ready')?.value === true;

    const groupedDaemons = chunk(
      sortBy(
        listDaemons.filter(({ key }) => key !== 'ready'),
        'key',
      ),
      2,
    );

    return (
      <EuiPanel>
        <EuiFlexGroup alignItems='center'>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle size='m'>
                  <h2>Daemons</h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem
                grow={false}
                className='wz-status-daemons-overview-ready'
              >
                <EuiText>
                  <EuiIconTip
                    type='dot'
                    color={generalStatus ? statusColors.ok : statusColors.warn}
                    size='l'
                    aria-label='Daemon status general'
                    content={`ready: ${generalStatus ? 'yes' : 'no'}`}
                  />
                  <span style={textStyle}>
                    {generalStatus ? 'ready' : 'not ready'}
                  </span>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        {groupedDaemons.map((daemonGroup, index) => (
          <EuiFlexGroup key={`daemon_group_${index}`}>
            {daemonGroup.map(daemon => {
              const ready = daemon.value?.ready === true;
              const running = daemon.value?.running === true;

              let statusColor = '';

              if (running && ready) {
                statusColor = statusColors.ok;
              } else if (!running) {
                statusColor = statusColors.error;
              } else {
                statusColor = statusColors.warn;
              }

              return (
                <EuiFlexItem key={daemon.key}>
                  <EuiText>
                    <EuiIconTip
                      type='dot'
                      color={statusColor}
                      size='m'
                      aria-label='Daemon status info'
                      content={`ready:  ${ready ? 'yes' : 'no'}, running: ${
                        running ? 'yes' : 'no'
                      }`}
                    />
                    <span style={textStyle}>{daemon.key}</span>
                  </EuiText>
                </EuiFlexItem>
              );
            })}
          </EuiFlexGroup>
        ))}
      </EuiPanel>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.statusReducers,
  };
};

export default connect(mapStateToProps)(WzStatusDaemons);
