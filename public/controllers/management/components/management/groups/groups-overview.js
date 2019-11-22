/*
 * Wazuh app - React component for building the groups table.
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
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiInMemoryTable,
  EuiButtonIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiTitle,
  EuiButtonEmpty,
  EuiText,
  EuiPopover,
  EuiFormRow,
  EuiFieldText,
  EuiSpacer,
  EuiButton,
  EuiCallOut,
  EuiToolTip,
  EuiPage
} from '@elastic/eui';

import { connect } from 'react-redux';

// Wazuh components
import WzGroupsTable from './groups-table';


export class WzGroupsOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);

    this.state = {
      items: this.props.items,
      originalItems: this.props.items,
      pageIndex: 0,
      pageSize: 10,
      showPerPageOptions: true,
      showConfirm: false,
      newGroupName: '',
      isPopoverOpen: false,
      msg: false,
      isLoading: false
    };

    this.filters = { name: 'search', value: '' };
  }

  /**
   * Refresh the groups entries
   */
  async refresh() {
    try {
      this.setState({ refreshingGroups: true });
      await this.props.refresh();
      this.setState({
        originalItems: this.props.items,
        refreshingGroups: false
      });
    } catch (error) {
      this.setState({
        refreshingGroups: false
      });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      items: nextProps.items
    });
  }

  componentDidMount() {
    this._isMounted = true;
    if (this._isMounted) this.bindEnterToInput();
  }

  componentDidUpdate() {
    this.bindEnterToInput();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
  * Looking for the input element to bind the keypress event, once the input is found the interval is clear
  */
  bindEnterToInput() {
    try {
      const interval = setInterval(async () => {
        const input = document.getElementsByClassName('groupNameInput');
        if (input.length) {
          const i = input[0];
          if (!i.onkeypress) {
            i.onkeypress = async (e) => {
              if (e.which === 13) {
                await this.createGroup(this.state.newGroupName);
              }
            };
          }
          clearInterval(interval);
        }
      }, 150);
    } catch (error) { }
  }

  togglePopover() {
    if (this.state.isPopoverOpen) {
      this.closePopover();
    } else {
      this.setState({ isPopoverOpen: true });
    }
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false,
      msg: false,
      newGroupName: ''
    });
  }

  clearGroupName() {
    this.setState({
      newGroupName: ''
    });
  }

  onChangeNewGroupName = e => {
    this.setState({
      newGroupName: e.target.value
    });
  };

  showConfirm(groupName) {
    this.setState({
      showConfirm: groupName
    });
  }

  async createGroup() {
    try {
      this.setState({ msg: false });
      const groupName = this.state.newGroupName;
      await this.props.createGroup(groupName);
      this.clearGroupName();
      this.refresh();
      this.setState({ msg: { msg: `${groupName} created`, type: 'success' } });
    } catch (error) {
      this.setState({ msg: { msg: error, type: 'danger' } });
    }
  }


  onQueryChange = ({ query }) => {
    if (query) {
      this.setState({ isLoading: true });
      const filter = query.text || "";
      this.filters.value = filter;
      const items = filter
        ? this.state.originalItems.filter(item => {
          return item.name.toLowerCase().includes(filter.toLowerCase());
        })
        : this.state.originalItems;
      this.setState({
        isLoading: false,
        items: items,
      });
    }
  };

  render() {
    const columns = [
      {
        field: 'name',
        name: 'Name',
        sortable: true
      },
      {
        field: 'count',
        name: 'Agents',
        sortable: true
      },
      {
        field: 'mergedSum',
        name: 'Configuration checksum',
        sortable: true
      },
      {
        name: 'Actions',

        render: item => {
          return (
            <div>
              <EuiFlexGroup>
                {this.state.showConfirm !== item.name && (
                  <Fragment>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip
                        position="right"
                        content="View group details"
                      >
                        <EuiButtonIcon
                          aria-label="View group details"
                          onClick={() => this.props.goGroup(item)}
                          iconType="eye"
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiToolTip
                        position="right"
                        content="Edit group configuration"
                      >
                        <EuiButtonIcon
                          aria-label="Edit group configuration"
                          onClick={() => this.props.editGroup(item)}
                          iconType="pencil"
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                  </Fragment>
                )}
                {this.state.showConfirm !== item.name &&
                  item.name !== 'default' && (
                    <EuiFlexItem grow={false}>
                      <EuiToolTip
                        position="right"
                        content="Delete group"
                      >
                        <EuiButtonIcon
                          aria-label="Delete groups"
                          onClick={() => this.showConfirm(item.name)}
                          iconType="trash"
                          color="danger"
                        />
                      </EuiToolTip>
                    </EuiFlexItem>
                  )}
                {this.state.showConfirm === item.name && (
                  <EuiFlexItem grow={true}>
                    <EuiText>
                      <p>
                        Are you sure you want to delete this group?
                        <EuiButtonEmpty onClick={() => this.showConfirm(false)}>
                          No
                        </EuiButtonEmpty>
                        <EuiButtonEmpty
                          onClick={async () => {
                            this.showConfirm(false);
                            await this.props.deleteGroup(item);
                            this.refresh();
                          }}
                          color="danger"
                        >
                          Yes
                        </EuiButtonEmpty>
                      </p>
                    </EuiText>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </div>
          );
        }
      }
    ];

    const search = {
      onChange: this.onQueryChange,
      box: {
        incremental: this.state.incremental,
        schema: true
      }
    };

    const newGroupButton = (
      <EuiButtonEmpty
        iconSide="left"
        iconType="plusInCircle"
        onClick={() => this.togglePopover()}
      >
        Add new groups
      </EuiButtonEmpty>
    );

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>Groups</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiPopover
                id="popover"
                button={newGroupButton}
                isOpen={this.state.isPopoverOpen}
                closePopover={() => this.closePopover()}
              >
                <EuiFormRow label="Introduce the group name" id="">
                  <EuiFieldText
                    className="groupNameInput"
                    value={this.state.newGroupName}
                    onChange={this.onChangeNewGroupName}
                    aria-label=""
                  />
                </EuiFormRow>
                <EuiSpacer size="xs" />
                {this.state.msg && (
                  <Fragment>
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiCallOut title={this.state.msg.msg} color={this.state.msg.type} iconType={this.state.msg.type === 'danger' ? 'cross' : 'check'} />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size="xs" />
                  </Fragment>
                )}
                <EuiSpacer size="xs" />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiButton
                      iconType="save"
                      fill
                      onClick={async () => {
                        await this.createGroup(this.state.newGroupName);
                        this.clearGroupName();
                        this.refresh();
                      }}
                    >
                      Save new group
                  </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPopover>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="exportAction"
                onClick={async () => await this.props.export([this.filters])}
              >
                Export formatted
            </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType="refresh" onClick={() => this.refresh()}>
                Refresh
            </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
                From here you can list and check your groups, its agents and
                files.
            </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzGroupsTable />
            </EuiFlexItem>
          </EuiFlexGroup>
          {/* <EuiInMemoryTable
            itemId="id"
            items={this.state.items}
            columns={columns}
            search={search}
            pagination={true}
            loading={this.state.refreshingGroups || this.state.isLoading}
          /> */}
        </EuiPanel>
      </EuiPage>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

export default connect(mapStateToProps)(WzGroupsOverview);


WzGroupsOverview.propTypes = {
  items: PropTypes.array,
  createGroup: PropTypes.func,
  goGroup: PropTypes.func,
  editGroup: PropTypes.func,
  export: PropTypes.func,
  refresh: PropTypes.func,
  deleteGroup: PropTypes.func
};
