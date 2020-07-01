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
import MarkdownIt from 'markdown-it';
import $ from 'jquery';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
});

import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiLoadingContent,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiDescriptionList,
  EuiSpacer,
  EuiLink,
  EuiAccordion,
  EuiToolTip,
  EuiIcon
} from '@elastic/eui';
import { WzRequest } from '../../../../../../../react-services/wz-request';
import { AppState } from '../../../../../../../react-services/app-state';
import { AppNavigate } from '../../../../../../../react-services/app-navigate';
import { Discover } from '../../../../../../common/modules/discover';

export class FlyoutTechnique extends Component {
  _isMount = false;
  clusterFilter: object;

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
        // description: ''
      },
      loading: false
    }
  }

  async componentDidMount() {
    this._isMount = true;
    const isCluster = (AppState.getClusterInfo() || {}).status === "enabled";
      const clusterFilter = isCluster
        ? { "cluster.name": AppState.getClusterInfo().cluster }
        : { "manager.name": AppState.getClusterInfo().manager };
    this.clusterFilter = clusterFilter ;
    await this.getTechniqueData();
    this.addListenersToCitations();
  }

  async componentDidUpdate(prevProps) {
    const { currentTechnique } = this.props;
    if (prevProps.currentTechnique !== currentTechnique ){
      await this.getTechniqueData();
    }
    this.addListenersToCitations();
  }

  componentWillUnmount(){
    // remove listeners of citations if these exist
    if(this.state.techniqueData && this.state.techniqueData.replaced_external_references && this.state.techniqueData.replaced_external_references.length > 0){
      this.state.techniqueData.replaced_external_references.forEach(reference => {
        $(`.technique-reference-${reference.index}`).each(function(){
          $(this).off();
        });
      })
    }
  }

  addListenersToCitations(){
    if(this.state.techniqueData && this.state.techniqueData.replaced_external_references && this.state.techniqueData.replaced_external_references.length > 0){
      this.state.techniqueData.replaced_external_references.forEach(reference => {
        $(`.technique-reference-citation-${reference.index}`).each(function(){
          $(this).off();
          $(this).click(() => {
            $(`.euiFlyoutBody__overflow`).scrollTop($(`#technique-reference-${reference.index}`).position().top - 150);
          });
        })
      })
    }
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
    const { name, description, x_mitre_version: version, x_mitre_data_sources, external_references } = rawData.json;

    const replaced_external_references = [];
    let index_replaced_external_references = 0;
    let last_citation_string = '';
    const descriptionWithCitations = external_references.reduce((accum, reference) => {
      return accum
      .replace(new RegExp(`\\(Citation: ${reference.source_name}\\)`,'g'), (token) => {
        if(last_citation_string !== token){
          index_replaced_external_references++;
          replaced_external_references.push({...reference, index: index_replaced_external_references});
          last_citation_string = token;
        }
        return `<a style="vertical-align: super;" rel="noreferrer" class="euiLink euiLink--primary technique-reference-citation-${index_replaced_external_references}">[${String(index_replaced_external_references)}]</a>`;
      })
    }, description);
    this.setState({techniqueData: { name, description: descriptionWithCitations, phase_name, platform_name, version, x_mitre_data_sources, external_references, replaced_external_references }, loading: false  })
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
    const implicitFilters=[{ 'rule.mitre.id': currentTechnique}, this.clusterFilter ];
    if(this.props.implicitFilters){
      this.props.implicitFilters.forEach( item => 
        implicitFilters.push(item))
    }

    const link = `https://attack.mitre.org/techniques/${currentTechnique}/`;
    const formattedDescription = techniqueData.description 
      ? (
        <div
          className="wz-markdown-margin wz-markdown-wapper"
          dangerouslySetInnerHTML={{__html: md.render(techniqueData.description)}}>
        </div>
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
          techniqueData.x_mitre_data_sources
        )
      },
      {
        title: 'Version',
        description: techniqueData.version
      },
      {
        title: 'Description',
        description: formattedDescription
      },
      
    ];
    if(techniqueData && techniqueData.replaced_external_references && techniqueData.replaced_external_references.length > 0){
      data.push({
        title: 'References',
        description: (
          <EuiFlexGroup>
            <EuiFlexItem>
              {techniqueData.replaced_external_references.map((external_reference, external_reference_index) => (
                <div key={`external_reference-${external_reference.index}`} id={`technique-reference-${external_reference.index}`}>
                  <span>{external_reference.index}. </span>
                  <EuiLink href={external_reference.url} target='_blank'>
                    {external_reference.source_name}
                  </EuiLink>
                </div>
              )
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        )
      })
    }
    return (
      <EuiFlyoutBody className="flyout-body" >
        <EuiAccordion
        id={"details"}
        buttonContent={
          <EuiTitle size="s">
            <h3>Technique details</h3>
          </EuiTitle>
        }
        paddingSize="none"
        initialIsOpen={true}>
        <div className='flyout-row details-row'>

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
        </div>
        </EuiAccordion>


        <EuiSpacer size='s' />
          <EuiAccordion
            style={{textDecoration: 'none'}}
            id={"recent_events"}
            className='events-accordion'
            extraAction={<div style={{marginBottom: 5}}><strong>{this.state.totalHits || 0}</strong> hits</div>}
            buttonContent={
              <EuiTitle size="s">
                <h3>
                  Recent events{this.props.view !== 'events' && (
                    <span style={{ marginLeft: 16 }}> 
                      <span>
                        <EuiToolTip position="top" content={"Show " + currentTechnique+ " in Dashboard"}>
                            <EuiIcon onMouseDown={(e) => {this.props.openDashboard(e,currentTechnique);e.stopPropagation()}} color="primary" type="visualizeApp" style={{marginRight: '10px'}}></EuiIcon>
                        </EuiToolTip>
                        <EuiToolTip position="top" content={"Inspect " + currentTechnique + " in Events"} >
                          <EuiIcon onMouseDown={(e) => {this.props.openDiscover(e,currentTechnique);e.stopPropagation()}} color="primary" type="discoverApp"></EuiIcon>
                        </EuiToolTip>
                      </span> 
                    </span>
                  )}
                </h3>
              </EuiTitle>
            }
            paddingSize="none"
            initialIsOpen={true}>
          <EuiFlexGroup className="flyout-row">
            <EuiFlexItem>
              <Discover initialColumns={["icon", "timestamp", 'rule.mitre.id', 'rule.mitre.tactic', 'rule.level', 'rule.id', 'rule.description']} implicitFilters={implicitFilters} initialFilters={[]} updateTotalHits={(total) => this.updateTotalHits(total)}/>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiAccordion>
      
      </EuiFlyoutBody>
    );
  }

  updateTotalHits = (total) => {
    this.setState({totalHits : total});
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
          size="l"
          className="flyout-no-overlap"
          aria-labelledby="flyoutSmallTitle"
          > 
          { techniqueData &&
            this.renderHeader()
          }
          {
            this.renderBody()
          }
          { this.state.loading &&
            this.renderLoading()
          }
        </EuiFlyout>
    );
  }
}