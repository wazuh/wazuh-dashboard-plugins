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
  EuiCallOut,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { FlyoutTechnique } from './components/flyout-technique/';
import { mitreTechniques, getElasticAlerts, IFilterParams } from '../../lib'
import { ITactic } from '../../';
import { getServices } from '../../../../../../../../src/plugins/discover/public/kibana_services';
import { withWindowSize } from '../../../../../components/common/hocs/withWindowSize';
import WzRequest from '../../../../../react-services/wz-request';
import {WAZUH_ALERTS_PATTERN} from '../../../../../../util/constants';
import AppState from '../../../../../react-services/app-state';
import { WzFieldSearchDelay } from '../../../../common/search'

export const Techniques = withWindowSize(class Techniques extends Component {
  _isMount = false;

  props!: {
    tacticsObject: ITactic
    selectedTactics: any
    indexPattern: any
    filterParams: IFilterParams
  }

  state: {
    techniquesCount: {key: string, doc_count: number}[]
    isFlyoutVisible: Boolean,
    currentTechniqueData: {},
    currentTechnique: string,
    hideAlerts: boolean,
    actionsOpen: string,
    filteredTechniques: boolean | [string]
    isSearching: boolean
  }

	constructor(props) {
    super(props);
    
    this.state = {
      isFlyoutVisible: false,
      currentTechniqueData: {},
      techniquesCount: [],
      currentTechnique: '',
      hideAlerts: false,
      actionsOpen: "",
      filteredTechniques: false,
      isSearching: false
    }
    this.onChangeFlyout.bind(this);
	}
  
  async componentDidMount(){
    this._isMount = true;
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { filterParams, indexPattern, selectedTactics, isLoading } = this.props;
    if (nextProps.isLoading !== isLoading) 
      return true;
    if (JSON.stringify(nextProps.filterParams) !== JSON.stringify(filterParams))
      return true;
    if (JSON.stringify(nextProps.indexPattern) !== JSON.stringify(indexPattern))
      return true;
    if (JSON.stringify(nextState.selectedTactics) !== JSON.stringify(selectedTactics))
      return true;
    return false;
  }

  componentDidUpdate(prevProps) {
    const { isLoading, tacticsObject, filters } = this.props;
    if ( JSON.stringify(prevProps.tacticsObject) !== JSON.stringify(tacticsObject) || (isLoading !== prevProps.isLoading))
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
      this._isMount && this.setState({loadingAlerts: true});
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

  techniqueColumnsResponsive(){
    if(this.props && this.props.windowSize){
      return this.props.windowSize.width < 930 ? 2
      : this.props.windowSize.width < 1200 ? 3
      : 4;
    }else{
      return 4;
    }
  }

  renderFacet() {
    const { tacticsObject } = this.props;
    const { techniquesCount } = this.state;
    let tacticsToRender: Array<any> = [];
    const currentTechniques = Object.keys(tacticsObject).map(tacticsKey => ({tactic: tacticsKey, techniques: tacticsObject[tacticsKey]}))
      .filter(tactic => this.props.selectedTactics[tactic.tactic])
      .map(tactic => tactic.techniques)
      .flat()
      .filter((techniqueID, index, array) => array.indexOf(techniqueID) === index);
    
    tacticsToRender = currentTechniques
      .filter(techniqueID => this.state.filteredTechniques ? this.state.filteredTechniques.includes(techniqueID) : techniqueID)
      .map(techniqueID => {
        return {
          id: techniqueID,
          label: `${techniqueID} - ${mitreTechniques[techniqueID].name}`,
          quantity: (techniquesCount.find(item => item.key === techniqueID) || {}).doc_count || 0
        }
      })
      .filter(technique => this.state.hideAlerts ? technique.quantity !== 0 : true);

    const tacticsToRenderOrdered = tacticsToRender.sort((a, b) => b.quantity - a.quantity).map( (item,idx) => {
      const tooltipContent = `View details of ${mitreTechniques[item.id].name} (${item.id})`;
      const toolTipAnchorClass = "wz-display-inline-grid" + (this.state.hover=== item.id ? " wz-mitre-width" : " ");
      return(
        <EuiFlexItem 
        onMouseEnter={() => this.setState({ hover: item.id })}
        onMouseLeave={() => this.setState({ hover: "" })}
        key={idx} style={{border: "1px solid #8080804a", maxWidth: 'calc(25% - 8px)', maxHeight: 41}}>

        <EuiPopover
            id="techniqueActionsContextMenu"
            anchorClassName="wz-width-100"
            button={(
                <EuiFacetButton
                  style={{width: "100%", padding: "0 5px 0 5px", lineHeight: "40px", maxHeight: 40}}
                  quantity={item.quantity}
                  className={"module-table"}
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
                    <span style={{float: "right", position: 'fixed'}}>
                      <EuiToolTip position="top" content={"Show " + item.id + " in Dashboard"} >
                          <EuiIcon onClick={(e) => {this.openDashboard(e,item.id);e.stopPropagation()}} color="primary" type="visualizeApp"></EuiIcon>
                      </EuiToolTip> &nbsp;
                      <EuiToolTip position="top" content={"Inspect " + item.id + " in Events"} >
                        <EuiIcon onClick={(e) => {this.openDiscover(e,item.id);e.stopPropagation()}} color="primary" type="discoverApp"></EuiIcon>
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
    if(this.state.isSearching || this.state.loadingAlerts || this.props.isLoading){
      return (
        <EuiFlexItem style={{ height: "calc(100vh - 410px)", alignItems: 'center' }} >
          <EuiLoadingSpinner size='xl'/>
        </EuiFlexItem>
      )
    }
    if(tacticsToRender.length){
      return (
      <EuiFlexGrid columns={this.techniqueColumnsResponsive()} gutterSize="s" style={{ maxHeight: "calc(100vh - 385px)", overflow: "overlay", overflowX: "hidden", paddingRight: 10}}>
        {tacticsToRenderOrdered}
      </EuiFlexGrid>
      )
    }else{
      return <EuiCallOut title='There are no results.' iconType='help' color='warning'></EuiCallOut>
    }
  }

  openDiscover(e,techniqueID){
    this.addFilter({key: 'rule.mitre.id', value: techniqueID, negate: false} );
    this.props.onSelectedTabChanged('events');
  }


  openDashboard(e,techniqueID){
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
        "index": AppState.getCurrentPattern() || WAZUH_ALERTS_PATTERN
      },
      "query": { "match_phrase": matchPhrase },
      "$state": { "store": "appState" }
    }
    filterManager.addFilters([newFilter]);
  }

  onChange = searchValue => {
    if(!searchValue){
      this._isMount && this.setState({ filteredTechniques: false, isSearching: false });
    }
  }

  onSearch = async searchValue => {
    try{
      if(searchValue){
        this._isMount && this.setState({isSearching: true});
        const response = await WzRequest.apiReq('GET', '/mitre', {
          params: {
            select: "id",
            search: searchValue,
            limit: 500
          }
        });
        const filteredTechniques = ((((response || {}).data || {}).data).affected_items || []).map(item => item.id);
        this._isMount && this.setState({ filteredTechniques, isSearching: false });
      }else{
        this._isMount && this.setState({ filteredTechniques: false, isSearching: false });
      }
    }catch(error){
      this._isMount && this.setState({ filteredTechniques: false, isSearching: false });
    }
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

        <WzFieldSearchDelay
          fullWidth={true}
          placeholder="Filter techniques of selected tactic/s"
          onChange={this.onChange}
          onSearch={this.onSearch}
          isClearable={true}
          aria-label="Use aria labels when no actual label is in use"
        />
        <EuiSpacer size="s" />

        <div>
          {this.renderFacet()}
        </div>
        { isFlyoutVisible &&
          <EuiOverlayMask
            headerZindexLocation="below"
            // @ts-ignore
            onClick={() => this.onChangeFlyout(false) } >
          
            <FlyoutTechnique
              openDashboard={(e,itemId) => this.openDashboard(e,itemId)}
              openDiscover={(e,itemId) => this.openDiscover(e,itemId)}
              onChangeFlyout={this.onChangeFlyout}
              currentTechniqueData={this.state.currentTechniqueData}
              currentTechnique={currentTechnique} />
          </EuiOverlayMask>
        } 
      </div>   
		)
	}
})
