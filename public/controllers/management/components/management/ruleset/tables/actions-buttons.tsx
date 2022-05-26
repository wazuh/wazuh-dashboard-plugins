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
import React, { useState } from 'react';
// Eui components
import { EuiButtonEmpty } from '@elastic/eui';
import { getToasts } from '../../../../../../kibana-services';

import {
  toggleShowFiles,
  updateLoadingStatus,
  updteAddingRulesetFile,
  updateListContent,
  updateIsProcessing,
  updatePageIndex,
} from '../../../../../../redux/actions/rulesetActions';

import exportCsv from '../../../../../../react-services/wz-csv';
import { UploadFiles } from '../../../upload-files';
import columns from './columns';
import { resourceDictionary, RulesetHandler, RulesetResources } from '../utils/ruleset-handler';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';

import { connect } from 'react-redux';

import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';

const WzRulesetActionButtons = function (props) {

  const [generatingCsv, setGeneratingCsv] = useState(false);
  this.exportCsv = exportCsv;

  this.columns = columns;
  this.refreshTimeoutId = null;

  function showToast(title, text, color) {
    getToasts().add({
      title,
      text,
      color,
      toastLifeTimeMs: 3000,
    });
    /**
     * Generates a CSV
     */
    async function generateCsv() {
      try {
        setGeneratingCsv(true);
        const { section, filters } = props.state; //TODO get filters from the search bar from the REDUX store
        const mapFilters = filters.map((filter) => ({
          name: filter.field,
          value: filter.value,
        })); // adapt to shape used in /api/csv file: server/controllers/wazuh-api.js
        await exportCsv(
          `/${section}${props.state.showingFiles ? '/files' : ''}`,
          mapFilters,
          section
        );
      } catch (error) {
        const options = {
          context: `${WzRulesetActionButtons.name}.generateCsv`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: `Error generating CSV: ${error.message || error}`,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);

        setGeneratingCsv(false);
      }
      setGeneratingCsv(false);
    }

    /**
     * Uploads the files
     * @param {Array} files
     * @param {String} path
     */
     async function uploadFiles(files, resource) {
      try {
        let errors = false;
        let results: any[] = [];
        const rulesetHandler = new RulesetHandler(resource);
        for (let idx in files) {
          const { file, content } = files[idx];
          try {
            await rulesetHandler.updateFile(file, content, resource !== RulesetResources.LISTS); // True does not overwrite the file
            results.push({
              index: idx,
              uploaded: true,
              file: file,
              error: 0,
            });
          } catch (error) {
            errors = true;
            results.push({
              index: idx,
              uploaded: false,
              file: file,
              error: error,
            });
          }
        }
        if (errors) throw results;
        return;
      } catch (error) {
        throw error;
      }
    }

    /**
     * Toggle between files and rules or decoders
     */
    const toggleFiles = async () => {
      try {
        props.updateLoadingStatus(true);
        const { showingFiles } = props.state;
        props.toggleShowFiles(!showingFiles);
        props.updateIsProcessing(true);
        props.updatePageIndex(0);
        props.updateLoadingStatus(false);
      } catch (error) {
        const options = {
          context: `${WzRulesetActionButtons.name}.toggleFiles`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: false,
          error: {
            error: error,
            message: `Error generating CSV: ${error.message || error}`,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }

    /**
     * Refresh the items
     */
    async function refresh() {
      try {
        props.updateIsProcessing(true);
      } catch (error) {
        throw error;
      }
    }

    const { section, showingFiles } = props.state;

    const getReadPermissionsFiles = () => {
      const { permissionResource } = resourceDictionary[section];
      return [
        {
          action: `${section}:read`,
          resource: permissionResource('*'),
        },
      ];
    };

    const getUpdatePermissionsFiles = () => {
      const { permissionResource } = resourceDictionary[section];
      return [
        {
          action: `${section}:update`,
          resource: permissionResource('*'),
        },
        {
          action: `${section}:read`,
          resource: permissionResource('*'),
        },
      ];
    };

    // Export button
    const exportButton = (
      <WzButtonPermissions
        buttonType="empty"
        permissions={getReadPermissionsFiles()}
        iconType="exportAction"
        iconSide="left"
        onClick={async () => await this.generateCsv()}
        isLoading={generatingCsv}
      >
        Export formatted
      </WzButtonPermissions>
    );

    // Add new rule button
    const addNewRuleButton = (
      section !== 'lists' &&
      <WzButtonPermissions
        permissions={getUpdatePermissionsFiles()}
        buttonType="empty"
        iconType="plusInCircle"
        onClick={() =>
          props.updteAddingRulesetFile({
            name: '',
            content: '<!-- Modify it at your will. -->',
            path: `etc/${section}`,
          })
        }
      >
        {`Add new ${section} file`}
      </WzButtonPermissions>
    );

    //Add new CDB list button
    const addNewCdbListButton = (
      section === 'lists' &&
      <WzButtonPermissions
        buttonType="empty"
        permissions={getUpdatePermissionsFiles()}
        iconType="plusInCircle"
        onClick={() =>
          props.updateListContent({
            name: false,
            content: '',
            path: 'etc/lists',
          })
        }
      >
        {`Add new ${section} file`}
      </WzButtonPermissions>
    );

    // Manage files
    const manageFiles = (
      section !== 'lists' &&
      <WzButtonPermissions
        buttonType="empty"
        permissions={getUpdatePermissionsFiles()}
        iconType={showingFiles ? 'apmTrace' : 'folderClosed'}
        onClick={async () => await toggleFiles()}
      >
        {showingFiles ? `Manage ${section}` : `Manage ${section} files`}
      </WzButtonPermissions>
    );

    // Refresh
    const refreshButton = (
      <EuiButtonEmpty iconType="refresh" onClick={async () => await refresh()}>
        Refresh
      </EuiButtonEmpty>
    );

    const uploadFile = async (files, resource) => {
      try {
        await uploadFiles(files, resource);
        await refresh();
      } catch (error) {
        const options = {
          context: `${WzRulesetActionButtons.name}.uploadFile`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: `Error files cannot be uploaded: ${error.message || error}`,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    };

    const uploadFilesButton = (
      (section === 'lists' || showingFiles) && (
        <UploadFiles
          clusterStatus={props.clusterStatus}
          resource={section}
          path={`etc/${section}`}
          upload={uploadFile}
          onSuccess={() => props.updateRestartClusterManager(true)}
        />
      )
    );

    // Filter disabled action buttons
    const actionButtons = [
      manageFiles,
      addNewRuleButton,
      addNewCdbListButton,
      uploadFilesButton,
      exportButton,
      refreshButton
    ].filter(button => button);

    return actionButtons;
    
    }
  }

  const mapStateToProps = (state) => {
    return {
      state: state.rulesetReducers,
    };
  };

  const mapDispatchToProps = (dispatch) => {
    return {
      toggleShowFiles: (status) => dispatch(toggleShowFiles(status)),
      updateLoadingStatus: (status) => dispatch(updateLoadingStatus(status)),
      updteAddingRulesetFile: (content) => dispatch(updteAddingRulesetFile(content)),
      updateListContent: (content) => dispatch(updateListContent(content)),
      updateIsProcessing: (isProcessing) => dispatch(updateIsProcessing(isProcessing)),
      updatePageIndex: (pageIndex) => dispatch(updatePageIndex(pageIndex)),
    };
  };

  export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetActionButtons);
