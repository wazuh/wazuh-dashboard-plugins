/*
 * Wazuh app - React component for groups main table.
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
import {
  EuiBasicTable,
  EuiCallOut,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiSpacer,
} from '@elastic/eui';

import { connect } from 'react-redux';
import { compose } from 'redux';
import GroupsHandler from './utils/groups-handler';
import { getToasts } from '../../../../../kibana-services';
import { WzSearchBar, filtersToObject } from '../../../../../components/wz-search-bar';
import { withUserPermissions } from '../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../react-services/wz-user-permissions';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';


import {
  updateLoadingStatus,
  updateFileContent,
  updateIsProcessing,
  updatePageIndex,
  updateShowModal,
  updateListItemsForRemove,
  updateSortDirection,
  updateSortField,
  updateGroupDetail,
} from '../../../../../redux/actions/groupsActions';

import GroupsColums from './utils/columns-main';

class WzGroupsTable extends Component {
  _isMounted = false;

  suggestions = []; //TODO: Fix suggestions without q search for API 4.0

  constructor(props) {
    super(props);
    this.state = {
      items: [],
      pageSize: 10,
      totalItems: 0,
      filters: [],
    };

    this.groupsHandler = GroupsHandler;
  }

  async componentDidMount() {
    this._isMounted = true;
    await this.getItems();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { items, filters } = this.state;
    const { isProcessing, showModal, isLoading } = this.props.state;
    if (showModal !== nextProps.state.showModal) return true;
    if (isProcessing !== nextProps.state.isProcessing) return true;
    if (JSON.stringify(items) !== JSON.stringify(nextState.items)) return true;
    if (JSON.stringify(filters) !== JSON.stringify(nextState.filters)) return true;
    if (isLoading !== nextProps.state.isLoading) return true;
    return false;
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
    this.setState({ items: [], totalItems: 0 }, async () => {
      try {
        this.props.updateLoadingStatus(true);
        const rawItems = await this.groupsHandler.listGroups({ params: this.buildFilter() });
        const { affected_items, total_affected_items } = ((rawItems || {}).data || {}).data;

        this.setState({
          items: affected_items,
          totalItems: total_affected_items,
        });
        this.props.updateLoadingStatus(false);
        this.props.state.isProcessing && this.props.updateIsProcessing(false);
      } catch (error) {
        this.props.updateLoadingStatus(false);
        this.props.state.isProcessing && this.props.updateIsProcessing(false);
        const options = {
          context: `${WzGroupsTable.name}.getItems`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.CRITICAL,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Error getting groups`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    });
  }

  buildFilter() {
    const { pageIndex } = this.props.state;
    const { pageSize, filters } = this.state;
    const filter = {
      ...filtersToObject(filters),
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
    this._isMounted && this.setState({ pageSize });
    this.props.updatePageIndex(pageIndex);
    this.props.updateSortDirection(sortDirection);
    this.props.updateSortField(sortField);
    this.props.updateIsProcessing(true);
  };

  render() {
    const { filters } = this.state;

    this.groupsColumns = new GroupsColums(this.props);
    const { isLoading, pageIndex, error, sortField, sortDirection } = this.props.state;
    const { items, pageSize, totalItems } = this.state;
    const columns = this.groupsColumns.columns;
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
    const getRowProps = (item) => {
      const { id } = item;
      return {
        'data-test-subj': `row-${id}`,
        className: 'customRowClass',
        onClick: !WzUserPermissions.checkMissingUserPermissions(
          [{ action: 'group:read', resource: `group:id:${item.name}` }],
          this.props.userPermissions
        )
          ? () => this.props.updateGroupDetail(item)
          : undefined,
      };
    };

    if (error) {
      return <EuiCallOut color="warning" title={error} iconType="gear" />;
    }
    const itemList = this.props.state.itemList;
    return (
      <Fragment>
        <WzSearchBar
          filters={filters}
          suggestions={this.suggestions}
          onFiltersChange={(filters) => this._isMounted && this.setState({ filters })}
          placeholder="Search group"
        />
        <EuiSpacer size="s" />
        <EuiBasicTable
          itemId="id"
          items={items}
          columns={columns}
          pagination={pagination}
          onChange={this.onTableChange}
          loading={isLoading}
          sorting={sorting}
          message={message}
          rowProps={getRowProps}
          search={{ box: { incremental: true } }}
        />
        {this.props.state.showModal ? (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={`Delete ${itemList[0].file ? itemList[0].file : itemList[0].name} group?`}
              onCancel={() => this.props.updateShowModal(false)}
              onConfirm={() => {
                this.removeItems(itemList);
                this.props.updateShowModal(false);
              }}
              cancelButtonText="Cancel"
              confirmButtonText="Delete"
              defaultFocusedButton="cancel"
              buttonColor="danger"
            ></EuiConfirmModal>
          </EuiOverlayMask>
        ) : null}
      </Fragment>
    );
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  async removeItems(items) {
    this.props.updateLoadingStatus(true);
    const results = items.map(async (item, i) => {
      await this.groupsHandler.deleteGroup(item.name);
    });

    Promise.all(results).then(
      (completed) => {
        this.props.updateIsProcessing(true);
        this.props.updateLoadingStatus(false);
        this.showToast('success', 'Success', 'Deleted successfully', 3000);
      },
      (error) => {
        this.props.updateIsProcessing(true);
        this.props.updateLoadingStatus(false);
        this.showToast('danger', 'Error', error, 3000);
      }
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.groupsReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateLoadingStatus: (status) => dispatch(updateLoadingStatus(status)),
    updateFileContent: (content) => dispatch(updateFileContent(content)),
    updateIsProcessing: (isProcessing) => dispatch(updateIsProcessing(isProcessing)),
    updatePageIndex: (pageIndex) => dispatch(updatePageIndex(pageIndex)),
    updateShowModal: (showModal) => dispatch(updateShowModal(showModal)),
    updateListItemsForRemove: (itemList) => dispatch(updateListItemsForRemove(itemList)),
    updateSortDirection: (sortDirection) => dispatch(updateSortDirection(sortDirection)),
    updateSortField: (sortField) => dispatch(updateSortField(sortField)),
    updateGroupDetail: (itemDetail) => dispatch(updateGroupDetail(itemDetail)),
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withUserPermissions
)(WzGroupsTable);
