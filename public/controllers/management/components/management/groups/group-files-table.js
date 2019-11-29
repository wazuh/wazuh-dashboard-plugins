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
import { EuiInMemoryTable, EuiCallOut, EuiOverlayMask, EuiConfirmModal } from '@elastic/eui';

import { connect } from 'react-redux';
import GroupsHandler from './utils/groups-handler';
import { toastNotifications } from 'ui/notify';

import {
  updateLoadingStatus,
  updateIsProcessing,
  updatePageIndex,
  updateSortDirection,
  updateSortField,
  updateFileContent,
} from '../../../../../redux/actions/groupsActions';

import GroupsFilesColumns from './utils/columns-files';

class WzGroupFilesTable extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      pageSize: 10,
      totalItems: 0,
    };

    this.groupsHandler = GroupsHandler;
  }

  async componentDidMount() {
    this.props.updateIsProcessing(true);

    this._isMounted = true;
  }

  async componentDidUpdate() {
    if (this.props.state.isProcessing && this._isMounted) {
      await this.getItems();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Loads the initial information
   */
  async getItems() {
    try {
      const rawItems = await this.groupsHandler.filesGroup(this.props.state.itemDetail.name);
      const { items, totalItems } = ((rawItems || {}).data || {}).data;

      this.setState({
        items,
        totalItems,
        isProcessing: false,
      });
      this.props.updateIsProcessing(false);
    } catch (error) {
      this.props.updateIsProcessing(false);
      return Promise.reject(error);
    }
  }

  buildFilter() {
    const { pageIndex } = this.props.state;
    const { pageSize } = this.state;
    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter(),
    };

    return filter;
  }

  buildSortFilter() {
    const { sortField, sortDirection } = this.props.state;

    const field = sortField;
    const direction = sortDirection === 'asc' ? '+' : '-';

    return direction + field;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({ pageSize });
    this.props.updatePageIndex(pageIndex);
    this.props.updateSortDirection(sortDirection);
    this.props.changeGroupsSortField(sortField);
    this.props.updateIsProcessing(true);
  };

  render() {
    this.groupsAgentsColumns = new GroupsFilesColumns(this.props);
    const { isLoading, pageIndex, error, sortField, sortDirection } = this.props.state;
    const { items, pageSize, totalItems } = this.state;
    const columns = this.groupsAgentsColumns.columns;
    const message = isLoading ? null : 'No results...';
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      pageSizeOptions: [10, 25, 50, 100],
    };
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };

    if (!error) {
      return (
        <div>
          <EuiInMemoryTable
            itemId="id"
            items={items}
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
            loading={isLoading}
            sorting={sorting}
            message={message}
            search={{ box: { incremental: true } }}
          />
        </div>
      );
    } else {
      return <EuiCallOut color="warning" title={error} iconType="gear" />;
    }
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateIsProcessing: isProcessing => dispatch(updateIsProcessing(isProcessing)),
    updatePageIndex: pageIndex => dispatch(updatePageIndex(pageIndex)),
    updateSortDirection: sortDirection => dispatch(updateSortDirection(sortDirection)),
    updateSortField: sortField => dispatch(updateSortField(sortField)),
    updateFileContent: content => dispatch(updateFileContent(content)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzGroupFilesTable);
