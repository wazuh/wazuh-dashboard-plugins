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
import RulesetHandler from './utils/ruleset-handler';
import { toastNotifications } from 'ui/notify';

import {
  updateIsProcessing,
  updateShowModal,
  updateDefaultItems,
  updateListContent,
  updateFileContent,
  updateListItemsForRemove,
  updateRuleInfo,
  updateDecoderInfo
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
      pageSize: 15,
      pageIndex: 0,
      totalItems: 0,
      isLoading: false
    };
    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files'
    };
    this.rulesetHandler = RulesetHandler;
  }

  async componentDidMount() {
    this.props.updateIsProcessing(true);
    this._isMounted = true;
  }

  async componentDidUpdate(prevProps) {
    const sectionChanged = prevProps.state.section !== this.props.state.section;
    const showingFilesChanged =
      prevProps.state.showingFiles !== this.props.state.showingFiles;
    const filtersChanged = prevProps.state.filters !== this.props.state.filters;
    if ((this.props.state.isProcessing && this._isMounted) || sectionChanged) {
      if (sectionChanged || showingFilesChanged || filtersChanged) {
        await this.setState({
          pageSize: this.state.pageSize,
          pageIndex: 0,
          sortDirection: null,
          sortField: null
        });
      }
      this.setState({ isLoading: true });
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
      items: []
    });

    const rawItems = await this.wzReq(
      'GET',
      `${this.paths[this.props.request]}${showingFiles ? '/files' : ''}`,
      this.buildFilter()
    ).catch(error => {
      console.warn(`Error when get the items of ${section}: `, error);
      return {};
    });

    const { items = [], totalItems = 0 } =
      ((rawItems || {}).data || {}).data || {};
    this.setState({
      items,
      totalItems,
      isLoading: false
    });
  }

  async setDefaultItems() {
    const requestDefaultItems = await this.wzReq(
      'GET',
      '/manager/configuration',
      {
        wait_for_complete: false,
        section: 'ruleset',
        field: 'list'
      }
    );

    const defaultItems = ((requestDefaultItems || {}).data || {}).data;
    this.props.updateDefaultItems(defaultItems);
  }

  buildFilter() {
    const { pageSize, pageIndex } = this.state;
    const { filters } = this.props.state;
    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      ...this.buildSortFilter(),
      ...filters
    };

    return filter;
  }

  buildSortFilter() {
    const { sortDirection, sortField } = this.state;
    const sortFilter = {};
    if (sortField) {
      const direction = sortDirection === 'asc' ? '+' : '-';
      sortFilter['sort'] = direction + sortField;
    }

    return sortFilter;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({ pageSize, pageIndex, sortDirection, sortField });
    this.props.updateIsProcessing(true);
  };

  getColumns() {
    const { section, showingFiles } = this.props.state;
    const rulesetColums = new RulesetColums(this.props).columns;
    const columns = showingFiles ? rulesetColums.files : rulesetColums[section];
    return columns;
  }

  render() {
    const { error } = this.props.state;
    const {
      items,
      pageSize,
      totalItems,
      pageIndex,
      sortField,
      sortDirection,
      isLoading
    } = this.state;
    const columns = this.getColumns();
    const message = isLoading ? null : 'No results...';
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      pageSizeOptions: [10, 15, 25, 50, 100]
    };
    const sorting = !!sortField
      ? {
          sort: {
            field: sortField,
            direction: sortDirection
          }
        }
      : {};

    if (!error) {
      const itemList = this.props.state.itemList;

      const getRowProps = item => {
        const { id, name } = item;
        return {
          'data-test-subj': `row-${id || name}`,
          className: 'customRowClass',
          onClick: async () => {
            const { section } = this.props.state;
            if (section === 'rules') {
              const result = await this.rulesetHandler.getRuleInformation(
                item.file,
                id
              );
              this.props.updateRuleInfo(result);
            } else if (section === 'decoders') {
              const result = await this.rulesetHandler.getDecoderInformation(
                item.file,
                name
              );
              this.props.updateDecoderInfo(result);
            } else {
              const result = await this.rulesetHandler.getCdbList(
                `${item.path}/${item.name}`
              );
              const file = {
                name: item.name,
                content: result,
                path: item.path
              };
              this.props.updateListContent(file);
            }
          }
        };
      };

      return (
        <div>
          <EuiBasicTable
            itemId="id"
            items={items}
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
            loading={isLoading}
            rowProps={
              (!this.props.state.showingFiles && getRowProps) || undefined
            }
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
                <p>This items will be removed</p>
                <div>
                  {itemList.map(function(item, i) {
                    return <li key={i}>{item.file ? item.file : item.name}</li>;
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
      toastLifeTimeMs: time
    });
  };

  async removeItems(items) {
    this.setState({ isLoading: true });
    const results = items.map(async (item, i) => {
      await this.rulesetHandler.deleteFile(
        item.file ? item.file : item.name,
        item.path
      );
    });

    Promise.all(results).then(completed => {
      this.props.updateIsProcessing(true);
      this.showToast('success', 'Success', 'Deleted successfully', 3000);
    });
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateDefaultItems: defaultItems =>
      dispatch(updateDefaultItems(defaultItems)), //TODO: Research to remove
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing)),
    updateShowModal: showModal => dispatch(updateShowModal(showModal)),
    updateFileContent: fileContent => dispatch(updateFileContent(fileContent)),
    updateListContent: listInfo => dispatch(updateListContent(listInfo)),
    updateListItemsForRemove: itemList =>
      dispatch(updateListItemsForRemove(itemList)),
    updateRuleInfo: rule => dispatch(updateRuleInfo(rule)),
    updateDecoderInfo: rule => dispatch(updateDecoderInfo(rule))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzRulesetTable);
