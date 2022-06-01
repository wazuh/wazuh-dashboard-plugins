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
import { connect } from 'react-redux';
import {
  // updateFilters,
  updateIsProcessing,
  updateShowModal,
  updateDefaultItems,
  updateListContent,
  updateFileContent,
  updateListItemsForRemove,
  updateRuleInfo,
  updateDecoderInfo,
  updateAddingRulesetFile,
  toggleShowFiles,
  updateLoadingStatus,
  updatePageIndex,
} from '../../../../../../redux/actions/rulesetActions';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { formatUIDate } from '../../../../../../react-services/time-service';
import { RulesetHandler, RulesetResources, resourceDictionary } from '../utils/ruleset-handler';
import RulesetColumns from './columns';
import { withUserPermissions } from '../../../../../../components/common/hocs/withUserPermissions';
import { WzUserPermissions } from '../../../../../../react-services/wz-user-permissions';
import { compose } from 'redux';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import {
  ManageFiles,
  AddNewRuleButton,
  AddNewCdbListButton,
  UploadFilesButton,
} from './actions-buttons'

import { apiSuggestsItems } from './ruleset-suggestions';

export const RulesetTable = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showingFiles, setShowingFiles] = useState(false);
  const [error, setError] = useState(false);
  const rulesetHandler = new RulesetHandler(props.state.section);

  // Table custom filter options
  const buttonOptions = [{ label: "Custom rules", field: "relative_dirname", value: "etc/rules" },];

  const updateFilters = (filters) => {
    setFilters(filters);
  }

  const toggleShowFiles = () => {
    setShowingFiles(!showingFiles);
  }

  const getColumns = () => {
    const { section } = props.state;
    const rulesetColumns = new RulesetColumns(props).columns;
    const columns = rulesetColumns[showingFiles ? 'files' : section];
    return columns;
  }

  const getRowProps = (item) => {
    const { id, name } = item;

    const getRequiredPermissions = (item) => {
      const { section } = props.state;
      const { permissionResource } = resourceDictionary[section];
      return [
        {
          action: `${section}:read`,
          resource: permissionResource(item.name),
        },
      ];
    };

    const updateInfo = async () => {
      if (isLoading) return;
      setIsLoading(true);
      const { section } = props.state;
      section === RulesetResources.RULES && (window.location.href = `${window.location.href}&redirectRule=${id}`);
      try {
        if (section === RulesetResources.LISTS) {
          const result = await rulesetHandler.getFileContent(item.filename);
          const file = {
            name: item.filename,
            content: result,
            path: item.relative_dirname,
          };
          props.updateListContent(file);
        } else {
          const result = await rulesetHandler.getResource({
            params: {
              filename: item.filename,
            },
          });
          if (result.data) {
            Object.assign(result.data, { current: id || name });
          }
          if (section === RulesetResources.RULES) props.updateRuleInfo(result.data);
          if (section === RulesetResources.DECODERS) props.updateDecoderInfo(result.data);
        }
      } catch (error) {
        const options = {
          context: `${RulesetTable.name}.updateInfo`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: `Error updating info: ${error.message || error}`,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
        setIsLoading(false);
      }
      setIsLoading(false);
    };

    return {
      'data-test-subj': `row-${id || name}`,
      className: 'customRowClass',
      onClick: !WzUserPermissions.checkMissingUserPermissions(
        getRequiredPermissions(item),
        props.userPermissions
      )
        ? updateInfo
        : undefined,
    };
  };

  const { section } = props.state;
  const { updateRestartClusterManager, updateListContent } = props;
  const columns = getColumns();

  const actionButtons = [
    <ManageFiles
      section={section}
      showingFiles={showingFiles}
      updateLoadingStatus={props.updateLoadingStatus}
      toggleShowFiles={toggleShowFiles}
      updateIsProcessing={props.updateIsProcessing}
      updatePageIndex={props.updatePageIndex}
    />,
    <AddNewRuleButton
      section={section}
      updateAddingRulesetFile={props.updateAddingRulesetFile}
    />,
    <AddNewCdbListButton
      section={section}
      updateListContent={updateListContent}
    />,
    <UploadFilesButton
      section={section}
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
        searchBarSuggestions={apiSuggestsItems.items[section]}
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
    return (
      <TableWzAPI
        actionButtons={actionButtons}
        title={'Rules'}
        searchBarProps={{ buttonOptions: buttonOptions }}
        description={`From here you can manage your rules.`}
        tableColumns={columns}
        tableInitialSortingField={'id'}
        searchTable={true}
        searchBarSuggestions={apiSuggestsItems.items[section]}
        endpoint={'/rules'}
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

  return (
    <div className="wz-inventory">
      {showingFiles ? <RenderFilesTable/>: <RenderRulesTable/>
      }
    </div>
  );

}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateIsProcessing: isProcessing => dispatch(updateIsProcessing(isProcessing)),
    updateShowModal: (showModal) => dispatch(updateShowModal(showModal)),
    updateFileContent: (fileContent) => dispatch(updateFileContent(fileContent)),
    updateListContent: (content) => dispatch(updateListContent(content)),
    updateListItemsForRemove: (itemList) => dispatch(updateListItemsForRemove(itemList)),
    updateRuleInfo: (rule) => dispatch(updateRuleInfo(rule)),
    updateDecoderInfo: (rule) => dispatch(updateDecoderInfo(rule)),
    updateAddingRulesetFile: (content) => dispatch(updateAddingRulesetFile(content)),
    updateLoadingStatus: (status) => dispatch(updateLoadingStatus(status)),
    updatePageIndex: (pageIndex) => dispatch(updatePageIndex(pageIndex)),
  };
};

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withUserPermissions
)(RulesetTable);