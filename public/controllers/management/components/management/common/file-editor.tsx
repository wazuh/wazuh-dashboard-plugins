/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
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

import 'brace/theme/textmate';
// Eui components
import {
  EuiPage,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiOverlayMask,
  EuiFieldText,
  EuiConfirmModal,
  EuiCodeEditor,
  EuiPanel,
} from '@elastic/eui';

import { resourceDictionary, ResourcesHandler } from './resources-handler';
import validateConfigAfterSent from './valid-configuration';

import { getToasts } from '../../../../../kibana-services';
import { updateWazuhNotReadyYet } from '../../../../../redux/actions/appStateActions';
import WzRestartClusterManagerCallout from '../../../../../components/common/restart-cluster-manager-callout';
import { validateXML } from '../configuration/utils/xml';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import 'brace/theme/textmate';
import 'brace/mode/xml';
import 'brace/snippets/xml';
import 'brace/ext/language_tools';
import "brace/ext/searchbox";
import _ from 'lodash';

import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';

class WzFileEditor extends Component {
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
      enableLiveAutocompletion: false,
    };
    this.resourcesHandler = new ResourcesHandler(this.props.section);
    const { fileContent, addingFile } = this.props;
    const { name, content, path } = fileContent ? fileContent : addingFile;

    this.state = {
      isSaving: false,
      error: false,
      inputValue: '',
      initialInputValue: '',
      showWarningRestart: false,
      isModalVisible: false,
      initContent: content,
      content,
      name,
      path,
    };
  }

  componentWillUnmount() {
    // When the component is going to be unmounted its info is clear
    this._isMounted = false;
    this.props.cleanEditState();
  }

  componentDidMount() {
    this._isMounted = true;
  }

  /**
   * Check if the file content has changed and is not empty
   */
  contentHasChanged() {
    return !!this.state.content.trim() && (this.state.content.trim() !== this.state.initContent.trim());
  } 

  /**
   * Save the new content
   * @param {String} name
   * @param {Boolean} overwrite
   */
  async save(name, overwrite = true) {
    if (!this._isMounted) {
      return;
    }else if(/\s/.test(name)) {
      this.showToast('warning', 'Warning', `The ${this.props.section} name must not contain spaces.`, 3000);
      return;
    }  
    try {
      const { content } = this.state;

      this.setState({ isSaving: true, error: false });

      await this.resourcesHandler.updateFile(name, content, overwrite);
      try {
        await validateConfigAfterSent();
      } catch (error) {
        const options = {
          context: `${WzFileEditor.name}.save`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message:`The content of the file ${name} is incorrect. There were found several errors while validating the configuration: ${error.message || error}`,
            title: `Error file content is incorrect: ${error.message || error}`,
          },
        };
        getErrorOrchestrator().handleError(options);
        this.setState({ isSaving: false });
        this.goToEdit(name);

        let toastMessage;

        if (this.props.addingFile != false) {
          //remove current invalid file if the file is new.
          await this.resourcesHandler.deleteFile(name);
          toastMessage = 'The new file was deleted.';
        } else {
          //restore file to previous version
          await this.resourcesHandler.updateFile(name, this.state.initContent, overwrite);
          toastMessage = 'The content file was restored to previous state.';
        }

        this.showToast('success', 'Success', toastMessage, 3000);
        return;
      }
      this.setState({ isSaving: false });
      this.goToEdit(name);
      this.setState({
        showWarningRestart: true,
        initialInputValue: this.state.inputValue,
        initContent: content,
      });

    } catch (error) {
      let errorMessage;
      if (error instanceof Error) {
        errorMessage = error.details
          ? error.details
          : String(error);
      }
      this.setState({ error, isSaving: false });
      const options = {
        context: `${WzFileEditor.name}.save`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: errorMessage || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  goToEdit = (name) => {
    const { content, path } = this.state;
    const file = { name: name, content: content, path: path };
    this.props.updateFileContent(file);
  };

  /**
   * onChange the input value in case adding new file
   */
  onChange = (e) => {
    this.setState({
      inputValue: e.target.value,
    });
  };

  render() {
    const { section, addingFile, fileContent } = this.props;
    const { wazuhNotReadyYet } = this.props;
    const { name, content, path, showWarningRestart } = this.state;
    const isRules = path.includes('rules') ? 'Ruleset Test' : 'Decoders Test';

    const isEditable = addingFile
      ? true
      : path !== 'ruleset/rules' && path !== 'ruleset/decoders';
    let nameForSaving = addingFile ? this.state.inputValue : name;
    nameForSaving = nameForSaving.endsWith('.xml') ? nameForSaving : `${nameForSaving}.xml`;
    const overwrite = fileContent ? true : false;

    const xmlError = validateXML(content);

    const onClickOpenLogtest = () => {
      this.props.logtestProps.openCloseFlyout();
    };

    const buildLogtestButton = () => {
      return (
        <WzButtonPermissions
          buttonType="empty"
          permissions={[{ action: 'logtest:run', resource: `*:*:*` }]}
          color="primary"
          iconType="documentEdit"
          style={{ margin: '0px 8px', cursor: 'pointer' }}
          onClick={onClickOpenLogtest}
        >
          {isRules}
        </WzButtonPermissions>
      );
    };

    const headerButtons = (
      <>
        {buildLogtestButton()}
        <WzButtonPermissions
          permissions={[
            {
              action: `${section}:update`,
              resource: resourceDictionary[section].permissionResource(nameForSaving),
            },
          ]}
          fill
          iconType={isEditable && xmlError ? 'alert' : 'save'}
          isLoading={this.state.isSaving}
          isDisabled={nameForSaving.length <= 4 || !!(isEditable && xmlError) || !this.contentHasChanged()}
          onClick={() => this.save(nameForSaving, overwrite)}
        >
          {isEditable && xmlError ? 'XML format error' : 'Save'}
        </WzButtonPermissions>
      </>
    );

    const closeModal = () => this.setState({ isModalVisible: false });
    const showModal = () => this.setState({ isModalVisible: true });

    let modal;
    if (this.state.isModalVisible) {
      modal = (
        <EuiOverlayMask>
          <EuiConfirmModal
            title="Unsubmitted changes"
            onConfirm={() => {
              closeModal;
              this.props.cleanEditState();
            }}
            onCancel={closeModal}
            cancelButtonText="No, don't do it"
            confirmButtonText="Yes, do it"
          >
            <p style={{ textAlign: 'center' }}>
              There are unsaved changes. Are you sure you want to proceed?
            </p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      );
    }
    return (
      <>
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
                          <EuiToolTip position="right" content={`Back to ${section}`}>
                            <EuiButtonIcon
                              aria-label="Back"
                              color="primary"
                              iconSize="l"
                              iconType="arrowLeft"
                              onClick={() => {
                                if (
                                  this.state.content !== this.state.initContent ||
                                  this.state.inputValue !== this.state.initialInputValue
                                ) {
                                  showModal();
                                } else {
                                  this.props.cleanEditState();
                                }
                              }}
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
                        <span style={{ fontSize: '22px' }}>
                          <EuiToolTip position="right" content={`Back to ${section}`}>
                            <EuiButtonIcon
                              aria-label="Back"
                              color="primary"
                              iconSize="l"
                              iconType="arrowLeft"
                              onClick={() => {
                                if (
                                  this.state.content !== this.state.initContent ||
                                  this.state.inputValue !== this.state.initialInputValue
                                ) {
                                  showModal();
                                } else {
                                  this.props.cleanEditState();
                                }
                              }}
                            />
                          </EuiToolTip>
                          {nameForSaving}
                        </span>
                      </EuiTitle>
                    )}
                  </EuiFlexItem>
                  <EuiFlexItem />
                  {/* This flex item is for separating between title and save button */}
                  {isEditable && (
                    <EuiFlexItem style={{ display: 'block' }} grow={false}>
                      {headerButtons}
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
                <EuiSpacer size="m" />
                {this.state.showWarningRestart && (
                  <Fragment>
                    <WzRestartClusterManagerCallout
                      onRestarted={() => this.setState({ showWarningRestart: false })}
                      onRestartedError={() => this.setState({ showWarningRestart: true })}
                    />
                    <EuiSpacer size="s" />
                  </Fragment>
                )}
                {xmlError && (
                  <Fragment>
                    <span style={{ color: 'red' }}> {xmlError}</span>
                    <EuiSpacer size="s" />
                  </Fragment>
                )}
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiFlexGroup>
                      <EuiFlexItem className="codeEditorWrapper">
                        <EuiCodeEditor
                          theme="textmate"
                          width="100%"
                          height={`calc(100vh - ${
                            (showWarningRestart && !xmlError) || wazuhNotReadyYet
                              ? 300
                              : xmlError
                              ? !showWarningRestart
                                ? 245
                                : 350
                              : 230
                          }px)`}
                          value={content}
                          onChange={(newContent) => {
                            this.setState({ content: newContent });
                          }}
                          mode="xml"
                          isReadOnly={!isEditable}
                          wrapEnabled
                          setOptions={this.codeEditorOptions}
                          aria-label="Code Editor"
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiPage>
        {modal}
      </>
    );
  }
}

const mapStateToProps = state => {
  return {
    wazuhNotReadyYet: state.appStateReducers.wazuhNotReadyYet,
    showFlyout: state.appStateReducers.showFlyoutLogtest,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateWazuhNotReadyYet: wazuhNotReadyYet => dispatch(updateWazuhNotReadyYet(wazuhNotReadyYet)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzFileEditor);
