/*
 * Wazuh app - React component for groups files table.
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
import { EuiBasicTable, EuiCallOut, EuiSpacer } from '@elastic/eui';

import { connect } from 'react-redux';
import GroupsHandler from './utils/groups-handler';
import { getToasts }  from '../../../../../kibana-services';

import {
  updateLoadingStatus,
  updateIsProcessing,
  updatePageIndexFile,
  updateSortDirectionFile,
  updateSortFieldFile,
  updateFileContent
} from '../../../../../redux/actions/groupsActions';
import GroupsFilesColumns from './utils/columns-files';
import { WzSearchBar, filtersToObject } from '../../../../../components/wz-search-bar';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';


class WzGroupFilesTable extends Component {
  _isMounted = false;
  suggestions = [
    //{ type: 'q', label: 'filename', description: 'Filter by file name', operators: ['=', '!=',], values: async (value) => getGroupsFilesValues('filename', value, {},this.props.state.itemDetail.name )},
    //{ type: 'params', label: 'hash', description: 'Filter by hash', operators: ['=', '!=',], values: async (value) => getGroupsFilesValues('hash', value, {},this.props.state.itemDetail.name )},
  ];

  constructor(props) {
    super(props);
    this.state = {
      items: [],
      pageSize: 10,
      totalItems: 0,
      filters: []
    };

    this.groupsHandler = GroupsHandler;
  }

  async componentDidMount() {
    await this.getItems();
    this._isMounted = true;
  }

  async componentDidUpdate(prevProps, prevState) {
    if (this.props.state.isProcessing && this._isMounted) {
      await this.getItems();
    }
    const { filters } = this.state;
    if (JSON.stringify(filters) !== JSON.stringify(prevState.filters)) {
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
        { params: this.buildFilter() }
      );
      const { affected_items, total_affected_items } = ((rawItems || {}).data || {}).data;

      this.setState({
        items: affected_items,
        totalItems: total_affected_items,
        isProcessing: false
      });
      this.props.state.isProcessing && this.props.updateIsProcessing(false);
    } catch (error) {
      this.props.state.isProcessing && this.props.updateIsProcessing(false);
      const options = {
        context: `${WzGroupFilesTable.name}.getItems`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.CRITICAL,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error loading the groups: ${error.message || error}`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  buildFilter() {
    const { pageIndexFile } = this.props.state;
    const { pageSize, filters } = this.state;
    const filter = {
      ...filtersToObject(filters),
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
    const { items, pageSize, totalItems, filters } = this.state;
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
        <Fragment>
          <WzSearchBar
            filters={filters}
            suggestions={this.suggestions}
            onFiltersChange={filters => this.setState({filters})}
            placeholder='Search file'
          />
          <EuiSpacer size='s' />
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
        </Fragment>
      );
    } else {
      return <EuiCallOut color="warning" title={error} iconType="gear" />;
    }
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
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
