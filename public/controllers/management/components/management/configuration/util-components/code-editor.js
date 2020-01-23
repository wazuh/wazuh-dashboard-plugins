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

import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import {
  EuiCodeEditor,
  EuiSpacer
} from "@elastic/eui";

import 'brace/theme/github';
import 'brace/ext/language_tools';

class WzCodeEditor extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { title, titleComponent, mode, value, onChange, isReadOnly, height, minusHeight } = this.props;
    return (
      <Fragment>
        {(titleComponent && (
          <Fragment>
            {titleComponent}
            <EuiSpacer size='s'/>
          </Fragment>)
          ) || (title && <div>{title}</div>)
        }
        <EuiCodeEditor
          mode={mode}
          theme='github'
          width='100%'
          height={height || `calc(100vh - ${minusHeight || 350}px)`} // Groups section has -250px
          value={value}
          tabSize={2}
          highlightActiveLine={false}
          onChange={onChange}
          isReadOnly={isReadOnly}
          setOptions={{
            fontSize: '14px',
            // enableBasicAutocompletion: true,
            enableSnippets: true,
            // enableLiveAutocompletion: true,
          }}
          aria-label='Code Editor'
        />
      </Fragment>
    )
  }
}

WzCodeEditor.propTypes = {
  title: PropTypes.string,
  mode: PropTypes.string,
  value: PropTypes.string,
  height: PropTypes.string,
  minusHeight: PropTypes.number
};

export default WzCodeEditor;