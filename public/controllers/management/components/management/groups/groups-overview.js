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
import React, { Component } from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiPanel, EuiTitle, EuiText, EuiPage } from '@elastic/eui';

import { connect } from 'react-redux';

// Wazuh components
import WzGroupsTable from './groups-table';
import WzGroupsActionButtons from './actions-buttons-main';

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
      isLoading: false,
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
        refreshingGroups: false,
      });
    } catch (error) {
      this.setState({
        refreshingGroups: false,
      });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      items: nextProps.items,
    });
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  showConfirm(groupName) {
    this.setState({
      showConfirm: groupName,
    });
  }

  onQueryChange = ({ query }) => {
    if (query) {
      this.setState({ isLoading: true });
      const filter = query.text || '';
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
            <WzGroupsActionButtons />
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
                From here you can list and check your groups, its agents and files.
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <WzGroupsTable />
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
  };
};

export default connect(mapStateToProps)(WzGroupsOverview);
