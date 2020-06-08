/*
 * Wazuh app - Mitre flyout components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiLoadingContent,
  EuiTitle,
  EuiFlyoutBody,
  EuiDescriptionList,
  EuiSpacer,
  EuiLink,
  EuiToolTip,
} from '@elastic/eui';
import { WzRequest } from '../../../../../../../react-services/wz-request';

export class FlyoutTechnique extends Component {
  _isMount = false;
  state: {
    techniqueData: {
      [key:string]: any,
    }
    loading: boolean
  }

  props!: {
    currentTechniqueData: any
    currentTechnique: string
  }

  constructor(props) {
    super(props);
    this.state = {
      techniqueData: {
        description: ''
      },
      loading: false
    }
  }

  componentDidMount() {
    this._isMount = true;
    this.getTechniqueData();

  }

  componentDidUpdate(prevProps) {
    const { currentTechnique } = this.props;
    if (prevProps.currentTechnique !== currentTechnique )
      this.getTechniqueData();
  }

  async getTechniqueData() {
    try{
      this.setState({loading: true, techniqueData: {}});
      const { currentTechnique } = this.props;
      const result = await WzRequest.apiReq('GET', '/mitre', {
        q: `id=${currentTechnique}`
      });
      const rawData = (((result || {}).data || {}).data || {}).items
      !!rawData && this.formatTechniqueData(rawData[0]);
    }catch(err){
      this.setState({loading: false});
    }
  }

  formatTechniqueData (rawData) {
    const { platform_name, phase_name} = rawData;
    const { name, description, x_mitre_version: version } = rawData.json;
    this.setState({techniqueData: { name, description, phase_name, platform_name, version}, loading: false  })
  }

  getArrayFormatted(arrayText) {
    try {
      const stringText = arrayText.toString();
      const splitString = stringText.split(',');
      const resultString = splitString.join(', ');
      return resultString;
    } catch (err) {
      return arrayText;
    }
  }
  
  renderHeader() {
    const { techniqueData } = this.state;
    return(
      <EuiFlyoutHeader hasBorder style={{padding:"12px 16px"}}>
        {(Object.keys(techniqueData).length === 0 && (
          <div>
            <EuiLoadingContent lines={1} />
          </div>
        )) || (
          <EuiTitle size="m">
            <h2 id="flyoutSmallTitle">
              {techniqueData.name}
            </h2>
          </EuiTitle>
        )}
      </EuiFlyoutHeader>
    )
  }
  
  renderBody() {
    const { currentTechnique } = this.props;
    const { techniqueData } = this.state;
    const link = `https://attack.mitre.org/techniques/${currentTechnique}/`;
    const formattedDescription = techniqueData.description 
      ? (
        <ReactMarkdown
          className="wz-markdown-margin"
          source={techniqueData.description}
        />
      )
      : techniqueData.description;
    const data = [
      {
        title: 'ID',
        description: ( <EuiToolTip
          position="top"
          content={"Open " + currentTechnique + " details in a new page"}>
          <EuiLink href={link} external target="_blank">
            {currentTechnique}
          </EuiLink>
        </EuiToolTip>)
      },
      {
        title: 'Tactic',
        description: this.getArrayFormatted(
          techniqueData.phase_name
        )
      },
      {
        title: 'Platform',
        description: this.getArrayFormatted(
          techniqueData.platform_name
        )
      },
      {
        title: 'Data sources',
        description: this.getArrayFormatted(
          techniqueData.dataSources
        )
      },
      {
        title: 'Version',
        description: techniqueData.version
      },
      {
        title: 'Description',
        description: formattedDescription
      }
    ];
    return (
      <EuiFlyoutBody>
        {(Object.keys(techniqueData).length === 0 && (
          <div>
            <EuiLoadingContent lines={2} />
            <EuiLoadingContent lines={3} />
          </div>
        )) || (
          <div style={{marginBottom: 30}}>
            <EuiDescriptionList listItems={data} />
            <EuiSpacer />
            <p>
              More info:{' '}
              <EuiLink href={link} target="_blank">
                {`MITRE ATT&CK - ${currentTechnique}`}
              </EuiLink>
            </p>
          </div>
        )}
      </EuiFlyoutBody>
    );
  }

  renderLoading(){
    return (
    <EuiFlyoutBody>
          <EuiLoadingContent lines={2} />
          <EuiLoadingContent lines={3} />
    </EuiFlyoutBody>
    )
  }

  render() {
    const { techniqueData } = this.state;
    const { onChangeFlyout } = this.props;
    return(
        <EuiFlyout
          onClose={() => onChangeFlyout(false)}
          maxWidth="50%"
          className="flyout-no-overlap"
          aria-labelledby="flyoutSmallTitle"
          > 
          { techniqueData &&
            this.renderHeader()
          }
          {
            !!Object.keys(techniqueData).length &&
            this.renderBody()
          }
          { this.state.loading &&
            this.renderLoading()
          }
        </EuiFlyout>
    );
  }
}