/*
 * Wazuh app - React component for registering agents.
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
import {
  EuiInMemoryTable,
  EuiPage,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiButton,
  EuiText,
  EuiButtonEmpty,
  EuiPopover,
  EuiFieldText,
  EuiSpacer,
  EuiPanel
} from '@elastic/eui';

import { connect } from 'react-redux';

import {
  cleanInfo,
  updateListContent
} from '../../../../../redux/actions/rulesetActions';

import RulesetHandler from './utils/ruleset-handler';

import { toastNotifications } from 'ui/notify';

import exportCsv from '../../../../../react-services/wz-csv';

import { updateWazuhNotReadyYet } from '../../../../../redux/actions/appStateActions';
import WzRestartClusterManagerCallout from '../../../../../components/common/restart-cluster-manager-callout';

class WzListEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      isSaving: false,
      editing: false,
      isPopoverOpen: false,
      addingKey: '',
      addingValue: '',
      editingValue: '',
      newListName: '',
      showWarningRestart: false
    };

    this.items = {};

    this.rulesetHandler = RulesetHandler;

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
        sortable: true,
        render: (value, item) => {
          if (this.state.editing === item.key) {
            return (
              <EuiFieldText
                placeholder="New value"
                value={this.state.editingValue}
                onChange={this.onChangeEditingValue}
                aria-label="Use aria labels when no actual label is in use"
              />
            );
          } else {
            return <span>{value}</span>;
          }
        }
      },
      {
        name: 'Actions',
        align: 'left',
        render: item => {
          if (this.state.editing === item.key) {
            return (
              <Fragment>
                <EuiToolTip position="top" content={'Yes'}>
                  <EuiButtonIcon
                    aria-label="Confirm value"
                    iconType="check"
                    onClick={() => {
                      this.setEditedValue();
                    }}
                    color="primary"
                  />
                </EuiToolTip>
                <EuiToolTip position="top" content={'No'}>
                  <EuiButtonIcon
                    aria-label="Cancel edition"
                    iconType="cross"
                    onClick={() => this.setState({ editing: false })}
                    color="danger"
                  />
                </EuiToolTip>
              </Fragment>
            );
          } else {
            return (
              <Fragment>
                <EuiToolTip position="top" content={`Edit ${item.key}`}>
                  <EuiButtonIcon
                    aria-label="Edit content"
                    iconType="pencil"
                    onClick={() => {
                      this.setState({
                        editing: item.key,
                        editingValue: item.value
                      });
                    }}
                    color="primary"
                  />
                </EuiToolTip>
                <EuiToolTip position="top" content={`Remove ${item.key}`}>
                  <EuiButtonIcon
                    aria-label="Show content"
                    iconType="trash"
                    onClick={() => this.deleteItem(item.key)}
                    color="danger"
                  />
                </EuiToolTip>
              </Fragment>
            );
          }
        }
      }
    ];
  }

  componentDidMount() {
    const { listInfo } = this.props.state;
    const { content } = listInfo;
    const obj = this.contentToObject(content);
    this.items = { ...obj };
    const items = this.contentToArray(obj);
    this.setState({ items });
  }

  /**
   * When getting a CDB list is returned a raw text, this function parses it to an array
   * @param {Object} obj
   */
  contentToArray(obj) {
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
    return items;
  }

  /**
   * Transform this.items (an object) into a raw string
   */
  itemsToRaw() {
    let raw = '';
    Object.keys(this.items).forEach(key => {
      raw = raw
        ? `${raw}\n${key}:${this.items[key]}`
        : `${key}:${this.items[key]}`;
    });
    return raw;
  }

  /**
   * Save the list
   * @param {String} name
   * @param {String} path
   */
  async saveList(name, path, addingNew = false) {
    try {
      if (!name) {
        this.showToast(
          'warning',
          'Invalid name',
          'CDB list name cannot be empty',
          3000
        );
        return;
      }
      name = name.endsWith('.cdb')
      ? name.replace('.cdb', '')
      : name;
      const overwrite = addingNew; // If adding new disable the overwrite
      const raw = this.itemsToRaw();
      if (!raw) {
        this.showToast(
          'warning',
          'Please insert at least one item',
          'Please insert at least one item, a CDB list cannot be empty',
          3000
        );
        return;
      }
      this.setState({ isSaving: true });
      await this.rulesetHandler.sendCdbList(name, path, raw, overwrite);
      if (!addingNew) {
        const result = await this.rulesetHandler.getCdbList(`${path}/${name}`);
        const file = { name: name, content: result, path: path };
        this.props.updateListContent(file);
        this.setState({ showWarningRestart: true });
        this.showToast(
          'success',
          'Success',
          'CBD List successfully created',
          3000
        );
      } else {
        this.setState({ showWarningRestart: true });
        this.showToast('success', 'Success', 'CBD List updated', 3000);
      }
    } catch (error) {
      this.showToast(
        'danger',
        'Error',
        'Error saving CDB list: ' + error,
        3000
      );
    }
    this.setState({ isSaving: false });
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  openAddEntry = () => {
    this.setState({
      isPopoverOpen: true
    });
  };

  closeAddEntry = () => {
    this.setState({
      isPopoverOpen: false
    });
  };

  onChangeKey = e => {
    this.setState({
      addingKey: e.target.value
    });
  };

  onChangeValue = e => {
    this.setState({
      addingValue: e.target.value
    });
  };

  onChangeEditingValue = e => {
    this.setState({
      editingValue: e.target.value
    });
  };

  onNewListNameChange = e => {
    this.setState({
      newListName: e.target.value
    });
  };

  /**
   * Append a key value to this.items and after that if everything works ok re-create the array for the table
   */
  addItem() {
    const { addingKey, addingValue } = this.state;
    if (!addingKey || Object.keys(this.items).includes(addingKey)) {
      this.showToast(
        'danger',
        'Error',
        <Fragment>
          <strong>{addingKey}</strong> key already exists
        </Fragment>,
        3000
      );
      return;
    }
    this.items[addingKey] = addingValue;
    const itemsArr = this.contentToArray(this.items);
    this.setState({
      items: itemsArr,
      addingKey: '',
      addingValue: ''
    });
  }

  /**
   * Set the new value in the input field when editing a item value (this.props.editingValue)
   */
  setEditedValue() {
    const key = this.state.editing;
    const value = this.state.editingValue;
    this.items[key] = value;
    const itemsArr = this.contentToArray(this.items);
    this.setState({
      items: itemsArr,
      editing: false,
      editingValue: '',
      generatingCsv: false
    });
  }

  /**
   * Delete a item from the list
   * @param {String} key
   */
  deleteItem(key) {
    delete this.items[key];
    const items = this.contentToArray(this.items);
    this.setState({ items });
  }

  /**
   * Render an input in order to set a cdb list name
   */
  renderInputNameForNewCdbList() {
    return (
      <Fragment>
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>
              <EuiToolTip position="right" content={'Back to lists'}>
                <EuiButtonIcon
                  aria-label="Back"
                  color="primary"
                  iconSize="l"
                  iconType="arrowLeft"
                  onClick={() => this.props.cleanInfo()}
                />
              </EuiToolTip>
              {name}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem style={{ marginLeft: '-5px !important' }}>
          <EuiFieldText
            fullWidth={true}
            style={{ marginLeft: '-18px', width: 'calc(100% - 28px)' }}
            placeholder="New CDB list name"
            value={this.state.newListName}
            onChange={this.onNewListNameChange}
            aria-label="Use aria labels when no actual label is in use"
          />
        </EuiFlexItem>
      </Fragment>
    );
  }

  /**
   * Render an add buton with a popover to add new key and values and the save button for saving the list changes
   * @param {String} name
   * @param {String} path
   */
  renderAddAndSave(name, path, newList = false, items = []) {
    const saveButton = (
      <EuiButton
        fill
        isDisabled={items.length === 0}
        iconType="save"
        isLoading={this.state.isSaving}
        onClick={async () => this.saveList(name, path, newList)}
      >
        Save
      </EuiButton>
    );

    return (
      <Fragment>
        {!this.state.isPopoverOpen && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="plusInCircle"
              onClick={() => this.openAddEntry()}
            >
              Add new entry
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
        {/* Save button */}
        <EuiFlexItem grow={false}>{saveButton}</EuiFlexItem>
      </Fragment>
    );
  }

  renderAdd() {
    const { addingKey, addingValue } = this.state;

    return (
      <Fragment>
        {this.state.isPopoverOpen && (
          <div>
            <EuiSpacer size="l" />
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFieldText
                  fullWidth={true}
                  placeholder="Key"
                  value={addingKey}
                  onChange={this.onChangeKey}
                  aria-label="Use aria labels when no actual label is in use"
                />
              </EuiFlexItem>

              <EuiFlexItem>
                <EuiFieldText
                  fullWidth={true}
                  placeholder="Value"
                  value={addingValue}
                  onChange={this.onChangeValue}
                  aria-label="Use aria labels when no actual label is in use"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      iconType="plusInCircle"
                      isDisabled={!addingKey}
                      fill
                      onClick={() => this.addItem()}
                    >
                      Add
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty onClick={() => this.closeAddEntry()}>
                      Close
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        )}
      </Fragment>
    );
  }

  /**
   * Render the list name, path, and back button
   * @param {String} name
   * @param {String} path
   */
  renderTitle(name, path) {
    return (
      <Fragment>
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <span style={{ fontSize: '22px' }}>
              <EuiToolTip position="right" content={'Back to lists'}>
                <EuiButtonIcon
                  aria-label="Back"
                  color="primary"
                  iconSize="l"
                  iconType="arrowLeft"
                  onClick={() => this.props.cleanInfo()}
                />
              </EuiToolTip>
              {name}
            </span>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem style={{ marginLeft: '-5px !important' }}>
          <EuiText color="subdued" style={{ marginTop: '10px' }}>
            {path}
          </EuiText>
        </EuiFlexItem>
      </Fragment>
    );
  }

  //isDisabled={nameForSaving.length <= 4}
  render() {
    const { listInfo, isLoading, error } = this.props.state;
    const { adminMode } = this.props;
    const { name, path } = listInfo;

    const message = isLoading ? false : 'No results...';
    const columns = adminMode ? this.adminColumns : this.columns;

    const addingNew = name === false || !name;
    const listName = this.state.newListName || name;

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              {/* File name and back button when watching or editing a CDB list */}
              <EuiFlexGroup>
                {(!addingNew && this.renderTitle(name, path)) ||
                  this.renderInputNameForNewCdbList()}
                <EuiFlexItem />
                {/* This flex item is for separating between title and save button */}
                {/* Pop over to add new key and value */}
                {!addingNew && (
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      iconType="exportAction"
                      isDisabled={this.state.generatingCsv}
                      isLoading={this.state.generatingCsv}
                      onClick={async () => {
                        try {
                          this.setState({ generatingCsv: true });
                          await exportCsv(
                            `/lists?path=${path}/${name}`,
                            [
                              {
                                _isCDBList: true,
                                name: 'path',
                                value: `${path}/${name}`
                              }
                            ],
                            name
                          );
                          this.setState({ generatingCsv: false });
                        } catch (error) {
                          this.setState({ generatingCsv: false });
                        }
                      }}
                    >
                      Export formatted
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                )}
                {adminMode &&
                  !this.state.editing &&
                  this.renderAddAndSave(
                    listName,
                    path,
                    !addingNew,
                    this.state.items
                  )}
              </EuiFlexGroup>
              {this.state.showWarningRestart && (
                <Fragment>
                  <EuiSpacer size='s'/>
                  <WzRestartClusterManagerCallout
                    onRestart={() => this.setState({showWarningRestart: true})}
                    onRestarted={() => this.setState({showWarningRestart: false})}
                    onRestartedError={() => this.setState({showWarningRestart: false})}
                  />
                </Fragment>
              )}
              {/* CDB list table */}
              {this.renderAdd()}
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFlexGroup>
                    <EuiFlexItem style={{ marginTop: '30px' }}>
                      <EuiInMemoryTable
                        itemId="id"
                        items={this.state.items}
                        columns={columns}
                        pagination={{ pageSizeOptions: [10, 15] }}
                        sorting={true}
                        message={message}
                        search={{ box: { incremental: true } }}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers,
    adminMode: state.appStateReducers.adminMode
  };
};

const mapDispatchToProps = dispatch => {
  return {
    cleanInfo: () => dispatch(cleanInfo()),
    updateListContent: content => dispatch(updateListContent(content)),
    updateWazuhNotReadyYet: wazuhNotReadyYet => dispatch(updateWazuhNotReadyYet(wazuhNotReadyYet))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzListEditor);
