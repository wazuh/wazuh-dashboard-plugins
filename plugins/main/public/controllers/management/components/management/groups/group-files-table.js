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
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  updateLoadingStatus,
  updateIsProcessing,
  updatePageIndexFile,
  updateSortDirectionFile,
  updateSortFieldFile,
  updateFileContent,
} from '../../../../../redux/actions/groupsActions';
import GroupsFilesColumns from './utils/columns-files';
import { TableWzAPI } from '../../../../../components/common/tables';
import { WzRequest } from '../../../../../react-services';

class WzGroupFilesTable extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);
    this.state = {
      filters: {},
    };

    this.searchBar = {
      wql: {
        suggestionsFields: [
          { label: 'filename', description: 'filter by filename' },
          { label: 'hash', description: 'filter by hash' },
        ],
      },
    };
  }

  render() {
    this.groupsAgentsColumns = new GroupsFilesColumns(this.props);
    const columns = this.groupsAgentsColumns.columns;
    const groupName = this.props.state?.itemDetail?.name;
    const searchBarWQL = this.searchBar.wql;

    return (
      <TableWzAPI
        title='Files'
        description='From here you can list and see your group files, also, you can
        edit the group configuration'
        tableColumns={columns}
        tableInitialSortingField='filename'
        endpoint={`/groups/${groupName}/files`}
        searchBarWQL={{
          suggestions: {
            field: () => searchBarWQL.suggestionsFields,
            value: async (currentValue, { field }) => {
              try {
                const response = await WzRequest.apiReq(
                  'GET',
                  `/groups/${groupName}/files`,
                  {
                    params: {
                      distinct: true,
                      limit: 30,
                      select: field,
                      sort: `+${field}`,
                      ...(currentValue
                        ? { q: `${field}~${currentValue}` }
                        : {}),
                    },
                  },
                );
                return response?.data?.data.affected_items.map(item => ({
                  label: item[field],
                }));
              } catch (error) {
                return [];
              }
            },
          },
        }}
        showReload
        downloadCsv={`files-group-${groupName}`}
        searchTable={true}
      />
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers,
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
    updateFileContent: content => dispatch(updateFileContent(content)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzGroupFilesTable);
