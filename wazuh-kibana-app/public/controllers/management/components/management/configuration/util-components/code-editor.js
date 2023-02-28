/*
 * Wazuh app - React component for code editor in configuration.
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
import PropTypes from 'prop-types';

import { EuiCodeEditor, EuiSpacer } from '@elastic/eui';

import 'brace/theme/textmate';
import 'brace/mode/xml';
import 'brace/snippets/xml';
import 'brace/mode/json';
import 'brace/snippets/json';
import 'brace/mode/javascript';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';
import "brace/ext/searchbox";

class WzCodeEditor extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {
      title,
      titleComponent,
      mode,
      value,
      onChange,
      isReadOnly,
      height,
      minusHeight,
      setOptions
    } = this.props;
    return (
      <Fragment>
        {(titleComponent && (
          <Fragment>
            {titleComponent}
            <EuiSpacer size="s" />
          </Fragment>
        )) ||
          (title && <div>{title}</div>)}
        <div className="codeEditorWrapper">
          <EuiCodeEditor
            theme="textmate"
            mode={mode}
            width="100%"
            height={height || `calc(100vh - ${minusHeight || 400}px)`} // Groups section has -250px
            value={value}
            wrapEnabled
            tabSize={2}
            highlightActiveLine={false}
            onChange={onChange}
            isReadOnly={isReadOnly}
            setOptions={setOptions || {
              fontSize: '14px',
              enableSnippets: true
            }}
            aria-label="Code Editor"
          />
        </div>
      </Fragment>
    );
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
