import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiCodeEditor,
  EuiSpacer
} from "@elastic/eui";

import 'brace/theme/github';
import 'brace/mode/javascript';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';

class WzCodeEditor extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { title, titleComponent, mode, value, onChange, isReadOnly } = this.props;
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
          value={value}
          tabSize={2}
          minLines={15}
          maxLines={15}
          highlightActiveLine={false}
          onChange={onChange}
          isReadOnly={isReadOnly}
          setOptions={{
            fontSize: '14px',
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
          }}
          aria-label='Code Editor'
        />
      </Fragment>
    )
  }
}

WzCodeEditor.propTypes = {
  title: Proptypes.string,
  mode: Proptypes.string,
  value: Proptypes.string
};

export default WzCodeEditor;