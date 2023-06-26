/*
 * Wazuh app - React component for test a configuration.
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
  EuiCodeEditor,
  EuiCallOut,
  EuiSpacer,
  EuiPanel,
  EuiFlexItem,
  EuiButton,
  EuiFlexGroup
} from '@elastic/eui';
import { DynamicHeight } from '../../../utils/dynamic-height';
import 'brace/theme/textmate';
import "brace/ext/searchbox";

export class TestConfiguration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      configuration: '',
      validating: false,
      result: false
    };
  }

  onChange = value => {
    this.setState({ configuration: value });
  };

  validate = async () => {
    this.setState({
      validating: true
    });
    const result = await this.props.clickAction(this.state.configuration);
    this.setState({
      validating: false,
      result: result
    });
  };

  dynamicHeight = () =>
    DynamicHeight.dynamicHeightStatic(
      '.euiCodeEditorWrapper',
      this.state.result ? 110 : 110
    );

  render() {
    this.dynamicHeight();
    return (
      <div>
        <Fragment>
          <EuiSpacer size="m" />
          <EuiPanel paddingSize="l">
            {this.state.result && (
              <div>
                <EuiCallOut
                  title="The configuration is valid!"
                  color="success"
                  iconType="check"
                ></EuiCallOut>
                <EuiSpacer size="m" />
              </div>
            )}
            <div className="codeEditorWrapper">
              <EuiCodeEditor
                theme="textmate"
                width="100%"
                value={this.state.configuration}
                height="720px"
                onChange={this.onChange}
                setOptions={{
                  fontSize: '14px',
                  enableBasicAutocompletion: true,
                  enableSnippets: true,
                  enableLiveAutocompletion: true
                }}
              ></EuiCodeEditor>
            </div>
          </EuiPanel>
          <EuiSpacer size="m" />
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}></EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                isLoading={this.state.validating}
                isDisabled={this.state.validating || !this.state.configuration}
                fill
                onClick={() => {
                  this.validate();
                }}
              >
                Validate
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
      </div>
    );
  }
}

TestConfiguration.propTypes = {};
