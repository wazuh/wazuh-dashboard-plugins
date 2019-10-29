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
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiButton,
  EuiText
} from '@elastic/eui';

import { connect } from 'react-redux';

import {
  cleanInfo,
} from '../../../../redux/actions/rulesetActions';

import RulesetHandler from './utils/ruleset-handler';


class WzListEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSaving: false
    };
    
    this.items = {};
    this.sendCdbList = RulesetHandler.sendCdbList;

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

    this.adminColumns = [
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
      },
      {
        name: 'Actions',
        align: 'left',
        render: item => {
          return (
            <div>
              <EuiToolTip position="top" content={`Edit ${item.key}`}>
                <EuiButtonIcon
                  aria-label="Edit content"
                  iconType="pencil"
                  onClick={async () => {
                    console.log(`editing ${item.key}`)
                  }}
                  color="primary"
                />
              </EuiToolTip>
              <EuiToolTip position="top" content={`Remove ${item.key}`}>
                <EuiButtonIcon
                  aria-label="Show content"
                  iconType="trash"
                  onClick={async () => {
                    console.log(`deleting ${item.key}`);
                  }}
                  color="danger"
                />
              </EuiToolTip>
            </div>
          )
        }
      }
    ];
  }

  /**
   * When getting a CDB list is returned a raw text, this function parses it to an array
   * @param {String} content 
   */
  contentToArray(content) {
    const obj = this.contentToObject(content);
    const items = [];
    for (const key in obj) {
      const value = obj[key];
      items.push(Object.assign({ key, value }));
    }
    return items;
  }

  /**
   * Save in the state as object the items for an easy modification by key-value
   * @param {String} content 
   */
  contentToObject(content) {
    const items = {};
    const lines = content.split('\n');
    lines.forEach(line => {
      const split = line.split(':');
      const key = split[0];
      const value = split[1] || '';
      if (key) items[key] = value; // Prevent add empty keys
    });
    this.items = { ...items };
    return items;
  }

  /**
   * Transform this.items (an object) into a raw string
   */
  itemsToRaw() {
    let raw = '';
    Object.keys(this.items).forEach(key => {
      raw = raw ? `${raw}\n${key}:${this.items[key]}` : `${key}:${this.items[key]}`;
    });
    return raw;
  }

  async saveList(name, path) {
    try {
      this.setState({ isSaving: true });
      const overwrite = true;
      const raw = this.itemsToRaw();
      await this.sendCdbList(name, path, raw, overwrite);
    } catch (error) {
      console.error('Error saving CDB list ', error);
    }
    this.setState({ isSaving: false });
  }

  //isDisabled={nameForSaving.length <= 4} 
  render() {
    const { listInfo, isLoading, error, adminMode } = this.props.state;
    const { name, path, content } = listInfo;
    const items = this.contentToArray(content);
    const message = isLoading ? false : 'No results...';
    const columns = adminMode ? this.adminColumns : this.columns;
    const saveButton = (
      <EuiButton
        fill
        iconType="save"
        isLoading={this.state.isSaving}
        onClick={async () => this.saveList(name, path)}>
        Save
      </EuiButton>
    );

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
              <EuiFlexItem style={{ marginLeft: '-5px !important' }}>
                <EuiText color="subdued" style={{ marginTop: '10px' }}>
                  {path}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem />{/* This flex item is for separating between title and save button */}
              {adminMode && (
                <EuiFlexItem grow={false}>
                  {saveButton}
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
            {/* CDB list table */}
            <EuiFlexGroup>
              <EuiFlexItem style={{ marginTop: '30px' }}>
                <EuiInMemoryTable
                  itemId="id"
                  items={items}
                  columns={columns}
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