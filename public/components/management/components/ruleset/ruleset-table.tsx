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
import React, { useCallback, useEffect, useState } from 'react';
import { EuiBasicTable, EuiCallOut, EuiConfirmModal, EuiOverlayMask } from '@elastic/eui';
import { useHistory } from 'react-router-dom';

import { connect } from 'react-redux';
import RulesetHandler from './utils/ruleset-handler';
import {
  updateDecoderInfo,
  updateDefaultItems,
  updateFileContent,
  updateIsProcessing,
  updateListContent,
  updateListItemsForRemove,
  updateRuleInfo,
  updateShowModal,
} from '../../../../redux/actions/rulesetActions';

import RulesetColums from './utils/columns';
import WzRequest from '../../../../react-services/wz-request';
import { filtersToObject } from '../../../wz-search-bar';
import { withUserPermissions } from '../../../common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import { getToasts } from '../../../../kibana-services';

const WzRulesetTable = (props) => {
  // @ts-ignore
  const wzReq = (...args) => WzRequest.apiReq(...args);
  const [items, setItems] = useState([]);
  const [pageSize, setPageSize] = useState<number>(15);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [sortDirection, setSortDirection] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRedirect, setIsRedirect] = useState<boolean>(false);
  const history = useHistory();
  const handleOnClickRedirect = useCallback((path) => history.push(path), [history]);

  const [paths, setPaths] = useState({
    rules: '/rules',
    decoders: '/decoders',
    lists: '/lists/files',
  });
  const [extraSectionPrefixResource, setExtraSectionPrefixResource] = useState({
    rules: 'rule:file',
    decoders: 'decoder:file',
    lists: 'list:path',
  });
  const rulesetHandler = RulesetHandler;
  const { isProcessing, section, showingFiles, filters } = props.state;

  useEffect(() => {
    props.updateIsProcessing(true);
    if (props.state.section === 'rules') {
      const regex = new RegExp('redirectRule=' + '[^&]*');
      const match = window.location.href.match(regex);
      if (match && match[0]) {
        setIsRedirect(true);
        const id = match[0].split('=')[1];
        const result = WzRequest.apiReq('GET', `/rules`, {
          params: {
            rule_ids: id,
          },
        });
        const items = ((result.data || {}).data || {}).affected_items || [];
        if (items.length) {
          const info = rulesetHandler.getRuleInformation(items[0].filename, parseInt(id));
          props.updateRuleInfo(info);
        }
        setIsRedirect(false);
      }
    }
  }, []);

  useEffect(() => {
    setPageIndex(0);
    setSortDirection(null);
    setSortField(null);
    setIsLoading(true);
    props.updateIsProcessing(false);

    getItems();
  }, [isProcessing, section, showingFiles, filters]);

  const getItems = async () => {
    const { section, showingFiles } = props.state;
    setItems([]);
    props.updateTotalItems(false);

    const rawItems = await wzReq('GET', `${paths[props.request]}${showingFiles ? '/files' : ''}`, {
      params: buildFilter(),
    }).catch((error) => {
      console.warn(`Error when get the items of ${section}: `, error);
      return {};
    });

    const { affected_items = [], total_affected_items = 0 } =
      ((rawItems || {}).data || {}).data || {};
    props.updateTotalItems(total_affected_items);
    setItems(affected_items);
    setTotalItems(total_affected_items);
    setIsLoading(false);
  };

  const setDefaultItems = async () => {
    const requestDefaultItems = await wzReq('GET', '/manager/configuration', {
      wait_for_complete: false,
      section: 'ruleset',
      field: 'list',
    });

    const defaultItems = ((requestDefaultItems || {}).data || {}).data;
    props.updateDefaultItems(defaultItems);
  };

  const buildFilter = () => {
    const { filters } = props.state;
    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      ...buildSortFilter(),
      ...filtersToObject(filters),
    };

    return filter;
  };

  const buildSortFilter = () => {
    const sortFilter = {};
    if (sortField) {
      const direction = sortDirection === 'asc' ? '+' : '-';
      sortFilter['sort'] = direction + sortField;
    }

    return sortFilter;
  };

  const onTableChange = ({ page = {}, sort = {} }) => {
    // @ts-ignore
    const { index: pageIndex, size: pageSize } = page;
    // @ts-ignore
    const { field: sortField, direction: sortDirection } = sort;
    setPageIndex(pageIndex);
    setPageSize(pageSize);
    setSortField(sortField);
    setSortDirection(sortDirection);
    props.updateIsProcessing(true);
  };

  const getColumns = () => {
    const { showingFiles } = props.state;
    const rulesetColums = new RulesetColums(props).columns;
    return showingFiles ? rulesetColums.files : rulesetColums[props.request];
  };

  const { error } = props.state;

  const columns = getColumns();
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
    const itemList = props.state.itemList;

    const getRowProps = (item) => {
      const { id, name } = item;

      const extraSectionPermissions = extraSectionPrefixResource[props.state.section];
      return {
        'data-test-subj': `row-${id || name}`,
        className: 'customRowClass',
        onClick: WzUserPermissions.checkMissingUserPermissions(
          [
            [
              {
                action: 'manager:read_file',
                resource: `file:path:${item.relative_dirname}/${item.filename}`,
              },
              {
                action: 'manager:read',
                resource: `file:path:${item.relative_dirname}/${item.filename}`,
              },
              {
                action: `${props.state.section}:read`,
                resource: `${extraSectionPermissions}:${item.filename}`,
              },
            ],
          ],
          props.userPermissions
        )
          ? async () => {
              if (isLoading) return;
              setIsLoading(true);
              debugger;
              const { section } = props.state;
              if (section === 'rules') {
                const result = await rulesetHandler.getRuleInformation(item.filename, id);
                await props.updateRuleInfo(result);
              } else if (section === 'decoders') {
                const result = await rulesetHandler.getDecoderInformation(item.filename, name);
                await props.updateDecoderInfo(result);
              } else {
                const result = await rulesetHandler.getCdbList(
                  `${item.relative_dirname}/${item.filename}`
                );
                const file = { name: item.filename, content: result, path: item.relative_dirname };
                await props.updateListContent(file);
              }
              setIsLoading(false);
              handleOnClickRedirect(`/management/rules/${id}`);
            }
          : undefined,
      };
    };

    const showToast = (color, title, text, time) => {
      getToasts().add({
        color: color,
        title: title,
        text: text,
        toastLifeTimeMs: time,
      });
    };

    const removeItems = async (items) => {
      setIsLoading(true);
      const results = items.map(async (item, i) => {
        await rulesetHandler.deleteFile(
          item.filename ? item.filename : item.name,
          item.relative_dirname
        );
      });

      Promise.all(results).then((completed) => {
        props.updateIsProcessing(true);
        showToast('success', 'Success', 'Deleted successfully', 3000);
      });
    };

    return (
      <div>
        <EuiBasicTable
          itemId="id"
          items={items}
          columns={columns}
          pagination={pagination}
          onChange={onTableChange}
          loading={isLoading || isRedirect}
          rowProps={(!props.state.showingFiles && getRowProps) || undefined}
          sorting={sorting}
          message={message}
        />
        {props.state.showModal ? (
          <EuiOverlayMask>
            <EuiConfirmModal
              title="Are you sure?"
              onCancel={() => props.updateShowModal(false)}
              onConfirm={() => {
                removeItems(itemList);
                props.updateShowModal(false);
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
};

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
