/*
 * Wazuh app - React component for section tabs.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';

export class WzEuiPrompt extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }


  render() {
    return (
      <EuiEmptyPrompt
        iconType={this.props.icon}
        style={{ marginTop: 20 }}
        title={<h2>{this.props.title}</h2>}
        body={
          <Fragment>
            <p>
              {this.props.promptText}
          </p>
            <a href={this.props.docsUrl} target="_blank">
              {this.props.docsUrl}
          </a>
          </Fragment>
        }
        actions={
          <EuiButton href={this.props.href} color="primary" fill>
            {this.props.actionButton}
        </EuiButton>
        }
      />);
  }
}
