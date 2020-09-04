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
  EuiButton,
  EuiCodeEditor,
  EuiPanel,
  EuiCodeBlock
} from '@elastic/eui';

import GroupsHandler from './utils/groups-handler';

import { toastNotifications } from 'ui/notify';
import 'brace/theme/textmate';
import { validateXML } from '../configuration/utils/xml';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';

class WzGroupsEditor extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.codeEditorOptions = {
      fontSize: '14px',
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    };
    this.groupsHandler = GroupsHandler;
    const { fileContent } = this.props.state;

    const { name, content, isEditable, groupName } = fileContent;

    this.state = {
      error: false,
      isSaving: false,
      content,
      name,
      isEditable,
      groupName: groupName
    };
  }

  updateHeight = () => {
    this.height = window.innerHeight - 275; //eslint-disable-line
    this.forceUpdate();
  };

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
        const warning = Object.assign(error, {
          savedMessage: `File ${name} saved, but there were found several error while validating the configuration.`
        });
        this.setState({ isSaving: false });
        this.showToast('warning', warning.savedMessage, error, 3000);
        return;
      }
      this.setState({ isSaving: false });
      const textSuccess = 'File successfully edited';
      this.showToast('success', 'Success', textSuccess, 3000);
    } catch (error) {
      this.setState({ error, isSaving: false });
      this.showToast(
        'danger',
        'Error',
        'Error saving group configuration: ' + error,
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

  render() {
    const { name, content, isEditable, groupName } = this.state;

    const xmlError = validateXML(content);
    const saveButton = (
      <WzButtonPermissions
        permissions={[{action: 'group:update_config', resource: `group:id:${groupName}`}]}
        fill
        iconType={(isEditable && xmlError) ? "alert" : "save"}
        isLoading={this.state.isSaving}
        isDisabled={name.length <= 4 || (isEditable && xmlError ? true : false)}
        onClick={() => this.save(name)}
      >
        {(isEditable && xmlError) ? 'XML format error' : 'Save'}
      </WzButtonPermissions>
    );

    return (
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
                          onClick={() => this.props.cleanFileContent()}
                        />
                      </EuiToolTip>
                      {name} <span style={{ color: 'grey'}}>of</span> {groupName} <span style={{ color: 'grey'}}>group</span>
                    </span>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem />
                {isEditable && (
                  <EuiFlexItem grow={false}>{saveButton}</EuiFlexItem>
                )}
              </EuiFlexGroup>
              <EuiSpacer size="m" />
              {xmlError && (
                <Fragment>
                  <span style={{ color: 'red' }}> {xmlError}</span>
                  <EuiSpacer size='s'/>
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
                          height={`calc(100vh - ${(xmlError ? 195 : 175)}px)`}
                          value={content}
                          onChange={newContent =>
                            this.setState({ content: newContent })
                          }
                          mode="xml"
                          wrapEnabled
                          setOptions={this.codeEditorOptions}
                          aria-label="Code Editor"
                        ></EuiCodeEditor>
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
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.groupsReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    cleanFileContent: () => dispatch(cleanFileContent())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzGroupsEditor);
