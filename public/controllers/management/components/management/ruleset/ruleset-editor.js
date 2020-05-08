/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';

import { connect } from 'react-redux';
import {
  cleanInfo,
  updateFileContent
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
  EuiFieldText,
  EuiCodeEditor,
  EuiPanel
} from '@elastic/eui';

import RulesetHandler from './utils/ruleset-handler';
import validateConfigAfterSent from './utils/valid-configuration';

import { toastNotifications } from 'ui/notify';
import { updateWazuhNotReadyYet } from '../../../../../redux/actions/appStateActions';
import WzRestartClusterManagerCallout from '../../../../../components/common/restart-cluster-manager-callout';

class WzRulesetEditor extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.codeEditorOptions = {
      fontSize: '14px',
      displayIndentGuides: false,
      indentedSoftWrap: false,
      behavioursEnabled: false,
      animatedScroll: true,
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: false
    };
    this.rulesetHandler = RulesetHandler;
    const { fileContent, addingRulesetFile } = this.props.state;
    const { name, content, path } = fileContent
      ? fileContent
      : addingRulesetFile;

    this.state = {
      isSaving: false,
      error: false,
      inputValue: '',
      showWarningRestart: false,
      content,
      name,
      path,
    };
  }

  componentWillUnmount() {
    // When the component is going to be unmounted its info is clear
    this._isMounted = false;
    this.props.cleanInfo();
  }

  componentDidMount() {
    this._isMounted = true;
  }

  /**
   * Save the new content
   * @param {String} name
   * @param {Boolean} overwrite
   */
  async save(name, overwrite = true) {
    if (!this._isMounted) {
      return;
    }
    try {
      const { content } = this.state;
      this.setState({ isSaving: true, error: false });
      const { section } = this.props.state;
      let saver = this.rulesetHandler.sendRuleConfiguration; // By default the saver is for rules
      if (section === 'decoders')
        saver = this.rulesetHandler.sendDecoderConfiguration;
      await saver(name, content, overwrite);
      try {
        await validateConfigAfterSent();
      } catch (error) {
        const warning = Object.assign(error, {
          savedMessage: `File ${name} saved, but there were found several error while validating the configuration.`
        });
        this.setState({ isSaving: false });
        this.goToEdit(name);
        this.showToast('warning', warning.savedMessage, warning.details, 3000);
        return;
      }
      this.setState({ isSaving: false });
      this.goToEdit(name);

      let textSuccess = 'New file successfully created';
      if (overwrite) {
        textSuccess = 'File successfully edited';
      }
      this.setState({ showWarningRestart: true});
      this.showToast('success', 'Success', textSuccess, 3000);
    } catch (error) {
      this.setState({ error, isSaving: false });
      this.showToast(
        'danger',
        'Error',
        'Error saving CDB list: ' + error,
        3000
      );
    }
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  goToEdit = name => {
    const { content, path } = this.state;
    const file = { name: name, content: content, path: path };
    this.props.updateFileContent(file);
  };

  /**
   * onChange the input value in case adding new file
   */
  onChange = e => {
    this.setState({
      inputValue: e.target.value
    });
  };

  render() {
    const {
      section,
      adminMode,
      addingRulesetFile,
      fileContent
    } = this.props.state;
    const { wazuhNotReadyYet } = this.props;
    const { name, content, path, showWarningRestart } = this.state;
    const isEditable = addingRulesetFile
      ? true
      : path !== 'ruleset/rules' && path !== 'ruleset/decoders' && adminMode;
    let nameForSaving = addingRulesetFile ? this.state.inputValue : name;
    nameForSaving = name.endsWith('.xml')
      ? nameForSaving
      : `${nameForSaving}.xml`;
    const overwrite = fileContent ? true : false;

    const saveButton = (
      <EuiButton
        fill
        iconType="save"
        isLoading={this.state.isSaving}
        isDisabled={nameForSaving.length <= 4}
        onClick={() => this.save(nameForSaving, overwrite)}
      >
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
                  {(!fileContent && (
                    <EuiFlexGroup>
                      <EuiFlexItem grow={false}>
                        <EuiToolTip
                          position="right"
                          content={`Back to ${section}`}
                        >
                          <EuiButtonIcon
                            aria-label="Back"
                            color="primary"
                            iconSize="l"
                            iconType="arrowLeft"
                            onClick={() => this.props.cleanInfo()}
                          />
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
                  )) || (
                    <EuiTitle>
                      <h2>
                        <EuiToolTip
                          position="right"
                          content={`Back to ${section}`}
                        >
                          <EuiButtonIcon
                            aria-label="Back"
                            color="primary"
                            iconSize="l"
                            iconType="arrowLeft"
                            onClick={() => this.props.cleanInfo()}
                          />
                        </EuiToolTip>
                        {nameForSaving}
                      </h2>
                    </EuiTitle>
                  )}
                </EuiFlexItem>
                <EuiFlexItem />
                {/* This flex item is for separating between title and save button */}
                {isEditable && (
                  <EuiFlexItem grow={false}>{saveButton}</EuiFlexItem>
                )}
              </EuiFlexGroup>
              <EuiSpacer size="m" />
              {this.state.showWarningRestart && (
                <Fragment>
                  <WzRestartClusterManagerCallout
                    onRestart={() => this.setState({showWarningRestart: true})}
                    onRestarted={() => this.setState({showWarningRestart: false})}
                    onRestartedError={() => this.setState({showWarningRestart: false})}
                  />
                  <EuiSpacer size='s'/>
                </Fragment>
              )}
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFlexGroup>
                    <EuiFlexItem className="codeEditorWrapper">
                      <EuiCodeEditor
                        width="100%"
                        height={`calc(100vh - ${showWarningRestart || wazuhNotReadyYet ? 250 : 175}px)`}
                        value={content}
                        onChange={newContent =>
                          this.setState({ content: newContent })
                        }
                        mode="xml"
                        isReadOnly={!isEditable}
                        wrapEnabled
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
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers,
    wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet
  };
};

const mapDispatchToProps = dispatch => {
  return {
    cleanInfo: () => dispatch(cleanInfo()),
    updateFileContent: content => dispatch(updateFileContent(content)),
    updateWazuhNotReadyYet: wazuhNotReadyYet => dispatch(updateWazuhNotReadyYet(wazuhNotReadyYet))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzRulesetEditor);
