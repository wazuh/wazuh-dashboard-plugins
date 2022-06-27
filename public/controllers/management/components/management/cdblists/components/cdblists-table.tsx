/*
 * Wazuh app - Agent vulnerabilities table component
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState } from 'react';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { ResourcesHandler, resourceDictionary } from '../../common/resources-handler';
import { SECTION_CDBLIST_SECTION, SECTION_CDBLIST_KEY } from '../../common/constants';
import CDBListsColumns from './columns';

import { withUserPermissions } from '../../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import {
  ManageFiles,
  AddNewFileButton,
  AddNewCdbListButton,
  UploadFilesButton,
} from '../../common/actions-buttons'

import { apiSuggestsItems } from './cdblists-suggestions';

function CDBListsTable(props) {
  const [filters, setFilters] = useState([]);
  const [showingFiles, setShowingFiles] = useState(false);
  const resourcesHandler = new ResourcesHandler(SECTION_CDBLIST_SECTION);
  const updateFilters = (filters) => {
    setFilters(filters);
  }

  const toggleShowFiles = () => {
    setShowingFiles(!showingFiles);
  }


  const getColumns = () => {
    const cdblistsColumns = new CDBListsColumns({ state: {
      section: SECTION_CDBLIST_KEY,
      defaultItems: []
    }, ...props}).columns;
    const columns = cdblistsColumns[SECTION_CDBLIST_KEY];
    return columns;
  }

  const getRowProps = (item) => {
    const { id, name } = item;

    const getRequiredPermissions = (item) => {
      const { permissionResource } = resourceDictionary[SECTION_CDBLIST_KEY];
      return [
        {
          action: `${SECTION_CDBLIST_KEY}:read`,
          resource: permissionResource(item.name),
        },
      ];
    };

    return {
      'data-test-subj': `row-${id || name}`,
      className: 'customRowClass',
      onClick: !WzUserPermissions.checkMissingUserPermissions(
        getRequiredPermissions(item),
        props.userPermissions
      )
        ? async () => {
          const result = await resourcesHandler.getFileContent(item.filename);
          const file = {
            name: item.filename,
            content: result,
            path: item.relative_dirname,
          };
          updateListContent(file);
        }
        : undefined,
    };
  };

  const { updateRestartClusterManager, updateListContent } = props;
  const columns = getColumns();

  const actionButtons = [
    <ManageFiles
      section={SECTION_CDBLIST_SECTION}
      showingFiles={showingFiles}
      toggleShowFiles={toggleShowFiles}
      updateIsProcessing={props.updateIsProcessing}
      updatePageIndex={props.updatePageIndex}
    />,
    <AddNewFileButton
      section={SECTION_CDBLIST_SECTION}
      updateAddingFile={props.updateAddingFile}
    />,
    <AddNewCdbListButton
      section={SECTION_CDBLIST_SECTION}
      updateListContent={updateListContent}
    />,
    <UploadFilesButton
      section={SECTION_CDBLIST_SECTION}
      showingFiles={showingFiles}
      clusterStatus={props.clusterStatus}
      onSuccess={() => { updateRestartClusterManager && updateRestartClusterManager() }}
    />,
  ];



  return (
    <div className="wz-inventory">
      <TableWzAPI
        actionButtons={actionButtons}
        title={'CDB Lists'}
        description={`From here you can manage your lists.`}
        tableColumns={columns}
        tableInitialSortingField={'filename'}
        searchTable={true}
        searchBarSuggestions={apiSuggestsItems.items[SECTION_CDBLIST_KEY]}
        endpoint={'/lists'}
        isExpandable={true}
        rowProps={getRowProps}
        downloadCsv={true}
        showReload={true}
        filters={filters}
        onFiltersChange={updateFilters}
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );

}


export default compose(
  withUserPermissions
)(CDBListsTable);