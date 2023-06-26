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
import { EuiFlexGroup, EuiIcon, EuiText, EuiPage } from '@elastic/eui';

import { connect } from 'react-redux';

export class WzStatusDaemons extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { listDaemons } = this.props.state;

    const textStyle = {
      marginLeft: '4px'
    };

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiFlexGroup wrap responsive={true}>
          <div className="daemons-card">
            {listDaemons.map(daemon => (
              <div className="daemon-label" key={daemon.key}>
                <EuiText>
                  {(daemon.value === 'running' && (
                    <EuiIcon type="dot" color="#00a69b" size="m" />
                  )) || <EuiIcon type="dot" color="#ff645c" size="m" />}
                  <span style={textStyle}>{daemon.key}</span>
                </EuiText>
              </div>
            ))}
          </div>
        </EuiFlexGroup>
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.statusReducers
  };
};

export default connect(mapStateToProps)(WzStatusDaemons);
