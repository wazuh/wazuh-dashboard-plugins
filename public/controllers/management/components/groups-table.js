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
  EuiButton
} from '@elastic/eui';

export class GroupsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: this.props.items,
      pageIndex: 0,
      pageSize: 10,
      showPerPageOptions: true,
      showConfirm: false,
      newGroupName: '',
      isPopoverOpen: false
    };
    this.firstRender = true;
  }

  /**
   * Refresh the groups entries
   */
  async refresh() {
    try {
      this.setState({ refreshingGroups: true });
      await this.props.refresh();
      this.setState({
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

  componentDidMount(){
    $('.groupNameInput').keypress((e) => {
      if(e.which === 13){
       console.log("enter");
      }
   });
  }

  togglePopover() {
    this.setState({
      isPopoverOpen: !this.state.isPopoverOpen
    });
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false
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
                      <EuiButtonIcon
                        aria-label="View group details"
                        onClick={() => this.props.goGroup(item)}
                        iconType="eye"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon
                        aria-label="Edit group configuration"
                        onClick={() => this.props.editGroup(item)}
                        iconType="pencil"
                      />
                    </EuiFlexItem>
                  </Fragment>
                )}
                {this.state.showConfirm !== item.name &&
                  item.name !== 'default' && (
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon
                        aria-label="Delete groups"
                        onClick={() => this.showConfirm(item.name)}
                        iconType="trash"
                        color="danger"
                      />
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
      <EuiPanel paddingSize="l">
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
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiButton
                    iconType="save"
                    fill
                    onClick={async () => {
                      await this.props.createGroup(this.state.newGroupName);
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
              iconType="importAction"
              onClick={async () => await this.props.export()}
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
        <EuiInMemoryTable
          itemId="id"
          items={this.state.items}
          columns={columns}
          search={search}
          pagination={true}
          loading={this.state.refreshingGroups}
        />
      </EuiPanel>
    );
  }
}

GroupsTable.propTypes = {
  items: PropTypes.array,
  createGroup: PropTypes.func,
  goGroup: PropTypes.func,
  editGroup: PropTypes.func,
  export: PropTypes.func,
  refresh: PropTypes.func,
  deleteGroup: PropTypes.func
};
