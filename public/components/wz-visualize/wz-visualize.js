/*
 * Wazuh app - React component for Visualize.
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

import { EuiText } from '@elastic/eui';

import { visualizations } from './visualizations';

export class WzVisualize extends Component {
  constructor(props) {
    super(props);
    this.visualizations = visualizations;
    this.state = {
      selectedTab: this.props.selectedTab,
    };
  }

  async componentDidUpdate() {
    const { selectedTab } = this.state;
    if (selectedTab !== this.props.selectedTab) {
      this.setState({ selectedTab: this.props.selectedTab });
    }
  }

  render() {
    const { selectedTab } = this.state;
    return <EuiText grow={false}>{selectedTab}</EuiText>;
  }
}
