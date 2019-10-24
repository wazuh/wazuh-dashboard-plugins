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
  EuiButtonIcon
} from '@elastic/eui';

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
  }


  render() {
    const { section, fileContent } = this.props.state;
    const { name, content } = fileContent;
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
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            <EuiFlexGroup>
              <EuiFlexItem>
                <CodeMirror
                  className="react-code-mirror"
                  options={this.codeMirrorOptions}
                  value={content}
                  onChange={newContent => console.log('changing value in codemirror')}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPage>
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
