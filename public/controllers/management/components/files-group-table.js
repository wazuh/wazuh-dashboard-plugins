/*
 * Wazuh app - React component for building the groups table.
 *
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
import {
  EuiInMemoryTable,
  EuiButtonIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiTitle,
  EuiButtonEmpty,
  EuiText,
  EuiToolTip
} from '@elastic/eui';

import { ExportConfiguration } from '../../agent/components/export-configuration';
import { ReportingService } from '../../../react-services/reporting';

export class FilesInGroupTable extends Component {
  constructor(props) {
    super(props);
    this.reportingService = new ReportingService();

    this.state = {
      groupName: this.props.group.name || 'Group',
      files: [],
      originalfiles: [],
      isLoading: false
    };

    this.filters = { name: 'search', value: '' };
  }

  async componentDidMount() {
    try {
      const files = await this.props.getFilesFromGroup(this.props.group.name);
      this.setState({
        files: files,
        originalfiles: files
      });
    } catch (error) {
      console.error('error mounting the component ', error);
    }
  }

  onQueryChange = ({ query }) => {
    if (query) {
      this.setState({ isLoading: true });
      const filter = query.text || '';
      this.filters.value = filter;
      const items = filter
        ? this.state.originalfiles.filter(item => {
            return item.filename.toLowerCase().includes(filter.toLowerCase());
          })
        : this.state.originalfiles;
      this.setState({
        isLoading: false,
        files: items
      });
    }
  };

  /**
   * Refresh the agents
   */
  async refresh() {
    try {
      this.setState({ refreshingFiles: true });
      const files = await this.props.getFilesFromGroup(this.props.group.name);
      this.setState({
        originalfiles: files,
        refreshingFiles: false
      });
    } catch (error) {
      this.setState({ refreshingFiles: false });
      console.error('error refreshing files ', error);
    }
  }

  render() {
    const columns = [
      {
        field: 'filename',
        name: 'File',
        sortable: true
      },
      {
        field: 'hash',
        name: 'Checksum',
        sortable: true
      },
      {
        name: 'Actions',

        render: item => {
          return (
            <EuiToolTip position="right" content="See file content">
              <EuiButtonIcon
                aria-label="See file content"
                onClick={() => 
                  this.props.openFileContent(
                    this.state.groupName,
                    item.filename
                  )
                }
                iconType="eye"
              />
            </EuiToolTip>
          );
        }
      }
    ];

    const search = {
      onChange: this.onQueryChange,
      box: {
        incremental: this.state.incremental,
        schema: true
      }
    };

    return (
      <EuiPanel paddingSize="l" className="wz-margin-16">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>{this.state.groupName}</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconSide="left"
              iconType="pencil"
              onClick={() => this.props.editConfig()}
            >
              Edit group configuration
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <ExportConfiguration
              exportConfiguration={enabledComponents =>
                this.reportingService.startConfigReport(
                  this.props.state.itemDetail,
                  'groupConfig',
                  enabledComponents
                )
              }
              type='group'
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="importAction"
              onClick={async () =>
                await this.props.export(this.state.groupName, [this.filters])
              }
            >
              Export formatted
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="refresh" onClick={() => this.refresh()}>
              Refresh
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
              From here you can list and see your group files, also, you can
              edit the group configuration
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiInMemoryTable
          itemId="id"
          items={this.state.files}
          columns={columns}
          search={search}
          pagination={true}
          loading={this.state.refreshingFiles || this.state.isLoading}
        />
      </EuiPanel>
    );
  }
}

FilesInGroupTable.propTypes = {
  group: PropTypes.object,
  getFilesFromGroup: PropTypes.func,
  export: PropTypes.func,
  exportConfigurationProps: PropTypes.object,
  editConfig: PropTypes.func,
  openFileContent: PropTypes.func
};
