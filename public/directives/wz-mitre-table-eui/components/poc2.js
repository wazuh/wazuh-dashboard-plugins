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
  EuiPanel,
  EuiFacetButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiSpacer,
  EuiFieldSearch,
  EuiPopover,
  EuiListGroup,
  EuiListGroupItem,
  EuiCheckbox,
  EuiColorPicker,
  EuiButton,
  EuiButtonIcon
} from '@elastic/eui';


 export class Poc2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowingTechniques:"",
      isPopoverOpen: [],
      rounded:true,
      extra:true,
      color: '#FFFFFF',
      compacto: true,
      currentSearch: "",
      isFixedWidth:false,
      alerts: false
   };
  }

  async componentDidMount() {
    this.setState({isPopoverOpen : Array(100).fill(false), color: "#FFFFFF",extra:true, isFixedWidth: false})
    console.log(this.props)
  }

  handleChange = value => {
    this.setState({ color: value });
  };



  selectTactic(tactic){
    this.setState({isShowingTechniques : this.state.isShowingTechniques === tactic ? "" : tactic, currentSearch : ""});
  }

  getTacticsCards(){
    const orderedArray = [
      "Initial Access",
      "Execution" ,
      "Persistence",
      "Privilege Escalation",
      "Defense Evation",
      "Credential Access" ,
      "Discovery" ,
      "Lateral Movement" ,
      "Collection" ,
      "Command And Control" ,
      "Exfiltriation",
      "Impact",
      "Táctica con muchas técnicas"
    ]

    const result = orderedArray.map( (item,idx) => {
      return (
        <EuiFlexItem grow={false}>
          <EuiToolTip position="top" delay="long" content={"View " + item + " techniques"}>
            <EuiFacetButton isSelected={this.state.isShowingTechniques === item} onClick={() => this.selectTactic(item)} style={{padding: "10px", "backgroundColor": this.state.color, borderRadius: this.state.rounded ? "15px" : "0"}} quantity={this.props[item].attacks_count}>{item}</EuiFacetButton>
          </EuiToolTip>
        </EuiFlexItem>
      )
    } )

    return (<span><div style={{marginTop: "-8px", marginBottom: "12px", fontSize: "18px"}}>MITRE tactics &nbsp; &nbsp; </div> <EuiFlexGroup gutterSize={this.state.compacto ? 's' : 'm'} wrap>{result}</EuiFlexGroup></span>);
  }

  closePopover() {
    this.setState({isPopoverOpen : Array(100).fill(false)})
  }

  openPopover(id){
    let tmpArray = Array(100).fill(false);
    tmpArray[id] = true;
    this.setState({
      isPopoverOpen: tmpArray,
    });

  }

  getTechniques(){ 

    const result = this.props[this.state.isShowingTechniques].techniques.map( (item,idx) => {
      if(item.name.toLowerCase().includes(this.state.currentSearch.toLowerCase()) && (!this.state.alerts || item.attacks_count > 0))
      return (
        <EuiFlexItem grow={false}>
          <EuiPopover
              id={idx}
              ownFocus
              button={<EuiFacetButton onClick={() => this.openPopover(idx)} className={ this.state.isFixedWidth == true ? "testPoc2" : ""} style={{padding: "10px",width: this.state.isFixedWidth ? "250px !important": "", "backgroundColor": this.state.color, borderRadius: this.state.rounded ? "15px" : "0"}} quantity={item.attacks_count}>{item.name}</EuiFacetButton>}
              isOpen={this.state.isPopoverOpen[idx]}
              closePopover={() => this.closePopover()}
              anchorPosition="rightCenter">
              
              <EuiListGroup maxWidth={288}>
                <EuiListGroupItem
                  id="link1"
                  iconType="eye"
                  label="View details"
                  onClick={() => window.alert('aparecería el mismo flyout con toda la info en la parte derecha de la pantalla, se puede ver en el primer ejemplo (card slider y mitre table)')}
                  isActive
                />

                <EuiListGroupItem
                  id="link2"
                  iconType="pin"
                  onClick={() => window.alert('Se añadiria esta tecnica como filtro  a la búsqueda')}
                  label="Add filter"
                />

                <EuiListGroupItem
                  id="link3"
                  onClick={() => window.alert('Se añadaria esta técnica excluida a la búsqueda')}
                  iconType="pin"
                  label="Exclude from search"
                />
              </EuiListGroup>


            </EuiPopover>
        </EuiFlexItem>
      )
    } )

    return (<span> <div style={{marginTop: "-8px", marginBottom: "12px", fontSize: "18px"}}><EuiFlexGroup> <EuiFlexItem grow={false}>{this.props[this.state.isShowingTechniques].name} techniques</EuiFlexItem>
    <EuiFlexItem><EuiFieldSearch
      style={{height: "20px", marginTop: "-15px"}}
      placeholder="Search this"
      value={this.state.currentSearch}
      onChange={this.onChange3}
      aria-label="Use aria labels when no actual label is in use"
    /></EuiFlexItem>
    <EuiFlexItem grow={false} style={{float:"right"}}>
    <span style={{float: "right"}}>
    <EuiButtonIcon
      onClick={() => {this.setState({isShowingTechniques: ""})}}
      iconType="cross"
      aria-label="Close"
    /></span></EuiFlexItem>
    </EuiFlexGroup></div>
     <EuiFlexGroup gutterSize={this.state.compacto ? 's' : 'm'} wrap>{result}</EuiFlexGroup></span>);
  }

  onCheckChange = e => {
    this.setState({
      rounded: e.target.checked,
    });
  };
  
  onCheckChange2 = e => {
    this.setState({
      compacto: e.target.checked,
    });
  };
  onCheckChangre = e => {
    this.setState({
      alerts: e.target.checked,
    });
  };
  onCheckChangeda = e => {
    console.log(e)
    this.setState({
      isFixedWidth: e.target.checked,
    });
    console.log(this.state)
  };
  onChange3 = e => {
    this.setState({
      currentSearch: e.target.value,
    });
  };

  ocultar(){
    this.setState({extra: false})
  }

  render(){
    return (<div style={{margin: "10px"}}> 
    {this.state.extra && (<EuiFlexGroup style={{margin: "15px"}}>
    <EuiCheckbox
        id={"012"}
        label="rounded corners"
        checked={this.state.rounded}
        onChange={this.onCheckChange}
      /> &nbsp; &nbsp;
      <EuiCheckbox
          id={"0132"}
          label="Show techniques with alerts"
          checked={this.state.alerts}
          onChange={this.onCheckChangre}
        /> &nbsp; &nbsp;
      <EuiCheckbox
          id={"013299"}
          label="compacto"
          checked={this.state.compacto}
          onChange={this.onCheckChange2}
        />&nbsp; &nbsp;
        <EuiCheckbox
            id={"01232"}
            label="fixed width"
            checked={this.state.isFixedWidth}
            onChange={this.onCheckChangeda}
          />&nbsp; &nbsp;
      <EuiColorPicker
          onChange={this.handleChange}
          color={this.state.color}
        />
        <EuiButton onClick={() => this.ocultar()}>
          hide options
        </EuiButton>
        </EuiFlexGroup>)}
      <EuiPanel paddingSize="l" hasShadow >
         {this.getTacticsCards()}
      </EuiPanel>
      <EuiSpacer size="xs" />
      {this.state.isShowingTechniques && (
      <EuiPanel paddingSize="m" hasShadow>
         {this.getTechniques()}
      </EuiPanel>)}

    </div>)
  }

}