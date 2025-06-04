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

import React, { useState } from 'react';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { getToasts } from '../../../../../../kibana-services';
import {
  resourceDictionary,
  ResourcesConstants,
  ResourcesHandler,
} from '../../common/resources-handler';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import {
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  UI_LOGGER_LEVELS,
} from '../../../../../../../common/constants';

import {
  SECTION_CDBLIST_SECTION,
  SECTION_CDBLIST_KEY,
} from '../../common/constants';
import CDBListsColumns from './columns';

import { withUserPermissions } from '../../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import {
  ManageFiles,
  AddNewFileButton,
  AddNewCdbListButton,
  UploadFilesButton,
} from '../../common/actions-buttons';
import { WzRequest } from '../../../../../../react-services';

const searchBarWQLOptions = {
  searchTermFields: ['filename', 'relative_dirname'],
  filterButtons: [
    {
      id: 'relative-dirname',
      input: 'relative_dirname=etc/lists',
      label: 'Custom lists',
    },
  ],
};

function CDBListsTable(props) {
  const [showingFiles, setShowingFiles] = useState(false);
  const [tableFootprint, setTableFootprint] = useState(0);

  const resourcesHandler = new ResourcesHandler(ResourcesConstants.LISTS);

  const toggleShowFiles = () => {
    setShowingFiles(!showingFiles);
  };

  const getColumns = () => {
    const cdblistsColumns = new CDBListsColumns({
      removeItems: removeItems,
      state: {
        section: SECTION_CDBLIST_KEY,
        defaultItems: [],
      },
      ...props,
    }).columns;
    const columns = cdblistsColumns[SECTION_CDBLIST_KEY];
    return columns;
  };

  /**
   * Columns and Rows properties
   */
  const getRowProps = item => {
    const { id, name } = item;

    const getRequiredPermissions = item => {
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
        props.userPermissions,
      )
        ? async ev => {
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

  /**
   * Remove files method
   */
  const removeItems = async items => {
    try {
      const results = items.map(async (item, i) => {
        await resourcesHandler.deleteFile(item.filename || item.name);
      });

      Promise.all(results).then(completed => {
        setTableFootprint(Date.now());
        getToasts().add({
          color: 'success',
          title: 'Success',
          text: 'Deleted successfully',
          toastLifeTimeMs: 3000,
        });
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
  };

  const { updateListContent } = props;
  const columns = getColumns();

  /**
   * Build table custom action buttons dynamically based on showing files state
   */
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
    />,
  ];

  return (
    <div className='wz-inventory'>
      <TableWzAPI
        reload={tableFootprint}
        actionButtons={actionButtons}
        title='CDB Lists'
        description='From here you can manage your lists.'
        tableColumns={columns}
        tableInitialSortingField='filename'
        searchTable
        searchBarWQL={{
          options: searchBarWQLOptions,
          suggestions: {
            field(currentValue) {
              return [
                { label: 'filename', description: 'filter by filename' },
                {
                  label: 'relative_dirname',
                  description: 'filter by relative path',
                },
              ];
            },
            value: async (currentValue, { field }) => {
              try {
                const response = await WzRequest.apiReq('GET', '/lists', {
                  params: {
                    distinct: true,
                    limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                    select: field,
                    sort: `+${field}`,
                    ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
                  },
                });
                return response?.data?.data.affected_items.map(item => ({
                  label: item[field],
                }));
              } catch (error) {
                return [];
              }
            },
          },
        }}
        endpoint={'/lists'}
        isExpandable={true}
        rowProps={getRowProps}
        downloadCsv
        showReload
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
}

export default compose(withUserPermissions)(CDBListsTable);
