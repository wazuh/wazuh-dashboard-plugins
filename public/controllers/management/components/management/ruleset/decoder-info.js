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
  EuiLink,
  EuiAccordion,
  EuiFlexGrid,
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
        field: 'filename',
        name: 'File',
        align: 'left',
        sortable: true,
        render: (value, item) => {
          return (
            <EuiToolTip position="top" content={`Show ${value} content`}>
              <EuiLink onClick={async () => {
                const noLocal = item.relative_dirname.startsWith('ruleset/');
                const result = await this.rulesetHandler.getDecoderContent(value, noLocal);
                const file = { name: value, content: result, path: item.relative_dirname };
                this.props.updateFileContent(file);
              }
              }>{value}</EuiLink>
            </EuiToolTip>
          );
        }
      },
      {
        field: 'relative_dirname',
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
    this.props.cleanFilters();
    this.props.updateFilters(filters);
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
      <EuiFlexGrid columns={4}>
        <EuiFlexItem key="position">
          <b style={{ paddingBottom: 6 }}>Position</b>{position}
        </EuiFlexItem>
        <EuiFlexItem key="file">
          <b style={{ paddingBottom: 6 }}>File</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this file: ${file}`}>
              <EuiLink onClick={async () => this.setNewFiltersAndBack([{field:'filename', value: file}])}>
                &nbsp;{file}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiFlexItem key="path">
          <b style={{ paddingBottom: 6 }}>Path</b>
          <span>
            <EuiToolTip position="top" content={`Filter by this path: ${path}`}>
              <EuiLink onClick={async () => this.setNewFiltersAndBack([{field:'relative_dirname', value: path}])}>
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
    const capitalize = str => str[0].toUpperCase() + str.slice(1);

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
        <EuiFlexItem key={`decoder-detail-${key}`} grow={3} style={{ maxWidth: 'calc(25% - 24px)' }}>
          <b style={{ paddingBottom: 6 }}>{capitalize(key)}</b><div>{content}</div>
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
        <span
          key={`decoder-info-color-order-${i}`}
          style={{ color: colors[i] }}
        >
          {valuesArray[i].startsWith(" ") ? valuesArray[i] : ` ${valuesArray[i]}`}
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
    const currentDecoder = (this.state && this.state.currentDecoder) ? this.state.currentDecoder : decoderInfo.current;
    const decoders = decoderInfo.affected_items;
    const currentDecoderArr = decoders.filter(r => { return r.name === currentDecoder });
    const currentDecoderInfo = currentDecoderArr[0];
    const { position, details, filename, name, relative_dirname } = currentDecoderInfo;
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
                  <span style={{ fontSize: '22px' }}>
                    <EuiToolTip position="right" content="Back to decoders">
                      <EuiButtonIcon
                        aria-label="Back"
                        color="primary"
                        iconSize="l"
                        iconType="arrowLeft"
                        onClick={() => this.props.cleanInfo()}
                      />
                    </EuiToolTip>
                    {name}
                  </span>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            {/* Cards */}
            <EuiPanel style={{ margin: '16px 0', padding: '16px 16px 0px 16px' }}>
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
                    initialIsOpen={true}>
                    <div className='flyout-row details-row'>
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
                    initialIsOpen={true}>
                    <div className='flyout-row details-row'>
                      {this.renderDetails(details)}
                    </div>
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
                    initialIsOpen={true}>
                    <div className='flyout-row related-rules-row'>
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
                    </div>
                  </EuiAccordion>
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
