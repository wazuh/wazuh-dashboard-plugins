/*
 * Wazuh app - React component for registering agents.
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
import {
  EuiInMemoryTable,
  EuiPage,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiButton,
  EuiCallOut,
  EuiFieldText,
  EuiText
} from '@elastic/eui';

import { connect } from 'react-redux';

import {
  cleanInfo,
} from '../../../../redux/actions/rulesetActions';


class WzListEditor extends Component {
  constructor(props) {
    super(props);
    this.columns = [
      {
        field: 'key',
        name: 'Key',
        align: 'left',
        sortable: true
      },
      {
        field: 'value',
        name: 'Value',
        align: 'left',
        sortable: true
      }
    ];
  }

  /**
   * When getting a CDB list is returned a raw text, this function parses it to an array
   * @param {String} content 
   */
  contentToArray(content) {
    const arrContent = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      const split = line.split(':');
      const key = split[0];
      const value = split[1] || '';
      const obj = Object.assign({ key, value });
      arrContent.push(obj);
    });
    return arrContent;
  }

  render() {
    const { listInfo, isLoading, error } = this.props.state;
    const { name, path, content } = listInfo;
    const items = this.contentToArray(content);
    const message = isLoading ? false : 'No results...';
    const search = {
      box: {
        incremental: true,
      }
    }

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiFlexGroup>
          <EuiFlexItem>
            {/* File name and back button when watching or editing a CDB list */}
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle>
                  <h2>
                    <EuiToolTip position="right" content={'Back to lists'}>
                      <EuiButtonIcon
                        aria-label="Back"
                        color="subdued"
                        iconSize="l"
                        iconType="arrowLeft"
                        onClick={() => this.props.cleanInfo()} />
                    </EuiToolTip>
                    {name}
                  </h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem style={{marginLeft: '-5px !important'}}>
                <EuiText color="subdued" style={{ marginTop: '10px' }}>
                  {path}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            {/* CDB list table */}
            <EuiFlexGroup>
              <EuiFlexItem style={{ marginTop: '30px' }}>
                <EuiInMemoryTable
                  itemId="id"
                  items={items}
                  columns={this.columns}
                  pagination={{ pageSizeOptions: [10, 15] }}
                  loading={isLoading}
                  sorting={true}
                  message={message}
                  search={{ box: { incremental: true } }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPage>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    cleanInfo: () => dispatch(cleanInfo())
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzListEditor);