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
  EuiHealth,
  EuiModalFooter,
  EuiSelectable,
  EuiForm,
  EuiFormRow,
  EuiDescribedFormGroup,
  EuiHorizontalRule
} from "@elastic/eui";

import moduleGuides from './guides';
import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from '../../controllers/management/components/management/configuration/utils/xml-beautifier';
import { toastNotifications } from 'ui/notify';
import withLoading from "../../controllers/management/components/management/configuration/util-hocs/loading";
import { clusterReq, clusterNodes, fetchFile, saveFileManager, saveFileCluster, restartNodeSelected } from '../../controllers/management/components/management/configuration/utils/wz-fetch';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import { updateWazuhNotReadyYet } from '../../redux/actions/appStateActions';
import $ from 'jquery';
import _ from 'lodash';
import { WzAgentSelector, WzGroupSelector } from './module-guide-selector';
import { WzButtonAsync } from '../common/util/button-async';
import { WzButtonModal, WzButtonConfirmModal } from '../common/util/button-modal';
import WzLoading from '../../controllers/management/components/management/configuration/util-components/loading';

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
        const items = ((nodesResponse.data || {}).data || {}).affected_items || [];
        props.updateClusterNodes(items);
        props.clusterNodeSelect(items.length > 0 ? items[0].name : '');
        return { isCluster: true, nodes: nodesResponse.data.data.affected_items };
      }else{
        return { isCluster: false };
      }
    }catch(error){
      return {};
    }
  },
  (props, prevProps) => props.agentTypeSelected === 'manager' && prevProps.agentTypeSelected !== 'manager'
)((props) => {
  useEffect(() => {
    props.setAgentOSSelected('linux');
  }, [])
  return (
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
    <EuiText>Load the current configuration or from scratch:</EuiText>
    <EuiSpacer size='s'/>
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <WzButtonAsync disableWhileLoading onClick={props.setStepsGuideLoadedConfiguration} size='s'>Load</WzButtonAsync>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton onClick={props.setStepsGuideFromScratch} size='s'>New</EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  </Fragment>
)});

const WzModuleGuideAgentSelector = props => {
  const [typeSelection, setTypeSelection] = useState(agentTypeSelector[0].id);
  const onChange = (value) => {
    props.cleanStepsGuide();
    setTypeSelection(value);
  }

  const resetAgentState = () => {
    props.setAgentSelected(undefined);
  }

  useEffect(() => {
    resetAgentState();
    return () => resetAgentState();
  }, [typeSelection]);

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
        <WzModuleGuideAgentRegistered {...props} />
      ) : typeSelection === agentTypeSelector[1].id ? (
        <WzModuleGuideAgentSelectorCustom {...props}/>
      ) : null}
    </Fragment>
  )
}

const WzModuleGuideAgentRegistered = props => {
  const [isSelectionOpened, setIsSelectionOpened] = useState(false);

  const onClickIsSelectionOpened = () => setIsSelectionOpened(true);
  const onClickIsSelectionClosed = () => setIsSelectionOpened(false);
  const onSelectItem = (agent) => {
    const agentOS = (((agent.os || {}).platform || '')) === 'windows' ? 'windows'
      : (((agent.os || {}).uname || '')).includes('Linux') ? 'linux'
      : undefined
    if(Array.isArray(props.guide.avaliable_for.agent) && !props.guide.avaliable_for.agent.includes(agentOS)){
      toastNotifications.add({
        title: `This module is not avaliable for OS of selected agent: ${capitalize(agentOS)}`,
        color: 'danger'
      })
      return 
    }
    props.setAgentSelected(agent);

    props.setAgentOSSelected(agentOS);
  };
  const color = status => {
    if (status.toLowerCase() === 'active') {
      return 'success';
    } else if (status.toLowerCase() === 'disconnected') {
      return 'danger';
    } else if (status.toLowerCase() === 'never connected') {
      return 'subdued';
    }
  };

  return (
    <Fragment>
      <EuiFlexGroup alignItems='center' responsive={false}>
        <EuiFlexItem grow={false}>
          <WzAgentSelector
            onSelectItem={onSelectItem}
            modal={{title: 'Select an agent', className:'wz-select-agent-modal'}}
            isOpen={isSelectionOpened}
            onClose={onClickIsSelectionClosed}
            button={<EuiButton onClick={onClickIsSelectionOpened} size='s'>Select an agent</EuiButton>}
          />
        </EuiFlexItem>
        {props.agentSelected && (
          <EuiFlexItem grow={false}>
            <EuiHealth color={color(props.agentSelected.status)}><span className={'hide-agent-status'}>{props.agentSelected.name} ({props.agentSelected.id})</span></EuiHealth>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      {props.agentSelected && (
        <Fragment>
          <EuiSpacer size='s' />
          <EuiText>{props.agentSelected.status !== 'Never connected' ? 'Load the current configuration or from scratch:' : 'From scratch'}</EuiText>
          <EuiSpacer size='s'/>
          <EuiFlexGroup>
            {props.agentSelected.status !== 'Never connected' && (
              <EuiFlexItem grow={false}>
                <WzButtonAsync disableWhileLoading onClick={props.setStepsGuideLoadedConfiguration} size='s'>Load</WzButtonAsync>
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false}>
              <EuiButton onClick={props.setStepsGuideFromScratch} size='s'>New</EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
      )}
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
        options={agentOSSelector.filter(agentOS => props.guide.avaliable_for.agent === true || Array.isArray(props.guide.avaliable_for.agent) && props.guide.avaliable_for.agent.includes(agentOS.id))}
        idSelected={props.agentOSSelected}
        onChange={props.setAgentOSSelected}
      />
      <EuiSpacer size='s'/>
      <EuiButton onClick={props.setStepsGuideFromScratch} isDisabled={!props.agentOSSelected} size='s'>
        New
      </EuiButton>
    </Fragment>
  )
}

const WzModuleGuideCentralizedSelector = props => {
  const [isSelectionOpened, setIsSelectionOpened] = useState(false);
  const [ isLoading, setIsLoading ] = useState(false);
  const onClickIsSelectionOpened = () => setIsSelectionOpened(true);
  const onClickIsSelectionClosed = () => setIsSelectionOpened(false);
  const onSelectItem = (group) => {
    props.setGroupSelected(group.name);
    resetCentralizedState();
  };

  useEffect(() => {
    return () => {
      props.setGroupSelected(false);
      resetCentralizedState();
    };
  }, []);

  const resetCentralizedState = () => {
    props.setCentralizedConfigurations(false);
    props.setCentralizedFilters(false);
  }
  const newConfiguration = () => {
    resetCentralizedState();
    props.setStepsGuideFromScratch();
  }
  const loadConfiguration = async () => {
    props.setCentralizedFilters(false);
    await props.setStepsGuideLoadedConfiguration();
  }
  return (
    <Fragment>
      <EuiFlexGroup alignItems='center' responsive={false}>
        <EuiFlexItem grow={false}>
          <WzGroupSelector
            onSelectItem={onSelectItem}
            modal={{title: 'Select a group'}}
            isOpen={isSelectionOpened}
            onClose={onClickIsSelectionClosed}
            button={<EuiButton onClick={onClickIsSelectionOpened} size='s'>Select a group</EuiButton>}
          />
        </EuiFlexItem>
        {props.groupSelected && (
          <EuiFlexItem grow={false}>
            {props.groupSelected}
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      {props.groupSelected && (
        <Fragment>
          <EuiSpacer size='s' />
          <EuiText>Load the current configuration or from scratch:</EuiText>
          <EuiSpacer size='s'/>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <WzButtonAsync disableWhileLoading onClick={loadConfiguration} onChange={setIsLoading} size='s'>Load</WzButtonAsync>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton onClick={newConfiguration} size='s'>New</EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
      )}
      {isLoading && (
        <Fragment>
          <div>Loading</div>
          <WzLoading />
        </Fragment>
      )}
      {props.centralizedConfigurations && (
        <Fragment>
          <EuiSpacer size='s'/>
          <EuiText>Select a configuration:</EuiText>
          <EuiSpacer size='s'/>
          <EuiSelectable
            aria-label='Select a configuration'
            singleSelection
            options={props.centralizedConfigurations}
            listProps={{ bordered: true }}
            renderOption={option => {
              return (
                <div style={{cursor: 'pointer'}}>
                  {Object.keys(option.filters).length > 0 && Object.keys(option.filters).sort().map(key => <EuiBadge>{`${key}: ${option.filters[key]}`}</EuiBadge>) || 'No filters'}
                </div>
              )
            }}
            onChange={props.setCentralizedConfigurations}>
            {list => list }
          </EuiSelectable>
        </Fragment>
      )}
    </Fragment>
  )
}

const WzCalloutActionModuleGuide = ({ name='' , action, loading}) => (
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
          isDisabled={loading}
          isLoading={loading}
        >
          Restart
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiCallOut>
)

class WzModuleGuide extends Component {
  constructor(props) {
    super(props);
    this.guide = Object.keys(moduleGuides).map(key => moduleGuides[key]).find(guide => guide.id === props.guideId);
    this.specificGuide = Boolean(this.props.agent);
    this.state = {
      agentTypeSelected: (this.props.agent && ((this.props.agent.id === '000' ? 'manager' : 'agent') || this.props.agent.type)) || (this.guide.avaliable_for.manager ? 'manager' : 'agent'),
      agentOSSelected: this.props.agent && (typeof this.props.agent.os === 'string' ? this.props.agent.os : (this.props.agent.os && this.props.agent.os.platform === 'windows' ? 'windows' : 'linux')) || '',
      clusterNodes: false, //TODO: remove of this state?
      clusterNodeSelected: false,
      agentSelected: false,
      groupSelected: false,
      centralizedConfigurations: false,
      centralizedFilters: false,
      applyChanges: false,
      showConfig: false,
      updatingConfiguration: false,
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
    if(prevState.clusterNodeSelected !== this.state.clusterNodeSelected || prevState.agentTypeSelected !== this.state.agentTypeSelected || prevState.agentOSSelected !== this.state.agentOSSelected || prevState.groupSelected !== this.state.groupSelected || !_.isEqual(prevState.agentSelected, this.state.agentSelected)){
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
    let moduleConfiguration;
    try{
      if(this.state.agentTypeSelected === 'manager'){
        if(this.state.clusterNodeSelected){
          // Cluster node configuration
          const moduleConfigResponse = await WzRequest.apiReq('GET', `/cluster/${this.state.clusterNodeSelected}/configuration/${this.guide.api_component}/${this.guide.api_configuration}`, {});
          moduleConfiguration = ((((moduleConfigResponse || {}).data || {}).data || {}).affected_items || [])[0];
          if(this.guide.api_component === 'wmodules' && this.guide.api_configuration === 'wmodules'){
            moduleConfiguration = (moduleConfiguration.wmodules.find(wmodule => wmodule[this.guide.api_module]) || {})[this.guide.api_module] || undefined;
          }else if(this.guide.api_module){
            moduleConfiguration = moduleConfiguration[this.guide.api_module];
          };
          if(this.guide.api_module === 'integration'){
            moduleConfiguration = moduleConfiguration.find(integration => integration.name === this.guide.api_integration)
          };
          this.setState({ steps: this.buildInitialSteps(this.guide.steps, this.mapAPIConfigurationToStepsGuide(moduleConfiguration)) });
          this.addToastLoadConfiguration(moduleConfiguration, this.state.clusterNodeSelected);
        }else{
          // Manager configuration
          const moduleConfigResponse = await WzRequest.apiReq('GET', `/manager/configuration/${this.guide.api_component}/${this.guide.api_configuration}`, {});
          moduleConfiguration = ((((moduleConfigResponse || {}).data || {}).data || {}).affected_items || [])[0];
          if(this.guide.api_module){
            moduleConfiguration = moduleConfiguration[this.guide.api_module];
          };
          if(this.guide.api_module === 'integration'){
            moduleConfiguration = moduleConfiguration.find(integration => integration.name === this.guide.api_integration)
          };
          this.setState({ steps: this.buildInitialSteps(this.guide.steps, this.mapAPIConfigurationToStepsGuide(moduleConfiguration)) });
          this.addToastLoadConfiguration(moduleConfiguration, 'Manager');
        }
      }else if (this.state.agentTypeSelected === 'agent'){
        // Agent configuration
        const moduleConfigResponse = await WzRequest.apiReq('GET', `/agents/${this.state.agentSelected.id}/config/${this.guide.api_component}/${this.guide.api_configuration}`, {});
        moduleConfiguration = (((moduleConfigResponse || {}).data || {}).data || {});
        if(this.guide.api_module){
          moduleConfiguration = moduleConfiguration[this.guide.api_module];
        };
        this.setState({ steps: this.buildInitialSteps(this.guide.steps, this.mapAPIConfigurationToStepsGuide(moduleConfiguration)) });
        this.addToastLoadConfiguration(moduleConfiguration, `${this.state.agentSelected.name} (${this.state.agentSelected.id}) agent`);
      }else if (this.state.agentTypeSelected === 'centralized'){
        // Centralized configuration
        if(!this.state.centralizedConfigurations){
          const moduleConfigResponse = await WzRequest.apiReq('GET', `/groups/${this.state.groupSelected}/files/agent.conf/json`, {});
          moduleConfiguration = (((moduleConfigResponse || {}).data || {}).data || []);
          if(moduleConfigResponse.length <= 1){
            moduleConfiguration = moduleConfigResponse[0]
            // if(this.guide.api_module){
            //   moduleConfiguration = moduleConfiguration[this.guide.api_module];
            // };
            this.setState({ centralizedFilters: this.buildCentralizedFilters(moduleConfiguration.filters), steps: this.buildInitialSteps(this.guide.steps, this.mapAPIGroupsConfigurationToStepsGuide(moduleConfiguration.config[this.guide.api_module])) });
            this.addToastLoadConfiguration(moduleConfiguration, `${this.state.groupSelected} group`);
          }else{
            this.setState({ centralizedConfigurations: moduleConfiguration.map(centralizedConfiguration => ({...centralizedConfiguration, label: `${Object.keys(centralizedConfiguration.filters).sort().map(centralizedConfigurationFilter => `${centralizedConfigurationFilter}: ${centralizedConfiguration.filters[centralizedConfigurationFilter]}`).join(' ')}` || 'No filters'})) });
            this.addToast({
              title: 'This group has multiple configurations for this module.',
              color: 'success',
              time: 5000
            });
          }
        }else{
          moduleConfiguration = this.state.centralizedConfigurations && this.state.centralizedConfigurations.find(centralizedConfiguration => centralizedConfiguration.checked === 'on');
          if(moduleConfiguration){
            this.setState({ centralizedFilters: this.buildCentralizedFilters(moduleConfiguration.filters), steps: this.buildInitialSteps(this.guide.steps, this.mapAPIGroupsConfigurationToStepsGuide(moduleConfiguration.config[this.guide.api_module])) });
            this.addToastLoadConfiguration(moduleConfiguration, `${this.state.groupSelected} group - ${moduleConfiguration.label}`);
          }
        }
      }
      if(this.guide.contain_secrets){
        this.addToast({
          title: 'There are settings which contain secrets, these were removed for security reasons. You need add them again.',
          color: 'warning'
        });
      }
    }catch(error){
      this.addToast({
        title: 'Load configuration  error',
        text: typeof error === 'string' ? error : error.message,
        color: 'danger'
      })
    }
  }
  setStepsGuideFromScratch = () => {
    this.setState({ steps: this.buildInitialSteps(this.guide.steps), ...(this.state.agentTypeSelected === 'centralized' ? {centralizedFilters: this.buildCentralizedFilters({})} : {})});
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
        color: 'warning',
        time: 5000
      });
    }else{
      this.addToast({
        title: 'Load configuration',
        text: `${name} configuration was loaded.`,
        color: 'success'
      });
    }
  }
  setAgentSelected = (agentSelected) => {
    this.setState( { agentSelected });
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
          setAgentOSSelected={this.setAgentOSSelected}
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
          agentSelected={this.state.agentSelected}
          setAgentSelected={this.setAgentSelected}
          setStepsGuideLoadedConfiguration={this.setStepsGuideLoadedConfiguration}
          setStepsGuideFromScratch={this.setStepsGuideFromScratch}
          agentOSSelected={this.state.agentOSSelected}
          setAgentOSSelected={this.setAgentOSSelected}
          cleanStepsGuide={this.cleanStepsGuide}
          guide={this.guide}
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
          centralizedConfigurations={this.state.centralizedConfigurations}
          setCentralizedConfigurations={this.setCentralizedConfigurations}
          setCentralizedFilters={this.setCentralizedFilters}
        />
      )
    }
  }
  renderCentralizedOption(option, keyID){
    switch (option.type) {
      case 'input': {
        const invalid = this.checkInvalidElement(option);
        return (
          <Fragment>
            <EuiFieldText
              placeholder={option.placeholder}
              value={option.value}
              isInvalid={invalid}
              disabled={option.field_disabled}
              readOnly={option.field_read_only}
              onChange={(e) => { this.setCentralizedOptionProp(keyID, 'value', e.target.value); option.onChange && option.onChange(e.target.value) }}
            />
            {invalid === true && <EuiText color='danger'>{option.validate_error_message}</EuiText>}
          </Fragment>
        )
      }
      case 'select':
        return (
          <EuiSelect
            id={option.name}
            options={option.values}
            value={option.value}
            disabled={option.field_disabled}
            onChange={(e) => {this.setCentralizedOptionProp(keyID, 'value', e.target.value); option.onChange && option.onChange(e.target.value)}}
            aria-label={`${option.name}-select`}
          />
        )
      default:
        return null
    }
  }
  setCentralizedOptionProp(keyID, prop, value){
    this.state.centralizedFilters[keyID][prop] = value;
    this.setState({ centralizedFilters:  this.state.centralizedFilters });
  }
  buildCentralizedSelectorFiltersStep(){
    return this.state.centralizedFilters ? [{
      title: 'Filter the configuration',
      children: (
        <Fragment>
          <EuiText color='subdued'>Add filters to this configuration if it is applicable.</EuiText>
          <EuiSpacer size='s'/>
          {this.state.centralizedFilters && this.state.centralizedFilters.map((centralizedFilter, keyID) => (
            <Fragment key={`centralized-filter-${centralizedFilter.name}`}>
              <EuiPanel>
                <EuiDescribedFormGroup
                  fullWidth
                  title={(<span>
                    {centralizedFilter.toggleable && (
                      <EuiToolTip
                      position='top'
                      content={'Enable to configure this setting'}
                    >
                      <EuiSwitch label='' showLabel={false} checked={centralizedFilter.enabled} compressed onChange={() => this.setElementProp(keyID, 'enabled', !centralizedFilter.enabled)}/>
                    </EuiToolTip>
                    )}
                    <span> {this.renderOptionSetting(centralizedFilter, keyID, {})}</span>
                  </span>)}
                  description={centralizedFilter.description}>
                    {centralizedFilter.type && (
                      <EuiFormRow label={centralizedFilter.name}>
                        {this.renderCentralizedOption(centralizedFilter, keyID)}
                      </EuiFormRow>
                    )}
                </EuiDescribedFormGroup>

                {/* <EuiText>{centralizedFilter.display_name}</EuiText>
                <EuiSpacer size='s' />
                <EuiText color='subdued'>{centralizedFilter.description}</EuiText>
                {centralizedFilter.enabled && (
                  <Fragment>
                    <EuiSpacer size='s' />
                    {this.renderCentralizedOption(centralizedFilter, keyID)}
                  </Fragment>
                )} */}
              </EuiPanel>
              <EuiSpacer size='s'/>
            </Fragment>
          ))}
        </Fragment>
      )
    }] : []
  }
  setCentralizedConfigurations = (centralizedConfigurations) => {
    this.setState({centralizedConfigurations}, () => {
      if(this.state.centralizedConfigurations){
        this.setStepsGuideLoadedConfiguration();
      }
    });
  }
  setCentralizedFilters = (centralizedFilters) => {
    this.setState({centralizedFilters});
  }
  buildCentralizedFilters(filters = {}){
    const self = this;
    const centralizedFiltersTypes = [
      {
        name: 'name',
        display_name: 'Agent',
        description: 'Allows assignment of the block to one particular agent.',
        type: 'input',
        ignore_invalid_value: true,
      },
      {
        name: 'os',
        display_name: 'Operating system',
        description: 'Allows assignment of the block to an operating system.',
        type: 'select',
        values: [
          {value: '', text: 'All'},
          {value: 'Linux', text: 'Linux'},
          {value: 'Windows', text: 'Windows'},
        ],
        default_value: '',
        ignore_invalid_value: true,
        onChange(agentOSSelected){
          self.setState({ agentOSSelected }, () => { /*TODO: */})
        }
      },
      {
        name: 'profile',
        display_name: 'Profile',
        description: 'Allows assignment of a profile name to a block. Any agent configured to use the defined profile may use the block.',
        type: 'input',
        ignore_invalid_value: true,
      }
    ];

    return centralizedFiltersTypes.map(centralizedFilter => ({
      ...centralizedFilter,
      value: filters[centralizedFilter.name] || '',
      // toggleable: true,
      enabled: true,
      collapsible: true,
      collapsed: false,
      elements: undefined,
      show_options: false,
      options: undefined,
      show_attributes: false,
      attributes: undefined
    }));
  }
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
        return option.secret ? '' : (defaultValue || '');
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
  addToast({color, title, text, time = 3000}){
    toastNotifications.add({title, text, toastLifeTimeMs: time, color})
  }
  transformStateElementToJSON(element, accum){
    if (this.filterCentralizedOptionOS(element)){ return accum }
    if (!element.enabled && !element.elements) { return accum }
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
    let json = this.transformStateToJSON();
    if(this.guide.wodle_name){
      json = { wodle: {'@': {name: this.guide.wodle_name}, ...json}};
    }else{
      // json = { [this.guide.xml_tag || this.guide.id]: {...json } };
      json = { 
        ...(this.guide.xml_tag === '' ? {...json } : {[this.guide.xml_tag || this.guide.id]: {...json }})
      };
    };
    if(this.state.agentTypeSelected === 'centralized'){
      if(this.state.centralizedFilters){
        const agent_config = this.state.centralizedFilters
          .filter(centralizedFilter => (centralizedFilter.type === 'input' && centralizedFilter.value) || (centralizedFilter.type === 'select' && centralizedFilter.value) )
          .reduce((accum, centralizedFilter) => {
            accum['@'][centralizedFilter.name] = centralizedFilter.value;
            return accum
        },{'@': {}});
        json = { agent_config: {...agent_config, ...json}};
      }
    }else{
      json = { ossec_config: {...json}};
    }
    return XMLBeautifier(js2xmlparser.parse('configuration', json, js2xmlOptionsParser).replace("<?xml version=\"1.0\"?>\n", "").replace("<configuration>\n    ", "").replace("</configuration>",""));
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
      show_options: typeof element.show_options !== 'undefined' ? element.show_options : (element.options && element.options.filter((option) => this.filterElementByAgent(option)).length || false),
      options: element.options && element.options.filter((option) => this.filterElementByAgent(option)).map(option => ({ 
        ...option, 
        value: this.buildConfigurationElementValue(option, config && typeof config === 'object' && config[option.name] && typeof config[option.name] === 'object'? config[option.name]['#'] : config && config[option.name]  ),
        toggleable: this.buildConfigurationElementToggleable(option),
        enabled: this.buildConfigurationElementEnabled(option, config && config[option.name]),
        elements: option.repeatable ? (
          config && config[option.name] && config[option.name].length > 0 ? config[option.name].map(e => this.buildConfigurationElement({...option }, e, {ignore_repeatable: true}))
          : option.repeatable_insert_first ? [this.buildConfigurationElement({...option, ...option.repeatable_insert_first_properties }, config && config[option.name], {ignore_repeatable: true})]
          : []
        ) : undefined,
        attributes: option.attributes && option.attributes.length ? option.attributes.map((optionAtribute) => this.buildConfigurationElement(optionAtribute, config && config[option.name] && config[option.name]['@'] && config[option.name]['@'][optionAtribute.name])) : undefined
      })) || undefined,
      // show_attributes: element.show_attributes || false,
      show_attributes: typeof element.show_attributes !== 'undefined' ? element.show_attributes : (element.attributes && element.attributes.filter((attribute) => this.filterElementByAgent(attribute)).length || false),
      attributes: element.attributes && element.attributes.filter((attribute) => this.filterElementByAgent(attribute)).map(attribute => {return ({ 
        ...attribute,
        value: this.buildConfigurationElementValue(attribute, config && config['@'] && typeof config['@'][attribute.name] !== 'undefined' ? config['@'][attribute.name] : undefined),
        toggleable: this.buildConfigurationElementToggleable(attribute),
        enabled: this.buildConfigurationElementEnabled(attribute, config && config['@'] && typeof config['@'][attribute.name] !== 'undefined' ? config['@'][attribute.name] : undefined)
      })}) || undefined
    }
  }
  mapAPIConfigurationToStepsGuide(config){
    return this.guide.mapAgentConfigurationAPIResponse && config ? this.guide.mapAgentConfigurationAPIResponse(config) : config;
  }
  mapAPIGroupsConfigurationToStepsGuide(config){
    return this.guide.mapCentralizedConfigurationAPIResponse && config ? this.guide.mapCentralizedConfigurationAPIResponse(config) : config;
  }
  filterCentralizedOptionOS(element){
    return this.state.agentTypeSelected === 'centralized' && this.state.agentOSSelected && element.agent_os && element.agent_os !== this.state.agentOSSelected
  }
  async updateConfiguration(text) {
    try {
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
          'PUT',
          `/groups/${this.state.groupSelected}/configuration`,
          {body: text}
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
        return Promise.reject(error);
      }
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
    const invalidConfiguration = configurationSteps.reduce((accum, step) => accum || step.status === 'danger', false)
      // || (this.state.centralizedFilters ? this.checkInvalidElements(this.state.centralizedFilters) : false);

    const guideSteps = [
      ...(this.state.agentTypeSelected === 'manager' ? [this.buildManagerSelectorStep()] : []),
      ...(this.state.agentTypeSelected === 'agent' ? [this.buildAgentSelectorStep()] : []),
      ...(this.state.agentTypeSelected === 'centralized' ? [this.buildCentralizedSelectorStep()] : []),
      ...(this.state.agentTypeSelected === 'centralized' && this.state.centralizedFilters ? this.buildCentralizedSelectorFiltersStep() : []),
      ...(configurationSteps.length > 0 ? configurationSteps : []),
    ]

    return { guideSteps, invalidConfiguration }
  }
  renderOption(guideOption, keyID, options = {}){
    return !guideOption.elements && (
      <Fragment>
        <EuiPanel>
          <EuiDescribedFormGroup
            fullWidth
            title={(<span>
              {guideOption.toggleable && (
                <EuiToolTip
                position='top'
                content={'Enable to configure this setting'}
              >
                <EuiSwitch label='' showLabel={false} checked={guideOption.enabled} disabled={this.filterCentralizedOptionOS(guideOption)} compressed onChange={() => this.setElementProp(keyID, 'enabled', !guideOption.enabled)}/>
              </EuiToolTip>
              )}
              <span> {this.renderOptionSetting(guideOption, keyID, {})}</span>
            </span>)}
            description={guideOption.description}>
              {guideOption.type && (
                <EuiFormRow label={guideOption.name}>
                  {this.renderOptionType(guideOption, keyID)}
                </EuiFormRow>
              )}
          </EuiDescribedFormGroup>
          {guideOption.enabled && guideOption.attributes && guideOption.attributes.length > 0 && (
            <Fragment>
              {guideOption.type && (<EuiHorizontalRule margin='s'/>)}
              <EuiButtonToggle
                label='Advanced attributes'
                isEmpty
                color={this.checkInvalidElements(guideOption.attributes) ? 'danger' : 'primary'}
                iconType={guideOption.show_attributes ? 'arrowDown' : 'arrowRight'}
                iconSide='right'
                onChange={() => this.setElementProp(keyID, 'show_attributes', !guideOption.show_attributes)}
                style={{marginRight: '4px'}}
                size='s'
                title={null}
              />
              {guideOption.show_attributes && guideOption.attributes && guideOption.attributes.length && (
                <Fragment>
                  <EuiSpacer size='m' />
                  <EuiFlexGrid columns={2} style={{ marginLeft: '8px' }}>
                    {guideOption.attributes.map((guideSubOption, key) => (
                      <EuiFlexItem key={`module-guide-${guideOption.name}-${guideSubOption.name}`}>
                        {this.renderOption(guideSubOption, [...keyID, 'attributes', key], { ignore_description: true })}
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGrid>
                </Fragment>
              )}
            </Fragment>
          )}
          {guideOption.enabled && guideOption.options && guideOption.options.length && ((guideOption.collapsible && !guideOption.collapsed) || !guideOption.collapsible)? (
            <Fragment>
              {guideOption.show_attributes && (<EuiHorizontalRule margin='s'/>)}
              <EuiButtonToggle
                label='Options'
                isEmpty
                color={this.checkInvalidElements(guideOption.options) ? 'danger' : 'primary'}
                iconType={guideOption.show_options ? 'arrowDown' : 'arrowRight'}
                iconSide='right'
                onChange={() => this.setElementProp(keyID, 'show_options', !guideOption.show_options)}
                style={{marginRight: '4px'}}
                size='s'
              />
              {guideOption.show_options && guideOption.options && guideOption.options.length && (
                <Fragment>
                  <EuiSpacer size='m' />
                  {guideOption.options.map((guideSubOption, key) => {
                    return !guideSubOption.elements ? (
                    <Fragment key={`${guideOption.name}-options-${guideSubOption.name}`}>
                      <EuiFlexGroup>
                        <EuiFlexItem key={`module-guide-${guideOption.name}-${guideSubOption.name}`}>
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
                          content={`Add more ${guideSubOption.display_name || guideSubOption.name} to configuration`}
                        >
                          <EuiButtonEmpty iconType='plusInCircle' onClick={() => this.addElementToStep([...keyID,'options', key,'elements'], guideSubOption, {ignore_repeatable: true})}>Add {guideSubOption.display_name || guideSubOption.name}</EuiButtonEmpty>
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
      </Fragment>
    ) || (
      <Fragment>
        {guideOption.elements.length > 0 && guideOption.elements.map((option, index) => (
          <Fragment key={`${guideOption.name}-elements-${option.name}-${index}`}>
            {this.renderOption(option,[...keyID, 'elements', index])}
          </Fragment>
        )
        ).reduce((prev, curr) => [prev, <EuiSpacer key={String(keyID)} size='s'/>, curr])}
        <EuiSpacer />
        <EuiFlexGroup justifyContent='center'>
          <EuiFlexItem grow={false}>
          <EuiToolTip
            position='top'
            content={`Add more ${guideOption.display_name || guideOption.name}  to configuration`}
          >
            <EuiButtonEmpty iconType='plusInCircle' onClick={() => this.addElementToStep([...keyID,'elements'], guideOption, {ignore_repeatable: true})}>Add {guideOption.display_name || guideOption.name}</EuiButtonEmpty>
          </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }
  renderOptionSetting(guideOption, keyID, options = {}){
    return (
      <Fragment>
        <span className={`euiTextColor euiTextColor--${guideOption.enabled ? 'default' : 'subdued'}`} style={{ display: 'inline' }}>
          <span>{guideOption.display_name || guideOption.name}</span>
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
                content='Remove this setting'
              >
                <EuiButtonIcon color='danger' iconType='cross' onClick={() => this.removeElementOfStep(keyID)} aria-label='Remove setting'/>
              </EuiToolTip>
            </span>
          )}
        </span>
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
    if (!element.enabled) { return undefined };
    if(element.ignore_invalid_value){ return false };
    switch (element.type) {
      case 'input': {
        return (element.validate && !element.validate(element))
        || (element.validate_regex && !element.value.match(element.validate_regex))
        || (!element.value);
      }
      case 'input-number': {
        return (element.validate && !element.validate(element))
        || (element.values && (element.values.min !== undefined && element.values.max !== undefined && element.value < element.values.min || element.value > element.values.max))
        || (element.values && (element.values.min !== undefined && element.values.max === undefined && element.value < element.values.min))
        || (element.values && (element.values.min === undefined && element.values.max !== undefined && element.value > element.values.max))
        || (element.value === '');
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
              disabled={guideOption.field_disabled || !guideOption.enabled}
              readOnly={guideOption.field_read_only}
              onChange={(e) => { this.setElementProp(keyID, 'value', e.target.value) }}
            />
            {invalid === true && <EuiText color='danger' size='s'>{guideOption.validate_error_message}</EuiText>}
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
              disabled={guideOption.field_disabled || !guideOption.enabled}
              readOnly={guideOption.field_read_only}
              onChange={(e) => { this.setElementProp(keyID, 'value', e.target.value) }}
            />
            {invalid === true && <EuiText color='danger' size='s'>{guideOption.validate_error_message}</EuiText>}
          </Fragment>
        )
      }
      case 'switch':
        return (
          <EuiSwitch
            label={guideOption.values && guideOption.values[String(guideOption.value)] || ({ true: 'yes', false: 'no' })[String(guideOption.value)]}
            checked={guideOption.value}
            disabled={guideOption.field_disabled || !guideOption.enabled}
            onChange={(e) => { this.setElementProp(keyID, 'value', e.target.checked) }}
          />
        )
      case 'select':
        return (
          <EuiSelect
            id={guideOption.name}
            options={guideOption.values}
            value={guideOption.value}
            disabled={guideOption.field_disabled || !guideOption.enabled}
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
    this.setState({ applyChanges: false });
    try{
      let configuration;
      this.setState({ updatingConfiguration: true });
      if(this.state.agentTypeSelected === 'manager'){
        configuration = await fetchFile(this.state.clusterNodeSelected);
      }else if(this.state.agentTypeSelected === 'centralized'){
        const configurationResponse = await WzRequest.apiReq('GET', `/groups/${this.state.groupSelected}/files/agent.conf/xml`, {});
        configuration = ((configurationResponse || {}).data || {}).data || '';
      }
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
      const regexpParent = new RegExp(`<${parentTag}>[\\t\\n ]*<\\/${parentTag}>`,'g');
      await this.updateConfiguration(`${configuration}\n${this.transformToXML()}`.replace(regexpParent,''));
      
    if(this.state.agentTypeSelected === 'manager'){
      const newAction = {type: 'manager', isNode: Boolean(this.state.clusterNodeSelected), name: this.state.clusterNodeSelected || 'Manager', loading: false };
      this.setState({ 
        actions: [...this.state.actions.filter((action,index,actions) => action.type !== newAction.type || action.isNode !== newAction.isNode || action.name !== newAction.name), newAction],
        updatingConfiguration: false
      });
    }

    }catch(error){
      this.setState({ updatingConfiguration: false });
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
      let removeAction;
      this.setState({ restartAgentManagerModal: false, actions: this.state.actions.map(action => { if (action === restartAgentManagerAction){removeAction = {...action, loading: true}; return removeAction}else{return action}}) });
      if(restartAgentManagerAction.type === 'manager'){
        await restartNodeSelected(restartAgentManagerAction.isNode ? restartAgentManagerAction.name : undefined, this.props.updateWazuhNotReadyYet);
        this.props.updateWazuhNotReadyYet('');
        this.addToast({
          title: <span><strong>{restartAgentManagerAction.isNode ? restartAgentManagerAction.name : 'Manager'}</strong> was restarted</span>,
          color: 'success'
        });
        this.setState({actions: this.state.actions.filter(action => action !== removeAction) });
      }
    }catch(error){
      this.setState({ actions: this.state.actions.map(action => action === restartAgentManagerAction ? {...action, loading: false} : action) })
      this.addToast({
        title: 'Error occured while restarting',
        text: typeof error === 'string' ? error : error.message,
        color: 'danger'
      });
    }
  }
  setAgentTypeSelected = (agentTypeSelected) => {
    this.setState({ agentTypeSelected, agentOSSelected: agentTypeSelected === 'manager' ? 'linux' : '' });
  }
  setAgentOSSelected = (agentOSSelected) => {
    this.setState({ agentOSSelected });
  }
  render() {
    const { guide } = this;
    const { agentTypeSelected, agentOSSelected, applyChanges, actions, restartAgentManagerModal, showConfig, updatingConfiguration } = this.state;
    const { guideSteps, invalidConfiguration } = this.renderSteps(); 
    const actionRestartManager = this.state.actions.find(action => action.type === 'manager' && action.name === this.state.clusterNodeSelected);
    let moduleConfigurationEntity;

    if(this.state.agentTypeSelected === 'manager'){
      moduleConfigurationEntity = this.state.clusterNodeSelected || 'Manager';
    }else if(this.state.agentTypeSelected === 'agent'){
      moduleConfigurationEntity = this.state.agentSelected ? `${this.state.agentSelected.name} (${this.state.agentSelected.id})` : `custom agent${this.state.agentOSSelected ? ` (${capitalize(this.state.agentOSSelected)})` : ''}`;
    }else if(this.state.agentTypeSelected === 'centralized'){
      moduleConfigurationEntity = this.state.groupSelected;
    };

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
                      <EuiSpacer />
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
        {!this.specificGuide && guide.avaliable_for && Object.keys(guide.avaliable_for).length > 1 && (
          <EuiFlexGroup justifyContent='center'>
            <EuiFlexItem grow={false}>
              <EuiButtonGroup
                color='primary'
                options={configurationTypes.filter(entity => Object.keys(guide.avaliable_for).includes(entity.id))}
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
              <WzCalloutActionModuleGuide name={action.name} loading={action.loading} action={() => this.openRestartAgentManagerModal(action)}/>
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
                {/* <EuiButton size='s' color='ghost' iconType='eye' isDisabled={invalidConfiguration} onClick={this.toggleShowConfig}>{invalidConfiguration ? 'Error in config': 'Preview XML configuration'}</EuiButton> */}
                <WzButtonModal
                  button={<EuiButton size='s' color='ghost' iconType='eye' isDisabled={invalidConfiguration} onClick={this.toggleShowConfig}>{invalidConfiguration ? 'Error in configuration': 'Preview XML configuration'}</EuiButton>}
                  isOpen={showConfig}
                  onClose={this.toggleShowConfig}
                  className='wz-modal-expanded'
                >
                  <EuiModalHeader>
                    <EuiModalHeaderTitle>Module XML configuration - {moduleConfigurationEntity}</EuiModalHeaderTitle>
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
                          <EuiText>When you finish of configure the module, copy above XML configuration, and include it in <EuiCode>/var/ossec/etc/ossec.conf</EuiCode> file of <strong>{moduleConfigurationEntity}</strong> agent. Then restart the agent.</EuiText>
                          ) : (
                            <EuiText>When you finish of configure the module, copy above XML configuration, and include it in <EuiCode>C:\Program Files (x86)\ossec-agent\ossec.conf</EuiCode> file of <strong>{moduleConfigurationEntity}</strong> agent. Then restart the agent.</EuiText>
                        )}
                        <EuiSpacer />
                        <EuiCallOut size='s'>
                          <EuiText size='s' style={{color: 'rgb(0, 107, 180)'}}>
                            <EuiIcon type='alert'></EuiIcon>
                            <span> You could need to remove other configuration blocks for this module in the <EuiCode>ossec.conf</EuiCode> file if they exist and you want only this configuration applied.</span>
                          </EuiText>
                        </EuiCallOut>
                      </Fragment>
                    )}
                    {this.state.agentTypeSelected === 'centralized' && (
                      <Fragment>
                        <EuiSpacer />
                        <EuiText>When you finish of configure the module, copy above XML configuration, go to <EuiCode>Management/Groups</EuiCode>, choose <strong>{this.state.groupSelected}</strong> group, edit <EuiCode>Management/Groups</EuiCode> and include the above configuration in <EuiCode>agent.conf</EuiCode> and save.</EuiText>
                      </Fragment>
                    )}
                  </EuiModalBody>
                </WzButtonModal>
              </EuiFlexItem>
              {actionRestartManager && (
                <EuiFlexItem grow={false} style={{marginTop: 0, marginBottom: 0}}>
                  <EuiButton size='s' fill iconType='refresh' isDisabled={actionRestartManager.loading} isLoading={actionRestartManager.loading} onClick={() => this.openRestartAgentManagerModal(actionRestartManager)}>Restart</EuiButton>   
                </EuiFlexItem>
              )}
              {['manager','centralized'].includes(this.state.agentTypeSelected) && (
                <EuiFlexItem grow={false} style={{marginTop: 0, marginBottom: 0}}>
                  <WzButtonConfirmModal
                    button={<EuiButton size='s' color='secondary' iconType='check' fill isLoading={updatingConfiguration} isDisabled={invalidConfiguration || updatingConfiguration} onClick={this.toggleApplyChanges}>Apply configuration</EuiButton>}
                    isOpen={this.state.steps.length > 0 && applyChanges}
                    title={`Do you want to apply changes for ${this.state.agentTypeSelected === 'manager' ? (this.state.clusterNodeSelected || 'Manager') : `${this.state.groupSelected} group` }?`}
                    onCancel={this.toggleApplyChanges}
                    onConfirm={this.applyChanges}
                    cancelButtonText="No, don't do it"
                    confirmButtonText="Yes, do it"
                    defaultFocusedButton="confirm"
                  ></WzButtonConfirmModal>
                  
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiBottomBar>
        )}
        {/* {this.state.steps.length > 0 && applyChanges && (
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
        )} */}
        {restartAgentManagerModal && (
          <EuiOverlayMask onClick={(e) => { e.target.className === 'euiOverlayMask' && this.closeRestartAgentManagerModal() }}>
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
        {/* {showConfig && (
          <EuiOverlayMask>
            <EuiModal onClose={this.toggleShowConfig} initialFocus="[name=popswitch]">
              <EuiModalHeader>
                <EuiModalHeaderTitle>Module XML configuration - {moduleConfigurationEntity}</EuiModalHeaderTitle>
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
                      <EuiText>When you finish of configure the module, copy above XML configuration, and include it in <EuiCode>/var/ossec/etc/ossec.conf</EuiCode> file of <strong>{moduleConfigurationEntity}</strong> agent. Then restart the agent.</EuiText>
                      ) : (
                        <EuiText>When you finish of configure the module, copy above XML configuration, and include it in <EuiCode>C:\Program Files (x86)\ossec-agent\ossec.conf</EuiCode> file of <strong>{moduleConfigurationEntity}</strong> agent. Then restart the agent.</EuiText>
                    )}
                    <EuiSpacer />
                    <EuiCallOut size='s'>
                      <EuiText size='s' style={{color: 'rgb(0, 107, 180)'}}>
                        <EuiIcon type='alert'></EuiIcon>
                        <span> You could need to remove other configuration blocks for this module in the <EuiCode>ossec.conf</EuiCode> file if they exist and you want only this configuration applied.</span>
                      </EuiText>
                    </EuiCallOut>
                  </Fragment>
                )}
              </EuiModalBody>
            </EuiModal>
          </EuiOverlayMask>
        )} */}
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
