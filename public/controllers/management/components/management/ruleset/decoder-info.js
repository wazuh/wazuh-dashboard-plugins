import React, { Component, Fragment } from 'react';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiButtonIcon,
  EuiTitle,
  EuiToolTip,
  EuiText,
  EuiSpacer,
  EuiInMemoryTable,
  EuiLink
} from '@elastic/eui';

import { connect } from 'react-redux';

import RulesetHandler from './utils/ruleset-handler';
import { colors } from './utils/colors';

import {
  updateFileContent,
  cleanFileContent,
  cleanInfo,
  updateFilters,
  cleanFilters
} from '../../../../../redux/actions/rulesetActions';

class WzDecoderInfo extends Component {
  constructor(props) {
    super(props);

    this.rulesetHandler = RulesetHandler;
    this.columns = [
      {
        field: 'name',
        name: 'Name',
        align: 'left',
        sortable: true
      },
      {
        field: 'details.program_name',
        name: 'Program name',
        align: 'left',
        sortable: true
      },
      {
        field: 'details.order',
        name: 'Order',
        align: 'left',
        sortable: true
      },
      {
        field: 'file',
        name: 'File',
        align: 'left',
        sortable: true,
        render: (value, item) => {
          return (
            <EuiToolTip position="top" content={`Show ${value} content`}>
              <EuiLink
                onClick={async () => {
                  const noLocal = item.path.startsWith('ruleset/');
                  const result = await this.rulesetHandler.getDecoderContent(
                    value,
                    noLocal
                  );
                  const file = {
                    name: value,
                    content: result,
                    path: item.path
                  };
                  this.props.updateFileContent(file);
                }}
              >
                {value}
              </EuiLink>
            </EuiToolTip>
          );
        }
      },
      {
        field: 'path',
        name: 'Path',
        align: 'left',
        sortable: true
      }
    ];
  }

  /**
   * Clean the existing filters and sets the new ones and back to the previous section
   */
  setNewFiltersAndBack(filters) {
    const fil = filters.filters || filters;
    this.props.cleanFilters();
    this.props.updateFilters(fil);
    this.props.cleanInfo();
  }

  /**
   * Render the basic information in a list
   * @param {Number} position
   * @param {String} file
   * @param {String} path
   */
  renderInfo(position, file, path) {
    return (
      <ul>
        <li key="position">
          <b>Position:</b>&nbsp;
          <span className="subdued-color">{position}</span>
        </li>
        <EuiSpacer size="s" />
        <li key="file">
          <b>File:</b>
          <EuiToolTip position="top" content={`Filter by this file: ${file}`}>
            <EuiLink
              onClick={async () => this.setNewFiltersAndBack({ file: file })}
            >
              &nbsp;{file}
            </EuiLink>
          </EuiToolTip>
        </li>
        <EuiSpacer size="s" />
        <li key="path">
          <b>Path:</b>
          <EuiToolTip position="top" content={`Filter by this path: ${path}`}>
            <EuiLink
              onClick={async () => this.setNewFiltersAndBack({ path: path })}
            >
              &nbsp;{path}
            </EuiLink>
          </EuiToolTip>
        </li>
        <EuiSpacer size="s" />
      </ul>
    );
  }

  /**
   * Render a list with the details
   * @param {Array} details
   */
  renderDetails(details) {
    const detailsToRender = [];
    Object.keys(details).forEach(key => {
      let content = details[key];
      if (key === 'regex') {
        content = this.colorRegex(content);
      } else if (key === 'order') {
        content = this.colorOrder(content);
      } else {
        content = <span className="subdued-color">{details[key]}</span>;
      }
      detailsToRender.push(
        <Fragment key={`decoder-detail-${key}`}>
          <li>
            <b>{key}:</b>&nbsp;{content}
          </li>
          <EuiSpacer size="s" />
        </Fragment>
      );
    });
    return <ul>{detailsToRender}</ul>;
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
        <span
          key={`decoder-info-color-order-${i}`}
          style={{ color: colors[i] }}
        >
          {valuesArray[i]}
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
        <span
          key={`decoder-info-color-regex-${i}`}
          style={{ color: colors[i] }}
        >
          {valuesArray[i]}
        </span>
      );
      result.push(coloredString);
    }
    return result;
  }

  /**
   * Changes between decoders
   * @param {Number} name
   */
  changeBetweenDecoders(name) {
    this.setState({ currentDecoder: name });
  }

  render() {
    const { decoderInfo, isLoading } = this.props.state;
    const currentDecoder =
      this.state && this.state.currentDecoder
        ? this.state.currentDecoder
        : decoderInfo.current;
    const decoders = decoderInfo.items;
    const currentDecoderArr = decoders.filter(r => {
      return r.name === currentDecoder;
    });
    const currentDecoderInfo = currentDecoderArr[0];
    const { position, details, file, name, path } = currentDecoderInfo;
    const columns = this.columns;

    const onClickRow = item => {
      return {
        onClick: () => {
          this.changeBetweenDecoders(item.name);
        }
      };
    };

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiFlexGroup>
          <EuiFlexItem>
            {/* Decoder description name */}
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle>
                  <h2>
                    <EuiToolTip position="right" content="Back to decoders">
                      <EuiButtonIcon
                        aria-label="Back"
                        color="subdued"
                        iconSize="l"
                        iconType="arrowLeft"
                        onClick={() => this.props.cleanInfo()}
                      />
                    </EuiToolTip>
                    {name}
                  </h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            {/* Cards */}
            <EuiFlexGroup>
              {/* General info */}
              <EuiFlexItem>
                <EuiPanel paddingSize="m">
                  <EuiTitle size={'s'}>
                    <h3>Information</h3>
                  </EuiTitle>
                  <EuiSpacer size="s" />
                  {this.renderInfo(position, file, path)}
                </EuiPanel>
              </EuiFlexItem>
              {/* Details */}
              <EuiFlexItem>
                <EuiPanel paddingSize="m">
                  <EuiTitle size={'s'}>
                    <h3>Details</h3>
                  </EuiTitle>
                  <EuiSpacer size="s" />
                  {this.renderDetails(details)}
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>

            {/* Table */}
            <EuiSpacer size="l" />
            <EuiPanel paddingSize="m">
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiTitle size="s">
                        <h5>Related decoders</h5>
                      </EuiTitle>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiSpacer size="m" />
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiInMemoryTable
                        itemId="id"
                        items={decoders}
                        columns={columns}
                        rowProps={onClickRow}
                        pagination={true}
                        loading={isLoading}
                        sorting={true}
                        message={null}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateFileContent: content => dispatch(updateFileContent(content)),
    cleanFileContent: () => dispatch(cleanFileContent()),
    updateFilters: filters => dispatch(updateFilters(filters)),
    cleanFilters: () => dispatch(cleanFilters()),
    cleanInfo: () => dispatch(cleanInfo())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzDecoderInfo);
