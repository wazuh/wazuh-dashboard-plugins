/*
 * Wazuh app - React component for groups files table.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiBasicTable, EuiCallOut } from '@elastic/eui';

import { connect } from 'react-redux';
import GroupsHandler from './utils/groups-handler';
import { toastNotifications } from 'ui/notify';

import {
  updateLoadingStatus,
  updateIsProcessing,
  updatePageIndexFile,
  updateSortDirectionFile,
  updateSortFieldFile,
  updateFileContent
} from '../../../../../redux/actions/groupsActions';

import GroupsFilesColumns from './utils/columns-files';

class WzGroupFilesTable extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      pageSize: 10,
      totalItems: 0
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
      const rawItems = await this.groupsHandler.filesGroup(
        this.props.state.itemDetail.name,
        this.buildFilter()
      );
      const { items, totalItems } = ((rawItems || {}).data || {}).data;

      this.setState({
        items,
        totalItems,
        isProcessing: false
      });
      this.props.updateIsProcessing(false);
    } catch (error) {
      this.props.updateIsProcessing(false);
      return Promise.reject(error);
    }
  }

  buildFilter() {
    const { pageIndexFile } = this.props.state;
    const { pageSize } = this.state;
    const filter = {
      offset: pageIndexFile * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter()
    };

    return filter;
  }

  buildSortFilter() {
    const { sortFieldFile, sortDirectionFile } = this.props.state;

    const field = sortFieldFile;
    const direction = sortDirectionFile === 'asc' ? '+' : '-';

    return direction + field;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndexFile, size: pageSize } = page;
    const { field: sortFieldFile, direction: sortDirectionFile } = sort;
    this.setState({ pageSize });
    this.props.updatePageIndexFile(pageIndexFile);
    this.props.updateSortDirectionFile(sortDirectionFile);
    this.props.updateSortFieldFile(sortFieldFile);
    this.props.updateIsProcessing(true);
  };

  render() {
    this.groupsAgentsColumns = new GroupsFilesColumns(this.props);
    const {
      isLoading,
      pageIndexFile,
      error,
      sortFieldFile,
      sortDirectionFile
    } = this.props.state;
    const { items, pageSize, totalItems } = this.state;
    const columns = this.groupsAgentsColumns.columns;
    const message = isLoading ? null : 'No results...';
    const pagination = {
      pageIndex: pageIndexFile,
      pageSize: pageSize,
      totalItemCount: totalItems,
      pageSizeOptions: [10, 25, 50, 100]
    };
    const sorting = {
      sort: {
        field: sortFieldFile,
        direction: sortDirectionFile
      }
    };

    if (!error) {
      return (
        <div>
          <EuiBasicTable
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
      toastLifeTimeMs: time
    });
  };
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing)),
    updatePageIndexFile: pageIndexFile =>
      dispatch(updatePageIndexFile(pageIndexFile)),
    updateSortDirectionFile: sortDirectionFile =>
      dispatch(updateSortDirectionFile(sortDirectionFile)),
    updateSortFieldFile: sortFieldFile =>
      dispatch(updateSortFieldFile(sortFieldFile)),
    updateFileContent: content => dispatch(updateFileContent(content))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzGroupFilesTable);
