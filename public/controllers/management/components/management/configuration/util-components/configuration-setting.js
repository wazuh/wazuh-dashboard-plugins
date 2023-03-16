/*
 * Wazuh app - React component for render configuration setting.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import { EuiFieldText, EuiSpacer, EuiTextAlign } from '@elastic/eui';

class WzConfigurationSetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMobile: false,
    };
    this.limitResize = 760;
    this.resize = this.resize.bind(this);
  }
  componentDidMount() {
    window.addEventListener('resize', this.resize);
    this.resize();
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }
  resize() {
    this.setState({ isMobile: window.innerWidth < this.limitResize });
  }
  render() {
    const { isMobile } = this.state;
    const { keyItem, label, value } = this.props;
    return value || typeof value === 'number' || typeof value === 'boolean' ? (
      <Fragment>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <div
            style={
              isMobile
                ? { margin: '1em', width: '100%' }
                : { justifySelf: 'flex-end', margin: '1em', width: '35%' }
            }
          >
            <EuiTextAlign textAlign={isMobile ? 'left' : 'right'}>{label}</EuiTextAlign>
          </div>
          <div style={isMobile ? { width: '100%' } : { width: '65%' }}>
            {Array.isArray(value) ? (
              <ul>
                {value.map((v, key) => (
                  <li key={`${keyItem}-${label}-${key}`}>
                    <EuiFieldText value={String(v)} readOnly />
                  </li>
                ))}
              </ul>
            ) : (
              <EuiFieldText
                data-testid={`${String(label).toLowerCase().replace(/\s/g, '-')}`}
                value={String(value)}
                readOnly
              />
            )}
          </div>
        </div>
        <EuiSpacer size="s" />
      </Fragment>
    ) : null;
  }
}

WzConfigurationSetting.propTypes = {
  keyItem: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default WzConfigurationSetting;
