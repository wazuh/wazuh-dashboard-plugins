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
import {
  EuiBasicTable,
  EuiCallOut,
  EuiOverlayMask,
  EuiConfirmModal
} from '@elastic/eui';

import { connect } from 'react-redux';
import RulesetHandler from './utils/ruleset-handler';
import { toastNotifications } from 'ui/notify';

import {
  updateIsProcessing,
  updateShowModal,
  updateDefaultItems,
} from '../../../../../redux/actions/rulesetActions';

import RulesetColums from './utils/columns';
import { WzRequest } from '../../../../../react-services/wz-request';

class WzRulesetTable extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.wzReq = (...args) => WzRequest.apiReq(...args);
    this.state = {
      items: [],
      pageSize: 10,
      pageIndex: 0,
      totalItems: 0,
      isLoading: false,
    };
    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files',
    };
    this.rulesetHandler = RulesetHandler;
  }

  async componentDidMount() {
    this.props.updateIsProcessing(true);
    this._isMounted = true;
  }

  async componentDidUpdate(prevProps) {
    const sectionChanged = prevProps.state.section !== this.props.state.section

    if ( (this.props.state.isProcessing && this._isMounted) || sectionChanged) {
      this.setState({isLoading:true});
      this.props.updateIsProcessing(false);

      await this.getItems();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async getItems() {
    const { section, showingFiles } = this.props.state;

    this.setState({
      items : []
    });

    const rawItems = await this.wzReq(
      'GET',
      `${this.paths[section]}${showingFiles ? '/files': ''}`,
      this.buildFilter(),
    )

    const { items, totalItems } = ((rawItems || {}).data || {}).data;
    this.setState({
      items,
      totalItems,
      isLoading:false
    });
  }

  async setDefaultItems() {
    const requestDefaultItems = await this.wzReq(
      'GET',
      '/manager/configuration',
      {
        'wait_for_complete' : false,
        'section': 'ruleset',
        'field': 'list'
      }
    );

    const defaultItems = ((requestDefaultItems || {}).data || {}).data;
    this.props.updateDefaultItems(defaultItems);
  }

  buildFilter() {
    const { pageSize, pageIndex } = this.state;
    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      ...this.buildSortFilter(),
    };

    return filter;
  }

  buildSortFilter() {
    const {sortDirection, sortField} = this.state;
    const sortFilter = {};
    if (sortField) {
      const direction = (sortDirection === 'asc') ? '+' : '-';
      sortFilter['sort'] = direction+sortField;
    }

    return sortFilter;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({ pageSize, pageIndex, sortDirection, sortField });
    this.props.updateIsProcessing(true);
  };

  render() {
    this.rulesetColums = new RulesetColums(this.props);
    const {
      section,
      showingFiles,
      error,
    } = this.props.state;
    const { items,
      pageSize,
      totalItems,
      pageIndex,
      sortField,
      sortDirection,
      isLoading,
    } = this.state;
    const rulesetColums = this.rulesetColums.columns;
    const columns = showingFiles ? rulesetColums.files : rulesetColums[section];
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
    }

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
          />
          {this.props.state.showModal ? (
            <EuiOverlayMask>
              <EuiConfirmModal
                title="Are you sure?"
                onCancel={() => this.props.updateShowModal(false)}
                onConfirm={() => {
                  this.removeItems(itemList);
                  this.props.updateShowModal(false);
                }}
                cancelButtonText="No, don't do it"
                confirmButtonText="Yes, do it"
                defaultFocusedButton="cancel"
                buttonColor="danger"
              >
                <p>Are you sure you want to remove?</p>
                <div>
                  {itemList.map(function(item, i) {
                    return (
                      <li key={i}>{(item.file)? item.file: item.name}</li>
                    );
                  })}
                </div>
              </EuiConfirmModal>
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
      toastLifeTimeMs: time,
    });
  };

  async removeItems(items) {
    this.setState({ isLoading: true });
    const results = items.map(async (item, i) => {
      await this.rulesetHandler.deleteFile((item.file)? item.file: item.name, item.path);
    });

    Promise.all(results).then((completed) => {
      this.props.updateIsProcessing(true);
      this.showToast('success', 'Success', 'Deleted correctly', 3000);
    });
  };
}


const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateDefaultItems: defaultItems => dispatch(updateDefaultItems(defaultItems)), //TODO: Research to remove
    updateIsProcessing: isProcessing => dispatch(updateIsProcessing(isProcessing)),
    updateShowModal: showModal => dispatch(updateShowModal(showModal)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetTable);
