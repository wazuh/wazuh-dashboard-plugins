/*
 * Wazuh app - React component for Logtest.
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
  EuiTitle,
  EuiButton,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiTextArea,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiSpacer,
  EuiFlyoutFooter
} from '@elastic/eui';

export class Logtest extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      testing: false
    };
  }

  onChange = e => {
    this.setState({
      value: e.target.value
    });
  };

  test = async () => {
    this.setState({
      testing: true
    });
    const result = await this.props.clickAction(this.state.value);
    this.setState({
      testing: false,
      testResult: result
    });
  };

  render() {
    const codeBlock = {
      zIndex: '100'
    };
    return (
      <Fragment>
        <EuiFlexGroup gutterSize="xs">
          <EuiTitle size="s">
            <h2>Test your logs</h2>
          </EuiTitle>
          <EuiFlexItem />
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              color={'text'}
              onClick={() => this.props.close()}
              iconType="cross"
              aria-label="Close"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <Fragment>
          <EuiTextArea
            placeholder="Type one log per line..."
            fullWidth={true}
            aria-label=""
            rows={8}
            onChange={this.onChange}
          />
          <EuiSpacer size="s" />
            <EuiCodeBlock
              style={codeBlock}
              language="json"
              fontSize="s"
              overflowHeight={650}
              isCopyable={this.state.testResult ? true : false}
            >
              {this.state.testResult || 'The test result will appear here.'}
            </EuiCodeBlock>
        </Fragment>
        <EuiFlyoutFooter>
            <EuiFlexGroup justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  iconType="cross"
                  onClick={() => this.props.close()}
                  flush="left">
                  Close
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
              <EuiButton
                isLoading={this.state.testing}
                isDisabled={this.state.testing || !this.state.value}
                iconType="play"
                fill
                onClick={() => {
                  this.test();
                }}
              >
                Test it
              </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutFooter>
      </Fragment>
    );
  }
}

Logtest.propTypes = {
  clickAction: PropTypes.func,
  close: PropTypes.func
};
