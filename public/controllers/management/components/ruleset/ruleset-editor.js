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


import CodeMirror from 'react-codemirror';
import 'codemirror/mode/xml/xml';

import { connect } from 'react-redux';
import {
  updateRulesetSection,
  updateLoadingStatus,
  updateItems,
  toggleShowFiles,
  cleanFilters,
  cleanInfo
} from '../../../../redux/actions/rulesetActions';

// Eui components
import {
  EuiPage,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiButton
} from '@elastic/eui';

import RulesetHandler from './utils/ruleset-handler';

class WzRulesetEditor extends Component {
  constructor(props) {
    super(props);
    this.codeMirrorOptions = {
      lineNumbers: true,
      lineWrapping: true,
      matchClosing: true,
      matchBrackets: true,
      mode: 'text/xml',
      //theme: IS_DARK_THEME ? 'lesser-dark' : 'ttcn',
      foldGutter: true,
      styleSelectedText: true,
      gutters: ['CodeMirror-foldgutter']
    }
    this.codeMirrorContent = this.props.state.fileContent.content;
    this.rulesetHandler = RulesetHandler;
    this.state = {
      isSaving: false
    }
  }


  /**
   * Save the new content 
   * @param {String} name 
   * @param {Boolean} overwrite 
   */
  async save(name, overwrite = true) {
    try {
      this.setState({ isSaving: true });
      const { section } = this.props.state;
      let saver = this.rulesetHandler.sendRuleConfiguration; // By default the saver is for rules
      if (section === 'decoders') saver = this.rulesetHandler.sendDecoderConfiguration;
      if (section === 'lists') save = this.rulesetHandler.sendCdbList;
      const r = await saver(name, this.codeMirrorContent, overwrite);
      console.log('result ', r)
    } catch (error) {
      console.error('Error saving content ', error);
    }
    this.setState({ isSaving: false });
  }

  render() {
    const { section, fileContent } = this.props.state;
    console
    const { name, content, path } = fileContent;
    const isEditable = path !== 'ruleset/rules' && path !== 'ruleset/decoders';
    const options = Object.assign(this.codeMirrorOptions, { readOnly: !isEditable });////TODO check ADMIN MODE

    const saveButton = (
      <EuiButton
        fill
        iconType="save"
        isLoading={this.state.isSaving}
        onClick={() => this.save(name, true)}>
        Save
      </EuiButton>
    );


    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiFlexGroup>
          <EuiFlexItem>
            {/* File name and back button */}
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
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
                    {name}
                  </h2>
                </EuiTitle>
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
                <CodeMirror
                  className="react-code-mirror"
                  options={options}
                  value={content}
                  onChange={newContent => this.codeMirrorContent = newContent}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
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
    changeSection: section => dispatch(updateRulesetSection(section)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateItems: items => dispatch(updateItems(items)),
    toggleShowFiles: status => dispatch(toggleShowFiles(status)),
    cleanFilters: () => dispatch(cleanFilters()),
    cleanInfo: () => dispatch(cleanInfo())
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetEditor);
