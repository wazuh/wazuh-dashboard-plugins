/*
* Wazuh app - React component for show a module guide.
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/
import React, { Component, Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";

import {
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiIcon,
  EuiSpacer,
  EuiPanel,
  EuiSteps,
  EuiFieldText,
  EuiFieldNumber,
  EuiSwitch,
  EuiSelect,
  EuiButton,
  EuiButtonEmpty,
  EuiToolTip,
  EuiButtonToggle,
  EuiCheckbox,
  EuiCodeBlock,
  EuiLink,
  EuiButtonIcon,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiImage,
  EuiCallOut,
  EuiButtonGroup,
  EuiTabs,
  EuiTab,
  EuiCode,
  EuiBadge,
  EuiAccordion,
  EuiBottomBar,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter
} from "@elastic/eui";

import moduleGuides from './guides';
import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from '../../controllers/management/components/management/configuration/utils/xml-beautifier';
import { toastNotifications } from 'ui/notify';
import withLoading from "../../controllers/management/components/management/configuration/util-hocs/loading";
import { clusterReq, clusterNodes, fetchFile , saveFileManager, saveFileCluster, restartNodeSelected } from '../../controllers/management/components/management/configuration/utils/wz-fetch';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import { updateWazuhNotReadyYet } from '../../redux/actions/appStateActions';
import $ from 'jquery';

const js2xmlOptionsParser = {
  format: {
    doubleQuotes: true
  }
};

const capitalize = (str) => str[0].toUpperCase() + str.slice(1);

const configurationTypes = [
  {
    id: 'manager',
    label: 'Manager'
  },
  {
    id: 'agent',
    label: 'Agent'
  },
  {
    id: 'centralized',
    label: 'Centralized'
  }
];

const agentOsTabs = [
  {
    id: 'linux',
    name: 'Linux'
  },
  {
    id: 'windows',
    name: 'Windows'
  }
];

const agentTypeSelector = [
  {
    id: 'registered',
    label: 'Registered'
  },
  {
    id: 'custom',
    label: 'Custom'
  }
];

const agentOSSelector = [
  {
    id: 'linux',
    label: 'Linux'
  },
  {
    id: 'windows',
    label: 'Windows'
  }
];

const renderOSIcon = (os) => <i className={`fa fa-${os} AgentsTable__soBadge AgentsTable__soBadge--${os}`} aria-hidden="true"/>;

const WzModuleGuideNodeSelector = withLoading(
  async (props) => {
    try{
      const clusterStatus = await clusterReq();
      if(clusterStatus.data.data.enabled === 'yes' && clusterStatus.data.data.running === 'yes'){
        const nodesResponse = await clusterNodes();
        props.updateClusterNodes(nodesResponse.data.data.items);
        props.clusterNodeSelect(nodesResponse.data.data.items[0].name);
        return { isCluster: true, nodes: nodesResponse.data.data.items };
      }else{
        return { isCluster: false };
      }
    }catch(error){
      return {};
    }
  },
  (props, prevProps) => props.agentTypeSelected === 'manager' && prevProps.agentTypeSelected !== 'manager'
)((props) => (
  <Fragment>
    <EuiFlexGroup>
      {props.isCluster && props.nodes && props.nodes.length > 0 && (
        <EuiFlexItem grow={false}>
          <EuiText>Cluster mode is enabled. Choose a node:</EuiText>
          <EuiSpacer size='s'/>
          <EuiSelect
            id='selectClusterNodeConfigurationModuleGuide'
            options={props.nodes.map(node => ({
              value: node.name,
              text: `${node.name} (${node.type})`
            }))}
            value={props.clusterNodeSelected}
            onChange={(e) => props.clusterNodeSelect(e.target.value)}
            aria-label='Select Cluster node'
            fullWidth={true}
          />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
    <EuiSpacer />
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <EuiText>Current configuration</EuiText>
        <EuiSpacer size='s'/>
        <WzButtonAsync disablewhileloading onClick={props.setStepsGuideLoadedConfiguration}>Load configuration</WzButtonAsync>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
          <EuiText>From scratch</EuiText>
          <EuiSpacer size='s'/>
          <EuiButton onClick={props.setStepsGuideFromScratch}>New</EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  </Fragment>
));

const WzModuleGuideAgentSelector = props => {
  const [typeSelection, setTypeSelection] = useState(agentTypeSelector[0].id);
  const onChange = (value) => {
    props.cleanStepsGuide();
    setTypeSelection(value);
  }
  return (
    <Fragment>
      <EuiText>Agent type</EuiText>
      <EuiSpacer size='s'/>
      <EuiButtonGroup
        color='primary'
        options={agentTypeSelector}
        idSelected={typeSelection}
        onChange={onChange}
      />
      <EuiSpacer size='s'/>
      {typeSelection === agentTypeSelector[0].id ? (
        null
      ) : typeSelection === agentTypeSelector[1].id ? (
        <WzModuleGuideAgentSelectorCustom {...props}/>
      ) : null}
    </Fragment>
  )
}

const WzModuleGuideAgentSelectorCustom = props => {
  return (
    <Fragment>
      <EuiText>Operating system</EuiText>
      <EuiSpacer size='s'/>
      <EuiButtonGroup
        color='primary'
        options={agentOSSelector}
        idSelected={props.agentOSSelected}
        onChange={props.setAgentOSSelected}
      />
      <EuiSpacer size='s'/>
      <EuiButton onClick={props.setStepsGuideFromScratch}>
        Apply
      </EuiButton>
    </Fragment>
  )
}

const WzModuleGuideCentralizedSelector = withLoading(
  async props => {
    try{
      const groupsResponse = await WzRequest.apiReq('GET', '/agents/groups', {limit: 1000});
      const groups = (((groupsResponse || {}).data || {}).data || {}).items || [];
      groups.length > 0 && props.setGroupSelected(groups[0].name)
      return { groups }
    }catch(error){
      return {}
    }
  }

)(props => {
  return (
    <Fragment>
      {props.groups && props.groups.length > 0 && (
        <EuiFlexItem grow={false}>
          <EuiText>Choose a group:</EuiText>
          <EuiSpacer size='s'/>
          <EuiSelect
            id='selectGroupConfigurationModuleGuide'
            options={props.groups.map(group => ({
              value: group.name,
              text: group.name
            }))}
            value={props.groupSelected}
            onChange={(e) => props.setGroupSelected(e.target.value)}
            aria-label='Select group'
            // fullWidth={true}
          />
        </EuiFlexItem>
      )}
      <EuiSpacer />
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiText>Current configuration</EuiText>
          <EuiSpacer size='s'/>
          <WzButtonAsync disablewhileloading onClick={props.setStepsGuideLoadedConfiguration}>Load configuration</WzButtonAsync>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
            <EuiText>From scratch</EuiText>
            <EuiSpacer size='s'/>
            <EuiButton onClick={props.setStepsGuideFromScratch}>New</EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  )
})

const WzCalloutActionModuleGuide = ({ name='' , action}) => (
  <EuiCallOut>
    <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
      <EuiFlexItem style={{ marginTop: '0', marginBottom: '0'}}>
        <EuiText style={{color: 'rgb(0, 107, 180)'}} >
          <EuiIcon type='iInCircle' color='primary' style={{marginBottom: '7px', marginRight: '6px'}}/>
          <span>{name} configuration changes will not take effect until a restart is performed.</span>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ marginTop: '0', marginBottom: '0'}}>
        <EuiButton
          iconType="refresh"
          onClick={action}
        >
          Restart
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiCallOut>
)

const WzButtonScroll = ({scrollTo = 'bottom', side = 'right', top = 40, bottom = 40, sideDistance = 40}) => {
  const onClick = () => window.scrollTo(0, scrollTo === 'bottom' ? document.body.scrollHeight : 0 );
  return (
    <EuiButtonIcon
      color='primary'
      iconType={scrollTo === 'bottom' ? 'arrowDown' : 'arrowUp'}
      aria-label='Scroll to'
      onClick={onClick}
      style={{position: 'fixed', ...(side === 'right' ? {right: sideDistance} : { left: sideDistance}), ...(scrollTo === 'bottom' ? {top} : {bottom})}}
    />
  )
};

const WzScroll = ({margin = 0, padding = {top: 0, bottom: 0}}) => {
  const windowScroll = useWindowScroll();
  const body = document.body,
  html = document.documentElement;

  const documentHeight = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
  if(window.innerHeight === documentHeight){
    return null
  }
  if(windowScroll.y + window.innerHeight + margin >= documentHeight){
    return <WzButtonScroll scrollTo='top' top={70}/>
  }else if(windowScroll.y - margin <= 0){
    return <WzButtonScroll scrollTo='bottom' top={70}/>
  }
  return null
}

const useWindowScroll = () => {
  const isClient = typeof window === 'object';

  function getScroll() {
    return {
      x: isClient ? window.scrollX : undefined,
      y: isClient ? window.scrollY : undefined
    };
  }

  const [windowScroll, setWindowScroll] = useState(getScroll());

  useEffect(() => {
    if (!isClient) {
      return false;
    }
    
    function handleScroll() {
      setWindowScroll(getScroll());
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowScroll;
}

const WzButtonAsync = ({button, disablewhileloading, onClick, onClickStart, onClickEnd, onClickSuccess, onClickError, children, ...buttonProps}) => {
  const [isLoading, setIsLoading] = useState(false);
  const Button = button || EuiButton;
  const executeOnClick = onClick ? async () => {
    setIsLoading(true);
    onClickStart && onClickStart(true);
    try{
      await onClick();
      onClickSuccess && onClickSuccess(true);
    }catch(error){
      onClickError && onClickError();
    }
    setIsLoading(false);
    onClickEnd && onClickEnd(false);
  } : undefined;
  return <Button {...buttonProps} onClick={executeOnClick} isLoading={isLoading} isDisabled={disablewhileloading && isLoading}>{children}</Button>
}
class WzModuleGuide extends Component {
  constructor(props) {
    super(props);
    this.guide = Object.keys(moduleGuides).map(key => moduleGuides[key]).find(guide => guide.id === props.guideId);
    this.specificGuide = Boolean(this.props.agent);
    this.state = {
      modalRestartIsVisble: false,
      agentTypeSelected: (this.props.agent && ((this.props.agent.id === '000' ? 'manager' : 'agent') || this.props.agent.type)) || (this.guide.avaliable_for_manager ? 'manager' : 'agent'),
      agentOSSelected: this.props.agent && (typeof this.props.agent.os === 'string' ? this.props.agent.os : (this.props.agent.os && this.props.agent.os.platform === 'windows' ? 'windows' : 'linux')) || '',
      clusterNodes: false, //TODO: remove of this state?
      clusterNodeSelected: false,
      groupSelected: false,
      applyChanges: false,
      showConfig: false,
      actions: []
    };
    this.state.steps = [];
  }
  componentDidMount(){
    window.scrollTo(0, 0);
    this._isMounted = true;
  }
  componentWillUnmount(){
    this._isMounted = false;
    this.manageToastsPosition('default');
  }
  async componentDidUpdate(prevProps, prevState){
    if(prevState.clusterNodeSelected !== this.state.clusterNodeSelected || prevState.agentTypeSelected !== this.state.agentTypeSelected || prevState.agentOSSelected !== this.state.agentOSSelected || prevState.groupSelected !== this.state.groupSelected){
      this.cleanStepsGuide();
    }
    if(this.state.steps.length > 0){
      this.manageToastsPosition('move');
    }else if(this.state.steps.length === 0){
      this.manageToastsPosition('default');
    }
  }
  manageToastsPosition(action){
    if (action === 'move'){
      $('.euiGlobalToastList').addClass('euiGlobalToastListWzModuleGuides');
    }else{
      $('.euiGlobalToastList').removeClass('euiGlobalToastListWzModuleGuides');
    }
  }
  setStepsGuideLoadedConfiguration = async () => {
    this.setState({ steps: []});
    try{

    }catch(error){

    }
    if(this.state.agentTypeSelected === 'manager'){
      if(this.state.clusterNodeSelected){
        try{
          // const configuration = fetchFile(this.state.clusterNodeSelected);
          const moduleConfigResponse = await WzRequest.apiReq('GET', `/cluster/${this.state.clusterNodeSelected}/config/${this.guide.api_component}/${this.guide.api_configuration}`, {});
          let moduleConfiguration = moduleConfigResponse.data.data;
          if(this.guide.api_module){
            moduleConfiguration = moduleConfiguration[this.guide.api_module]
          };
          this.setState({ steps: this.buildInitialSteps(this.guide.steps, this.mapAPIConfigurationToStepsGuide(moduleConfiguration)) });
          this.addToastLoadConfiguration(moduleConfiguration, this.state.clusterNodeSelected);
        }catch(error){
          this.addToast({
            title: 'Load configuration  error',
            text: typeof error === 'string' ? error : error.message,
            color: 'danger'
          })
        }
      }else{
        try{
          // const configuration = fetchFile(this.state.clusterNodeSelected);
          const moduleConfigResponse = await WzRequest.apiReq('GET', `/manager/config/${this.guide.api_component}/${this.guide.api_configuration}`, {});
          let moduleConfiguration = moduleConfigResponse.data.data;
          if(this.guide.api_module){
            moduleConfiguration = moduleConfiguration[this.guide.api_module]
          };
          this.setState({ steps: this.buildInitialSteps(this.guide.steps, this.mapAPIConfigurationToStepsGuide(moduleConfiguration)) });
          this.addToastLoadConfiguration(moduleConfiguration, 'Manager');
        }catch(error){
          this.addToast({
            title: 'Load configuration error',
            text: typeof error === 'string' ? error : error.message,
            color: 'danger'
          })
        }
      }
    }else if (this.state.agentTypeSelected === 'agent'){

    }else if (this.state.agentTypeSelected === 'centralized'){
      try{
        const moduleConfigResponse = await WzRequest.apiReq('GET', `/agents/groups/${this.state.groupSelected}/files/agent.conf`, {});
        let moduleConfiguration = moduleConfigResponse.data.data.items[0].config;
        if(this.guide.api_module){
          moduleConfiguration = moduleConfiguration[this.guide.api_module]
        };
        this.setState({ steps: this.buildInitialSteps(this.guide.steps, this.mapAPIGroupsConfigurationToStepsGuide(moduleConfiguration)) });
        this.addToastLoadConfiguration(moduleConfiguration, `${this.state.groupSelected} group`);
      }catch(error){
        this.addToast({
          title: 'Load configuration  error',
          text: typeof error === 'string' ? error : error.message,
          color: 'danger'
        })
      }
    }
  }
  setStepsGuideFromScratch = () => {
    this.setState({ steps: this.buildInitialSteps(this.guide.steps) });
    this.addToast({
      title: 'Configuration from scratch',
      color: 'success'
    })
  }
  addToastLoadConfiguration(moduleConfiguration, name){
    if(typeof moduleConfiguration === 'undefined'){
      this.addToast({
        title: 'Load configuration',
        text: `${name} doesn't have configuration for this module. Guide was loaded with default values.`,
        color: 'warning'
      });
    }else{
      this.addToast({
        title: 'Load configuration',
        text: `${name} configuration was loaded.`,
        color: 'success'
      });
    }
  }
  setGroupSelected = (groupSelected) => {
    this.setState( { groupSelected });
  }
  cleanStepsGuide = () => {
    this.setState({ steps: [] });
  }
  updateClusterNodes = clusterNodes => {
    this.setState({ clusterNodes });
  }
  clusterNodeSelect = (clusterNodeSelected) => {
    this.setState({ clusterNodeSelected });
  }
  setElementProp(keyID, prop, value) {
    let obj = this.getSettingbyKeyID(keyID);
    obj[prop] = value;
    this.setState({ steps: this.state.steps });
  }
  getSettingbyKeyID(keyID, last = false) {
    let obj = this.state.steps;
    for (let i = 0, length = keyID.length; i < length; i++) {
      obj = last && ((i + 1) === length) ? obj : obj[keyID[i]];
    }
    return obj;
  }
  buildManagerSelectorStep(){
    return {
      title: 'Select the manager',
      children: (
        <WzModuleGuideNodeSelector
          {...this.props}
          updateClusterNodes={this.updateClusterNodes}
          clusterNodeSelect={this.clusterNodeSelect}
          agentTypeSelected={this.state.agentTypeSelected}
          setStepsGuideLoadedConfiguration={this.setStepsGuideLoadedConfiguration}
          setStepsGuideFromScratch={this.setStepsGuideFromScratch}
        />
      )
    }
  }
  buildAgentSelectorStep(){
    return {
      title: 'Select the agent',
      children: (
        <WzModuleGuideAgentSelector
          {...this.props}
          updateClusterNodes={this.updateClusterNodes}
          clusterNodeSelect={this.clusterNodeSelect}
          agentTypeSelected={this.state.agentTypeSelected}
          setStepsGuideLoadedConfiguration={this.setStepsGuideLoadedConfiguration}
          setStepsGuideFromScratch={this.setStepsGuideFromScratch}
          agentOSSelected={this.state.agentOSSelected}
          setAgentOSSelected={this.setAgentOSSelected}
          cleanStepsGuide={this.cleanStepsGuide}
        />
      )
    }
  }
  buildCentralizedSelectorStep(){
    return {
      title: 'Select the group',
      children: (
        <WzModuleGuideCentralizedSelector
          {...this.props}
          agentTypeSelected={this.state.agentTypeSelected}
          agentOSSelected={this.state.agentOSSelected}
          groupSelected={this.state.groupSelected}
          updateClusterNodes={this.updateClusterNodes}
          clusterNodeSelect={this.clusterNodeSelect}
          setGroupSelected={this.setGroupSelected}
          setStepsGuideLoadedConfiguration={this.setStepsGuideLoadedConfiguration}
          setStepsGuideFromScratch={this.setStepsGuideFromScratch}
          setAgentOSSelected={this.setAgentOSSelected}
        />
      )
    }
  }
  // buildInitialSteps(steps) {
  //   return [...steps.map(step => ({ ...step, elements: step.elements && step.elements.filter((element) => this.filterElementByAgent(element)).map((element) => this.buildConfigurationElement(element)) || [] }))].filter((step) => step.elements && step.elements.length);
  // }
  buildInitialSteps(steps, config = {}) {
    return [...steps.map(step => ({ ...step, elements: step.elements && step.elements.filter((element) => this.filterElementByAgent(element)).map((element) => this.buildConfigurationElement(element, config[element.name])) || [] }))].filter((step) => step.elements && step.elements.length);
  }
  buildConfigurationElementValue(option, config) {
    const defaultValue = typeof config !== 'undefined' && typeof config !== 'object' ? config 
      : option.default_value_linux !== undefined && this.state.agentOSSelected === 'linux' ? option.default_value_linux
      : option.default_value_windows !== undefined && this.state.agentOSSelected === 'windows' ? option.default_value_windows
      : option.default_value
    switch (option.type) {
      case 'input':{
        return defaultValue || '';
      }
      case 'input-number':
        return defaultValue !== undefined ? defaultValue : 0;
      case 'switch':
        return (typeof defaultValue === 'string' ? ({ yes: true, no: false })[defaultValue] : defaultValue) || false;
      case 'select':
        return defaultValue !== undefined ? defaultValue : option.values[0].value;
      default:
        return undefined;
    }
  }
  buildConfigurationElementToggleable(option){
    return option.required ? false : option.toggleable !== undefined ? option.toggleable : true;
  }
  buildConfigurationElementEnabled(option, config){
    return option.required || typeof config !== 'undefined' ? true : option.enabled !== undefined ? option.enabled : false;
  }
  filterElementByAgent(element){
    if(element.agent_os && element.agent_type){
      return this.state.agentOSSelected !== '' ? element.agent_os === this.state.agentOSSelected && element.agent_type === this.state.agentTypeSelected : true;
    }else if(element.agent_os){
      return this.state.agentOSSelected !== '' ? element.agent_os === this.state.agentOSSelected : true;
    }else if(element.agent_type){
      return element.agent_type === this.state.agentTypeSelected;
    }
    return true
  }
  resetGuideWithNotification = () => {
    this.resetGuide(true);
    this.addToast({
      title: 'The guide was restarted',
      color: 'success'
    });
  }
  resetGuide(){
    this.setState({
      steps: this.buildInitialSteps(this.guide.steps),
      modalRestartIsVisble: false
    });
  }
  addToast({color, title, text, time = 3000}){
    toastNotifications.add({title, text, toastLifeTimeMs: time, color})
  }
  transformStateElementToJSON(element, accum){
    if (!element.enabled && !element.elements) { return accum}
    if (element.repeatable) {
      if (!accum[element.name]) {
        accum[element.name] = []
      }
    }
    if (element.elements && element.elements.length) {
      element.elements.forEach((el) => {
        this.transformStateElementToJSON(el, accum);
      });
      return accum;
    }else if(element.elements && !element.elements.length){
      return accum;
    }
    const obj = {
      '#': this.getConfigurationValueFromForm(element)
    }
    if(obj['#'] === undefined){
      delete obj['#'];
    }
    if (element.attributes && element.attributes.length) {
      obj['@'] = element.attributes.filter(attribute => attribute.enabled).reduce((accumAttribute, attribute) => ({
        ...accumAttribute,
        [attribute.name]: this.getConfigurationValueFromForm(attribute)
      }), {})
    }
    if (element.options && element.options.length) {
      element.options.filter(option => option.enabled || (option.repeatable && option.elements && option.elements.length)).forEach((option) => {
        if(option.elements){
          option.elements.forEach(optionRepeatable => {
            this.transformStateElementToJSON(optionRepeatable, obj)
          });
        }else{
          obj[option.name] = this.getConfigurationValueFromForm(option);
        }
      })
    }
    if (element.repeatable) {
      accum[element.name].push(obj);
    } else {
      accum[element.name] = obj;
    }
    return accum
  }
  transformStateToJSON() {
    return {
      ...this.state.steps.reduce((accum, step) => {
        return {
          ...accum, ...step.elements.reduce((accumStep, element) => {
            return this.transformStateElementToJSON(element, accumStep);
          }, {})
        }
      }, {})
    }
  }
  transformToXML() {
    const json = this.transformStateToJSON();
    return (this.guide.wodle_name) ? 
    XMLBeautifier(js2xmlparser.parse('configuration', { wodle: {'@': {name: this.guide.wodle_name}, ...json}}, js2xmlOptionsParser).replace("<?xml version=\"1.0\"?>\n", "").replace("<configuration>\n", "").replace("</configuration>","").replace("    <wodle", "<wodle"))
    : XMLBeautifier(js2xmlparser.parse(this.guide.xml_tag || this.guide.id, json, js2xmlOptionsParser).replace("<?xml version=\"1.0\"?>\n", ""));
  }
  buildConfigurationElement(element, config, params = {}) {
    return {
      ...element,
      value: this.buildConfigurationElementValue(element, typeof config === 'object' ? config['#'] : config),
      toggleable: this.buildConfigurationElementToggleable(element),
      enabled: this.buildConfigurationElementEnabled(element, config),
      collapsible: (element.attributes || element.options) ? true : false,
      collapsed: (element.attributes || element.options) ? false : undefined,
      elements: !params.ignore_repeatable && element.repeatable ? (
        config && config.length > 0 ? config.map(e => this.buildConfigurationElement({...element }, e, {ignore_repeatable: true}))
        : element.repeatable_insert_first ? [this.buildConfigurationElement({...element, ...element.repeatable_insert_first_properties }, config && config[element.name], {ignore_repeatable: true})]
        : []
      ) : undefined,
      show_options: element.show_options || false,
      options: element.options && element.options.filter((option) => this.filterElementByAgent(option)).map(option => ({ 
        ...option, 
        value: this.buildConfigurationElementValue(option, config && config[option.name]),
        toggleable: this.buildConfigurationElementToggleable(option),
        enabled: this.buildConfigurationElementEnabled(option, config && config[option.name]),
        // elements: option.repeatable ? (option.repeatable_insert_first ? [this.buildConfigurationElement({...option, ...option.repeatable_insert_first_properties}, config[option.name], {ignore_repeatable: true})] : []) : undefined,
        elements: option.repeatable ? (
          config && config[option.name] && config[option.name].length > 0 ? config.map(e => this.buildConfigurationElement({...option }, e, {ignore_repeatable: true}))
          : option.repeatable_insert_first ? [this.buildConfigurationElement({...option, ...option.repeatable_insert_first_properties }, config[option.name], {ignore_repeatable: true})]
          : []
        ) : undefined,
        attributes: option.attributes && option.attributes.length ? option.attributes.map((optionAtribute) => this.buildConfigurationElement(optionAtribute, config[option.name][optionAtribute.name])) : undefined
      })) || undefined,
      show_attributes: element.show_attributes || false,
      attributes: element.attributes && element.attributes.filter((attribute) => this.filterElementByAgent(attribute)).map(attribute => ({ 
        ...attribute,
        value: this.buildConfigurationElementValue(attribute, config && config['@'] && typeof config['@'][attribute.name] !== 'undefined' ? config['@'][attribute.name] : undefined),
        toggleable: this.buildConfigurationElementToggleable(attribute),
        enabled: this.buildConfigurationElementEnabled(attribute, config && config['@'] && typeof config['@'][attribute.name] !== 'undefined' ? config['@'][attribute.name] : undefined)
      })) || undefined
    }
  }
  mapAPIConfigurationToStepsGuide(config){
    if(this.guide.id === 'fim'){
      return {
        ...config,
        ...(config.synchronization ? {
          synchronization: {
            ...config.synchronization,
            ...(typeof config.synchronization.max_interval !== undefined ? {max_interval: `${config.synchronization.max_interval}s`} : {}),
            ...(typeof config.synchronization.interval !== undefined ? {interval: `${config.synchronization.interval}s`} : {}),
          }
        } : {}),
        ...(config.directories ? {
          directories: config.directories.map(directory => {
            const mapped = {
              '#': directory.dir,
              ...(directory.opts ? {'@': directory.opts.reduce((accum, opt) => {
                accum[opt] = true;
                return accum
              }, {})} : {})
            }
            return mapped
          })
        } : {}),
        ...(config.ignore || config.ignore_sregex ? {
          ignore: [
            ...(config.ignore ? config.ignore.map(ignore => ({
                '#': ignore
            })): []),
            ...(config.ignore_sregex ? config.ignore_sregex.map(ignore => ({
              '#': ignore,
              '@': {
                type: 'sregex'
              }
            })): [])
          ]
        } : {})
      }
    }
    return config
  }
  mapAPIGroupsConfigurationToStepsGuide(config){
    if(typeof config === 'undefined'){
      return undefined
    }
    if(this.guide.id === 'fim'){
      return {
        ...config,
        ...(config.synchronization ? {
          synchronization: {
            ...config.synchronization,
            ...(typeof config.synchronization.max_interval !== undefined ? {max_interval: `${config.synchronization.max_interval}s`} : {}),
            ...(typeof config.synchronization.interval !== undefined ? {interval: `${config.synchronization.interval}s`} : {}),
          }
        } : {}),
        ...(config.directories ? {
          directories: config.directories.map(directory => {
            const mapped = {
              '#': directory.path,
              ...(Object.keys(directory).length > 1 ? {'@': Object.keys(directory).filter(key => key !== 'path').reduce((accum, opt) => {
                accum[opt] = ({yes: true, no: false})[directory[opt]];
                return accum
              }, {})} : {})
            }
            return mapped
          })
        } : {}),
        ...(config.ignore || config.ignore_sregex ? {
          ignore: [
            ...(config.ignore ? config.ignore.map(ignore => ({
                '#': ignore
            })): []),
            ...(config.ignore_sregex ? config.ignore_sregex.map(ignore => ({
              '#': ignore,
              '@': {
                type: 'sregex'
              }
            })): [])
          ]
        } : {})
      }
    }
    return config
  }
  async updateConfiguration(text) {
    try {
      this.setState({ isApplyingChanges: true });
      if(this.state.agentTypeSelected === 'manager'){
        this.state.clusterNodeSelected
          ? await saveFileCluster(
              text,
              this.state.clusterNodeSelected
            )
          : await saveFileManager(text);
        this.addToast({
          title: (
            <Fragment>
              <EuiIcon type="check" />
              &nbsp;
              <span>
                <b>{this.state.clusterNodeSelected || 'Manager'}</b> configuration
                has been updated. Changes will not take effect until a restart is performed.
              </span>
            </Fragment>
          ),
          color: 'success'
        });
      }else if(this.state.agentTypeSelected === 'centralized'){
        await WzRequest.apiReq(
          'POST',
          `/agents/groups/${this.state.groupSelected}/files/agent.conf`,
          {
            content: text,
            origin: 'xmleditor'
          }
        )
        this.addToast({
          title: (
            <Fragment>
              <EuiIcon type="check" />
              &nbsp;
              <span>
                <b>{this.state.groupSelected}</b> group configuration
                has been updated
              </span>
            </Fragment>
          ),
          color: 'success'
        });
      }
    } catch (error) {
      if (error.details) {
        this.addToast({
          title: (
            <Fragment>
              <EuiIcon type="alert" />
              &nbsp;
              <span>
                File {this.state.agentTypeSelected === 'manager' ? 'ossec.conf' : 'agent.conf'} saved, but there were found several error while
                validating the configuration.
              </span>
            </Fragment>
          ),
          color: 'warning',
          text: error.details
        });
      } else {
        this.addToast({
          title: (
            <Fragment>
              <EuiIcon type="alert" />
              &nbsp;
              <span>Error saving configuration</span>
            </Fragment>
          ),
          color: 'danger',
          text: typeof error === 'string' ? error : error.message
        });
      }
      this.setState({ isApplyingChanges: false });
    }
  }
  addElementToStep(keyID, element, params){
    const obj = this.getSettingbyKeyID(keyID);
    obj.push(this.buildConfigurationElement(element, undefined, params));
    this.setState({ steps: this.state.steps });
  }
  removeElementOfStep(keyID) {
    const obj = this.getSettingbyKeyID(keyID, true);
    obj.splice(keyID[keyID.length - 1], 1);
    this.setState({ steps: this.state.steps });
  }
  renderSteps() {
    const xmlConfig = this.transformToXML();

    const configurationSteps = this.state.steps.map((step, key) => ({
      title: step.title || '',
      children: (
        <Fragment>
          {step.description && (
            <Fragment>
              <EuiText color='subdued'>{step.description}</EuiText>
              <EuiSpacer size='s' />
            </Fragment>
          )}
          {step.elements && step.elements.length ? (
            <Fragment>
              {step.elements.map((guideOption, keyOption) => (
                <Fragment key={`${guideOption.name}-${keyOption}`}>
                  {this.renderOption(guideOption, [key, 'elements', keyOption])}
                  <EuiSpacer size='s' />
                </Fragment>
              ))}
            </Fragment>
          ) : null}
        </Fragment>
      ),
      status: this.checkInvalidElements(step.elements) ? 'danger' : 'complete'
    }));
    const invalidConfiguration = configurationSteps.reduce((accum, step) => accum || step.status === 'danger', false);

    const actionRestartManager = this.state.actions.find(action => action.type === 'manager' && action.name === this.state.clusterNodeSelected);
    const guideSteps = [
      ...(this.state.agentTypeSelected === 'manager' ? [this.buildManagerSelectorStep()] : []),
      ...(this.state.agentTypeSelected === 'agent' ? [this.buildAgentSelectorStep()] : []),
      ...(this.state.agentTypeSelected === 'centralized' ? [this.buildCentralizedSelectorStep()] : []),
      ...(configurationSteps.length > 0 ? configurationSteps : []),
      // ...(configurationSteps.length > 0 ? [{
      //   title: !invalidConfiguration ? `Edit ${['manager', 'agent'].includes(this.state.agentTypeSelected) ? 'ossec.conf' : 'agent.conf'}` : 'Configuration error',
      //   children: (
      //     <Fragment>
      //       {!invalidConfiguration ? (
      //         <Fragment>
      //           {this.state.agentTypeSelected === 'manager' && actionRestartManager && (
      //             <Fragment>
      //               <WzCalloutActionModuleGuide name={actionRestartManager.name} action={() => this.openRestartAgentManagerModal(actionRestartManager)}/>
      //               <EuiSpacer />
      //             </Fragment>
      //           )}
      //           <EuiFlexGroup>
      //             <EuiFlexItem>
      //               <EuiAccordion
      //                 id="result-configuration"
      //                 arrowDisplay="right"
      //                 buttonContent="Module configuration"
      //                 paddingSize="s">
      //                   <EuiSpacer />
      //                   <EuiCodeBlock
      //                     language="xml"
      //                     color="dark"
      //                     isCopyable>
      //                     {xmlConfig}
      //                   </EuiCodeBlock>
      //               </EuiAccordion>
      //             </EuiFlexItem>
      //             {/* {(this.state.agentTypeSelected === 'manager' || this.state.agentTypeSelected === 'centralized') && (
      //               <EuiFlexItem grow={false}>
      //                 <EuiButton onClick={this.toggleApplyChanges}>
      //                   Apply changes
      //                 </EuiButton>
      //               </EuiFlexItem>
      //             )} */}
      //           </EuiFlexGroup>
      //           {this.state.agentTypeSelected === 'agent' && (
      //             <EuiFlexGroup>
      //               <EuiFlexItem>
      //                 {this.state.agentOSSelected === 'linux' ? (
      //                   <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>/var/ossec/etc</EuiCode> in Linux agent, include the above configuration in <EuiCode>ossec.conf</EuiCode> and restart the agent.</EuiText>
      //                 ) : (
      //                   <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>C:\Program Files (x86)\ossec-agent</EuiCode> in Windows agent, include the above configuration in <EuiCode>ossec.conf</EuiCode> and restart the agent.</EuiText>  
      //                 )}
      //               </EuiFlexItem>
      //             </EuiFlexGroup>
      //           )}
      //           {/* <EuiSpacer size='s'/>
      //           {this.state.agentTypeSelected === 'manager' ? (
      //             <Fragment>
      //               <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>Management</EuiCode> {'>'} <EuiCode>Configuration</EuiCode> {'>'} <EuiCode>Edit configuration</EuiCode>, paste configuration, save and restart manager or node.</EuiText>
      //             </Fragment>
      //             ) : this.state.agentOSSelected === 'linux' ? (
      //               <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>/var/ossec/etc</EuiCode> in Linux agent, include the above configuration in <EuiCode>ossec.conf</EuiCode> and restart the agent.</EuiText>
      //               ) : (
      //                 <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>C:\Program Files (x86)\ossec-agent</EuiCode> in Windows agent, include the above configuration in <EuiCode>ossec.conf</EuiCode> and restart the agent.</EuiText>
      //           )}
                
      //           <EuiSpacer size='s' />
      //           <EuiText>The above section must be located within the top-level <EuiCode>{`<ossec_config>`}</EuiCode> tag.</EuiText> */}
      //         </Fragment>
      //         ) : (
      //           <EuiText color='danger'>There is an error in the configuration, please check fields that have errors.</EuiText>
      //       )}
      //     </Fragment>
      //   ),
      //   status: invalidConfiguration ? 'danger' : 'complete'
      // }] : [])
    ]

    return { guideSteps, invalidConfiguration }
  }
  renderOption(guideOption, keyID, options) {
    return (
      <Fragment>
        {!guideOption.elements ? (
          <EuiPanel>
            {this.renderOptionSetting(guideOption, keyID, options)}
            {guideOption.enabled && guideOption.attributes && guideOption.attributes.length && ((guideOption.collapsible && !guideOption.collapsed) || !guideOption.collapsible)? (
              <Fragment>
                {guideOption.type && (<EuiSpacer size='m' />)}
                <EuiToolTip
                  position='top'
                  content='Show / hide attributes'
                >
                  <EuiButtonToggle
                    label='Attributes'
                    color={this.checkInvalidElements(guideOption.attributes) ? 'danger' : 'primary'}
                    fill={guideOption.show_attributes}
                    iconType={guideOption.show_attributes ? 'arrowDown' : 'arrowRight'}
                    onChange={() => this.setElementProp(keyID, 'show_attributes', !guideOption.show_attributes)}
                    style={{marginRight: '4px'}}
                  />
                </EuiToolTip>
                {guideOption.show_attributes && guideOption.attributes && guideOption.attributes.length && (
                  <Fragment>
                    <EuiSpacer size='m' />
                    <EuiFlexGrid columns={2} style={{ marginLeft: '8px' }}>
                      {guideOption.attributes.map((guideSubOption, key) => (
                        <EuiFlexItem key={`module-guide-${guideOption.name}-${guideSubOption.name}`}>
                          {this.renderOptionSetting(guideSubOption, [...keyID, 'attributes', key], { ignore_description: true })}
                        </EuiFlexItem>
                      ))}
                    </EuiFlexGrid>
                  </Fragment>
                )}
              </Fragment>
            ) : null}
            {guideOption.enabled && guideOption.options && guideOption.options.length && ((guideOption.collapsible && !guideOption.collapsed) || !guideOption.collapsible)? (
              <Fragment>
                {guideOption.show_attributes && (<EuiSpacer size='m' />)}
                <EuiToolTip
                  position='top'
                  content='Show / hide options'
                >
                  <EuiButtonToggle
                    label='Options'
                    color={this.checkInvalidElements(guideOption.options) ? 'danger' : 'primary'}
                    fill={guideOption.show_options}
                    iconType={guideOption.show_options ? 'arrowDown' : 'arrowRight'}
                    onChange={() => this.setElementProp(keyID, 'show_options', !guideOption.show_options)}
                    style={{marginRight: '4px'}}
                  />
                </EuiToolTip>
                {guideOption.show_options && guideOption.options && guideOption.options.length && (
                  <Fragment>
                    <EuiSpacer size='m' />
                    {guideOption.options.map((guideSubOption, key) => {
                      return !guideSubOption.elements ? (
                      <Fragment key={`${guideOption.name}-options-${guideSubOption.name}`}>
                        <EuiFlexGroup>
                          <EuiFlexItem key={`module-guide-${guideOption.name}-${guideSubOption.name}`}>
                            {/* {this.renderOptionSetting(guideSubOption, [...keyID, 'options', key], { ignore_description: true })} */}
                            {this.renderOption(guideSubOption, [...keyID, 'options', key])}
                            <EuiSpacer size='s'/>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </Fragment>
                    ) : (
                      <Fragment key={`${guideOption.name}-options-${guideSubOption.name}`}>
                        {guideSubOption.elements.map((guideSubOptionElement, keyGuideSubOptionElement) => (
                          <Fragment key={`module-guide-${guideOption.name}-${guideSubOption.name}-${keyGuideSubOptionElement}`}>
                            <EuiFlexGroup>
                              <EuiFlexItem>
                                {this.renderOption(guideSubOptionElement, [...keyID,'options', key,'elements',keyGuideSubOptionElement])}
                              </EuiFlexItem>
                            </EuiFlexGroup>
                            <EuiSpacer size='s'/>
                          </Fragment>
                        ))}
                        <EuiFlexGroup justifyContent='center'>
                          <EuiFlexItem grow={false}>
                          <EuiToolTip
                            position='top'
                            content={guideSubOption.description}
                          >
                            <EuiButtonEmpty iconType='plusInCircle' onClick={() => this.addElementToStep([...keyID,'options', key,'elements'], guideSubOption, {ignore_repeatable: true})}>Add {guideSubOption.name}</EuiButtonEmpty>
                          </EuiToolTip>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </Fragment>
                    )
                    })}
                  </Fragment>
                )}
              </Fragment>
            ) : null}
          </EuiPanel>
        ) : (
          <Fragment>
            {guideOption.elements.map((guideSubOption, key) => (
              <Fragment key={`module-guide-${guideSubOption.name}-${key}`}>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    {this.renderOption(guideSubOption, [...keyID, 'elements', key])}
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size='s'/>
              </Fragment>
            ))}
            <EuiFlexGroup justifyContent='center'>
              <EuiFlexItem grow={false}>
              <EuiToolTip
                position='top'
                content={guideOption.description}
              >
                <EuiButtonEmpty iconType='plusInCircle' onClick={() => this.addElementToStep([...keyID,'elements'], guideOption, {ignore_repeatable: true})}>Add {guideOption.name}</EuiButtonEmpty>
              </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
          </Fragment>
        )}
        {/* <EuiSpacer size='m' /> */}
      </Fragment>
    )
  }
  renderOptionSetting(guideOption, keyID, options = {}) {
    const checkboxLabel = (
      <Fragment>
        <EuiText color={guideOption.enabled ? 'default' : 'subdued'} style={{ display: 'inline' }} size='m'>
          <span>{guideOption.name}</span>
          {guideOption.description && options.ignore_description && (
            <span style={{margin: '0 0 0 6px'}}>
              <EuiToolTip
                position='top'
                content={guideOption.description}
              >
                <EuiIcon type='questionInCircle' color='primary'/>
              </EuiToolTip>
           </span>
          )}
          {guideOption.info && (
            <span style={{margin: '0 0 0 6px'}}>
              <EuiToolTip
                position='top'
                content={guideOption.info}
              >
                <EuiIcon type='iInCircle' color='primary'/>
              </EuiToolTip>
            </span>
          )}
          {guideOption.warning && (
            <span style={{margin: '0 0 0 6px'}}>
              <EuiToolTip
                position='top'
                content={guideOption.warning}
              >
                <EuiIcon type='alert' color='warning'/>
              </EuiToolTip>
            </span>
          )}
          {guideOption.agent_os && (
            <span style={{margin: '0 0 0 6px'}}>
              <EuiToolTip
                position='top'
                content={`only for ${capitalize(guideOption.agent_os)}`}
              >
                {renderOSIcon(guideOption.agent_os)}
              </EuiToolTip>
            </span>
          )}
          {guideOption.removable && (
            <span style={{margin: '0 0 0 6px'}}>
              <EuiToolTip
                position='top'
                content='Remove this option'
              >
                <EuiButtonIcon color='danger' iconType='minusInCircle' onClick={() => this.removeElementOfStep(keyID)} aria-label='Remove option'/>
              </EuiToolTip>
            </span>
          )}
          {guideOption.enabled && guideOption.collapsible && (
            <Fragment>
              <EuiToolTip
                position='top'
                content='Show / hide option'
              >
              <EuiButtonToggle
                label=''
                color={this.checkInvalidElements([guideOption]) ? 'danger' : 'primary'}
                isEmpty
                isIconOnly
                size='s'
                iconType={guideOption.collapsed ? 'arrowRight' : 'arrowDown' }
                onChange={() => this.setElementProp(keyID, 'collapsed', !guideOption.collapsed)}
              />
            </EuiToolTip>
            </Fragment>
          )}
        </EuiText>
      </Fragment>)
    return (
      <Fragment>
        {guideOption.toggleable ? (
          <EuiCheckbox
            id={[...keyID, guideOption.name].join('-')}
            label={checkboxLabel}
            style={{ display: 'inline' }}
            checked={guideOption.enabled}
            onChange={() => {
              this.setElementProp(keyID, 'enabled', !guideOption.enabled)
              if(guideOption.collapsible){
                this.setElementProp(keyID, 'collapsed', false)
              }
            }}
          />
        ) : checkboxLabel}
        {!options.ignore_description && guideOption.description && (
          <Fragment>
            <EuiSpacer size='xs' />
            <EuiText color='subdued'>{guideOption.description}</EuiText>
          </Fragment>
        )}
        {((guideOption.collapsible && !guideOption.collapsed) || !guideOption.collapsible) && (
          <Fragment>
            <div>
              {guideOption.enabled && (<EuiSpacer size='s' />)}
              {typeof guideOption.enabled === 'boolean' ?
                (guideOption.enabled ? this.renderOptionType(guideOption, keyID) : null)
                : this.renderOptionType(guideOption, keyID)
              }
            </div>
            {/* {typeof guideOption.enabled === 'boolean' && (<EuiSpacer size='m' />)} */}
          </Fragment>
        )}
      </Fragment>
    )
  }
  checkInvalidElements(elements) {
    return elements.reduce((accum, element) => {
      return accum
        || !element.repeatable && !element.elements && this.checkInvalidElement(element)
        || element.repeatable && !element.elements && this.checkInvalidElement(element)
        || element.elements && element.elements.length && this.checkInvalidElements(element.elements)
        || !element.elements && element.enabled && element.attributes && element.attributes.length && this.checkInvalidElements(element.attributes)
        || !element.elements && element.enabled && element.options && element.options.length && this.checkInvalidElements(element.options)
    }, false)
  }
  checkInvalidElement(element) {
    if (!element.enabled) { return undefined }
    switch (element.type) {
      case 'input': {
        return (element.validate && !element.validate(element))
        || (element.validate_regex && !element.value.match(element.validate_regex))
        || (!element.value)
      }
      case 'input-number': {
        return (element.validate && !element.validate(element))
        || (element.values && (element.values.min !== undefined && element.values.max !== undefined && element.value < element.values.min || element.value > element.values.max))
        || (element.values && (element.values.min !== undefined && element.values.max === undefined && element.value < element.values.min))
        || (element.values && (element.values.min === undefined && element.values.max !== undefined && element.value > element.values.max))
        || (element.value === '')
      }
      default:
        return undefined;
    }
  }
  renderOptionType(guideOption, keyID) {
    switch (guideOption.type) {
      case 'input': {
        const invalid = this.checkInvalidElement(guideOption);
        return (
          <Fragment>
            <EuiFieldText
              placeholder={guideOption.placeholder}
              value={guideOption.value}
              isInvalid={invalid}
              disabled={guideOption.field_disabled}
              readOnly={guideOption.field_read_only}
              onChange={(e) => { this.setElementProp(keyID, 'value', e.target.value) }}
            />
            {invalid === true && <EuiText color='danger'>{guideOption.validate_error_message}</EuiText>}
          </Fragment>
        )
      }
      case 'input-number': {
        const invalid = this.checkInvalidElement(guideOption);
        return (
          <Fragment>
            <EuiFieldNumber
              placeholder={guideOption.placeholder}
              value={guideOption.value}
              min={guideOption.values && guideOption.values.min}
              max={guideOption.values && guideOption.values.max}
              isInvalid={invalid === true}
              disabled={guideOption.field_disabled}
              readOnly={guideOption.field_read_only}
              onChange={(e) => { this.setElementProp(keyID, 'value', e.target.value) }}
            />
            {invalid === true && <EuiText color='danger'>{guideOption.validate_error_message}</EuiText>}
          </Fragment>
        )
      }
      case 'switch':
        return (
          <EuiSwitch
            label={guideOption.values && guideOption.values[String(guideOption.value)] || ({ true: 'yes', false: 'no' })[String(guideOption.value)]}
            checked={guideOption.value}
            disabled={guideOption.field_disabled}
            onChange={(e) => { this.setElementProp(keyID, 'value', e.target.checked) }}
          />
        )
      case 'select':
        return (
          <EuiSelect
            id={guideOption.name}
            options={guideOption.values}
            value={guideOption.value}
            disabled={guideOption.field_disabled}
            onChange={(e) => this.setElementProp(keyID, 'value', e.target.value)}
            aria-label={`${guideOption.name}-select`}
          />
        )
      default:
        return null
    }
  }
  getConfigurationValueFromForm(guideOption) {
    switch (guideOption.type) {
      case 'input': {
        return guideOption.value
      }
      case 'input-number': {
        return guideOption.value
      }
      case 'switch':
        return guideOption.values && guideOption.values[String(guideOption.value)] || ({ true: 'yes', false: 'no' })[String(guideOption.value)]
      case 'select':
        return guideOption.value
      default:
        return guideOption.value
    }
  }
  toggleApplyChanges = () => {
    this.setState({ applyChanges: !this.state.applyChanges });
  }
  toggleShowConfig = () => {
    this.setState({ showConfig: !this.state.showConfig });
  }
  applyChanges = async () =>{
    this.setState({ applyChanges: false});
    try{
      let configuration;
      if(this.state.agentTypeSelected === 'manager'){
        configuration = await fetchFile(this.state.clusterNodeSelected);
      }else if(this.state.agentTypeSelected === 'centralized'){
        const configurationResponse = await WzRequest.apiReq('GET', `/agents/groups/${this.state.groupSelected}/files/agent.conf`, { format: 'xml' });
        configuration = ((configurationResponse || {}).data || {}).data || '';
      }
      // const regexp = /<syscheck>[\s\S]*?<\/syscheck>/;
      let xmlTag;
      if(this.guide.wodle_name){
        xmlTag = {
          open: `<wodle name="${this.guide.wodle_name}">`,
          close: '</wodle>'
        }
      }else{
        const tag = this.guide.xml_tag || this.guide.id;
        xmlTag = {
          open: `<${tag}>`,
          close: `</${tag}>`
        }
      }
      const regexp = new RegExp(`${xmlTag.open}[\\s\\S]*?${xmlTag.close}`, 'g');

      if(configuration.match(regexp)){
        configuration = configuration.replace(regexp, '');
      }
      //TODO: add configuration block if this isn't exists
      const parentTag = (this.state.agentTypeSelected === 'manager' || this.state.agentTypeSelected === 'agent') ? 'ossec_config'
        : this.state.agentTypeSelected === 'centralized' ? 'agent_config' : false;
      const regexpParent = new RegExp(`<${parentTag}>[\\t ]*<\\/${parentTag}>`,'g');
      await this.updateConfiguration(`${configuration}\n
<${parentTag}>
        ${this.transformToXML()}
</${parentTag}>`.replace(regexpParent,''))
      
    if(this.state.agentTypeSelected === 'manager'){
      const newAction = {type: 'manager', isNode: Boolean(this.state.clusterNodeSelected), name: this.state.clusterNodeSelected || 'Manager' };
      this.setState({ actions: [...this.state.actions.filter((action,index,actions) => action.type !== newAction.type || action.isNode !== newAction.isNode || action.name !== newAction.name), newAction] });
    }

    }catch(error){
      this.addToast({
        title: (
          <Fragment>
            <EuiIcon type="alert" />
            &nbsp;
            <span>Error saving configuration</span>
          </Fragment>
        ),
        color: 'danger',
        text: typeof error === 'string' ? error : error.message
      });
    }
  }
  openRestartAgentManagerModal = (action) => {
    this.setState({ restartAgentManagerModal: true, restartAgentManagerAction: action });
  }
  closeRestartAgentManagerModal = () => {
    this.setState({ restartAgentManagerModal: false, restartAgentManagerAction: false });
  }
  restartAgentManager = async () => {
    const { restartAgentManagerAction } = this.state;
    try{
      this.setState({ restartAgentManagerModal: false });
      if(restartAgentManagerAction.type === 'manager'){
        await restartNodeSelected(restartAgentManagerAction.isNode ? restartAgentManagerAction.name : undefined, this.props.updateWazuhNotReadyYet);
        this.props.updateWazuhNotReadyYet('');
        this.addToast({
          title: `${restartAgentManagerAction.isNode ? restartAgentManagerAction.name : 'Manager'} was restarted`,
          color: 'success'
        });
        this.setState({actions: this.state.actions.filter(action => action !== restartAgentManagerAction), restartAgentManagerAction: false});
      }else{
        //TODO: when is an agent
      }
    }catch(error){
      this.addToast({
        title: 'Error occured while restarting',
        text: typeof error === 'string' ? error : error.message,
        color: 'danger'
      });
    }
  }
  toggleResetGuideModal = () => {
    this.setState({ modalRestartIsVisble: !this.state.modalRestartIsVisble });
  }
  setAgentTypeSelected = (agentTypeSelected) => {
    this.setState({ agentTypeSelected, agentOSSelected: agentTypeSelected === 'agent' ? 'linux' : '' });
  }
  setAgentOSSelected = (agentOSSelected) => {
    this.setState({ agentOSSelected });
  }
  render() {
    const { guide } = this;
    const { modalRestartIsVisble, agentTypeSelected, agentOSSelected, applyChanges, actions, restartAgentManagerModal, showConfig } = this.state;
    const { guideSteps, invalidConfiguration } = this.renderSteps(); 
    const actionRestartManager = this.state.actions.find(action => action.type === 'manager' && action.name === this.state.clusterNodeSelected);
    return (
      <Fragment>
        <EuiFlexGroup alignItems='center'>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size='l'>
                  <h2>
                    <EuiToolTip
                      position='top'
                      content='Back to add modules data'
                    >
                      <EuiButtonIcon onClick={() => this.props.close()} iconType='arrowLeft' iconSize='l' aria-label='Back to add modules data'/>
                    </EuiToolTip>
                    {guide.icon && (
                      <EuiIcon size='xl' type={guide.icon} />
                    )}
                    <span> {guide.name}</span>
                  </h2>
                </EuiTitle>
                <EuiSpacer size='m' />
                <EuiText>
                  {guide.description} {guide.documentation_link && (
                    <EuiLink href={guide.documentation_link} external target="_blank">
                      Learn more
                    </EuiLink>
                  )}
                </EuiText>
                <EuiSpacer size='m' />
                {guide.callout_warning && (
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiCallOut title='Warning' color="warning" iconType="alert">
                        <p>{guide.callout_warning}</p>
                      </EuiCallOut>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
                {this.specificGuide && (
                  <Fragment>
                    {guide.callout_warning && (
                      <EuiSpacer size='s' />
                    )}
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <span>
                          <EuiBadge color='hollow' style={{padding: '4px'}}>{capitalize(agentTypeSelected)}</EuiBadge>
                          <EuiBadge color='hollow' style={{padding: '4px'}}>
                            <span style={{marginLeft: '6px'}}>
                              {renderOSIcon(agentOSSelected)} {capitalize(agentOSSelected)}
                            </span></EuiBadge>
                        </span>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </Fragment>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          {guide.image && (
            <EuiFlexItem>
              <EuiFlexGroup justifyContent='flexEnd' style={{marginRight: '8px'}}>
                <EuiFlexItem grow={false}>
                  <EuiImage allowFullScreen size='l' alt={`${guide.id} image`} url={guide.image}/>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        {!this.specificGuide && guide.avaliable_for_manager && guide.avaliable_for_agent && (
          <EuiFlexGroup justifyContent='center'>
            <EuiFlexItem grow={false}>
              <EuiButtonGroup
                color='primary'
                options={configurationTypes}
                idSelected={this.state.agentTypeSelected}
                onChange={this.setAgentTypeSelected}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
        {actions && actions.length > 0 && (
          <Fragment>
            <EuiSpacer/>
            {actions.map((action, index) => (
              <WzCalloutActionModuleGuide name={action.name} action={() => this.openRestartAgentManagerModal(action)}/>
            )).reduce((prev, curr) => [prev, <EuiSpacer size='s'/>, curr])}
          </Fragment>
        )}
        <EuiSpacer size='l' />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>
                      {guide.title || 'Getting started'}
                    </h2>
                  </EuiTitle>
                </EuiFlexItem>
                {/* <EuiFlexItem>
                  {this.state.agentTypeSelected} - {this.state.agentOSSelected}
                </EuiFlexItem> */}
                {/* <EuiFlexItem grow={false}>
                  <EuiFlexGroup justifyContent='flexEnd'>
                    <EuiFlexItem>
                      <EuiButtonEmpty iconType='refresh' onClick={() => this.toggleResetGuideModal()}>Reset guide</EuiButtonEmpty>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem> */}
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  {/* {!this.specificGuide && agentTypeSelected === 'agent' && (
                    <Fragment>
                      <EuiTabs size='m' display='default' expand={false}>
                        {agentOsTabs.map((agentOSTab) => (
                          <EuiTab key={`agent-tab-${agentOSTab.name}`}
                            isSelected={agentOSTab.id === agentOSSelected}
                            onClick={() => this.setAgentOSSelected(agentOSTab.id)}
                            >
                            {agentOSTab.name}
                          </EuiTab>
                        ))}
                      </EuiTabs>
                      <EuiSpacer size='l'/>
                    </Fragment>
                  )} */}
                  <EuiSteps headingElement="h2" steps={guideSteps} />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        {this.state.steps.length > 0 && (
          <EuiBottomBar>
            <EuiFlexGroup justifyContent='flexEnd' style={{paddingTop: 3, paddingBottom: 3}}>
              <EuiFlexItem grow={false} style={{marginTop: 0, marginBottom: 0}}>
                <EuiButton size='s' color='ghost' iconType='eye' isDisabled={invalidConfiguration} onClick={this.toggleShowConfig}>{invalidConfiguration ? 'Error in config': 'Preview XML configuration'}</EuiButton>
              </EuiFlexItem>
              {actionRestartManager && (
                <EuiFlexItem grow={false} style={{marginTop: 0, marginBottom: 0}}>
                  <EuiButton size='s' fill iconType='refresh' onClick={() => this.openRestartAgentManagerModal(actionRestartManager)}>Restart</EuiButton>
                </EuiFlexItem>
              )}
              {['manager', 'centralized'].includes(this.state.agentTypeSelected) && (
                <EuiFlexItem grow={false} style={{marginTop: 0, marginBottom: 0}}>
                  <EuiButton size='s' color='secondary' iconType='check' fill onClick={this.toggleApplyChanges}>Apply configuration</EuiButton>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiBottomBar>
        )}
        {this.state.steps.length > 0 && applyChanges && (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={`Do you want to apply changes for ${this.state.agentTypeSelected === 'manager' ? (this.state.clusterNodeSelected || 'Manager') : `${this.state.groupSelected} group` }?`}
              onCancel={this.toggleApplyChanges}
              onConfirm={this.applyChanges}
              cancelButtonText="No, don't do it"
              confirmButtonText="Yes, do it"
              defaultFocusedButton="confirm">
            </EuiConfirmModal>
          </EuiOverlayMask>
        )}
        {restartAgentManagerModal && (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={`Do you want to restart ${this.state.restartAgentManagerAction.name}?`}
              onCancel={this.closeRestartAgentManagerModal}
              onConfirm={this.restartAgentManager}
              cancelButtonText="No, don't do it"
              confirmButtonText="Yes, do it"
              defaultFocusedButton="confirm">
            </EuiConfirmModal>
          </EuiOverlayMask>
        )}
        {showConfig && (
          <EuiOverlayMask>
            <EuiModal onClose={this.toggleShowConfig} initialFocus="[name=popswitch]">
              <EuiModalHeader>
                <EuiModalHeaderTitle>{['manager', 'agent'].includes(this.state.agentTypeSelected) ? 'Module XML configuration' : 'Module XML configuration'}</EuiModalHeaderTitle>
              </EuiModalHeader>
    
              <EuiModalBody>
                <EuiCodeBlock
                  language="xml"
                  color="dark"
                  isCopyable>
                  {this.transformToXML()}
                </EuiCodeBlock>
                {this.state.agentTypeSelected === 'agent' && (
                  <Fragment>
                    <EuiSpacer />
                    {this.state.agentOSSelected === 'linux' ? (
                      <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>/var/ossec/etc</EuiCode> in Linux agent, include the above configuration in <EuiCode>ossec.conf</EuiCode> and restart the agent.</EuiText>
                      ) : (
                        <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>C:\Program Files (x86)\ossec-agent</EuiCode> in Windows agent, include the above configuration in <EuiCode>ossec.conf</EuiCode> and restart the agent.</EuiText>
                    )}
                  </Fragment>
                )}
              </EuiModalBody>
    
              {/* <EuiModalFooter>
                <EuiButtonEmpty onClick={closeModal}>Cancel</EuiButtonEmpty>
    
                <EuiButton onClick={closeModal} fill>
                  Save
                </EuiButton>
              </EuiModalFooter> */}
            </EuiModal>
          </EuiOverlayMask>
        )}
      </Fragment>
    )
  }
}

WzModuleGuide.propTypes = {
  close: PropTypes.func,
  guideId: PropTypes.string,
  agent: PropTypes.oneOfType([
    PropTypes.shape({
      id: PropTypes.string,
      os: {
        platform: PropTypes.string
      }
    }),
    PropTypes.shape({
      type: PropTypes.oneOf['manager','agent'],
      os: PropTypes.oneOf['linux','windows']
    }),
    PropTypes.any
  ])
}

const mapDispatchToProps = dispatch => ({
  updateWazuhNotReadyYet: value => dispatch(updateWazuhNotReadyYet(value))
});

export default connect(null,mapDispatchToProps)(WzModuleGuide);
