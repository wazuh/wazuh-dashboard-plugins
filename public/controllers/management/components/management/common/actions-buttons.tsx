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
import React from 'react';
// Eui components

import { UploadFiles } from '../../upload-files';
import { resourceDictionary, ResourcesHandler, ResourcesConstants } from './resources-handler';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';

import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';

/**
 * Uploads the files
 * @param {Array} files
 * @param {String} path
 */
async function uploadFiles(files, resource) {
  try {
    let errors = false;
    let results: any[] = [];
    const resourcesHandler = new ResourcesHandler(resource);
    for (let idx in files) {
      const { file, content } = files[idx];
      try {
        await resourcesHandler.updateFile(file, content, resource !== ResourcesConstants.LISTS); // True does not overwrite the file
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

const getReadPermissionsFiles = (section) => {
  const { permissionResource } = resourceDictionary[section];
  return [
    {
      action: `${section}:read`,
      resource: permissionResource('*'),
    },
  ];
};

const getUpdatePermissionsFiles = (section) => {
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

// Add new rule button
export const AddNewFileButton = ({ section, updateAddingFile }) => (
  <>{
    section !== 'lists' &&
    <WzButtonPermissions
      permissions={getUpdatePermissionsFiles(section)}
      buttonType="empty"
      iconType="plusInCircle"
      onClick={() =>
        updateAddingFile({
          name: '',
          content: '<!-- Modify it at your will. -->',
          path: `etc/${section}`,
        })
      }
    >
      {`Add new ${section} file`}
    </WzButtonPermissions>
  }</>
)

//Add new CDB list button
export const AddNewCdbListButton = (({ section, updateListContent }) => {
  return <>
    {section === 'lists' &&
      <WzButtonPermissions
        buttonType="empty"
        permissions={getUpdatePermissionsFiles(section)}
        iconType="plusInCircle"
        onClick={() =>
          updateListContent({
            name: false,
            content: '',
            path: 'etc/lists',
          })
        }
      >
        {`Add new ${section} file`}
      </WzButtonPermissions>}
  </>
});

// Manage files
export const ManageFiles = (({ section, showingFiles, ...props }) => {
  
  /**
 * Toggle between files and rules or decoders
 */
  const toggleFiles = async () => {
    try {
      // props.updateLoadingStatus(true);
      props.toggleShowFiles(!showingFiles);
      // props.updateIsProcessing(true);
      // props.updatePageIndex(0);
      // props.updateLoadingStatus(false);
    } catch (error) {
      const options = {
        context: 'ActionButtons.toggleFiles',
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: false,
        error: {
          error: error,
          message: `Error toggling to files: ${error.message || error}`,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }
  return (
    <>
      {section !== 'lists' &&
        <WzButtonPermissions
          buttonType="empty"
          permissions={getUpdatePermissionsFiles(section)}
          iconType={showingFiles ? 'apmTrace' : 'folderClosed'}
          onClick={async () => await toggleFiles()}
        >
          {showingFiles ? `Manage ${section}` : `Manage ${section} files`}
        </WzButtonPermissions>}
    </>
  )
});

const uploadFile = async (files, resource) => {
  try {
    await uploadFiles(files, resource);
  } catch (error) {
    const options = {
      context: 'ActionButtons.uploadFile',
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

export const UploadFilesButton = (({ clusterStatus, section, showingFiles, onSuccess, ...props }) => {
  
  return (
    <>
      {(section === 'lists' || showingFiles) && (
        <UploadFiles
          clusterStatus={clusterStatus}
          resource={section}
          path={`etc/${section}`}
          upload={uploadFile}
          onSuccess={() => {
            props.updateIsProcessing(true);
            onSuccess && onSuccess(true)
          }}
        />
      )}
    </>
  )
});
