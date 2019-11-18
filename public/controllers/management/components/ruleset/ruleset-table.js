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
import { EuiBasicTable, EuiCallOut, EuiOverlayMask, EuiConfirmModal } from '@elastic/eui';

import { connect } from 'react-redux';
import RulesetHandler from './utils/ruleset-handler';

import {
  updateLoadingStatus,
  updateFileContent,
  updateRuleInfo,
  updateDecoderInfo,
  updateListContent,
  updateIsProcessing,
  updatePageIndex,
  updateShowModal,
  updateListItemsForRemove,
  updateSortDirection,
  updateSortField,
  updateDefaultItems,
} from '../../../../redux/actions/rulesetActions';

import RulesetColums from './utils/columns';
import { WzRequest } from '../../../../react-services/wz-request';

class WzRulesetTable extends Component {
  constructor(props) {
    super(props);
    this.wzReq = (...args) => WzRequest.apiReq(...args);
    this.state = {
      items: [],
      pageSize: 10,
      totalItems: 0,
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
  }

  async componentDidUpdate() {
    if (this.props.state.isProcessing) {
      await this.getItems();
    }
  }
  async getItems() {
    const { section, showingFiles } = this.props.state;
    const rawItems = await this.wzReq(
      'GET',
      `${this.paths[section]}${showingFiles ? '/files': ''}`,
      this.buildFilter(),
    )

    if(this.props.state.defaultItems.length === 0 && section === 'lists'){
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

    const { items, totalItems } = ((rawItems || {}).data || {}).data;
    this.setState({
      items,
      totalItems,
      isProcessing: false,
    });
    this.props.updateIsProcessing(false);
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
    const {sortField, sortDirection} = this.props.state;

    const field = sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';
    
    return direction+field;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({ pageSize });
    this.props.updatePageIndex(pageIndex);
    this.props.updateSortDirection(sortDirection);
    this.props.updateSortField(sortField);
    this.props.updateIsProcessing(true);
  };

  render() {
    this.rulesetColums = new RulesetColums(this.props);
    const {
      isLoading,
      section,
      pageIndex,
      showingFiles,
      error,
      sortField,
      sortDirection,
    } = this.props.state;
    const { items, pageSize, totalItems, } = this.state;
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
                      <li key={i}>{[item.name]}</li>
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

  async removeItems(items) {
    this.props.updateLoadingStatus(true);
    const results = items.map(async (item, i) => {
      await this.rulesetHandler.deleteFile(item.name, item.path);
    });

    Promise.all(results).then((completed) => {
      this.props.updateIsProcessing(true);
      this.props.updateLoadingStatus(false);
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
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateFileContent: content => dispatch(updateFileContent(content)),
    updateRuleInfo: info => dispatch(updateRuleInfo(info)),
    updateDecoderInfo: info => dispatch(updateDecoderInfo(info)),
    updateListContent: content => dispatch(updateListContent(content)),
    updateDefaultItems: defaultItems => dispatch(updateDefaultItems(defaultItems)),
    updateIsProcessing: isProcessing => dispatch(updateIsProcessing(isProcessing)),
    updatePageIndex: pageIndex => dispatch(updatePageIndex(pageIndex)),
    updateShowModal: showModal => dispatch(updateShowModal(showModal)),
    updateListItemsForRemove: itemList => dispatch(updateListItemsForRemove(itemList)),
    updateSortDirection: sortDirection => dispatch(updateSortDirection(sortDirection)),
    updateSortField: sortField => dispatch(updateSortField(sortField)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetTable);
