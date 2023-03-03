/*
 * Wazuh app - React component for show filter list.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  EuiFlexItem,
  EuiPopover,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';

class WzPopoverFilters extends Component {
  filters: {
    rules: { label: string; value: string }[];
    decoders: { label: string; value: string }[];
  };

  constructor(props) {
    super(props);
    this.state = {
      isPopoverOpen: false,
    };
    this.filters = {
      rules: [
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.File',
            {
              defaultMessage: 'File',
            },
          ),
          value: 'file',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.Path',
            {
              defaultMessage: 'Path',
            },
          ),
          value: 'path',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.Level',
            {
              defaultMessage: 'Level',
            },
          ),
          value: 'level',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.Group',
            {
              defaultMessage: 'Group',
            },
          ),
          value: 'group',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.PCIcontrol',
            {
              defaultMessage: 'PCI control',
            },
          ),
          value: 'pci',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.GDPR',
            {
              defaultMessage: 'GDPR',
            },
          ),
          value: 'gdpr',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.HIPAA',
            {
              defaultMessage: 'HIPAA',
            },
          ),
          value: 'hipaa',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.NIST-800-53',
            {
              defaultMessage: 'NIST-800-53',
            },
          ),
          value: 'nist-800-53',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.TSC',
            {
              defaultMessage: 'TSC',
            },
          ),
          value: 'tsc',
        },
      ],
      decoders: [
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.File',
            {
              defaultMessage: 'File',
            },
          ),
          value: 'file',
        },
        {
          label: i18n.translate(
            'wazuh.public.controller.management.ruleset.popover.Path',
            {
              defaultMessage: 'Path',
            },
          ),
          value: 'path',
        },
      ],
    };
  }

  onButtonClick() {
    this.setState({
      isPopoverOpen: !this.state['isPopoverOpen'],
    });
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false,
    });
  }

  render() {
    const { section } = this.props['state'];
    const button = (
      <EuiButton
        fill
        style={{ padding: 12 }}
        color='primary'
        onClick={() => this.onButtonClick()}
        iconType='logstashFilter'
        aria-label={i18n.translate(
          'wazuh.public.controller.management.ruleset.popover.Filter',
          {
            defaultMessage: 'Filter',
          },
        )}
      >
        {i18n.translate(
          'wazuh.public.controller.management.ruleset.popover.Filters',
          {
            defaultMessage: 'Filters',
          },
        )}
      </EuiButton>
    );

    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
        <EuiPopover
          id='trapFocus'
          ownFocus
          button={button}
          isOpen={this.state['isPopoverOpen']}
          anchorPosition='downRight'
          closePopover={this.closePopover.bind(this)}
        >
          {this.filters[section].map((filter, idx) => (
            <div key={idx}>
              <EuiButtonEmpty
                size='s'
                iconSide='right'
                // TODO: Add the logic to applyFilters
                onClick={() => null}
              >
                {filter.label}
              </EuiButtonEmpty>
            </div>
          ))}
        </EuiPopover>
      </EuiFlexItem>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers,
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(WzPopoverFilters);
