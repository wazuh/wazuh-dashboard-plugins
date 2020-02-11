/*
 * Wazuh app - React component for alerts stats.
 *
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
import {
  EuiFacetButton,
  EuiFacetGroup,
  EuiAvatar,
  EuiFieldSearch,
  EuiFlexGrid,
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiSwitch,
  EuiFlexItem,
  EuiBetaBadge,
  EuiPanel,
  EuiTitle,
} from '@elastic/eui';
import { EuiPopover } from '@elastic/eui';
import { AttkPopover } from './attk-popover-poc2';
import { Func } from 'mocha';

export class Poc22 extends Component {
  state:{
    selectedMap: {}
    filter: string
    isPopoverOpen3: boolean
    showZeroAlerts: boolean
    descending: boolean
    showIdentificator: boolean
  }

  props!: {
    mitreobject: object,
    addFilter: Function,
    addNegativeFilter: Function,
  }
  constructor(props) {
    super(props);
    this.state = {
      selectedMap: {},
      filter: '',
      isPopoverOpen3: false,
      showZeroAlerts: true,
      descending: true,
      showIdentificator: true
    };
  }

  componentWillMount() {
    const { mitreobject } = this.props;
    const selectedMap = {};
    Object.keys(mitreobject).forEach(tecn => selectedMap[tecn] = tecn === "Initial Access" ? true : false)
    this.setState({selectedMap})
  }

  renderTactics() {
    const { mitreobject } = this.props;
    const { selectedMap } = this.state;
    const tecniques = Object.keys(mitreobject)
    .filter(item => {return !this.state.showZeroAlerts || mitreobject[item].attacks_count})
    .map(tecn => {
      const isSelected = selectedMap[tecn];
      const newSelectMap = {...selectedMap, [tecn]:!isSelected };
      if(this.state.showIdentificator){    

        return (<EuiFacetButton 
          icon={<EuiAvatar size="m" name={tecn} />}
          quantity={mitreobject[tecn].attacks_count}
          isSelected={selectedMap[tecn]}
          onClick={() => this.setState({selectedMap:newSelectMap})} >
            {tecn}
        </EuiFacetButton>)

      }else{
        return (<EuiFacetButton 
          quantity={mitreobject[tecn].attacks_count}
          isSelected={selectedMap[tecn]}
          onClick={() => this.setState({selectedMap:newSelectMap})} >
            {tecn}
        </EuiFacetButton>)
        
      }
      }
    )
    return (
      <EuiFacetGroup> 
        {tecniques}
      </EuiFacetGroup>
    )
  }

  renderTechniques() {
    const { mitreobject } = this.props;
    const { selectedMap, filter } = this.state;
    const selectedTact = Object.keys(selectedMap).filter(tact => selectedMap[tact]);

    const allTechniques = selectedTact
    .map(tact => {
      const techniques = mitreobject[tact].techniques
      .filter(tecn => {return !this.state.showZeroAlerts || tecn.attacks_count})
      .map(tecn => {
        console.log(tact)
        if(this.state.showIdentificator){
          return (
            <AttkPopover 
              attacksCount={tecn.attacks_count}
              name={tecn.name}
              id={tecn.id}
              badge={tact}
              addFilter={(id) => this.props.addFilter(id)}
              addNegativeFilter={(id) => this.props.addNegativeFilter(id)} />
          )

        }else{
          return (
            <AttkPopover 
              attacksCount={tecn.attacks_count}
              name={tecn.name}
              id={tecn.id}
              badge=""
              addFilter={(id) => this.props.addFilter(id)}
              addNegativeFilter={(id) => this.props.addNegativeFilter(id)} />
          )

        }
      })
      return techniques;
    })
    const joinTechniques = [].concat(...allTechniques);
    const filterTechniques = joinTechniques.filter(item => item.props.name.toLocaleLowerCase().includes(filter))
    let sortTechniques = [];
    if(this.state.descending)
      sortTechniques =  filterTechniques.sort((a,b) => b.props.attacksCount - a.props.attacksCount)
    else{
      sortTechniques =  filterTechniques.sort((a,b) => a.props.attacksCount - b.props.attacksCount)
    }
    
    return (
      <EuiFacetGroup layout="horizontal"> 
        {sortTechniques}
      </EuiFacetGroup>
    )
  }
  onButtonClick3() {
    this.setState({
      isPopoverOpen3: !this.state.isPopoverOpen3,
    });
  }

  closePopover3() {
    this.setState({
      isPopoverOpen3: false,
    });
  }


  oncheck1Change = e => {
    this.setState({
      showZeroAlerts: e.target.checked,
    });
  };
  oncheck2Change = e => {
    this.setState({
      descending: e.target.checked,
    });
  };
  oncheck3Change = e => {
    this.setState({
      showIdentificator: e.target.checked,
    });
  };

  render() {
    return (
      <EuiPanel style={{margin:16}}>
        <EuiFlexGroup>
          <EuiFlexItem 
            grow={false}
            style={{background: '#f4f5f8', margin: '-4px', padding: '16px', width: '17%', minWidth:250}} >
              <EuiFlexGroup style={{margin: 2, maxHeight: 40}}>
                <EuiFlexItem style={{margin: 0}}>
                <EuiTitle><h1>Tactics</h1></EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}  style={{margin: 0}}>
                  <EuiPopover
                    id="downRight"
                    ownFocus
                    button={
                      <EuiButtonIcon
                        iconType="gear"
                        onClick={this.onButtonClick3.bind(this)}>
                        </EuiButtonIcon>
                    }
                    isOpen={this.state.isPopoverOpen3}
                    closePopover={this.closePopover3.bind(this)}
                    anchorPosition="downLeft">
                      <EuiFlexItem
                      style={{marginBottom: 5}}>

                      <EuiSwitch
                      style={{marginBottom: 5}}
                        label="Hide alerts without alerts"
                        checked={this.state.showZeroAlerts}
                        onChange={this.oncheck1Change}
                      />
                      </EuiFlexItem>

                      <EuiFlexItem
                      style={{marginBottom: 5}}>

                        <EuiSwitch
                      style={{marginBottom: 5}}
                          label="Descending order"
                          checked={this.state.descending}
                          onChange={this.oncheck2Change}
                        />
                      </EuiFlexItem>


                      <EuiFlexItem
                      style={{marginBottom: 5}}>

                      <EuiSwitch
                      style={{marginBottom: 5}}
                        label="Show tactic badge identificator"
                        checked={this.state.showIdentificator}
                        onChange={this.oncheck3Change}
                      />
                      </EuiFlexItem>



                  </EuiPopover>
                </EuiFlexItem>
           

              </EuiFlexGroup>
            {this.renderTactics()}
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup style={{maxHeight: 75}}>
              <EuiFlexItem grow={false}>
                <EuiTitle ><h1 style={{marginLeft: 20 }}>Techniques</h1></EuiTitle>                
              </EuiFlexItem>
              <EuiFlexItem style={{marginLeft: 0}}>
                <div>
                  <EuiFieldSearch
                    fullWidth={true}
                    onChange={(input) => this.setState({filter: input.target.value.toLocaleLowerCase()})}  /> 
                </div>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGrid style={{margin: '0px -22px -16px 15px', overflow:'hidden', overflowY: 'scroll', maxHeight:486}}>
            {this.renderTechniques()}
            </EuiFlexGrid>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}
