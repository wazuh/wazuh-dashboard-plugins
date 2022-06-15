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
import { connect } from 'react-redux';
import {
  // updateIsProcessing,
  // updateShowModal,
  // updateListContent,
  // updateFileContent,
  // updateListItemsForRemove,
  // updateRuleInfo,
  // updateDecoderInfo,
  // updateAddingRulesetFile,
  // updateLoadingStatus,
  // updatePageIndex,
} from '../../../../../../redux/actions/rulesetActions';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { formatUIDate } from '../../../../../../react-services/time-service';
import { RulesetHandler, RulesetResources, resourceDictionary } from '../utils/ruleset-handler';
import RulesetColumns from './columns';
import { FlyoutDetail } from './flyout-detail';
import { withUserPermissions } from '../../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { SECTION_RULES_SECTION, SECTION_RULES_KEY } from '../utils/constants';
import {
  ManageFiles,
  AddNewRuleButton,
  AddNewCdbListButton,
  UploadFilesButton,
} from './actions-buttons'

import { apiSuggestsItems } from './ruleset-suggestions';

function RulesetTable(props) {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState([]);
  const [infoContent, setInfoContent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [showingFiles, setShowingFiles] = useState(false);
  const [error, setError] = useState(false);
  // const rulesetHandler = new RulesetHandler(SECTION_RULES_KEY);


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

  const cleanInfo = () => {
    setInfoContent(null);
  }

  const cleanFilters = () => {
    setFilters([]);
  }

  const toggleShowFiles = () => {
    setShowingFiles(!showingFiles);
  }

  const closeFlyout = () => {
    setIsFlyoutVisible(false);
  }

  const getColumns = () => {
    // const { section } = props.state;
    const rulesetColumns = new RulesetColumns({ state: {
      section: SECTION_RULES_KEY
    }, ...props}).columns;
    const columns = rulesetColumns[showingFiles ? 'files' : SECTION_RULES_KEY];
    return columns;
  }

  const getRowProps = (item) => {
    const { id, name } = item;

    const getRequiredPermissions = (item) => {
      // const { section } = props.state;
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
        // ? (item) => updateInfo(item, id)
        ? (item) => {
          console.log(item, id)
          setCurrentItem(id)
          setIsFlyoutVisible(true);
        }
        : undefined,
    };
  };

  // const { section } = props.state;
  const { updateRestartClusterManager, updateListContent } = props;
  const columns = getColumns();

  const actionButtons = [
    <ManageFiles
      section={SECTION_RULES_SECTION}
      showingFiles={showingFiles}
      updateLoadingStatus={props.updateLoadingStatus}
      toggleShowFiles={toggleShowFiles}
      updateIsProcessing={props.updateIsProcessing}
      updatePageIndex={props.updatePageIndex}
    />,
    <AddNewRuleButton
      section={SECTION_RULES_SECTION}
      updateAddingRulesetFile={props.updateAddingRulesetFile}
    />,
    <AddNewCdbListButton
      section={SECTION_RULES_SECTION}
      updateListContent={updateListContent}
    />,
    <UploadFilesButton
      section={SECTION_RULES_SECTION}
      showingFiles={showingFiles}
      clusterStatus={props.clusterStatus}
      onSuccess={() => { updateRestartClusterManager && updateRestartClusterManager() }}
    />,
  ];

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
        searchBarSuggestions={apiSuggestsItems.items[SECTION_RULES_KEY]}
        endpoint={'/rules/files'}
        isExpandable={true}
        rowProps={getRowProps}
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
        searchBarSuggestions={apiSuggestsItems.items[SECTION_RULES_KEY]}
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
          isLoading={isLoading}
          item={currentItem}
          closeFlyout={closeFlyout}
          type="vulnerability"
          view="inventory"
          showViewInEvents={true}
          outsideClickCloses={true}
          filters={filters}
          onFiltersChange={updateFilters}
          cleanFilters={cleanFilters}
          cleanInfo={() => setIsFlyoutVisible(false)}
          {...props}
        />
      )}
    </>
  };

  // this.props.cleanFilters();
  //   this.props.updateFilters(filters);
  //   this.props.cleanInfo();
  return (
    <div className="wz-inventory">
      {showingFiles ? <RenderFilesTable /> : <RenderRulesTable />
      }
    </div>
  );

}

// const mapStateToProps = state => {
//   return {
//     state: state.rulesetReducers
//   };
// };

// const mapDispatchToProps = dispatch => {
//   return {
    // updateIsProcessing: isProcessing => dispatch(updateIsProcessing(isProcessing)),
    // updateShowModal: (showModal) => dispatch(updateShowModal(showModal)),
    // updateFileContent: (fileContent) => dispatch(updateFileContent(fileContent)),
    // updateListContent: (content) => dispatch(updateListContent(content)),
    // updateListItemsForRemove: (itemList) => dispatch(updateListItemsForRemove(itemList)),
    // updateRuleInfo: (rule) => dispatch(updateRuleInfo(rule)),
    // updateDecoderInfo: (rule) => dispatch(updateDecoderInfo(rule)),
    // updateAddingRulesetFile: (content) => dispatch(updateAddingRulesetFile(content)),
    // updateLoadingStatus: (status) => dispatch(updateLoadingStatus(status)),
    // updatePageIndex: (pageIndex) => dispatch(updatePageIndex(pageIndex)),
//   };
// };

export default compose(
  // connect(
  //   mapStateToProps,
  //   mapDispatchToProps
  // ),
  withUserPermissions
)(RulesetTable);