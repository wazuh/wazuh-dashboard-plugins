/*
 * Wazuh app - React component for building the Tools sections welcome cards.
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
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer
} from '@elastic/eui';

import { TabDescription } from '../../../../server/reporting/tab-description';

export class ToolsWelcomeCards extends Component {
  constructor(props) {
    super(props);
  }

  onButtonClick(btn) {
    this.setState({
      [btn]: !this.state[btn]
    });
  }

  buildTabCards() {
    return this.props.sections.map((tab, index) => (
      <EuiFlexItem grow={true}           key={index}> 
        <EuiCard
          icon={<EuiIcon size="xxl" type={tab.icon} />}
          title={TabDescription[tab.id].title}
          onClick={() => this.props.clickAction(tab.id)}
          description={TabDescription[tab.id].description}
          key={index}
        />
                  </EuiFlexItem>
    ));
  }

  render() {
    return (
      <div>
            <EuiTitle size="m">
      <h1>Wazuh tools</h1>
    </EuiTitle>
    <EuiSpacer size="m" />
        <EuiFlexGroup>
          {this.buildTabCards()}
        </EuiFlexGroup>
      </div>
    );
  }
}

ToolsWelcomeCards.propTypes = {
  sections: PropTypes.array,
  clickAction: PropTypes.func
};
