/*
 * Wazuh app - React component for reporting table.
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import ReportingHandler from './utils/reporting-handler';
import { getToasts } from '../../../../../kibana-services';

import {
  updateIsProcessing,
  updateShowModal,
  updateListItemsForRemove,
} from '../../../../../redux/actions/reportingActions';

import ReportingColums from './utils/columns-main';

import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';

class WzReportingTable extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      isLoading: false,
    };

    this.reportingHandler = ReportingHandler;
  }

  async componentDidMount() {
    this.props.updateIsProcessing(true);
    this._isMounted = true;
  }

  async componentDidUpdate() {
    try {
      if (this.props.state.isProcessing && this._isMounted) {
        await this.getItems();
      }
    } catch (error) {
      const options = {
        context: `${WzReportingTable.name}.componentDidUpdate`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
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
      const {reports: items = []} = rawItems?.data;
      this.setState({
        items,
        isProcessing: false,
      });
      this.props.updateIsProcessing(false);
    } catch (error) {
      this.props.updateIsProcessing(false);
      throw error;
    }
  }

  render() {
    this.reportingColumns = new ReportingColums(this.props);
    const { isLoading, error } = this.props.state;
    const { items } = this.state;
    const columns = this.reportingColumns.columns;
    const message = isLoading ? null : 'No results...';

    const deleteReport = (itemList) => {
      try {
        this.deleteReport(itemList);
        this.props.updateShowModal(false);
      } catch (error) {
        const options = {
          context: `${WzReportingTable.name}.deleteReport`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: `${error.name}: Error deleting report`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    };

    const sorting = {
      sort: {
        field: 'date',
        direction: 'desc',
      },
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
                onConfirm={() => deleteReport(itemList)}
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
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  async deleteReport(items) {
    try {
      const results = items.map(async (item, i) => {
        await this.reportingHandler.deleteReport(item.name);
      });
      await Promise.all(results);
      this.props.updateIsProcessing(true);
      this.showToast('success', 'Success', 'Deleted successfully', 3000);
    } catch (error) {
      throw error;
    }
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.reportingReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateIsProcessing: (isProcessing) => dispatch(updateIsProcessing(isProcessing)),
    updateShowModal: (showModal) => dispatch(updateShowModal(showModal)),
    updateListItemsForRemove: (itemList) => dispatch(updateListItemsForRemove(itemList)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzReportingTable);
