/*
* Wazuh app - React component for show a extension guide.
* Copyright (C) 2015-2020 Wazuh, Inc.
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
  EuiLink
} from "@elastic/eui";

import extensionGuides from '../extension-guides';
import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from '../../../controllers/management/components/management/configuration/utils/xml-beautifier';
import _ from 'lodash';

class WzExtensionGuide extends Component {
  constructor(props) {
    super(props);
    this.guide = extensionGuides[props.guide];
    this.state = {
      steps: this.buildInitialSteps(this.guide.steps)
    }
    console.log('state', this.state)
  }
  setSetting(keyID, value) {
    let obj = this.getSettingbyKeyID(keyID);
    obj.value = value;
    this.setState({ steps: this.state.steps });
  }
  setElementProp(keyID, prop, value) {
    let obj = this.getSettingbyKeyID(keyID)
    obj[prop] = value
    this.setState({ steps: this.state.steps })
  }
  getSettingbyKeyID(keyID, last = false) {
    let obj = this.state.steps;
    for (let i = 0, length = keyID.length; i < length; i++) {
      obj = last && ((i + 1) === length) ? obj : obj[keyID[i]];
    }
    return obj;
  }
  buildInitialSteps(steps) {
    return [...steps.map(step => ({ ...step, elements: step.elements && step.elements.map((element) => this.buildConfigurationElement(element)) || [] }))];
  }
  buildConfigurationElementValue(option) {
    switch (option.type) {
      case 'input':
        return option.default_value || '';
      case 'input-number':
        return option.default_value !== undefined ? option.default_value : 0;
      case 'switch':
        return option.default_value || false;
      case 'select':
        return option.default_value || option.values[0].value;
      default:
        return '';
    }
  }
  buildConfigurationElementToggleable(option){
    return option.required ? false : option.toggleable !== undefined ? option.toggleable : true;
  }
  buildConfigurationElementEnabled(option){
    return option.required ? true : option.enabled !== undefined ? option.enabled : false;
  }
  resetGuide(){
    this.setState({
      steps: this.buildInitialSteps(this.guide.steps)
    });
  }
  transformStateToJSON() {
    return {
      ...this.state.steps.reduce((accum, step) => {
        // console.log('step',step)
        return {
          ...accum, ...step.elements.reduce((accumStep, element) => {
            if (!element.enabled) { return accumStep }
            if (element.list) {
              if (!accumStep[element.name]) {
                accumStep[element.name] = []
              }
            }
            const obj = {
              '#': this.getConfigurationValueFromForm(element)
            }
            if (element.attributes && element.attributes.length) {
              obj['@'] = element.attributes.filter(attribute => attribute.enabled).reduce((accumAttribute, attribute) => ({
                ...accumAttribute,
                [attribute.name]: this.getConfigurationValueFromForm(attribute)
              }), {})
            }
            if (element.options && element.options.length) {
              element.options.forEach((option) => {
                if (!option.enabled) { return }
                obj[option.name] = this.getConfigurationValueFromForm(option)
              })
            }
            if (element.list) {
              accumStep[element.name].push(obj);
            } else {
              accumStep[element.name] = obj;
            }
            // console.log('element.name', element.name, obj)
            return accumStep
          }, {})
        }
      }, {})
    }
  }
  transformToXML() {
    const json = this.transformStateToJSON();
    return XMLBeautifier(js2xmlparser.parse(this.guide.xml_tag || this.guide.id, json).replace("<?xml version='1.0'?>\n", ""));
  }
  buildConfigurationElement(element) {
    return {
      ...element,
      value: this.buildConfigurationElementValue(element),
      toggleable: this.buildConfigurationElementToggleable(element),
      enabled: this.buildConfigurationElementEnabled(element),
      show_options: false,
      options: element.options && element.options.map(option => ({ 
        ...option, 
        value: this.buildConfigurationElementValue(option),
        toggleable: this.buildConfigurationElementToggleable(option),
        enabled: this.buildConfigurationElementEnabled(option) 
      })) || undefined,
      show_attributes: false,
      attributes: element.attributes && element.attributes.map(attribute => ({ 
        ...attribute,
        value: this.buildConfigurationElementValue(attribute),
        toggleable: this.buildConfigurationElementToggleable(attribute),
        enabled: this.buildConfigurationElementEnabled(attribute)
      })) || undefined
    }
  }
  buttonAction(button, key){
    switch(button.action){
      case 'add_element_to_step':{
        this.buttonActionAddElementToStep(key, button.add_element_to_step);
        break;
      }
      default:{
        if(typeof button.action === 'function'){
          button.action(button, this);
        }
        return
      }
    }
  }
  buttonActionAddElementToStep(key, element) {
    const { steps } = this.state;
    steps[key].elements.push(this.buildConfigurationElement(element));
    this.setState({ steps });
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
                </Fragment>
              ))}
            </Fragment>
          ) : null}
          {step.buttons && step.buttons.length && (
            <EuiFlexGroup justifyContent='center'>
              {step.buttons.map((button, keyButton) => (
                <EuiFlexItem grow={false} key={`${button.text}-${keyButton}`}>
                  <EuiButtonEmpty iconType={button.icon_type} key={`${button.text}-${keyButton}`} onClick={() => this.buttonAction(button, key)}>{button.text}</EuiButtonEmpty>
                </EuiFlexItem>
              )
              )}
            </EuiFlexGroup>
          )}
        </Fragment>
      ),
      status: this.checkInvalidElements(step.elements) ? 'danger' : 'complete'//TODO: check step value
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
                <EuiText>When you finish of configure the extension, copy it and go to Configuration Editor</EuiText>
                <EuiSpacer size='s' />
                <EuiCodeBlock
                  language="xml"
                  color="dark"
                  isCopyable>
                  {xmlConfig}
                </EuiCodeBlock>
              </Fragment>
            ) : (
                <EuiText color='danger'>There are some error in the configuration, please check fields that have errors
              </EuiText>
              )}
          </Fragment>
        ),
        status: invalidConfiguration ? 'danger' : 'complete'
      }
    ]
  }
  renderOption(guideOption, keyID) {
    return (
      <Fragment>
        <EuiPanel>
          {this.renderOptionSetting(guideOption, keyID)}
          {guideOption.enabled && guideOption.attributes && guideOption.attributes.length ? (
            <Fragment>
              <EuiButtonToggle
                label='Attributes'
                fill={guideOption.show_attributes}
                iconType={!guideOption.show_attributes ? 'eye' : 'eyeClosed'}
                onChange={() => this.setElementProp(keyID, 'show_attributes', !guideOption.show_attributes)}
              />
              {guideOption.show_attributes && (
                <Fragment>
                  <EuiSpacer size='m' />
                  <EuiFlexGrid columns={guideOption.attributes_layout && guideOption.attributes_layout.columns || 1} style={{ marginLeft: '8px' }}>
                    {guideOption.attributes.map((guideSubOption, key) => (
                      <EuiFlexItem key={`extension-guide-${guideOption.name}-${guideSubOption.name}`}>
                        {this.renderOptionSetting(guideSubOption, [...keyID, 'attributes', key], { ignore_description: true })}
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGrid>
                </Fragment>
              )}
            </Fragment>
          ) : null}
          {guideOption.enabled && guideOption.options && guideOption.options.length ? (
            <Fragment>
              <EuiButtonToggle
                label='Options'
                fill={guideOption.show_options}
                iconType={!guideOption.show_options ? 'eye' : 'eyeClosed'}
                onChange={() => this.setElementProp(keyID, 'show_options', !guideOption.show_options)}
              />
              {guideOption.show_options && (
                <Fragment>
                  <EuiSpacer size='s' />
                  <EuiFlexGrid columns={guideOption.options_layout && guideOption.options_layout.columns || 2} style={{ marginLeft: '8px' }}>
                    {guideOption.options.map((guideSubOption, key) => (
                      <EuiFlexItem key={`extension-guide-${guideOption.name}-${guideSubOption.name}`}>
                        {this.renderOptionSetting(guideSubOption, [...keyID, 'options', key], { ignore_description: true })}
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGrid>
                </Fragment>
              )}
            </Fragment>
          ) : null}
        </EuiPanel>
        <EuiSpacer size='m' />
      </Fragment>
    )
  }
  renderOptionSetting(guideOption, keyID, options = {}) {
    const checkboxLabel = (
      <Fragment>
        <EuiText color={guideOption.enabled ? 'default' : 'subdued'} style={{ display: 'inline' }} size='m'>
          <span>{guideOption.name}</span>
          <span style={{margin: '0 4px'}}>
            <EuiToolTip
              position='top'
              content={guideOption.description}
            >
              <EuiIcon type='questionInCircle' color='primary'/>
            </EuiToolTip>
          </span>
          {guideOption.warning && (
            <span style={{margin: '0 2px'}}>
              <EuiToolTip
                position='top'
                content={guideOption.warning}
              >
                <EuiIcon type='alert' color='primary'/>
              </EuiToolTip>
            </span>
          )}
          {guideOption.info && (
            <span style={{margin: '0 2px'}}>
              <EuiToolTip
                position='top'
                content={guideOption.info}
              >
                <EuiIcon type='iInCircle' color='primary'/>
              </EuiToolTip>
            </span>
          )}
          {/* FIXME: remove this */}
          {/* {guideOption.new && (
            <span style={{margin: '0 2px'}}>
              <EuiBadge isDisabled={!guideOption.enabled} color='primary'>{`new in v${guideOption.new}`}</EuiBadge>
            </span>
          )} */}
          {guideOption.removable && <EuiButtonEmpty color='danger' iconType='minusInCircle' onClick={() => this.removeElementOfStep(keyID)}></EuiButtonEmpty>}
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
            onChange={() => this.setElementProp(keyID, 'enabled', !guideOption.enabled)}
          />
        ) : checkboxLabel}
        {!options.ignore_description && guideOption.description && (
          <Fragment>
            <EuiSpacer size='xs' />
            <EuiText color='subdued'>{guideOption.description}</EuiText>
          </Fragment>
        )}
        <div>
          <EuiSpacer size='s' />
          {typeof guideOption.enabled === 'boolean' ?
            (guideOption.enabled ? this.renderOptionType(guideOption, keyID) : null)
            : this.renderOptionType(guideOption, keyID)
          }
        </div>
        <EuiSpacer size='m' />
      </Fragment>
    )
  }
  checkInvalidElements(elements) {
    return elements.reduce((accum, element) => {
      console.log('checkInvalidElement', element)

      return accum
        || this.checkInvalidElement(element)
        || element.attributes && element.attributes.length && this.checkInvalidElements(element.attributes)
        || element.options && element.options.length && this.checkInvalidElements(element.options)
    }, false)
  }
  checkInvalidElement(element) {
    if (!element.enabled) { return undefined }
    switch (element.type) {
      case 'input': {
        return (element.validate && !element.validate(element))
          || (!element.value)
      }
      case 'input-number': {
        return (element.validate && !element.validate(element))
          || (element.values && (element.values.min !== undefined && element.values.max !== undefined && element.value < element.values.min || element.value > element.values.max))
          || (element.values && (element.values.min !== undefined && element.values.max === undefined && element.value < element.values.min))
      }
      default:
        return undefined;
    }
  }
  renderOptionType(guideOption, keyID) {
    switch (guideOption.type) {
      case 'input': {
        const invalid = this.checkInvalidElement(guideOption);
        console.log('input-invalid', invalid, guideOption)
        return (
          <Fragment>
            <EuiFieldText
              placeholder={guideOption.placeholder}
              value={guideOption.value}
              isInvalid={invalid}
              onChange={(e) => { this.setSetting(keyID, e.target.value) }}
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
              // placeholder={guideOption.default_value}
              value={guideOption.value}
              min={guideOption.values.min}
              max={guideOption.values.max}
              isInvalid={invalid === true}
              onChange={(e) => { this.setSetting(keyID, e.target.value) }}
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
            onChange={(e) => { this.setSetting(keyID, e.target.checked) }}
          />
        )
      case 'select':
        return (
          <EuiSelect
            id={guideOption.name}
            options={guideOption.values}
            value={guideOption.value}
            onChange={(e) => this.setSetting(keyID, e.target.value)}
            aria-label=""
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
  render() {
    const { guide } = this;
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem>
            {guide.icon && (
              <EuiIcon type={guide.icon} style={{ display: 'inline' }} />
            )}
            <EuiTitle>
              <h2>
                {guide.name}
              </h2>
            </EuiTitle>
            <EuiSpacer size='s' />
            <EuiText color='subdued'>
              {guide.description} {guide.documentation_link && (
                <EuiLink href={guide.documentation_link} external target="_blank">
                  Learn more
                </EuiLink>
              )}
            </EuiText>
            <EuiSpacer size='s' />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='l' />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>
                      Getting started
                    </h2>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup justifyContent='flexEnd'>
                    <EuiButtonEmpty iconType='refresh' onClick={() => this.resetGuide()}>Reset Guide</EuiButtonEmpty>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiSteps headingElement="h2" steps={this.renderSteps()} />
                  <button onClick={() => console.log(this.state)}>log</button>
                  <button onClick={() => console.log('transform', this.transformStateToJSON())}>reduce</button>
                  <button onClick={() => this.generateXML()}>generateXML</button>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    )
  }
}

export default WzExtensionGuide;