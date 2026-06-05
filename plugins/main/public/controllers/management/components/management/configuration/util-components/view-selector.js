/*
 * Wazuh app - React component for view selector.
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

class WzViewSelector extends Component {
  constructor(props) {
    super(props);
  }

  // Recursively flatten children to handle Fragments
  flattenChildren(children) {
    const result = [];
    React.Children.forEach(children, child => {
      if (!child) return;

      // If it's a Fragment, flatten its children recursively
      if (child.type === React.Fragment) {
        result.push(...this.flattenChildren(child.props.children));
      } else {
        result.push(child);
      }
    });
    return result;
  }

  render() {
    const { view, children } = this.props;
    // Flatten children recursively to handle Fragments
    const childrenArray = this.flattenChildren(children);
    const selectedChild = childrenArray.find(
      child => child.props?.view === view,
    );
    const defaultChild = childrenArray.find(child => child.props?.default);
    return <Fragment>{selectedChild || defaultChild}</Fragment>;
  }
}

WzViewSelector.propTypes = {
  children: PropTypes.array,
};

export default WzViewSelector;

export class WzViewSelectorSwitch extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <Fragment>{this.props.children}</Fragment>;
  }
}

WzViewSelectorSwitch.propTypes = {
  view: PropTypes.oneOfType([PropTypes.string, PropTypes.any]),
};
