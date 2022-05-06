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
import { cleanFileContent } from '../../../../../redux/actions/groupsActions';
import validateConfigAfterSent from './utils/valid-configuration';

// Eui components
import {
  EuiPage,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiCodeEditor,
  EuiConfirmModal,
  EuiPanel,
  EuiCodeBlock,
  EuiOverlayMask
} from '@elastic/eui';

import GroupsHandler from './utils/groups-handler';

import { getToasts } from '../../../../../kibana-services';
import { validateXML } from '../configuration/utils/xml';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import { WzOverlayMask } from '../../../../../components/common/util';
import 'brace/theme/textmate';
import 'brace/mode/xml';
import 'brace/snippets/xml';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';


class WzGroupsEditor extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.codeEditorOptions = {
      fontSize: '14px',
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true,
    };
    this.groupsHandler = GroupsHandler;
    const { fileContent } = this.props.state;

    const { name, content, isEditable, groupName } = fileContent;

    this.state = {
      error: false,
      isSaving: false,
      content,
      name,
      isModalVisible: false,
      hasChanges: false,
      isEditable,
      initContent: content,
      groupName: groupName,
    };
  }

  updateHeight = () => {
    this.height = window.innerHeight - 275; //eslint-disable-line
    this.forceUpdate();
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.content !== this.state.content) {
      this.setState({ hasChanges: this.state.content !== this.state.initContent });
    }
  }

  componentWillUnmount() {
    // When the component is going to be unmounted its info is clear
    this._isMounted = false;
    window.removeEventListener('resize', this.updateHeight); //eslint-disable-line
  }

  componentDidMount() {
    this._isMounted = true;
    this.height = window.innerHeight - 275; //eslint-disable-line
    window.addEventListener('resize', this.updateHeight); //eslint-disable-line
    this.forceUpdate();
  }

  /**
   * Save the new content
   * @param {String} name
   */
  async save(name) {
    if (!this._isMounted) {
      return;
    }
    try {
      const { content, groupName } = this.state;
      this.setState({ isSaving: true, error: false });
      let saver = this.groupsHandler.sendGroupConfiguration;
      await saver(name, groupName, content);
      try {
        await validateConfigAfterSent();
      } catch (error) {
        this.setState({ isSaving: false });
        throw new Error(
          (error.title = `File ${name} saved, but there were found several error while validating the configuration.`)
        );
      }
      this.setState({ isSaving: false, hasChanges: false });
      const textSuccess = 'File successfully edited';
      this.showToast('success', 'Success', textSuccess, 3000);
    } catch (error) {
      const options = {
        context: `${WzGroupsEditor.name}.save`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.CRITICAL,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.title || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      this.setState({ error, isSaving: false });
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

  render() {
    const { name, content, isEditable, groupName } = this.state;

    const xmlError = validateXML(content);
    const saveButton = (
      <WzButtonPermissions
        permissions={[
          { action: 'group:update_config', resource: `group:id:${groupName}` },
          { action: 'cluster:status', resource: '*:*:*' },
        ]}
        fill
        iconType={isEditable && xmlError ? 'alert' : 'save'}
        isLoading={this.state.isSaving}
        isDisabled={name.length <= 4 || (isEditable && xmlError ? true : false)}
        onClick={() => this.save(name)}
      >
        {isEditable && xmlError ? 'XML format error' : 'Save'}
      </WzButtonPermissions>
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
              this.props.cleanFileContent();
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
                    <EuiTitle>
                      <span style={{ fontSize: '22px' }}>
                        <EuiToolTip position="right" content={`Back to groups`}>
                          <EuiButtonIcon
                            aria-label="Back"
                            color="primary"
                            iconSize="l"
                            iconType="arrowLeft"
                            onClick={() => {
                              if (this.state.hasChanges) {
                                showModal();
                              } else {
                                this.props.cleanFileContent();
                              }
                            }}
                          />
                        </EuiToolTip>
                        {name} <span style={{ color: 'grey' }}>of</span> {groupName}{' '}
                        <span style={{ color: 'grey' }}>group</span>
                      </span>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem />
                  {isEditable && <EuiFlexItem grow={false}>{saveButton}</EuiFlexItem>}
                </EuiFlexGroup>
                <EuiSpacer size="m" />
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
                        {(isEditable && (
                          <EuiCodeEditor
                            theme="textmate"
                            width="100%"
                            height={`calc(100vh - ${xmlError ? 250 : 230}px)`}
                            value={content}
                            onChange={(newContent) => this.setState({ content: newContent })}
                            mode="xml"
                            wrapEnabled
                            setOptions={this.codeEditorOptions}
                            aria-label="Code Editor"
                          />
                        )) || (
                          <EuiCodeBlock
                            language="json"
                            fontSize="m"
                            paddingSize="m"
                            overflowHeight={this.height}
                          >
                            {content}
                          </EuiCodeBlock>
                        )}
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

const mapStateToProps = (state) => {
  return {
    state: state.groupsReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    cleanFileContent: () => dispatch(cleanFileContent()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzGroupsEditor);
