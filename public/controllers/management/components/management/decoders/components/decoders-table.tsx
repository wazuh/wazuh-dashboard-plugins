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
import { resourceDictionary } from '../../common/resources-handler';
import DecodersColumns from './columns';
import { FlyoutDetail } from './flyout-detail';
import { withUserPermissions } from '../../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import { SECTION_DECODERS_SECTION, SECTION_DECODERS_KEY } from '../../common/constants';
import {
  ManageFiles,
  AddNewFileButton,
  AddNewCdbListButton,
  UploadFilesButton,
} from '../../common/actions-buttons'

import { apiSuggestsItems } from './decoders-suggestions';

export default compose(
  withUserPermissions
)(function DecodersTable(props) {
  const [filters, setFilters] = useState([]);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [showingFiles, setShowingFiles] = useState(false);

  // Table custom filter options
  const buttonOptions = [{ label: "Custom decoders", field: "relative_dirname", value: "etc/decoders" },];

  const updateFilters = (filters) => {
    setFilters(filters);
  }

  const cleanFilters = () => {
    setFilters([]);
  }

  const toggleShowFiles = () => {
    setShowingFiles(!showingFiles);
  }

  const closeFlyout = () => {
    setIsFlyoutVisible(false);
    setCurrentItem(null);
  }

  const getColumns = () => {
    const decodersColumns = new DecodersColumns({
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

  const { updateRestartClusterManager, updateListContent } = props;
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
      <AddNewCdbListButton
        section={SECTION_DECODERS_SECTION}
        updateListContent={updateListContent}
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

  /**
   * Render tables
   */
  const RenderFilesTable = () => {
    return (
      <TableWzAPI
        actionButtons={actionButtons}
        title={'Decoders files'}
        searchBarProps={{ buttonOptions: buttonOptions }}
        description={`From here you can manage your decoders files.`}
        tableColumns={columns}
        tableInitialSortingField={'filename'}
        searchTable={true}
        searchBarSuggestions={apiSuggestsItems.items[SECTION_DECODERS_KEY]}
        endpoint={'/decoders/files'}
        isExpandable={true}
        downloadCsv={true}
        showReload={true}
        filters={filters}
        onFiltersChange={updateFilters}
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
    )
  };

  const RenderDecodersTable = () => {
    return <>
      <TableWzAPI
        actionButtons={actionButtons}
        title={'Decoders'}
        searchBarProps={{ buttonOptions: buttonOptions }}
        description={`From here you can manage your decoders.`}
        tableColumns={columns}
        tableInitialSortingField={'filename'}
        searchTable={true}
        searchBarSuggestions={apiSuggestsItems.items[SECTION_DECODERS_KEY]}
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
  };

  return (
    <div className="wz-inventory">
      {showingFiles ? <RenderFilesTable /> : <RenderDecodersTable />}
    </div>
  );

});
