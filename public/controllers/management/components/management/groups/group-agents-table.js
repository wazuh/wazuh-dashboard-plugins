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
import React, { Component } from 'react';
import {
  EuiBasicTable,
  EuiCallOut,
  EuiOverlayMask,
  EuiConfirmModal
} from '@elastic/eui';

import { connect } from 'react-redux';
import GroupsHandler from './utils/groups-handler';
import { toastNotifications } from 'ui/notify';

import {
  updateLoadingStatus,
  updateFileContent,
  updateIsProcessing,
  updatePageIndexAgents,
  updateShowModal,
  updateListItemsForRemove,
  updateSortDirectionAgents,
  updateSortFieldAgents
} from '../../../../../redux/actions/groupsActions';

import GroupsAgentsColums from './utils/columns-agents';

class WzGroupAgentsTable extends Component {
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
      const rawItems = await this.groupsHandler.agentsGroup(
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
    const { pageIndexAgents } = this.props.state;
    const { pageSize } = this.state;
    const filter = {
      offset: pageIndexAgents * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter()
    };

    return filter;
  }

  buildSortFilter() {
    const { sortFieldAgents, sortDirectionAgents } = this.props.state;

    const field = sortFieldAgents;
    const direction = sortDirectionAgents === 'asc' ? '+' : '-';

    return direction + field;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndexAgents, size: pageSize } = page;
    const { field: sortFieldAgents, direction: sortDirectionAgents } = sort;
    this.setState({ pageSize });
    this.props.updatePageIndexAgents(pageIndexAgents);
    this.props.updateSortDirectionAgents(sortDirectionAgents);
    this.props.updateSortFieldAgents(sortFieldAgents);
    this.props.updateIsProcessing(true);
  };

  render() {
    this.groupsAgentsColumns = new GroupsAgentsColums(this.props);
    const {
      isLoading,
      pageIndexAgents,
      error,
      sortFieldAgents,
      sortDirectionAgents
    } = this.props.state;
    const { items, pageSize, totalItems } = this.state;
    const columns = this.groupsAgentsColumns.columns;
    const message = isLoading ? null : 'No results...';
    const pagination = {
      pageIndex: pageIndexAgents,
      pageSize: pageSize,
      totalItemCount: totalItems,
      pageSizeOptions: [10, 25, 50, 100]
    };
    const sorting = {
      sort: {
        field: sortFieldAgents,
        direction: sortDirectionAgents
      }
    };

    if (!error) {
      const itemList = this.props.state.itemList;
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
          {this.props.state.showModal ? (
            <EuiOverlayMask>
              <EuiConfirmModal
                title={`Delete ${
                  itemList[0].file ? itemList[0].file : itemList[0].name
                } agent?`}
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

  async removeItems(items) {
    const { itemDetail } = this.props.state;

    this.props.updateLoadingStatus(true);
    const results = items.map(async (item, i) => {
      await this.groupsHandler.deleteAgent(item.id, itemDetail.name);
    });

    Promise.all(results).then(
      completed => {
        this.props.updateIsProcessing(true);
        this.props.updateLoadingStatus(false);
        this.showToast('success', 'Success', 'Deleted successfully', 3000);
      },
      error => {
        this.props.updateIsProcessing(true);
        this.props.updateLoadingStatus(false);
        this.showToast('danger', 'Error', error, 3000);
      }
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateFileContent: content => dispatch(updateFileContent(content)),
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing)),
    updatePageIndexAgents: pageIndexAgents =>
      dispatch(updatePageIndexAgents(pageIndexAgents)),
    updateShowModal: showModal => dispatch(updateShowModal(showModal)),
    updateListItemsForRemove: itemList =>
      dispatch(updateListItemsForRemove(itemList)),
    updateSortDirectionAgents: sortDirectionAgents =>
      dispatch(updateSortDirectionAgents(sortDirectionAgents)),
    updateSortFieldAgents: sortFieldAgents =>
      dispatch(updateSortFieldAgents(sortFieldAgents))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzGroupAgentsTable);
