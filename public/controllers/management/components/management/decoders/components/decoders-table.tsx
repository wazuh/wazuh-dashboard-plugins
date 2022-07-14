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

import React, { useState, useCallback } from 'react';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { getToasts } from '../../../../../../kibana-services';
import { resourceDictionary, ResourcesConstants, ResourcesHandler } from '../../common/resources-handler';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';

import DecodersColumns from './columns';
import { FlyoutDetail } from './flyout-detail';
import { withUserPermissions } from '../../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import { SECTION_DECODERS_SECTION, SECTION_DECODERS_KEY } from '../../common/constants';
import {
  ManageFiles,
  AddNewFileButton,
  UploadFilesButton,
} from '../../common/actions-buttons'

import apiSuggestsItems from './decoders-suggestions';

/***************************************
 * Render tables 
 */
const FilesTable = ({
  actionButtons,
  buttonOptions,
  columns,
  searchBarSuggestions,
  filters,
  updateFilters,
  reload
}) => <TableWzAPI
    reload={reload}
    actionButtons={actionButtons}
    title={'Decoders files'}
    searchBarProps={{ buttonOptions: buttonOptions }}
    description={`From here you can manage your decoders files.`}
    tableColumns={columns}
    tableInitialSortingField={'filename'}
    searchTable={true}
    searchBarSuggestions={searchBarSuggestions}
    endpoint={'/decoders/files'}
    isExpandable={true}
    downloadCsv={true}
    showReload={true}
    filters={filters}
    onFiltersChange={updateFilters}
    tablePageSizeOptions={[10, 25, 50, 100]}
  />

const DecodersFlyoutTable = ({
  actionButtons,
  buttonOptions,
  columns,
  searchBarSuggestions,
  getRowProps,
  filters,
  updateFilters,
  isFlyoutVisible,
  currentItem,
  closeFlyout,
  cleanFilters,
  ...props
}) => <>
    <TableWzAPI
      actionButtons={actionButtons}
      title={'Decoders'}
      searchBarProps={{ buttonOptions: buttonOptions }}
      description={`From here you can manage your decoders.`}
      tableColumns={columns}
      tableInitialSortingField={'filename'}
      searchTable={true}
      searchBarSuggestions={searchBarSuggestions}
      endpoint={'/decoders'}
      isExpandable={true}
      rowProps={getRowProps}
      downloadCsv={true}
      showReload={true}
      filters={filters}
      onFiltersChange={updateFilters}
      tablePageSizeOptions={[10, 25, 50, 100]}
    />
    {isFlyoutVisible && (
      <FlyoutDetail
        item={currentItem}
        closeFlyout={closeFlyout}
        showViewInEvents={true}
        outsideClickCloses={true}
        filters={filters}
        onFiltersChange={updateFilters}
        cleanFilters={cleanFilters}
        {...props}
      />
    )}
  </>

/***************************************
 * Main component
 */
export default compose(
  withUserPermissions
)(function DecodersTable({ setShowingFiles, showingFiles, ...props }) {
  const [filters, setFilters] = useState([]);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [tableFootprint, setTableFootprint] = useState(0);

  const resourcesHandler = new ResourcesHandler(ResourcesConstants.DECODERS);

  // Table custom filter options
  const buttonOptions = [{ label: "Custom decoders", field: "relative_dirname", value: "etc/decoders" },];

  const updateFilters = (filters) => {
    setFilters(filters);
  }

  const cleanFilters = () => {
    setFilters([]);
  }

  const toggleShowFiles = () => {
    setFilters([]);
    setShowingFiles(!showingFiles);
  }

  const closeFlyout = () => {
    setIsFlyoutVisible(false);
    setCurrentItem(null);
  }

  /**
   * Columns and Rows properties
   */
  const getColumns = () => {
    const decodersColumns = new DecodersColumns({
      removeItems: removeItems,
      state: {
        section: SECTION_DECODERS_KEY
      }, ...props
    }).columns;
    const columns = decodersColumns[showingFiles ? 'files' : SECTION_DECODERS_KEY];
    return columns;
  }

  const getRowProps = (item) => {
    const getRequiredPermissions = (item) => {
      const { permissionResource } = resourceDictionary[SECTION_DECODERS_KEY];
      return [
        {
          action: `${SECTION_DECODERS_KEY}:read`,
          resource: permissionResource(item.name),
        },
      ];
    };

    return {
      'data-test-subj': `row-${item.name}-${item.details?.order}`,
      className: 'customRowClass',
      onClick: !WzUserPermissions.checkMissingUserPermissions(
        getRequiredPermissions(item),
        props.userPermissions
      )
        ? () => {
          setCurrentItem(item)
          setIsFlyoutVisible(true);
        }
        : undefined,
    };
  };

  /**
   * Remove files method
   */
  const removeItems = async (items) => {
    try {
      const results = items.map(async (item, i) => {
        await resourcesHandler.deleteFile(item.filename || item.name);
      });

      Promise.all(results).then((completed) => {
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
  }

  const { updateRestartClusterManager, updateFileContent } = props;
  const columns = getColumns();

  /**
   * Build table custom action buttons dynamically based on showing files state
   */
  const buildActionButtons = useCallback(() => {
    const buttons = [
      <ManageFiles
        section={SECTION_DECODERS_SECTION}
        showingFiles={showingFiles}
        toggleShowFiles={toggleShowFiles}
        updatePageIndex={props.updatePageIndex}
      />,
      <AddNewFileButton
        section={SECTION_DECODERS_SECTION}
        updateAddingFile={props.updateAddingFile}
      />,
    ];
    if (showingFiles)
      buttons.push(<UploadFilesButton
        section={SECTION_DECODERS_SECTION}
        showingFiles={showingFiles}
        clusterStatus={props.clusterStatus}
        onSuccess={() => { updateRestartClusterManager && updateRestartClusterManager() }}
      />);
    return buttons;
  }, [showingFiles]);

  const actionButtons = buildActionButtons();

  return (
    <div className="wz-inventory">
      {showingFiles ? (
        <FilesTable
          actionButtons={actionButtons}
          buttonOptions={buttonOptions}
          columns={columns}
          searchBarSuggestions={apiSuggestsItems.files}
          filters={filters}
          updateFilters={updateFilters}
          reload={tableFootprint}
        />
      ) : (
          <DecodersFlyoutTable
            actionButtons={actionButtons}
            buttonOptions={buttonOptions}
            columns={columns}
            searchBarSuggestions={apiSuggestsItems.items}
            filters={filters}
            updateFilters={updateFilters}
            getRowProps={getRowProps}
            isFlyoutVisible={isFlyoutVisible}
            currentItem={currentItem}
            closeFlyout={closeFlyout}
            cleanFilters={cleanFilters}
            updateFileContent={updateFileContent}
          />
        )}
    </div>
  );
});
