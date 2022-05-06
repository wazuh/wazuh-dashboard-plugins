/*
 * Wazuh app - React component for building the Tools sections welcome cards.
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
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCard,
  EuiIcon,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer
} from '@elastic/eui';

import { WAZUH_MODULES } from '../../../../common/wazuh-modules';

export class ToolsWelcomeCards extends Component {
  constructor(props) {
    super(props);
  }

  buildToolsCards() {
    return this.props.sections.map((tab, index) => (
      <Fragment>
        <EuiFlexItem grow={true}></EuiFlexItem>
        <EuiFlexItem grow={true} key={index}>
          <EuiCard
            icon={<EuiIcon size="xxl" type={tab.icon} />}
            title={WAZUH_MODULES[tab.id].title}
            onClick={() => this.props.clickAction(tab.id)}
            description={WAZUH_MODULES[tab.id].description}
            key={index}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}></EuiFlexItem>
      </Fragment>
    ));
  }

  render() {
    return (
      <div>
        <EuiTitle size="m">
          <h1>Wazuh tools</h1>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiFlexGroup>{this.buildToolsCards()}</EuiFlexGroup>
      </div>
    );
  }
}

ToolsWelcomeCards.propTypes = {
  sections: PropTypes.array,
  clickAction: PropTypes.func
};
