/*
 * Wazuh app - React component for main Decoders view.
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
// Redux
import WzReduxProvider from '../../../../../redux/wz-redux-provider';
import WzDecodersOverview from './views/decoders-overview';
import WzFileEditor from '../common/file-editor';
import { SECTION_DECODERS_SECTION } from '../common/constants';

export default function WzDecoder({ clusterStatus, logtestProps }) {

  const [fileContent, setFileContent] = useState(false);
  const [addingFile, setAddingFile] = useState(false);
  const [showingFiles, setShowingFiles] = useState(false);

  const cleanEditState = () => {
    setFileContent(false);
    setAddingFile(false);
  }

  return (
    <WzReduxProvider>
      {
        ((fileContent || addingFile) && (
          <WzFileEditor
            section={SECTION_DECODERS_SECTION}
            fileContent={fileContent}
            addingFile={addingFile}
            logtestProps={logtestProps}
            clusterStatus={clusterStatus}
            updateFileContent={(fileContent) => { setFileContent(fileContent) }}
            cleanEditState={() => cleanEditState()}
          />
        )) || (
          <WzDecodersOverview
            clusterStatus={clusterStatus}
            updateFileContent={(fileContent) => { setFileContent(fileContent) }}
            updateAddingFile={(addingFile) => { setAddingFile(addingFile) }}
            setShowingFiles={() => { setShowingFiles(!showingFiles) }}
            showingFiles={showingFiles}
          />
        )
      }
    </WzReduxProvider>
  );
}
