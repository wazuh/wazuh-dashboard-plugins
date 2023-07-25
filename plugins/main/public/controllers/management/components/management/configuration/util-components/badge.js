/*
 * Wazuh app - React component show configuration of log settings - alerts tab.
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

import { EuiBadge } from '@elastic/eui';

class WzBadge extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (typeof nextProps === 'object') {
      if (typeof nextProps.enabled !== 'undefined') {
        if (nextProps.enabled) {
          return { color: 'secondary', content: 'ENABLED' };
        } else {
          return { color: 'danger', content: 'DISABLED' };
        }
      } else if (typeof nextProps.synchronized !== 'undefined') {
        if (nextProps.synchronized) {
          return { color: 'secondary', content: 'SYNCHRONIZED' };
        } else {
          return { color: 'danger', content: 'NOT SYNCHRONIZED' };
        }
      } else if (nextProps.color && nextProps.content) {
        return { color: nextProps.color, content: nextProps.content };
      }
    }
    return null;
  }
  render() {
    const { color, content } = this.state;
    return color && content ? (
      <EuiBadge color={color}>{content}</EuiBadge>
    ) : null;
  }
}

export default WzBadge;
