/*
 * Wazuh app - React component for rener help button with help links.
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
import PropTypes from 'prop-types';

import { EuiButtonEmpty, EuiPopover, EuiText } from '@elastic/eui';

class WzHelpButtonPopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showHelp: false
    };
  }
  toggleShowHelp() {
    this.setState({ showHelp: !this.state.showHelp });
  }
  render() {
    const { showHelp } = this.state;
    const { children, links } = this.props;
    return (
      <EuiPopover
        id="show-help"
        button={
          <EuiButtonEmpty
            iconSide="left"
            iconType="questionInCircle"
            onClick={() => this.toggleShowHelp()}
          />
        }
        isOpen={showHelp}
        closePopover={() => this.toggleShowHelp()}
      >
        <div style={{ width: '300px' }}>
          <EuiText color="subdued" style={{ padding: '0 8px' }}>
            More info about this section
          </EuiText>
          {links.map(link => (
            <div key={`show-help-${link.text}`}>
              <EuiButtonEmpty target="_blank" href={link.href}>
                {link.text}
              </EuiButtonEmpty>
            </div>
          ))}
        </div>
      </EuiPopover>
    );
  }
}

WzHelpButtonPopover.propTypes = {
  links: PropTypes.array
};

export default WzHelpButtonPopover;
