/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { EuiButtonEmpty, EuiFlexItem } from '@elastic/eui';

import { connect } from 'react-redux';

import {
  toggleShowFiles,
  updateIsProcessing,
  updateListContent,
  updateLoadingStatus,
  updatePageIndex,
  updteAddingRulesetFile,
} from '../../../../redux/actions/rulesetActions';

import exportCsvService from '../../../../react-services/wz-csv';
import { UploadFiles } from '../../service/upload-files';
import RulesetHandler from '../../utils/ruleset-handler';
import { WzButtonPermissions } from '../../../common/permissions/button';
import { getToasts } from '../../../../kibana-services';

const WzRulesetActionButtons = (props) => {
  const exportCsv = exportCsvService;
  const rulesetHandler = RulesetHandler;
  const [generatinCsv, setGeneratinCsv] = useState<boolean>(false);
  const showToast = (title, text, color) => {
    getToasts().add({
      title,
      text,
      color,
      toastLifeTimeMs: 3000,
    });
  };
  /**
   * Generates a CSV
   */
  const generateCsv = async () => {
    try {
      setGeneratinCsv(true);
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
      showToast('Error exporting as CSV', error.message || error, 'danger');
    }
    setGeneratinCsv(false);
  };

  /**
   * Uploads the files
   * @param {Array} files
   * @param {String} path
   */
  const uploadFiles = async (files, path) => {
    try {
      let errors = false;
      let results = [];
      let upload;
      if (path === 'etc/rules') {
        upload = rulesetHandler.sendRuleConfiguration;
      } else if (path === 'etc/decoders') {
        upload = rulesetHandler.sendDecoderConfiguration;
      } else {
        upload = rulesetHandler.updateCdbList;
      }
      for (let idx in files) {
        const { file, content } = files[idx];
        try {
          await upload(file, content, true); // True does not overwrite the file
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
      //ErrorHandler.info('Upload successful');
      return;
    } catch (error) {
      if (Array.isArray(error) && error.length) return Promise.reject(error);
      //TODO handle the erros
      //ErrorHandler.handle('Files cannot be uploaded');
    }
  };

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
    } catch (error) {}
  };

  /**
   * Refresh the items
   */
  const refresh = async () => {
    try {
      props.updateIsProcessing(true);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const { section, showingFiles } = props.state;

  // Export button
  const exportButton = (
    <EuiButtonEmpty
      iconType="exportAction"
      onClick={async () => await generateCsv()}
      isLoading={generatinCsv}
    >
      Export formatted
    </EuiButtonEmpty>
  );

  const getOnClickNewRule = () => {
    props.updteAddingRulesetFile({
      name: '',
      content: '<!-- Modify it at your will. -->',
      path: `etc/${section}`,
    });
    props.params.history.push(`/management/${section}/new`);
  };

  // Add new rule button
  const addNewRuleButton = (
    <WzButtonPermissions
      permissions={[{ action: 'manager:upload_file', resource: `file:path:/etc/${section}` }]}
      buttonType="empty"
      iconType="plusInCircle"
      onClick={getOnClickNewRule}
    >
      {`Add new ${section} file`}
    </WzButtonPermissions>
  );

  //Add new CDB list button
  const addNewCdbListButton = (
    <WzButtonPermissions
      buttonType="empty"
      permissions={[{ action: 'manager:upload_file', resource: 'file:path:/etc/lists/files' }]}
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
    <WzButtonPermissions
      buttonType="empty"
      permissions={[{ action: 'manager:upload_file', resource: `file:path:/etc/${section}` }]}
      iconType={showingFiles ? 'apmTrace' : 'folderClosed'}
      onClick={async () => await toggleFiles()}
    >
      {showingFiles ? `Manage ${section}` : `Manage ${section} files`}
    </WzButtonPermissions>
  );

  //Refresh
  const refreshButton = (
    <EuiButtonEmpty iconType="refresh" onClick={async () => await refresh()}>
      Refresh
    </EuiButtonEmpty>
  );

  const uploadFile = async (files, path) => {
    await uploadFiles(files, path);
    await refresh();
  };

  return (
    <>
      {section !== 'lists' && <EuiFlexItem grow={false}>{manageFiles}</EuiFlexItem>}
      {section !== 'lists' && <EuiFlexItem grow={false}>{addNewRuleButton}</EuiFlexItem>}
      {section === 'lists' && <EuiFlexItem grow={false}>{addNewCdbListButton}</EuiFlexItem>}
      {(section === 'lists' || showingFiles) && (
        <EuiFlexItem grow={false}>
          <UploadFiles msg={section} path={`etc/${section}`} upload={uploadFile} />
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={false}>{exportButton}</EuiFlexItem>
      <EuiFlexItem grow={false}>{refreshButton}</EuiFlexItem>
    </>
  );
};

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
