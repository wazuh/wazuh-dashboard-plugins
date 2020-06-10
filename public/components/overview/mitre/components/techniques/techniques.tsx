/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react'
import {
  EuiFacetButton,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiTitle,
  EuiFieldSearch,
  EuiSpacer,
  EuiToolTip,
  EuiSwitch,
  EuiPopover,
  EuiText,
  EuiContextMenu,
  EuiIcon,
  EuiOverlayMask,
  EuiButtonIcon
} from '@elastic/eui';
import { FlyoutTechnique } from './components/flyout-technique/';
import { mitreTechniques, getElasticAlerts, IFilterParams } from '../../lib'
import { ITactic } from '../../';
import { getServices } from 'plugins/kibana/discover/kibana_services';

export class Techniques extends Component {
  _isMount = false;

  props!: {
    tacticsObject: ITactic
    selectedTactics: any
    indexPattern: any
    filterParams: IFilterParams
  }

  state: {
    techniquesCount: {key: string, doc_count: number}[]
    searchValue: any,
    isFlyoutVisible: Boolean,
    currentTechniqueData: {},
    currentTechnique: string,
    hideAlerts: boolean,
    actionsOpen: string
  }

	constructor(props) {
    super(props);
    
    this.state = {
      searchValue: "",
      isFlyoutVisible: false,
      currentTechniqueData: {},
      techniquesCount: [],
      currentTechnique: '',
      hideAlerts: false,
      actionsOpen: ""
    }
    this.onChangeFlyout.bind(this);
	}
  
  async componentDidMount(){
    this._isMount = true;
    await this.getTechniquesCount();
  }

  componentDidUpdate(prevProps) {
    const { filters } = this.props;
    if ( JSON.stringify(prevProps.filters) !== JSON.stringify(filters) )
      this.getTechniquesCount();
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  async getTechniquesCount() {
    try{
      const {indexPattern, filters} = this.props;
      if ( !indexPattern ) { return; }
      const aggs = {
        techniques: {
          terms: {
              field: "rule.mitre.id",
              size: 1000,
          }
        }
      }
      
      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const {data, status, statusText, } = await getElasticAlerts(indexPattern, filters, aggs);
      const { buckets } = data.aggregations.techniques;
      this._isMount && this.setState({techniquesCount: buckets, loadingAlerts: false});
        
    } catch(err){
      // this.showToast(
      //   'danger',
      //   'Error',
      //   `Mitre alerts could not be fetched: ${err}`,
      //   3000
      // );
      this._isMount && this.setState({loadingAlerts: false})
    }
  }

  buildPanel(techniqueID){
    return [
      {
        id: 0,
        title: 'Actions',
        items: [
          {
            name: 'Filter for value',
            icon: <EuiIcon type="magnifyWithPlus" size="m" />,
            onClick: () => {
              this.closeActionsMenu();
              this.addFilter({key: 'rule.mitre.id', value: techniqueID, negate: false} );
            },
          },
          {
            name: 'Filter out value',
            icon: <EuiIcon type="magnifyWithMinus" size="m" />,
            onClick: () => {
              this.closeActionsMenu();
              this.addFilter({key: 'rule.mitre.id', value: techniqueID, negate: true} );
            },
          },
          {
            name: 'View technique details',
            icon: <EuiIcon type="filebeatApp" size="m" />,
            onClick: () => {
              this.closeActionsMenu();
              this.showFlyout(techniqueID)
            },
          }
        ],
      }
    ]
  }

  renderFacet() {
    const { tacticsObject } = this.props;
    const { techniquesCount } = this.state;
    const tacticsToRender: Array<any> = [];
    const showTechniques = {};

    Object.keys(tacticsObject).forEach((key, inx) => {
      const currentTechniques = tacticsObject[key];
      if(this.props.selectedTactics[key]){
        currentTechniques.forEach( (technique,idx) => {
          if(!showTechniques[technique] && (technique.toLowerCase().includes(this.state.searchValue.toLowerCase()) || mitreTechniques[technique].name.toLowerCase().includes(this.state.searchValue.toLowerCase()) )){
            const quantity = (techniquesCount.find(item => item.key === technique) || {}).doc_count || 0;
            if(!this.state.hideAlerts || (this.state.hideAlerts && quantity > 0)){
              showTechniques[technique] = true;
              tacticsToRender.push({
                id: technique,
                label: `${technique} - ${mitreTechniques[technique].name}`,
                quantity
              })
            }
          }
        });

      }
    });

    const tacticsToRenderOrdered = tacticsToRender.sort((a, b) => b.quantity - a.quantity).map( (item,idx) => {
      const tooltipContent = `View details of ${mitreTechniques[item.id].name} (${item.id})`;
      const toolTipAnchorClass = "wz-display-inline-grid" + (this.state.hover=== item.id ? " wz-mitre-width" : " ");
      return(
        <EuiFlexItem 
        onMouseEnter={() => this.setState({ hover: item.id })}
        onMouseLeave={() => this.setState({ hover: "" })}
        key={idx} style={{border: "1px solid #8080804a", maxWidth: "calc(25% - 8px)"}}>

        <EuiPopover
            id="techniqueActionsContextMenu"
            anchorClassName="wz-width-100"
            button={(
                <EuiFacetButton
                  style={{width: "100%", padding: "0 5px 0 5px", lineHeight: "40px"}}
                  quantity={item.quantity}
                  onClick={() => this.showFlyout(item.id)}>
                  <EuiToolTip position="top" content={tooltipContent} anchorClassName={toolTipAnchorClass}>
                    <span style={{
                            display: "block",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis"}}>
                      {item.id} - {mitreTechniques[item.id].name}
                    </span>
                  </EuiToolTip>

                  {this.state.hover === item.id &&
                    <span style={{float: "right"}}>
                      <EuiToolTip position="top" content={"Show " + item.id + " in Dashboard"} >
                          <EuiIcon onClick={(e) => {this.openDashboard(item.id);e.stopPropagation()}} color="primary" type="visualizeApp"></EuiIcon>
                      </EuiToolTip> &nbsp;
                      <EuiToolTip position="top" content={"Inspect " + item.id + " in Events"} >
                        <EuiIcon onClick={(e) => {this.openDiscover(item.id);e.stopPropagation()}} color="primary" type="discoverApp"></EuiIcon>
                      </EuiToolTip>

                    </span>
                  }
                </EuiFacetButton>
              )
              }
            isOpen={this.state.actionsOpen === item.id}
            closePopover={() => this.closeActionsMenu()}
            panelPaddingSize="none"
            style={{width: "100%"}}
            withTitle
            anchorPosition="downLeft">
            <EuiContextMenu initialPanelId={0} panels={this.buildPanel(item.id)} />
          </EuiPopover>
        </EuiFlexItem>
      );
        
    })
    if(tacticsToRender.length){
      return (
      <EuiFlexGrid columns={4} gutterSize="s" style={{ maxHeight: "400px",overflow: "overlay", overflowX: "hidden", paddingRight: 10}}>
        {tacticsToRenderOrdered}
      </EuiFlexGrid>
      )
    }else{
      return <>No results.</>
    }
  }

  openDiscover(techniqueID){
    this.addFilter({key: 'rule.mitre.id', value: techniqueID, negate: false} );
    this.props.onSelectedTabChanged('events');
  }


  openDashboard(techniqueID){
    this.addFilter({key: 'rule.mitre.id', value: techniqueID, negate: false} );
    this.props.onSelectedTabChanged('dashboard');
  }

 /** 
   * Adds a new filter with format { "filter_key" : "filter_value" }, e.g. {"agent.id": "001"}
   * @param filter 
   */
  addFilter(filter) {    
    const { filterManager } = getServices();
    const matchPhrase = {};
    matchPhrase[filter.key] = filter.value;
    const newFilter = {
      "meta": {
        "disabled": false,
        "key": filter.key,
        "params": { "query": filter.value },
        "type": "phrase",
        "negate": filter.negate || false,
        "index": "wazuh-alerts-3.x-*"
      },
      "query": { "match_phrase": matchPhrase },
      "$state": { "store": "appState" }
    }
    filterManager.addFilters([newFilter]);
  }

  onSearchValueChange = e => {
    this.setState({searchValue: e.target.value});
  }

  async closeActionsMenu() {
    this.setState({actionsOpen: false});
  }

  async showActionsMenu(techniqueData) {
    this.setState({actionsOpen: techniqueData });
  }

  async showFlyout(techniqueData) {
    this.setState({isFlyoutVisible: true, currentTechnique: techniqueData });
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentTechniqueData: {},  });
  }

  onChangeFlyout = (isFlyoutVisible: boolean) => {
      this.setState({ isFlyoutVisible });
  }

  hideAlerts(){
    this.setState({hideAlerts: !this.state.hideAlerts})
  }

	render() {
    const { isFlyoutVisible, currentTechnique } = this.state;
		return (
      <div style={{padding: 10}}>
        <EuiFlexGroup>
          <EuiFlexItem grow={true}>
            <EuiTitle size="m">
              <h1>Techniques</h1>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiText grow={false}>
                    <span>Hide techniques with no alerts </span> &nbsp;
                  <EuiSwitch
                    label=""
                    checked={this.state.hideAlerts}
                    onChange={e => this.hideAlerts()}
                  />
                  </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup> 
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xs" />

        <EuiFieldSearch
          fullWidth={true}
          placeholder="Filter techniques"
          value={this.state.searchValue}
          onChange={e => this.onSearchValueChange(e)}
          isClearable={true}
          aria-label="Use aria labels when no actual label is in use"
        />
        <EuiSpacer size="s" />

        <div>
          {this.renderFacet()}
        </div>
        { isFlyoutVisible &&
          <EuiOverlayMask
            // @ts-ignore
            onClick={(e: Event) => { e.target.className === 'euiOverlayMask' && this.onChangeFlyout(false) }} >
          
            <FlyoutTechnique
              openDashboard={itemId => this.openDashboard(itemId)}
              openDiscover={itemId => this.openDiscover(itemId)}
              onChangeFlyout={this.onChangeFlyout}
              currentTechniqueData={this.state.currentTechniqueData}
              currentTechnique={currentTechnique} />
          </EuiOverlayMask>
        } 
      </div>   
		)
	}
}
