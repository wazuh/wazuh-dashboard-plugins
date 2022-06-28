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

import React, { useEffect, useState, useCallback } from 'react';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { resourceDictionary } from '../../common/resources-handler';
import { SECTION_RULES_SECTION, SECTION_RULES_KEY } from '../../common/constants';
import RulesetColumns from './columns';
import { FlyoutDetail } from './flyout-detail';
import { withUserPermissions } from '../../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import {
  ManageFiles,
  AddNewFileButton,
  AddNewCdbListButton,
  UploadFilesButton,
} from '../../common/actions-buttons'

import apiSuggestsItems from './ruleset-suggestions';

function RulesetTable(props) {
  const [filters, setFilters] = useState([]);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [showingFiles, setShowingFiles] = useState(false);


  useEffect(() => {
    const regex = new RegExp('redirectRule=' + '[^&]*');
    const match = window.location.href.match(regex);
    if (match && match[0]) {
      setCurrentItem(parseInt(match[0].split('=')[1]))
      setIsFlyoutVisible(true)
    }
  }, [])

  // Table custom filter options
  const buttonOptions = [{ label: "Custom rules", field: "relative_dirname", value: "etc/rules" },];

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
  }

  const getColumns = () => {
    const rulesetColumns = new RulesetColumns({
      state: {
        section: SECTION_RULES_KEY
      }, ...props
    }).columns;
    const columns = rulesetColumns[showingFiles ? 'files' : SECTION_RULES_KEY];
    return columns;
  }

  const getRowProps = (item) => {
    const { id, name } = item;

    const getRequiredPermissions = (item) => {
      const { permissionResource } = resourceDictionary[SECTION_RULES_KEY];
      return [
        {
          action: `${SECTION_RULES_KEY}:read`,
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
        ? (item) => {
          setCurrentItem(id)
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
        section={SECTION_RULES_SECTION}
        showingFiles={showingFiles}
        toggleShowFiles={toggleShowFiles}
        updatePageIndex={props.updatePageIndex}
      />,
      <AddNewFileButton
        section={SECTION_RULES_SECTION}
        updateAddingFile={props.updateAddingFile}
      />,
      <AddNewCdbListButton
        section={SECTION_RULES_SECTION}
        updateListContent={updateListContent}
      />,
    ];
    if (showingFiles)
      buttons.push(<UploadFilesButton
        section={SECTION_RULES_SECTION}
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
        title={'Rules files'}
        searchBarProps={{ buttonOptions: buttonOptions }}
        description={`From here you can manage your rules files.`}
        tableColumns={columns}
        tableInitialSortingField={'filename'}
        searchTable={true}
        searchBarSuggestions={apiSuggestsItems.files}
        endpoint={'/rules/files'}
        isExpandable={true}
        downloadCsv={true}
        showReload={true}
        filters={filters}
        onFiltersChange={updateFilters}
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
    )
  };

  const RenderRulesTable = () => {
    return <>
      <TableWzAPI
        actionButtons={actionButtons}
        title={'Rules'}
        searchBarProps={{ buttonOptions: buttonOptions }}
        description={`From here you can manage your rules.`}
        tableColumns={columns}
        tableInitialSortingField={'id'}
        searchTable={true}
        searchBarSuggestions={apiSuggestsItems.items}
        endpoint={'/rules'}
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
          type="vulnerability"
          view="inventory"
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
      {showingFiles ? <RenderFilesTable /> : <RenderRulesTable />}
    </div>
  );

}


export default compose(
  withUserPermissions
)(RulesetTable);