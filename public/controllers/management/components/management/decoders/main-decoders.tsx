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
import React, { Component } from 'react';
// Redux
import WzReduxProvider from '../../../../../redux/wz-redux-provider';
import WzDecodersOverview from './views/decoders-overview';
import WzFileEditor from '../common/file-editor';
import { SECTION_DECODERS_SECTION } from '../common/constants';

export default class WzDecoder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fileContent: false,
      addingFile: false
    }; 
  }

  render() {
    const { fileContent, addingFile } = this.state;

    return (
      <WzReduxProvider>
        {
          ((fileContent || addingFile) && (
            <WzFileEditor
              section={SECTION_DECODERS_SECTION}
              fileContent={fileContent}
              addingFile={addingFile}
              logtestProps={this.props.logtestProps}
              clusterStatus={this.props.clusterStatus}
              updateFileContent={(fileContent) => { this.setState({ fileContent }) }}
              cleanEditState={() => {
                this.setState({
                  fileContent: false,
                  addingFile: false
                })
              }}
            />
          )) || <WzDecodersOverview
            clusterStatus={this.props.clusterStatus}
            updateFileContent={(fileContent) => { this.setState({ fileContent }) }}
            updateAddingFile={(addingFile) => { this.setState({ addingFile }) }}
          />}
      </WzReduxProvider>
    );
  }
}
