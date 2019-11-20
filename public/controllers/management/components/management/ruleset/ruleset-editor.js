/*
 * Wazuh app - React component for registering agents.
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

import { connect } from 'react-redux';
import {
  cleanInfo
} from '../../../../../redux/actions/rulesetActions';

// Eui components
import {
  EuiPage,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiButton,
  EuiCallOut,
  EuiFieldText,
  EuiCodeEditor,
  EuiPanel,
} from '@elastic/eui';

import RulesetHandler from './utils/ruleset-handler';
import validateConfigAfterSent from './utils/valid-configuration';

class WzRulesetEditor extends Component {
  constructor(props) {
    super(props);
    this.codeEditorOptions = {
      fontSize: '14px',
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    }
    this.rulesetHandler = RulesetHandler;
    const { fileContent, addingRulesetFile } = this.props.state;
    const { name, content, path } = addingRulesetFile ? addingRulesetFile : fileContent;

    this.state = {
      isSaving: false,
      error: false,
      savedComplete: false,
      warning: false,
      inputValue: '',
      content,
      name,
      path,
    }
  }

  componentWillUnmount() {
    // When the component is going to be unmounted its info is clear
    this.props.cleanInfo();
  }

  /**
   * Save the new content 
   * @param {String} name 
   * @param {Boolean} overwrite 
   */
  async save(name, overwrite = true) {
    try {
      const { content } = this.state
      this.setState({ isSaving: true, error: false, savedComplete: false });
      const { section } = this.props.state;
      let saver = this.rulesetHandler.sendRuleConfiguration; // By default the saver is for rules
      if (section === 'decoders') saver = this.rulesetHandler.sendDecoderConfiguration;
      await saver(name, content , overwrite);
      try {
        await validateConfigAfterSent();
      } catch (error) {
        const warning = Object.assign(error, { savedMessage: `File ${name} saved, but there were found several error while validating the configuration.` });
        this.setState({ warning, isSaving: false })
        return;
      }
      this.setState({ savedComplete: true, isSaving: false });
    } catch (error) {
      this.setState({ error, isSaving: false });
    }
  }

  /**
   * onChange the input value in case adding new file
   */
  onChange = e => {
    this.setState({
      inputValue: e.target.value,
    });
  };

  render() {
    const { section, adminMode, addingRulesetFile } = this.props.state;
    const { name, content, path } = this.state;
    const isEditable = addingRulesetFile ? true : (path !== 'ruleset/rules' && path !== 'ruleset/decoders' && adminMode);
    let nameForSaving = addingRulesetFile ? this.state.inputValue : name;
    nameForSaving = name.endsWith('.xml') ? nameForSaving : `${nameForSaving}.xml`;
    const overwrite = !addingRulesetFile;

    const saveButton = (
      <EuiButton
        fill
        iconType="save"
        isLoading={this.state.isSaving}
        isDisabled={nameForSaving.length <= 4}
        onClick={() => this.save(nameForSaving, overwrite)}>
        Save
      </EuiButton>
    );

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              {/* File name and back button */}
              <EuiFlexGroup>
                <EuiFlexItem>
                  {!addingRulesetFile && (
                    <EuiTitle>
                      <h2>
                        <EuiToolTip position="right" content={`Back to ${section}`}>
                          <EuiButtonIcon
                            aria-label="Back"
                            color="subdued"
                            iconSize="l"
                            iconType="arrowLeft"
                            onClick={() => this.props.cleanInfo()} />
                        </EuiToolTip>
                        {nameForSaving}
                      </h2>
                    </EuiTitle>
                  ) || (
                      <EuiFlexGroup>
                        <EuiFlexItem grow={false}>
                          <EuiToolTip position="right" content={`Back to ${section}`}>
                            <EuiButtonIcon
                              aria-label="Back"
                              color="subdued"
                              iconSize="l"
                              iconType="arrowLeft"
                              onClick={() => this.props.cleanInfo()} />
                          </EuiToolTip>
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiFieldText
                            style={{ width: '300px' }}
                            placeholder={`Type your new ${section} file name here`}
                            value={this.state.inputValue}
                            onChange={this.onChange}
                            aria-label="aria-label to prevent react warning"
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    )}
                </EuiFlexItem>
                <EuiFlexItem />{/* This flex item is for separating between title and save button */}
                {isEditable && (
                  <EuiFlexItem grow={false}>
                    {saveButton}
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
              <EuiSpacer size="m" />
              <EuiFlexGroup>
                <EuiFlexItem>
                  {/* If everythin was ok while saving */}
                  {this.state.savedComplete && (
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiCallOut color="success" iconType="check" title={`File ${nameForSaving} was successfully saved`} />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  )}
                  {/* If there was any error while saving */}
                  {this.state.error && (
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiCallOut color="danger" iconType="cross" title={this.state.error} />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  )}
                  {/* If there was any warning while saving */}
                  {this.state.warning && (
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiCallOut color="warning">
                          <span style={{ color: '#c3880a' }}>{this.state.warning.savedMessage}</span>
                          <EuiToolTip position="top" content={this.state.warning.details}>
                            <EuiButtonIcon
                              color="primary"
                              iconType="questionInCircle"
                              aria-label="Info about the error"
                            />
                          </EuiToolTip>
                        </EuiCallOut>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  )}
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiCodeEditor
                        width="100%"
                        value={content}
                        onChange={newContent => this.setState({content: newContent})}
                        mode="xml"
                        isReadOnly={!isEditable}
                        setOptions={this.codeEditorOptions}
                        aria-label="Code Editor"
                      ></EuiCodeEditor>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage >
    )
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    cleanInfo: () => dispatch(cleanInfo())
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetEditor);
