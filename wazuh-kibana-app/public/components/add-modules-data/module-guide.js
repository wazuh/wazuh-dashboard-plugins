/*
* Wazuh app - React component for show a module guide.
* Copyright (C) 2015-2022 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/
import React, { Component, Fragment } from "react";
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
  EuiBadge
} from "@elastic/eui";

import moduleGuides from './guides';
import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from '../../controllers/management/components/management/configuration/utils/xml-beautifier';
import { getToasts }  from '../../../kibana-services';

const js2xmlOptionsParser = {
  format: {
    doubleQuotes: true
  }
};

const capitalize = (str) => str[0].toUpperCase() + str.slice(1);

const agentTypeButtons = [
  {
    id: 'manager',
    label: 'Manager'
  },
  {
    id: 'agent',
    label: 'Agent'
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

const renderOSIcon = (os) => <i className={`fa fa-${os} AgentsTable__soBadge AgentsTable__soBadge--${os}`} aria-hidden="true"/>;

class WzModuleGuide extends Component {
  constructor(props) {
    super(props);
    this.guide = Object.keys(moduleGuides).map(key => moduleGuides[key]).find(guide => guide.id === props.guideId);
    this.specificGuide = Boolean(this.props.agent);
    this.state = {
      modalRestartIsVisble: false,
      agentTypeSelected: (this.props.agent && ((this.props.agent.id === '000' ? 'manager' : 'agent') || this.props.agent.type)) || (this.guide.avaliable_for_manager ? 'manager' : 'agent'),
      agentOSSelected: this.props.agent && (typeof this.props.agent.os === 'string' ? this.props.agent.os : (this.props.agent.os.platform === 'windows' ? 'windows' : 'linux')) || ''
    };
    this.state.steps = this.buildInitialSteps(this.guide.steps);
  }
  componentDidMount(){
    window.scrollTo(0, 0);
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
  buildInitialSteps(steps) {
    return [...steps.map(step => ({ ...step, elements: step.elements && step.elements.filter((element) => this.filterElementByAgent(element)).map((element) => this.buildConfigurationElement(element)) || [] }))].filter((step) => step.elements && step.elements.length);
  }
  buildConfigurationElementValue(option) {
    const defaultValue = option.default_value_linux !== undefined && this.state.agentOSSelected === 'linux' ?
    option.default_value_linux
    : option.default_value_windows !== undefined && this.state.agentOSSelected === 'windows' ?
    option.default_value_windows
    : option.default_value
    switch (option.type) {
      case 'input':{
        return defaultValue || '';
      }
      case 'input-number':
        return defaultValue !== undefined ? defaultValue : 0;
      case 'switch':
        return defaultValue || false;
      case 'select':
        return defaultValue !== undefined ? defaultValue : option.values[0].value;
      default:
        return undefined;
    }
  }
  buildConfigurationElementToggleable(option){
    return option.required ? false : option.toggleable !== undefined ? option.toggleable : true;
  }
  buildConfigurationElementEnabled(option){
    return option.required ? true : option.enabled !== undefined ? option.enabled : false;
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
    getToasts().add({title, text, toastLifeTimeMs: time, color})
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
  buildConfigurationElement(element, params = {}) {
    return {
      ...element,
      value: this.buildConfigurationElementValue(element),
      toggleable: this.buildConfigurationElementToggleable(element),
      enabled: this.buildConfigurationElementEnabled(element),
      collapsible: (element.attributes || element.options) ? true : false,
      collapsed: (element.attributes || element.options) ? false : undefined,
      elements: !params.ignore_repeatable && element.repeatable ? (element.repeatable_insert_first ? [this.buildConfigurationElement({...element, ...element.repeatable_insert_first_properties }, {ignore_repeatable: true})] : []) : undefined,
      show_options: element.show_options || false,
      options: element.options && element.options.filter((option) => this.filterElementByAgent(option)).map(option => ({ 
        ...option, 
        value: this.buildConfigurationElementValue(option),
        toggleable: this.buildConfigurationElementToggleable(option),
        enabled: this.buildConfigurationElementEnabled(option),
        elements: option.repeatable ? (option.repeatable_insert_first ? [this.buildConfigurationElement({...option, ...option.repeatable_insert_first_properties}, {ignore_repeatable: true})] : []) : undefined,
        attributes: option.attributes && option.attributes.length ? option.attributes.map((optionAtribute) => this.buildConfigurationElement(optionAtribute)) : undefined
      })) || undefined,
      show_attributes: element.show_attributes || false,
      attributes: element.attributes && element.attributes.filter((attribute) => this.filterElementByAgent(attribute)).map(attribute => ({ 
        ...attribute,
        value: this.buildConfigurationElementValue(attribute),
        toggleable: this.buildConfigurationElementToggleable(attribute),
        enabled: this.buildConfigurationElementEnabled(attribute)
      })) || undefined
    }
  }
  addElementToStep(keyID, element, params){
    const obj = this.getSettingbyKeyID(keyID);
    obj.push(this.buildConfigurationElement(element, params));
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

    return [
      ...configurationSteps,
      {
        title: !invalidConfiguration ? 'Edit ossec.conf' : 'Configuration error',
        children: (
          <Fragment>
            {!invalidConfiguration ? (
              <Fragment>
                <EuiCodeBlock
                  language="xml"
                  color="dark"
                  isCopyable>
                  {xmlConfig}
                </EuiCodeBlock>
                <EuiSpacer size='s'/>
                {this.state.agentTypeSelected === 'manager' ? (
                  <Fragment>
                    <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>Management</EuiCode> {'>'} <EuiCode>Configuration</EuiCode> {'>'} <EuiCode>Edit configuration</EuiCode>, paste configuration, save and restart manager or node.</EuiText>
                  </Fragment>
                  ) : this.state.agentOSSelected === 'linux' ? (
                    <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>/var/ossec/etc</EuiCode> in Linux agent, include the above configuration in <EuiCode>ossec.conf</EuiCode> and restart the agent.</EuiText>
                    ) : (
                      <EuiText>When you finish of configure the module, copy above XML configuration. Go to <EuiCode>C:\Program Files (x86)\ossec-agent</EuiCode> in Windows agent, include the above configuration in <EuiCode>ossec.conf</EuiCode> and restart the agent.</EuiText>
                )}
                <EuiSpacer size='s' />
                <EuiText>The above section must be located within the top-level <EuiCode>{`<ossec_config>`}</EuiCode> tag.</EuiText>
              </Fragment>
              ) : (
                <EuiText color='danger'>There is an error in the configuration, please check fields that have errors.</EuiText>
            )}
          </Fragment>
        ),
        status: invalidConfiguration ? 'danger' : 'complete'
      }
    ]
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
                    iconType={!guideOption.show_attributes ? 'eye' : 'eyeClosed'}
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
                    iconType={!guideOption.show_options ? 'eye' : 'eyeClosed'}
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
                <i className={`fa fa-${guideOption.agent_os} AgentsTable__soBadge AgentsTable__soBadge--${guideOption.agent_os}`} aria-hidden="true"/>
              </EuiToolTip>
            </span>
          )}
          {guideOption.removable && (
            <span style={{margin: '0 0 0 6px'}}>
              <EuiToolTip
                position='top'
                content='Remove this option'
              >
                <EuiButtonIcon color='danger' iconType='minusInCircle' onClick={() => this.removeElementOfStep(keyID)}/>
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
                iconType={guideOption.collapsed ? 'eye' : 'eyeClosed'}
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
  toggleResetGuideModal = () => {
    this.setState({ modalRestartIsVisble: !this.state.modalRestartIsVisble });
  }
  onChangeAgentTypeSelected = (agentTypeSelected) => {
    this.setState({ agentTypeSelected, agentOSSelected: agentTypeSelected === 'agent' ? 'linux' : '' }, () => {
      this.resetGuide()
    });
  }
  onChangeAgentOSSelected(agentOSSelected){
    this.setState({ agentOSSelected }, () => {
      this.resetGuide()
    });
  }
  render() {
    const { guide } = this;
    const { modalRestartIsVisble, agentTypeSelected, agentOSSelected } = this.state;
    return (
      <div>
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
                legend='Agent type'
                options={agentTypeButtons}
                idSelected={this.state.agentTypeSelected}
                onChange={this.onChangeAgentTypeSelected}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
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
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup justifyContent='flexEnd'>
                    <EuiFlexItem>
                      <EuiButtonEmpty iconType='refresh' onClick={() => this.toggleResetGuideModal()}>Reset guide</EuiButtonEmpty>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  {!this.specificGuide && agentTypeSelected === 'agent' && (
                    <Fragment>
                      <EuiTabs size='m' display='default' expand={false}>
                        {agentOsTabs.map((agentOSTab) => (
                          <EuiTab key={`agent-tab-${agentOSTab.name}`}
                            isSelected={agentOSTab.id === agentOSSelected}
                            onClick={() => this.onChangeAgentOSSelected(agentOSTab.id)}
                            >
                            {agentOSTab.name}
                          </EuiTab>
                        ))}
                      </EuiTabs>
                      <EuiSpacer size='l'/>
                    </Fragment>
                  )}
                  <EuiSteps headingElement="h2" steps={this.renderSteps()} />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        {modalRestartIsVisble && (
          <EuiOverlayMask>
            <EuiConfirmModal
              title="Do you want reset the guide?"
              onCancel={this.toggleResetGuideModal}
              onConfirm={this.resetGuideWithNotification}
              cancelButtonText="No, don't do it"
              confirmButtonText="Yes, do it"
              defaultFocusedButton="confirm">
            </EuiConfirmModal>
          </EuiOverlayMask>
        )}
      </div>
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

export default WzModuleGuide;
