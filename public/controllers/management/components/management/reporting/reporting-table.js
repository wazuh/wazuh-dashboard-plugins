/*
 * Wazuh app - React component for reporting table.
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
  EuiInMemoryTable,
  EuiCallOut,
  EuiOverlayMask,
  EuiConfirmModal
} from '@elastic/eui';

import { connect } from 'react-redux';
import ReportingHandler from './utils/reporting-handler';
import { toastNotifications } from 'ui/notify';

import {
  updateIsProcessing,
  updateShowModal,
  updateListItemsForRemove
} from '../../../../../redux/actions/reportingActions';

import ReportingColums from './utils/columns-main';

class WzReportingTable extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      isLoading: false
    };

    this.reportingHandler = ReportingHandler;
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
      const rawItems = await this.reportingHandler.listReports();
      const items = ((rawItems || {}).data || {}).list || [];
      this.setState({
        items,
        isProcessing: false
      });
      this.props.updateIsProcessing(false);
    } catch (error) {
      this.props.updateIsProcessing(false);
      return Promise.reject(error);
    }
  }

  render() {
    this.reportingColumns = new ReportingColums(this.props);
    const { isLoading, error } = this.props.state;
    const { items } = this.state;
    const columns = this.reportingColumns.columns;
    const message = isLoading ? null : 'No results...';

    const sorting = {
      sort: {
        field: 'date',
        direction: 'desc'
      }
    };

    if (!error) {
      const itemList = this.props.state.itemList;
      return (
        <div>
          <EuiInMemoryTable
            items={items}
            columns={columns}
            pagination={true}
            loading={isLoading}
            message={message}
            sorting={sorting}
            search={{ box: { incremental: true } }}
          />
          {this.props.state.showModal ? (
            <EuiOverlayMask>
              <EuiConfirmModal
                title={`Delete report?`}
                onCancel={() => this.props.updateShowModal(false)}
                onConfirm={() => {
                  this.deleteReport(itemList);
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

  async deleteReport(items) {
    const results = items.map(async (item, i) => {
      await this.reportingHandler.deleteReport(item.name);
    });

    Promise.all(results).then(completed => {
      this.props.updateIsProcessing(true);
      this.showToast('success', 'Success', 'Deleted successfully', 3000);
    });
  }
}

const mapStateToProps = state => {
  return {
    state: state.reportingReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing)),
    updateShowModal: showModal => dispatch(updateShowModal(showModal)),
    updateListItemsForRemove: itemList =>
      dispatch(updateListItemsForRemove(itemList))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzReportingTable);
