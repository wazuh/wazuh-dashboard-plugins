/*
 * Wazuh app - React component for Logtest.
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
import PropTypes from 'prop-types';
import { DynamicHeight } from '../../../utils/dynamic-height';
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
  EuiPanel,
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

  dynamicHeight = () =>
    DynamicHeight.dynamicHeightStatic(
      '.euiCodeBlock',
      this.props.showClose ? 70 : 100
    );

  render() {
    const codeBlock = {
      zIndex: '100'
    };

    const logtest = (
      <Fragment>
        <EuiTextArea
          placeholder="Type one log per line..."
          fullWidth={true}
          aria-label=""
          rows={this.props.showClose ? 10 : 4}
          onChange={this.onChange}
        />
        <EuiSpacer size="s" />
        <EuiCodeBlock
          style={codeBlock}
          language="json"
          fontSize="s"
          overflowHeight={1}
          isCopyable={this.state.testResult ? true : false}
        >
          {this.state.testResult || 'The test result will appear here.'}
        </EuiCodeBlock>
      </Fragment>
    );

    this.dynamicHeight();
    return (
      <Fragment>
        {this.props.showClose && (
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
        )}
        <EuiSpacer size="m" />
        {(!this.props.showClose && (
          <EuiPanel paddingSize="l">{logtest}</EuiPanel>
        )) || <div>{logtest}</div>}
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              {this.props.showClose && (
                <EuiButtonEmpty
                  iconType="cross"
                  onClick={() => this.props.close()}
                  flush="left"
                >
                  Close
                </EuiButtonEmpty>
              )}
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
                Test
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
  close: PropTypes.func,
  showClose: PropTypes.bool
};
