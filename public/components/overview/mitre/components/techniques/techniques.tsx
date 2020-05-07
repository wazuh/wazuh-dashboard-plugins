/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react'
import {
  EuiFacetButton,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem
} from '@elastic/eui';

export class Techniques extends Component {
  props!: {
    tacticsObject: any
  }
	constructor(props) {
    super(props);
	}

  renderFacet() {
    const {tacticsObject} = this.props;
    const tacticsToRender: Array<JSX.Element> = [];

    Object.keys(tacticsObject).forEach((key, inx) => {
      tacticsToRender.push(
        <EuiFlexItem key={inx}>
          <EuiFacetButton quantity={0}>{key}</EuiFacetButton>
        </EuiFlexItem>
      );
    });
    return (
      <EuiFlexGrid columns={4}>
        {tacticsToRender}
      </EuiFlexGrid>
    )
  }

	render() {
		return (
			<Fragment>
        {this.renderFacet()}
      </Fragment>
		)
	}
}
