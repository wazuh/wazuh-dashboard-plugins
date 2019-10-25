/*
* Wazuh app - React component for registering agents.
* Copyright (C) 2015-2019 Wazuh, Inc.
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
import {
  EuiFlexItem,
  EuiButtonEmpty,
  EuiGlobalToastList
} from '@elastic/eui';

import { connect } from 'react-redux';

import {
  updateItems,
  toggleShowFiles,
  updateLoadingStatus
} from '../../../../redux/actions/rulesetActions';

import { WzRequest } from '../../../../react-services/wz-request';
import exportCsv from '../../../../react-services/wz-csv';
import { UploadFiles } from '../../../management/components/upload-files';
import columns from './utils/columns';
import RulesetHandler from './utils/ruleset-handler';

class WzRulesetActionButtons extends Component {
  constructor(props) {
    super(props);

    this.state = { generatingCsv: false };
    this.exportCsv = exportCsv;

    this.wzReq = WzRequest;
    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files'
    }
    this.columns = columns;
    this.rulesetHandler = RulesetHandler;
  }

  /**
   * Generates a CSV
   */
  async generateCsv() {
    try {
      this.setState({ generatingCsv: true });
      const { section, filters } = this.props.state; //TODO get filters from the search bar from the REDUX store
      await this.exportCsv(`/${section}`, filters, section);
    } catch (error) {
      console.error('Error exporting as CSV ', error);
    }
    this.setState({ generatingCsv: false });
  }

  /**
   * Uploads the files
   * @param {Array} files
   * @param {String} path
   */
  async uploadFiles(files, path) {
    try {
      let errors = false;
      let results = [];
      let upload;
      if (path === 'etc/rules') {
        upload = this.rulesetHandler.sendRuleConfiguration;
      } else if (path === 'etc/decoders') {
        upload = this.rulesetHandler.sendDecoderConfiguration;
      } else {
        upload = this.rulesetHandler.sendCdbList;
      }
      for (let idx in files) {
        const { file, content } = files[idx];
        try {
          await upload(file, content, true); // True does not overwrite the file
          results.push({
            index: idx,
            uploaded: true,
            file: file,
            error: 0
          });
        } catch (error) {
          console.error('ERROR FILE ONLY ONE ', error)
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
      //this.errorHandler.info('Upload successful');
      console.log('UPLOAD SUCCESS');
      return;
    } catch (error) {
      if (Array.isArray(error) && error.length) return Promise.reject(error);
      console.error('Errors uploading several files ', error);
      //TODO handle the erros
      //this.errorHandler.handle('Files cannot be uploaded');
    }
  }

  /**
   * Toggle between files and rules or decoders
   */
  async toggleFiles() {
    try {
      this.props.updateItems([]);// Clean the items to avoid flick
      this.props.updateLoadingStatus(true);
      const { showingFiles, section } = this.props.state;
      this.props.toggleShowFiles(!showingFiles)
      const path = !showingFiles ? `${this.paths[section]}/files` : this.paths[section];
      const result = await this.wzReq.apiReq('GET', path, {});
      const items = result.data.data.items;
      this.props.updateItems(items);
      this.props.updateLoadingStatus(false);
    } catch (error) {
      console.error('error toggling ', error)
    }
  }

  render() {
    const { section, showingFiles, adminMode } = this.props.state;

    // Export button
    const exportButton = (
      <EuiButtonEmpty
        iconType="exportAction"
        onClick={async () => await this.generateCsv()}
        isLoading={this.state.generatingCsv}
      >
        Export formatted
      </EuiButtonEmpty>
    );

    // Add new rule button
    const addNewRuleButton = (
      <EuiButtonEmpty
        iconType="plusInCircle"
        onClick={async () => console.log('adding new')}
      >
        {`Add new ${section} file`}
      </EuiButtonEmpty>
    );

    // Manage files
    const manageFiles = (
      <EuiButtonEmpty
        iconType={showingFiles ? 'apmTrace' : 'folderClosed'}
        onClick={async () => await this.toggleFiles()}
      >
        {showingFiles ? `Manage ${section}` : `Manage ${section} files`}
      </EuiButtonEmpty>
    );
    return (
      <Fragment>
        {(section !== 'lists' && adminMode) && (
          <EuiFlexItem grow={false}>
            {manageFiles}
          </EuiFlexItem>
        )
        }
        {adminMode && (
          <EuiFlexItem grow={false}>
            {addNewRuleButton}
          </EuiFlexItem>
        )}
        {((section === 'lists' || showingFiles) && adminMode) && (
          <EuiFlexItem grow={false}>
            <UploadFiles
              msg={section}
              path={`etc/${section}`}
              upload={async (files, path) => await this.uploadFiles(files, path)} />
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          {exportButton}
        </EuiFlexItem>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateItems: items => dispatch(updateItems(items)),
    toggleShowFiles: status => dispatch(toggleShowFiles(status)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetActionButtons);
