/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
// Eui components
import { EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';
import { getToasts }  from '../../../../../kibana-services';

import { connect } from 'react-redux';

import {
  toggleShowFiles,
  updateLoadingStatus,
  updteAddingRulesetFile,
  updateListContent,
  updateIsProcessing,
  updatePageIndex,
} from '../../../../../redux/actions/rulesetActions';

import exportCsv from '../../../../../react-services/wz-csv';
import { UploadFiles } from '../../upload-files';
//import columns from './utils/columns';
import { resourceDictionary, RulesetHandler, RulesetResources } from './utils/ruleset-handler';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';

class WzRulesetActionButtons extends Component {
  constructor(props) {
    super(props);

    this.state = { generatingCsv: false };
    this.exportCsv = exportCsv;

    //this.columns = columns;
    this.refreshTimeoutId = null;
  }

  showToast(title, text, color){
    getToasts().add({
      title,
      text,
      color,
      toastLifeTimeMs: 3000
    });
  }
  /**
   * Generates a CSV
   */
  async generateCsv() {
    try {
      this.setState({ generatingCsv: true });
      const { section, filters } = this.props.state; //TODO get filters from the search bar from the REDUX store
      const mapFilters = filters.map(filter => ({
        name: filter.field,
        value: filter.value
      })); // adapt to shape used in /api/csv file: server/controllers/wazuh-api.js
      await this.exportCsv(`/${section}${this.props.state.showingFiles ? '/files' : ''}`, mapFilters, section);
    } catch (error) {
      this.showToast('Error exporting as CSV', error.message || error, 'danger');
    }
    this.setState({ generatingCsv: false });
  }

  /**
   * Uploads the files
   * @param {Array} files
   * @param {String} path
   */
  async uploadFiles(files, resource) {
    try {
      let errors = false;
      let results = [];
      const rulesetHandler = new RulesetHandler(resource);    
      for (let idx in files) {
        const { file, content } = files[idx];
        try {
          await rulesetHandler(file, content, resource !== RulesetResources.LISTS); // True does not overwrite the file
          results.push({
            index: idx,
            uploaded: true,
            file: file,
            error: 0
          });
        } catch (error) {
          errors = true;
          results.push({
            index: idx,
            uploaded: false,
            file: file,
            error: error
          });
        }
      }
      if (errors) throw results;
      //ErrorHandler.info('Upload successful');
      return;
    } catch (error) {
      if (Array.isArray(error) && error.length) return Promise.reject(error);
      //TODO handle the erros
      //ErrorHandler.handle('Files cannot be uploaded');
    }
  }

  /**
   * Toggle between files and rules or decoders
   */
  async toggleFiles() {
    try {
      this.props.updateLoadingStatus(true);
      const { showingFiles } = this.props.state;
      this.props.toggleShowFiles(!showingFiles);
      this.props.updateIsProcessing(true);
      this.props.updatePageIndex(0);
      this.props.updateLoadingStatus(false);
    } catch (error) {};
  }

  /**
   * Refresh the items
   */
  async refresh() {
    try {
      this.props.updateIsProcessing(true);
      // this.onRefreshLoading();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  onRefreshLoading() {
    clearInterval(this.refreshTimeoutId);

    this.props.updateLoadingStatus(true);
    // this.refreshTimeoutId =  setInterval(() => {
    //   if(!this.props.state.isProcessing) {
    //     clearInterval(this.refreshTimeoutId);
    //   }
    // }, 100);
  }

  render() {
    const { section, showingFiles } = this.props.state;

    const getReadPermissionsFiles = () => {
      const  { permissionResource } = resourceDictionary[section];
      return [      
        {
          action: `${section}:read`,
          resource: permissionResource,
        }
      ];  
    };

    const getUpdatePermissionsFiles = () => {
      const  { permissionResource } = resourceDictionary[section];
      return [
        {
          action: `${section}:upload`,
          resource: permissionResource,
        },
        {
          action: `${section}:read`,
          resource: permissionResource,
        }
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
      >
        Export formatted
      </WzButtonPermissions>
    );

    // Add new rule button
    const addNewRuleButton = (
      <WzButtonPermissions
        permissions={getUpdatePermissionsFiles()}
        buttonType="empty"
        iconType="plusInCircle"
        onClick={() =>
          this.props.updteAddingRulesetFile({
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
      <WzButtonPermissions
        buttonType="empty"
        permissions={getUpdatePermissionsFiles()}
        iconType="plusInCircle"
        onClick={() =>
          this.props.updateListContent({
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
      <WzButtonPermissions
        buttonType="empty"
        permissions={getUpdatePermissionsFiles()}
        iconType={showingFiles ? 'apmTrace' : 'folderClosed'}
        onClick={async () => await this.toggleFiles()}
      >
        {showingFiles ? `Manage ${section}` : `Manage ${section} files`}
      </WzButtonPermissions>
    );

    // Refresh
    const refresh = (
      <EuiButtonEmpty
        iconType="refresh"
        onClick={async () => await this.refresh()}
      >
        Refresh
      </EuiButtonEmpty>
    );

    const uploadFile = async (files, resource) => {
      await this.uploadFiles(files, resource);
      await this.refresh();
    };

    return (
      <Fragment>
        {section !== 'lists' && (
          <EuiFlexItem grow={false}>{manageFiles}</EuiFlexItem>
        )}
        {section !== 'lists' && (
          <EuiFlexItem grow={false}>{addNewRuleButton}</EuiFlexItem>
        )}
        {section === 'lists' && (
          <EuiFlexItem grow={false}>{addNewCdbListButton}</EuiFlexItem>
        )}
        {(section === 'lists' || showingFiles) && (
          <EuiFlexItem grow={false}>
            <UploadFiles
              clusterStatus={this.props.clusterStatus}
              msg={section}
              path={`etc/${section}`}
              upload={uploadFile}
            />
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>{exportButton}</EuiFlexItem>
        <EuiFlexItem grow={false}>{refresh}</EuiFlexItem>
      </Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleShowFiles: status => dispatch(toggleShowFiles(status)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updteAddingRulesetFile: content =>
      dispatch(updteAddingRulesetFile(content)),
    updateListContent: content => dispatch(updateListContent(content)),
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing)),
    updatePageIndex: pageIndex => dispatch(updatePageIndex(pageIndex))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzRulesetActionButtons);
