/*
 * Wazuh app - React component for build q queries.
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiButtonEmpty, EuiButton, EuiCallOut, EuiLoadingSpinner } from '@elastic/eui';
import PropTypes from 'prop-types';
import './wz-menu.css';
import { AppState } from '../../react-services/app-state';
import {WzMisc} from '../../factories/misc';
import { PatternHandler } from '../../react-services/pattern-handler';
import { WazuhConfig } from '../../react-services/wazuh-config';
import chrome from 'ui/chrome';
import { connect } from 'react-redux';
import WzReduxProvider from '../../redux/wz-redux-provider';
import store from '../../redux/store'



class WzMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMenu: false,
      currentMenuTab: "",
      currentAPI: "",
      showSelector: false,
      theresPattern: false,
      currentPattern: "",
      patternList: [],
      currentSelectedPattern: ""
    };
    this.store = store;
    this.wazuhConfig = new WazuhConfig();
  }

  async componentDidMount(){
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.indexPatterns = $injector.get('indexPatterns');

  }

 


  componentDidUpdate(prevProps) {
    if(prevProps.state.showMenu !== this.props.state.showMenu  || this.props.state.showMenu === true && this.state.showMenu === false){
      this.load();
    }
    if(!this.state.currentAPI && JSON.parse(AppState.getCurrentAPI()).name || JSON.parse(AppState.getCurrentAPI()).name !== this.state.currentAPI ){
      this.setState( {currentAPI: JSON.parse(AppState.getCurrentAPI()).name })
    }else{
      if(this.state.currentAPI && this.props.state.currentAPI && this.state.currentAPI !== this.props.state.currentAPI){
        this.setState({currentAPI: this.props.state.currentAPI} );
      }
    }
  }


  async load(){
    try{
        this.setState( {showMenu : true});

        if(!this.state.currentMenuTab && AppState.getNavigation().currLocation){
          this.setState( {currentMenuTab : AppState.getNavigation().currLocation.replace(/\//g, '')});
        }

        const list = await PatternHandler.getPatternList();
        if (!list) return;

        // Get the configuration to check if pattern selector is enabled
        const config = this.wazuhConfig.getConfig();
        AppState.setPatternSelector(config['ip.selector']);

        // Abort if we have disabled the pattern selector
        if (!AppState.getPatternSelector()) return;

        // Show the pattern selector
        this.setState({showSelector: true });

        let filtered = false;
        // If there is no current pattern, fetch it
        if (!AppState.getCurrentPattern()) {
          AppState.setCurrentPattern(list[0].id);
        } else {
          // Check if the current pattern cookie is valid
          filtered = list.filter(item =>
            item.id.includes(AppState.getCurrentPattern())
          );
          if (!filtered.length) AppState.setCurrentPattern(list[0].id);
        }

        const data = filtered
          ? filtered
          : await this.indexPatterns.get(AppState.getCurrentPattern());
        this.setState({ theresPattern : true, currentPattern: data.title});

        // Getting the list of index patterns
        if (list) {
          this.setState({patternList: list, currentSelectedPattern: AppState.getCurrentPattern()})
        }
    }catch(error){
      //TODO handle error
      console.log(error)
    }

  }

  changePattern = (event) => {
    try{
      if (!AppState.getPatternSelector()) return;
      PatternHandler.changePattern(event.target.value);
      this.setState({currentSelectedPattern: event.target.value});
      location.reload();
    }catch(err){
      //TODO handle error
      console.log(err)
    }
  }

  buildPatternSelector(){
    return (
        <span className="small">
          <select className="wz-menu-select" value={this.state.currentSelectedPattern}
              onChange={this.changePattern} aria-label="Index pattern selector">

                {this.state.patternList.map((item) => {
                  return (
                    <option className="wz-menu-select-option"  value={item.id}>
                        {item.title}
                    </option>)  
                })}
          </select>
      </span>
    )
  }

  setMenuItem(item){
    this.setState({currentMenuTab: item})
  }

  render() {
    if(AppState.getNavigation() && AppState.getNavigation().currLocation && AppState.getNavigation().currLocation.replace(/\//g, '')!== this.state.currentMenuTab){
      this.setState({currentMenuTab: AppState.getNavigation().currLocation.replace(/\//g, '')})
    }
/*
  isHealthCheckExecuted(){
    if(!this.state.currentMenuTab){
      this.setState( {currentMenuTab : AppState.getNavigation().currLocation.replace(/\//g, '')});
    }*/
    
    if(this.state.showMenu){
      return (
        <WzReduxProvider>
        <div className="wz-menu-wrapper">
          <EuiFlexGroup className="wz-menu" responsive={false} direction="row">
              <EuiFlexItem >
                <EuiFlexGroup style={{marginLeft: "10px", marginTop: "-6px"}}>
                        
                <EuiButtonEmpty
                  className={"wz-menu-button " + (this.state.currentMenuTab === "overview" || this.state.currentMenuTab === "health-check" ? "wz-menu-active" : "")}
                  color="text"
                  href="#/overview"
                  onClick={() => this.setMenuItem('overview')} >
                    <EuiIcon type='visualizeApp' color='primary' size='m' />
                    <span className="wz-menu-button-title "> Overview</span>
                </EuiButtonEmpty>

                <EuiButtonEmpty
                  className={"wz-menu-button " + (this.state.currentMenuTab === "manager" ? "wz-menu-active" : "")}
                  color="text"
                  href="#/manager" 
                  onClick={ () => this.setMenuItem('manager')}>
                    <EuiIcon type='managementApp' color='primary' size='m' />
                    <span className="wz-menu-button-title "> Management </span>
                </EuiButtonEmpty>

                <EuiButtonEmpty 
                  className={"wz-menu-button " + (this.state.currentMenuTab === "agents-preview" || this.state.currentMenuTab === 'agents'  ? "wz-menu-active" : "")} 
                  color="text"  
                  href="#/agents-preview"
                  onClick={ () => this.setMenuItem('agents-preview')}>
                    <EuiIcon type='watchesApp' color='primary' size='m' />
                    <span className="wz-menu-button-title "> Agents</span>
                </EuiButtonEmpty>
          
                <EuiButtonEmpty 
                  className={"wz-menu-button " + (this.state.currentMenuTab === "wazuh-dev" ? "wz-menu-active" : "")} 
                  color="text"  
                  href="#/wazuh-dev"
                  onClick={ () => this.setMenuItem('wazuh-dev')}>
                    <EuiIcon type='console' color='primary' size='m' />
                    <span className="wz-menu-button-title "> Dev Tools</span>
                </EuiButtonEmpty>


                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{paddingTop: "6px", marginRight: "-4px", display: "inline"}}>
                {this.state.currentAPI && 
                (
                  <span><EuiIcon type='starFilledSpace' color="primary" size='m'></EuiIcon> {this.state.currentAPI} </span>
                )
                }
                {!this.state.currentAPI && 
                (
                  <span> No API </span>
                )
                }
                 &nbsp; &nbsp;
                {this.state.showSelector && this.state.theresPattern && this.state.patternList && this.state.patternList.length > 1 &&
                  (
                    this.buildPatternSelector()
                  )
                  }
              </EuiFlexItem>

              <EuiFlexItem grow={false} style={{ marginTop: "6px", marginRight: "1px"}}>
                <EuiButtonEmpty 
                  className={"wz-menu-button" + (this.state.currentMenuTab === "settings" ? " wz-menu-active" : "")}
                  href="#/settings"
                  color="text"  
                  aria-label="Settings"
                  onClick={ () => this.setMenuItem('settings')}>
                    <EuiIcon type='advancedSettingsApp' color='primary' size='m' />
                    <span> </span>
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
        </div>
            {this.props.state.wazuhNotReadyYet && 
            (<EuiCallOut  title={this.props.state.wazuhNotReadyYet} color="warning" style={{marginTop : "50px", marginBottom : "-50px", marginLeft: "8px", marginRight: "8px"}}>
              <EuiFlexGroup responsive={false} direction="row" style={{maxHeight: "40px", marginTop: "-45px"}}>
              
              <EuiFlexItem>
              <p></p>              
              </EuiFlexItem>  
              {this.props.state.wazuhNotReadyYet.includes("Restarting") && 
              (
                <EuiFlexItem grow={false}>
                <p>     <EuiLoadingSpinner size="l" /> &nbsp; &nbsp;</p>              
                </EuiFlexItem>  
              )
              }

              {this.props.state.wazuhNotReadyYet === "Wazuh could not be recovered." && 
              (
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty grow={false} onClick={() => location.reload()} className="WzNotReadyButton" >
                  <span> Reload </span>              
                  </EuiButtonEmpty>  
                </EuiFlexItem>  

              )
              }
              </EuiFlexGroup>
            </EuiCallOut>)
            }
        
      </WzReduxProvider>
      );
      }else{
        return (<WzReduxProvider><div> </div></WzReduxProvider>)
      }
  }
}

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
  };
};

export default connect(mapStateToProps)(WzMenu);