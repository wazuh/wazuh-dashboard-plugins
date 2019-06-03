import React, { Component } from 'react';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiFieldText,
  EuiFieldPassword,
  EuiFieldNumber,
  EuiButton,
  EuiPanel
} from '@elastic/eui';

export class AddApi extends Component {
  constructor(props) {
    super(props);

    this.state = {
      user: '',
      password: '',
      url: '',
      port: 55000
    };
  }

  onChangeEdit(e, field) {
    this.setState({
      [field]: e.target.value
    });
  }

  render() {
    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Username">
              <EuiFieldText
                onChange={e => this.onChangeEdit(e, 'user')}
                placeholder="foo"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Password">
              <EuiFieldPassword
                onChange={e => this.onChangeEdit(e, 'password')}
                placeholder="bar"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Host">
              <EuiFieldText
                onChange={e => this.onChangeEdit(e, 'url')}
                placeholder="http://localhost"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Port">
              <EuiFieldNumber
                max={99999}
                onChange={e => this.onChangeEdit(e, 'port')}
                placeholder={55000}
              />
            </EuiFormRow>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiFormRow label="Actions">
              <EuiButton
                iconType="save"
                color="primary"
                onClick={() => this.props.saveSettings({ ...this.state })}
              >
                Save
              </EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}
