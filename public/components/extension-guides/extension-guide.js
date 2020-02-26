/*
 * Wazuh app - React component for show how to configure an extension guide.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import extensionGuides from './extension-guides';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiText,
  EuiFlyoutHeader,
  EuiTitle,
  EuiSpacer,
  EuiTextColor,
  EuiSteps,
  EuiButton,
  EuiButtonIcon,
  EuiSuperSelect,
  EuiTextArea,
  EuiSwitch,
  EuiFieldText,
  EuiSelect,
  EuiPopover,
  EuiFormRow,
  EuiButtonEmpty,
  EuiCallOut,
  EuiLink
} from '@elastic/eui';

export class WzExtensionGuide extends Component {
  constructor(props) {
    super(props);
    this.statuses = ['complete', 'incomplete', 'warning'];
    this.state = {
      status: this.statuses[1],
      fetchingData: false,
      value: '',
      selectedExtension: props.selectedExtension || false,
      showAdvanced: false,
      isPopoverOpen: false
    };
    this.outputBlock = false;
    this.ExtensionsGuides = extensionGuides;
    this.extensions = [];

    if (this.props.isAgent !== undefined) {
      this.getExtensions(this.props.isAgent);
    }
  }

  // eslint-disable-next-line
  componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.selectedExtension) {
      this.onChange(nextProps.selectedExtension);
    }
    if (nextProps.isAgent) {
      this.getExtensions(nextProps.isAgent);
    }
  }

  getExtensions = isAgent => {
    this.extensions = Object.entries(extensionGuides)
      .filter(x =>
        isAgent
          ? x[1].type === 1 || x[1].type === 2
          : x[1].type === 0 || x[1].type === 2
      )
      .map(x => {
        return {
          value: x[0],
          inputDisplay: x[1].name,
          dropdownDisplay: (
            <Fragment>
              <strong>{x[1].name}</strong>
              <EuiSpacer size="xs" />
              <EuiText size="s" color="subdued">
                <p className="euiTextColor--subdued">{x[1].description}</p>
              </EuiText>
            </Fragment>
          )
        };
      });
  };

  updateExtensionsModel = () => {
    this.setState({
      options: this.ExtensionsGuides[this.state.selectedExtension].options
    });
  };
  onChange = value => {
    this.outputBlock = false;
    this.docsLink = this.ExtensionsGuides[value].docsLink || false;
    this.extraSteps = this.ExtensionsGuides[value].extraSteps || false;
    this.setState({
      value,
      status: this.statuses[1],
      selectedExtension: value,
      options: this.ExtensionsGuides[value].options
    });
  };

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
  };

  setSwitch = (option, e) => {
    this.ExtensionsGuides[this.state.selectedExtension].options[option].value =
      e.target.checked;
    this.updateExtensionsModel();
  };

  extraAttrChange = (option, attr, e) => {
    this.ExtensionsGuides[this.state.selectedExtension].options[option].extraAttr[
      attr
    ].value =
      this.ExtensionsGuides[this.state.selectedExtension].options[option].extraAttr[
        attr
      ].type === 'switch'
        ? e.target.checked
        : e.target.value;
    this.updateExtensionsModel();
  };

  setValue = (option, e) => {
    this.ExtensionsGuides[this.state.selectedExtension].options[option].value =
      e.target.value;
    this.updateExtensionsModel();
  };

  showAdvancedOptions = () => {
    this.setState({
      showAdvanced: !this.state.showAdvanced
    });
  };

  onGenerate = () => {
    this.setState({ status: this.statuses[0] });
    setTimeout(() => {
      var blockHeight = $('#codeBlock').offset().top;
      $('#sideNav').animate(
        {
          scrollTop: blockHeight
        },
        700
      );
    }, 150);
  };

  generateConfig = () => {
    let outputBlock = this.ExtensionsGuides[this.state.selectedExtension].isWodle
      ? `<wodle name="${this.state.selectedExtension}">`
      : `<${this.state.selectedExtension}>`;
    for (let idx_option in this.state.options) {
      const option = this.state.options[idx_option];
      //$scope.showExtraAttr(option) ? $scope.openExtraAttr(option) : ''

      if (option.type === 'switch') {
        // Switch
        if (
          option.required ||
          (option.value !== undefined &&
            !option.required &&
            (option['default_value'] == undefined ||
              option.value !== option['default_value']))
        ) {
          outputBlock += `\n\t<${option.name}>${
            option.value === undefined
              ? option.default_value
                ? 'yes'
                : 'no'
              : option.value
              ? 'yes'
              : 'no'
          }</${option.name}>`;
        }
      } else if (option.type === 'input') {
        // Input
        if (option.value || option.extraTag || option.required) {
          let extraAttributes = '';
          if (option.extraAttr) {
            // add extra attributes
            for (let attrKey in option.extraAttr) {
              const attrDefaultValue = option.extraAttr[attrKey].default_value;
              const currentAttrValue = option.extraAttr[attrKey].value;

              if (
                currentAttrValue !== undefined &&
                attrDefaultValue !== currentAttrValue
              ) {
                // Add attribute only if its value is different from default value
                if (option.extraAttr[attrKey].type === 'switch') {
                  extraAttributes += ` ${attrKey}="${
                    currentAttrValue ? 'yes' : 'no'
                  }"`;
                } else if (option.extraAttr[attrKey].type === 'input') {
                  extraAttributes += ` ${attrKey}="${currentAttrValue}"`;
                }
              }
            }
          }
          let startExtraTag = '';
          let endExtraTag = '';
          if (option.extraTag) {
            startExtraTag = `\n\t\t<${option.extraTag}>`;
            endExtraTag = `</${option.extraTag}>\n\t`;
          }
          const value = option.value
            ? `${startExtraTag}${option.value}${endExtraTag}`
            : option.default_value || '';
          const nameAndValue =
            !value && !extraAttributes
              ? ''
              : `\n\t<${option.name}${extraAttributes}>${value}</${option.name}>`;
          outputBlock += nameAndValue;
        }
      } else if (option.type === 'list') {
        // List - Area text
        if (option.value) {
          const tmpValuesList = option.value.split('\n');
          for (var i = 0; i < tmpValuesList.length; i++) {
            if (tmpValuesList[i]) {
              let extraAttributes = '';
              if (option.extraAttr) {
                // add extra attributes
                for (let attrKey in option.extraAttr) {
                  const attrDefaultValue =
                    option.extraAttr[attrKey].default_value;
                  const currentAttrValue = option.extraAttr[attrKey].value;

                  if (
                    attrDefaultValue !== currentAttrValue ||
                    option.required
                  ) {
                    // Add attribute only if its value is different from default value
                    extraAttributes += ` ${attrKey}="${
                      currentAttrValue ? 'yes' : 'no'
                    }"`;
                  }
                }
              }
              outputBlock += `\n\t<${option.name}${extraAttributes}>${tmpValuesList[i]}</${option.name}>`;
            }
          }
        }
      } else if (option.type === 'select') {
        // Select
          outputBlock += `\n\t<${option.name}>${option.value || option.values[0]}</${option.name}>`;
      }
    }
    outputBlock += this.ExtensionsGuides[this.state.selectedExtension].isWodle
      ? `\n</wodle>`
      : `\n</${this.state.selectedExtension}>`;
    this.outputBlock = outputBlock;
    this.forceUpdate();
    setTimeout(() => this.scrollToBottom(), 100);
  };

  togglePopover = () => {
    this.setState({
      isPopoverOpen: !this.state.isPopoverOpen
    });
  };

  buildPopoverRows(option, optionIdx) {
    const entries = Object.entries(option.extraAttr).map((attr, idx) => {
      return (
        <div key={idx}>
          {attr[1].type === 'switch' && (
            <EuiFormRow style={{ marginTop: '0px' }}>
              <EuiSwitch
                name="switch"
                label={attr[0]}
                onChange={e => this.extraAttrChange(optionIdx, attr[0], e)}
                checked={
                  attr[1].value === undefined
                    ? attr[1]['default_value'] || false
                    : attr[1].value
                }
              />
            </EuiFormRow>
          )}
          {attr[1].type === 'input' && (
            <EuiFormRow style={{ marginTop: '0px' }} label={attr[0]}>
              <EuiFieldText
                key={idx}
                value={attr[1].value}
                onChange={e => this.extraAttrChange(optionIdx, attr[0], e)}
                aria-label=""
              />
            </EuiFormRow>
          )}
        </div>
      );
    });

    return <div>{entries}</div>;
  }

  render() {
    const editConfigChildren = (
      <Fragment>
        {this.outputBlock && this.extraSteps && (
          <EuiCallOut
            color="warning"
            iconType="alert"
            style={{ marginBottom: '8px' }}
            title={this.extraSteps}
          ></EuiCallOut>
        )}
        {this.outputBlock && this.docsLink && (
          <EuiCallOut
            iconType="questionInCircle"
            style={{ marginBottom: '8px' }}
            title="Some extra steps are needed to configure this extension. Please visit our documentation:"
          >
            <EuiLink href={this.docsLink} target="_blank">
              {this.docsLink}
            </EuiLink>
          </EuiCallOut>
        )}
        {this.outputBlock && (
          <div>
            <EuiCodeBlock language="xml">{this.outputBlock}</EuiCodeBlock>
          </div>
        )}
      </Fragment>
    );

    const popoverButton = (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiButtonIcon
            onClick={this.togglePopover}
            iconType="gear"
            aria-label="Next"
            style={{ paddingTop: '5px' }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );

    const form = (this.state.options || []).map((option, idx) => {
      return (
        <Fragment key={option.name}>
          {(option.required ||
            (!option.required && this.state.showAdvanced)) && (
            <EuiFlexGroup>
              <EuiFlexItem>
                {' '}
                <EuiTitle style={{ paddingTop: '5px' }} size="s">
                  <h4>{option.name}</h4>
                </EuiTitle>
                <EuiTextColor
                  color="subdued"
                  style={{
                    opacity: '0.75',
                    fontSize: '12px',
                    lineHeight: '14px'
                  }}
                >
                  {option.description}
                </EuiTextColor>
              </EuiFlexItem>
              <EuiFlexItem style={{ paddingTop: '15px' }}>
                <div>
                  {option.type === 'input' && (
                    <EuiFieldText
                      key={idx}
                      placeholder={option.extraTag || ''}
                      value={option.value}
                      onChange={e => this.setValue(idx, e)}
                      aria-label=""
                    />
                  )}
                  {option.extraAttr && (
                    <div>
                      <EuiFlexGroup>
                        <EuiFlexItem>
                          <EuiPopover
                            ownFocus
                            button={popoverButton}
                            isOpen={this.state.isPopoverOpen}
                            closePopover={() => this.togglePopover()}
                          >
                            {this.buildPopoverRows(option, idx)}
                          </EuiPopover>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </div>
                  )}

                  {option.type === 'switch' && (
                    <EuiSwitch
                      key={idx}
                      label={''}
                      onChange={e => this.setSwitch(idx, e)}
                      checked={
                        option.value === undefined
                          ? option['default_value'] || false
                          : option.value
                      }
                    />
                  )}

                  {option.type === 'select' && (
                    <EuiSelect
                      key={idx}
                      options={option.values.map(x => {
                        return { value: x, text: x };
                      })}
                      value={option.value}
                      onChange={e => this.setValue(idx, e)}
                    />
                  )}

                  {option.type === 'list' && (
                    <EuiTextArea
                      key={idx}
                      placeholder="One entry per line"
                      label={''}
                      onChange={e => this.setValue(idx, e)}
                      value={option.value}
                    />
                  )}
                </div>
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
          {idx === this.state.options.length - 1 && (
            <EuiFlexGroup>
              <EuiFlexItem>
                {(this.state.options || []).filter(x => x.required).length !== (this.state.options || []).length && (
                <EuiButtonEmpty
                  onClick={this.showAdvancedOptions}
                  style={{ marginTop: '25px' }}
                >
                  {(this.state.showAdvanced && `Hide advanced options`) ||
                    `Show advanced options`}
                </EuiButtonEmpty>
                )}
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiButton
                  fill
                  onClick={() => this.generateConfig()}
                  style={{ marginTop: '25px' }}
                >
                  Generate configuration
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </Fragment>
      );
    });

    const selectExtensionChildren = (
      <Fragment>
        <EuiSuperSelect
          options={this.extensions}
          valueOfSelected={this.state.selectedExtension}
          onChange={this.onChange}
          hasDividers
          fullWidth={true}
          popoverClassName={'wz-max-height-400'}
        />
      </Fragment>
    );

    const steps = [
      {
        title: 'Select a extension',
        children: selectExtensionChildren
      },
      {
        title: 'Configure the extension',
        children: form
      },
      {
        title: 'Copy the configuration',
        children: editConfigChildren,
        status: this.outputBlock ? this.statuses[0] : this.state.status
      }
    ];

    const view = (
      <EuiFlexItem id={'ExtensionsGuideElement'}>
        <EuiFlyoutHeader hasBorder>
          <EuiFlexGroup gutterSize="xs">
            <EuiTitle size="s">
              <h2>How to configure extensions</h2>
            </EuiTitle>
            <EuiFlexItem />
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                color={'text'}
                onClick={() => this.props.close()}
                iconType="cross"
                aria-label="Close"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>
        <EuiSpacer />
        <EuiSteps firstStepNumber={1} steps={steps} />
        {
          <div
            style={{ float: 'left', clear: 'both' }}
            ref={el => {
              this.messagesEnd = el;
            }}
          ></div>
        }
      </EuiFlexItem>
    );

    return view;
  }
}

WzExtensionGuide.propTypes = {
  selectedExtension: PropTypes.string,
  close: PropTypes.func,
  isAgent: PropTypes.bool
};