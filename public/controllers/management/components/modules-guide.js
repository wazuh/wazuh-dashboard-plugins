/*
 * Wazuh app - React component for show how to configure a module guide.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import { ModulesGuides } from '../../../utils/modules-guides';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiText,
  EuiFlyoutHeader,
  EuiTitle,
  EuiSpacer,
  EuiCode,
  EuiSteps,
  EuiButtonIcon,
  EuiSuperSelect,
  EuiTextArea,
  EuiSwitch,
  EuiFieldText
} from '@elastic/eui';

export class ModulesGuide extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: 'incomplete',
      fetchingData: false,
      value: ''
    };
    this.statuses = ['complete', 'warning'];

    this.options = ModulesGuides['syscheck'].options;
    this.modules = [
      {
        value: 'rootcheck',
        inputDisplay: 'Rootcheck',
        dropdownDisplay: (
          <Fragment>
            <strong>Rootcheck</strong>
            <EuiSpacer size="xs" />
            <EuiText size="s" color="subdued">
              <p className="euiTextColor--subdued">
                Options for policy monitoring and anomaly detection.
              </p>
            </EuiText>
          </Fragment>
        )
      },
      {
        value: 'syscheck',
        inputDisplay: 'Syscheck',
        dropdownDisplay: (
          <Fragment>
            <strong>Syscheck</strong>
            <EuiSpacer size="xs" />
            <EuiText size="s" color="subdued">
              <p className="euiTextColor--subdued">
                Options for file integrity monitoring.
              </p>
            </EuiText>
          </Fragment>
        )
      },
      {
        value: 'active-response',
        inputDisplay: 'Active response',
        dropdownDisplay: (
          <Fragment>
            <strong>Active response</strong>
            <EuiSpacer size="xs" />
            <EuiText size="s" color="subdued">
              <p className="euiTextColor--subdued">
                An existing command is bound to one or more rules or rule types
                along with additional criteria for when to execute the command.
              </p>
            </EuiText>
          </Fragment>
        )
      }
    ];
  }

  onChange = value => {
    this.setState({ value, status: this.statuses[0], selectedModule: value });
  };

  onGenerate = () => {
    this.setState({ status: this.statuses[0] });
    setTimeout(() => {
      var blockHeight = $('#codeBlock').offset().top
      $('#sideNav').animate({
        scrollTop: blockHeight
      }, 700);
    }, 150)
  };

  render() {
    const apiExample = `<!-- Policy monitoring -->
    <rootcheck>
    <disabled>no</disabled>
    <check_unixaudit>yes</check_unixaudit>
    <check_files>yes</check_files>
    <check_trojans>yes</check_trojans>
    <check_dev>yes</check_dev>
    <check_sys>yes</check_sys>
    <check_pids>yes</check_pids>
    <check_ports>yes</check_ports>
    <check_if>yes</check_if>
  
    <!-- Frequency that rootcheck is executed - every 12 hours -->
    <frequency>43200</frequency>
  
    <rootkit_files>/var/ossec/etc/shared/rootkit_files.txt</rootkit_files>
    <rootkit_trojans>/var/ossec/etc/shared/rootkit_trojans.txt</rootkit_trojans>
  
    <system_audit>/var/ossec/etc/shared/system_audit_rcl.txt</system_audit>
    <system_audit>/var/ossec/etc/shared/system_audit_ssh.txt</system_audit>
    <system_audit>/var/ossec/etc/shared/cis_debian_linux_rcl.txt</system_audit>
  
    <skip_nfs>yes</skip_nfs>
  </rootcheck>`;

    const editConfigChildren = (
      <div>
        {this.state.status === 'complete' && (
          <Fragment>
            <EuiCodeBlock language="xml">{apiExample}</EuiCodeBlock>
          </Fragment>
        )}
      </div>
    );

    const form = this.options.map(option => {
      return (        
      <div key={option.name}>
        <span  style={{width: '150px', paddingTop: '10px', display: 'inline-block'}}> {option.name}:
        </span>

          {option.type === 'input' && (
            <EuiFieldText placeholder="" value={''} aria-label="" />
          )}

          {option.type === 'switch' && (
            <EuiSwitch label={''} checked={false} />
          )}

          {option.type === 'list' && (
            <EuiTextArea
              placeholder="One entry per line"
              aria-label={option.description}
              value=""
            />
          )}
        </div>
      );
    });

    const selectModuleChildren = (
      <div>
        <EuiSuperSelect
          options={this.modules}
          valueOfSelected={this.state.selectedModule}
          onChange={this.onChange}
          itemLayoutAlign="top"
          hasDividers
          fullWidth={true}
        />
      </div>
    );

    const steps = this.props.selectedModule ? [
      {
        title: `Configure ${this.props.selectedModule} module`,
        children: form
      },
      {
        title: 'Copy the configuration',
        children: editConfigChildren,
        status: this.state.status
      }
    ] : [
      {
        title: 'Select a module',
        children: selectModuleChildren
      },
      {
        title: 'Configure the module',
        children: form
      },
      {
        title: 'Copy the configuration',
        children: editConfigChildren,
        status: this.state.status
      }
    ];

    const view = (
      <EuiFlexItem>
        <EuiFlyoutHeader hasBorder>
          <EuiFlexGroup gutterSize="xs">
            <EuiTitle size="s">
              <h2>{this.props.selectedModule ? `How to configure ${this.props.selectedModule}` : `How to configure a module`}</h2>
            </EuiTitle>
            <EuiFlexItem />
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                color={'text'}
                onClick={() => this.props.close()}
                iconType="cross"
                aria-label="Close"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>
        <EuiSpacer />
        <EuiSteps firstStepNumber={1} steps={steps} />
      </EuiFlexItem>
    );

    return view;
  }
}

ModulesGuide.propTypes = {
  selectedModule: PropTypes.string,
  close: PropTypes.func
};
