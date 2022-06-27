import React, { Component } from 'react';
import _ from 'lodash';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiToolTip,
  EuiSpacer,
  EuiLink,
  EuiAccordion,
  EuiFlexGrid,
} from '@elastic/eui';

import { ResourcesHandler, ResourcesConstants } from '../../common/resources-handler';
import { colors } from '../../common/colors';
import { TableWzAPI } from '../../../../../../components/common/tables';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';

export default class WzDecoderInfo extends Component {
  constructor(props) {
    super(props);
    this.onClickRow = this.onClickRow.bind(this);
    this.state = {
      currentInfo: {}
    };

    this.resourcesHandler = new ResourcesHandler(ResourcesConstants.DECODERS);

    const handleFileClick = async (value, item) => {
      try {
        const result = await this.resourcesHandler.getFileContent(value);
        const file = { name: value, content: result, path: item.relative_dirname };
        this.props.updateFileContent(file);
      } catch (error) {
        const options = {
          context: `${WzDecoderInfo.name}.handleFileClick`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: `Error updating file content: ${error.message || error}`,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    };

    this.columns = [
      {
        field: 'name',
        name: 'Name',
        align: 'left',
        sortable: true,
      },
      {
        field: 'details.program_name',
        name: 'Program name',
        align: 'left',
        sortable: true,
      },
      {
        field: 'details.order',
        name: 'Order',
        align: 'left',
        sortable: true,
      },
      {
        field: 'filename',
        name: 'File',
        align: 'left',
        sortable: true,
        render: (value, item) => {
          return (
            <EuiToolTip position="top" content={`Show ${value} content`}>
              <EuiLink onClick={async () => handleFileClick(value, item)}>{value}</EuiLink>
            </EuiToolTip>
          );
        },
      },
      {
        field: 'relative_dirname',
        name: 'Path',
        align: 'left',
        sortable: true,
      },
    ];
  }

  async componentDidMount() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera

    this.setState({
      currentId: this.props.item
    });
  }

  /**
   * Clean the existing filters and sets the new ones and back to the previous section
   */
  setNewFiltersAndBack(filters) {
    this.props.cleanFilters();
    this.props.onFiltersChange(filters);
    this.props.closeFlyout();
  }

  /**
   * Render the basic information in a list
   * @param {Number} position
   * @param {String} file
   * @param {String} path
   */
  renderInfo(position, file, path) {
    return (
      <EuiFlexGrid columns={4}>
        <EuiFlexItem key="position">
          <b style={{ paddingBottom: 6 }}>Position</b>
          {position}
        </EuiFlexItem>
        <EuiFlexItem key="file">
          <b style={{ paddingBottom: 6 }}>File</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this file: ${file}`}>
              <EuiLink
                onClick={async () =>
                  this.setNewFiltersAndBack([{ field: 'filename', value: file }])
                }
              >
                &nbsp;{file}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="path">
          <b style={{ paddingBottom: 6 }}>Path</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this path: ${path}`}>
              <EuiLink
                onClick={async () =>
                  this.setNewFiltersAndBack([{ field: 'relative_dirname', value: path }])
                }
              >
                &nbsp;{path}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiSpacer size="s" />
      </EuiFlexGrid>
    );
  }

  /**
   * Render a list with the details
   * @param {Array} details
   */
  renderDetails(details) {
    const detailsToRender = [];
    const capitalize = (str) => str[0].toUpperCase() + str.slice(1);

    Object.keys(details).forEach((key) => {
      let content = details[key];
      if (key === 'order') {
        content = this.colorOrder(content);
      } else if (typeof details[key] === 'object') {
        content = (
          <ul>
            {Object.keys(details[key]).map((k) => (
              <li key={k} style={{ marginBottom: '4px', wordBreak: 'break-word' }} className="subdued-color">
                {k}:&nbsp;
                {details[key][k]}
                <br />
              </li>
            ))}
          </ul>
        );
      } else {
        content = <span className="subdued-color">{details[key]}</span>;
      }
      detailsToRender.push(
        <EuiFlexItem
          key={`decoder-detail-${key}`}
          grow={3}
          style={{ maxWidth: 'calc(25% - 24px)' }}
        >
          <b style={{ paddingBottom: 6 }}>{capitalize(key)}</b>
          <div>{content}</div>
        </EuiFlexItem>
      );
    });

    return <EuiFlexGrid columns={4}>{detailsToRender}</EuiFlexGrid>;
  }

  /**
   * This set a color to a given order
   * @param {String} order
   */
  colorOrder(order) {
    order = order.toString();
    let valuesArray = order.split(',');
    const result = [];
    for (let i = 0, len = valuesArray.length; i < len; i++) {
      const coloredString = (
        <span key={`decoder-info-color-order-${i}`} style={{ color: colors[i] }}>
          {valuesArray[i].startsWith(' ') ? valuesArray[i] : ` ${valuesArray[i]}`}
        </span>
      );
      result.push(coloredString);
    }
    return result;
  }

  /**
   * This set a color to a given regex
   * @param {String} regex
   */
  colorRegex(regex) {
    regex = regex.toString();
    const starts = (
      <span key={`decoder-info-color-regex-start`} className="subdued-color">
        {regex.split('(')[0]}
      </span>
    );
    let valuesArray = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gim);
    const result = [starts];
    for (let i = 0, len = valuesArray.length; i < len; i++) {
      const coloredString = (
        <span key={`decoder-info-color-regex-${i}`} style={{ color: colors[i] }}>
          {valuesArray[i]}
        </span>
      );
      result.push(coloredString);
    }
    return result;
  }

/**
 * Update decoder details with the selected detail row
 * @param decoder 
 */
  onClickRow(decoder) {
    return {
      onClick: () => {
        this.setState({ currentDecoder: decoder });
      },
    };
  };

  render() {
    const currentDecoder =
      this.state && this.state.currentDecoder ? this.state.currentDecoder : this.props.item;
    const { position, details, filename, name, relative_dirname } = currentDecoder;

    return (
      <>
        <EuiFlyoutHeader hasBorder className="flyout-header">
          {/* Decoder description name */}
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <span style={{ fontSize: '22px' }}>
                  {name}
                </span>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>
        <EuiFlyoutBody className="flyout-body">
        {/* Cards */}
          <EuiFlexGroup>
            {/* General info */}
            <EuiFlexItem style={{ marginBottom: 16, marginTop: 8 }}>
              <EuiAccordion
                id="Info"
                buttonContent={
                  <EuiTitle size="s">
                    <h3>Information</h3>
                  </EuiTitle>
                }
                paddingSize="none"
                initialIsOpen={true}
              >
                <div className="flyout-row details-row">
                  {this.renderInfo(position, filename, relative_dirname)}
                </div>
              </EuiAccordion>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem style={{ marginTop: 8 }}>
              <EuiAccordion
                id="Details"
                buttonContent={
                  <EuiTitle size="s">
                    <h3>Details</h3>
                  </EuiTitle>
                }
                paddingSize="none"
                initialIsOpen={true}
              >
                <div className="flyout-row details-row">{this.renderDetails(details)}</div>
              </EuiAccordion>
            </EuiFlexItem>
          </EuiFlexGroup>
          {/* Table */}
          <EuiFlexGroup>
            <EuiFlexItem style={{ marginTop: 8 }}>
              <EuiAccordion
                id="Related"
                buttonContent={
                  <EuiTitle size="s">
                    <h3>Related decoders</h3>
                  </EuiTitle>
                }
                paddingSize="none"
                initialIsOpen={true}
              >
                <div className="flyout-row related-rules-row">
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      {currentDecoder?.filename &&
                        <TableWzAPI
                          tableColumns={this.columns}
                          tableInitialSortingField={'name'}
                          endpoint={`/decoders?filename=${currentDecoder.filename}`}
                          tableProps={{ rowProps: this.onClickRow }}
                          tablePageSizeOptions={[10, 25]}
                        />
                      }
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </div>
              </EuiAccordion>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutBody>
      </>
    );
  }
}
