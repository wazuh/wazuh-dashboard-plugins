/*
 * Wazuh app - React component for registering agents.
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
import { EuiBasicTable, EuiCallOut, EuiOverlayMask, EuiConfirmModal } from '@elastic/eui';

import { connect } from 'react-redux';
import { RulesetHandler, RulesetResources, resourceDictionary } from './utils/ruleset-handler';
import { getToasts } from '../../../../../kibana-services';

import {
  updateIsProcessing,
  updateShowModal,
  updateDefaultItems,
  updateListContent,
  updateFileContent,
  updateListItemsForRemove,
  updateRuleInfo,
  updateDecoderInfo,
} from '../../../../../redux/actions/rulesetActions';

import RulesetColums from './utils/columns';
import { WzRequest } from '../../../../../react-services/wz-request';
import { filtersToObject } from '../../../../../components/wz-search-bar';
import { withUserPermissions } from '../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
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
      isLoading: false,
      isRedirect: false,
    };
    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files',
    };
    this.extraSectionPrefixResource = {
      rules: 'rule:file',
      decoders: 'decoder:file',
      lists: 'list:file',
    };
    this.rulesetHandler = new RulesetHandler(this.props.state.section);
  }

  async componentDidMount() {
    this._isMounted = true;
    this.props.updateIsProcessing(true);
    if (this.props.state.section === RulesetResources.RULES) {
      const regex = new RegExp('redirectRule=' + '[^&]*');
      const match = window.location.href.match(regex);
      if (match && match[0]) {
        this._isMounted && this.setState({ isRedirect: true });
        const id = match[0].split('=')[1];
        try {
          const result = await this.rulesetHandler.getResource({
            params: {
              rule_ids: id,
            },
          });
          const items = result.data.affected_items || [];
          if (items.length) {
            const info = await this.rulesetHandler.getResource({
              params: {
                filename: items[0].filename,
              },
            });
            if (info.data) {
              Object.assign(info.data, { current: parseInt(id) });
            }
            this.props.updateRuleInfo(info.data);
          }
        } catch (error) {
          const options = {
            context: `${WzRulesetTable.name}.componentDidMount`,
            level: UI_LOGGER_LEVELS.ERROR,
            severity: UI_ERROR_SEVERITIES.BUSINESS,
            error: {
              error: error,
              message: `Error getting resources: ${error.message || error}`,
              title: error.name || error,
            },
          };
          getErrorOrchestrator().handleError(options);
        }
        this._isMounted && this.setState({ isRedirect: false });
      }
    }
  }

  async componentDidUpdate(prevProps) {
    const { isProcessing, section, showingFiles, filters } = this.props.state;

    const processingChange =
      prevProps.state.isProcessing !== isProcessing ||
      (prevProps.state.isProcessing && isProcessing);
    const sectionChanged = prevProps.state.section !== section;
    const showingFilesChanged = prevProps.state.showingFiles !== showingFiles;
    const filtersChanged = prevProps.state.filters !== filters;

    try {
      if (
        (this._isMounted && processingChange && isProcessing) ||
        sectionChanged ||
        filtersChanged
      ) {
        if (sectionChanged || showingFilesChanged || filtersChanged) {
          this._isMounted &&
            (await this.setState({
              pageSize: this.state.pageSize,
              pageIndex: 0,
              sortDirection: null,
              sortField: null,
            }));
        }
        this._isMounted && this.setState({ isLoading: true });
        this.props.updateIsProcessing(false);
        await this.getItems();
      }
    } catch (error) {
      const options = {
        context: `${WzRulesetTable.name}.componentDidUpdate`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: `Error getting items: ${error.message || error}`,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async getItems() {
    const { section, showingFiles } = this.props.state;

    this._isMounted &&
      this.setState({
        items: [],
      });
    this.props.updateTotalItems(false);

    const rawItems = await this.wzReq(
      'GET',
      `${this.paths[this.props.request]}${showingFiles ? '/files' : ''}`,
      { params: this.buildFilter() }
    ).catch((error) => {
      throw new Error(`Error when get the items of ${section}`);
    });

    const { affected_items = [], total_affected_items = 0 } =
      ((rawItems || {}).data || {}).data || {};
    this.props.updateTotalItems(total_affected_items);
    this._isMounted &&
      this.setState({
        items: affected_items,
        totalItems: total_affected_items,
        isLoading: false,
      });
  }

  async setDefaultItems() {
    try {
      const requestDefaultItems = await this.wzReq('GET', '/manager/configuration', {
        wait_for_complete: false,
        section: 'ruleset',
        field: 'list',
      });

      const defaultItems = ((requestDefaultItems || {}).data || {}).data;
      this.props.updateDefaultItems(defaultItems);
    } catch (error) {
      throw error;
    }
  }

  buildFilter() {
    const { pageSize, pageIndex } = this.state;
    const { filters } = this.props.state;
    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      ...this.buildSortFilter(),
      ...filtersToObject(filters),
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
      isLoading,
      isRedirect,
    } = this.state;
    const columns = this.getColumns();
    const message = isLoading ? null : 'No results...';
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      pageSizeOptions: [10, 15, 25, 50, 100],
    };
    const sorting = !!sortField
      ? {
          sort: {
            field: sortField,
            direction: sortDirection,
          },
        }
      : {};

    if (!error) {
      const itemList = this.props.state.itemList;

      const getRowProps = (item) => {
        const { id, name } = item;

        const getRequiredPermissions = (item) => {
          const { section } = this.props.state;
          const { permissionResource } = resourceDictionary[section];
          return [
            {
              action: `${section}:read`,
              resource: permissionResource(item.name),
            },
          ];
        };

        const updateInfo = async () => {
          if (this.isLoading) return;
          this.setState({ isLoading: true });
          const { section } = this.props.state;
          section === RulesetResources.RULES && (window.location.href = `${window.location.href}&redirectRule=${id}`);
          try {
            if (section === RulesetResources.LISTS) {
              const result = await this.rulesetHandler.getFileContent(item.filename);
              const file = {
                name: item.filename,
                content: result,
                path: item.relative_dirname,
              };
              this.props.updateListContent(file);
            } else {
              const result = await this.rulesetHandler.getResource({
                params: {
                  filename: item.filename,
                },
              });
              if (result.data) {
                Object.assign(result.data, { current: id || name });
              }
              if (section === RulesetResources.RULES) this.props.updateRuleInfo(result.data);
              if (section === RulesetResources.DECODERS) this.props.updateDecoderInfo(result.data);
            }
          } catch (error) {
            const options = {
              context: `${WzRulesetTable.name}.updateInfo`,
              level: UI_LOGGER_LEVELS.ERROR,
              severity: UI_ERROR_SEVERITIES.BUSINESS,
              error: {
                error: error,
                message: `Error updating info: ${error.message || error}`,
                title: error.name || error,
              },
            };
            getErrorOrchestrator().handleError(options);
            this.setState({ isLoading: false });
          }
          this.setState({ isLoading: false });
        };

        return {
          'data-test-subj': `row-${id || name}`,
          className: 'customRowClass',
          onClick: !WzUserPermissions.checkMissingUserPermissions(
            getRequiredPermissions(item),
            this.props.userPermissions
          )
            ? updateInfo
            : undefined,
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
            loading={isLoading || isRedirect}
            rowProps={(!this.props.state.showingFiles && getRowProps) || undefined}
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
                <p>These items will be removed</p>
                <div>
                  {itemList.map(function (item, i) {
                    return <li key={i}>{item.filename ? item.filename : item.name}</li>;
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
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  async removeItems(items) {
    try {
      this.setState({ isLoading: true });
      const results = items.map(async (item, i) => {
        await this.rulesetHandler.deleteFile(item.filename || item.name);
      });

      Promise.all(results).then((completed) => {
        this.props.updateIsProcessing(true);
        this.showToast('success', 'Success', 'Deleted successfully', 3000);
      });
    } catch (error) {
      const options = {
        context: `${WzRulesetTable.name}.removeItems`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: `Error deleting item: ${error.message || error}`,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateDefaultItems: (defaultItems) => dispatch(updateDefaultItems(defaultItems)), //TODO: Research to remove
    updateIsProcessing: (isProcessing) => dispatch(updateIsProcessing(isProcessing)),
    updateShowModal: (showModal) => dispatch(updateShowModal(showModal)),
    updateFileContent: (fileContent) => dispatch(updateFileContent(fileContent)),
    updateListContent: (listInfo) => dispatch(updateListContent(listInfo)),
    updateListItemsForRemove: (itemList) => dispatch(updateListItemsForRemove(itemList)),
    updateRuleInfo: (rule) => dispatch(updateRuleInfo(rule)),
    updateDecoderInfo: (rule) => dispatch(updateDecoderInfo(rule)),
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withUserPermissions
)(WzRulesetTable);
