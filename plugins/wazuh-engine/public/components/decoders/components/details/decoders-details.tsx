import React from 'react';
import _ from 'lodash';
// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlexGrid,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiToolTip,
  EuiLink,
  EuiSpacer,
  EuiAccordion,
} from '@elastic/eui';
import { getServices } from '../../../../services';
import { columns } from './decoders-details-columns';
import { colors } from '../overview/decoders-overview-columns';

export const DecodersDetails = ({ item }) => {
  const navigationService = getServices().navigationService;
  const TableWzAPI = getServices().TableWzAPI;

  const renderInfo = (path, params, type) => {
    return (
      <EuiFlexGrid columns={4}>
        <EuiFlexItem key='name'>
          <b style={{ paddingBottom: 6 }}>{type}</b>
          <span>
            <EuiToolTip position='top' content={`Filter by: ${params}`}>
              <EuiLink
                onClick={() => {
                  navigationService
                    .getInstance()
                    .navigate(`/engine/${path}/${params}`);
                }}
              >
                &nbsp;{params}
              </EuiLink>
            </EuiToolTip>
          </span>
        </EuiFlexItem>
        <EuiSpacer size='s' />
      </EuiFlexGrid>
    );
  };

  /**
   * Render a list with the details
   * @param {Array} details
   */
  const renderDetails = details => {
    const detailsToRender = [];
    const capitalize = str => str[0].toUpperCase() + str.slice(1);

    Object.keys(details).forEach(key => {
      let content = details[key];
      if (key === 'order') {
        content = colorOrder(content);
      } else if (typeof details[key] === 'object') {
        content = (
          <ul>
            {Object.keys(details[key]).map(k => (
              <li
                key={k}
                style={{ marginBottom: '4px', wordBreak: 'break-word' }}
                className='subdued-color'
              >
                {key == 'references' ? (
                  <EuiLink href={details[key][k]}>{details[key][k]}</EuiLink>
                ) : (
                  details[key][k]
                )}
                <br />
              </li>
            ))}
          </ul>
        );
      } else {
        content = <span className='subdued-color'>{details[key]}</span>;
      }
      detailsToRender.push(
        <EuiFlexItem
          key={`decoder-detail-${key}`}
          grow={3}
          style={{ maxWidth: 'calc(25% - 24px)' }}
        >
          <b style={{ paddingBottom: 6 }}>{capitalize(key)}</b>
          <div>{content}</div>
        </EuiFlexItem>,
      );
    });

    return <EuiFlexGrid columns={4}>{detailsToRender}</EuiFlexGrid>;
  };

  /**
   * This set a color to a given order
   * @param {String} order
   */
  const colorOrder = order => {
    order = order.toString();
    let valuesArray = order.split(',');
    const result = [];
    for (let i = 0, len = valuesArray.length; i < len; i++) {
      const coloredString = (
        <span
          key={`decoder-info-color-order-${i}`}
          style={{ color: colors[i] }}
        >
          {valuesArray[i].startsWith(' ')
            ? valuesArray[i]
            : ` ${valuesArray[i]}`}
        </span>
      );
      result.push(coloredString);
    }
    return result;
  };

  return (
    <>
      <EuiFlyoutHeader hasBorder className='flyout-header'>
        {/* Decoder description name */}
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle>
              <span style={{ fontSize: '22px' }}>{name}</span>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody className='flyout-body'>
        {/* Cards */}
        <EuiFlexGroup>
          {/* General info */}
          <EuiFlexItem style={{ marginBottom: 16, marginTop: 8 }}>
            <EuiAccordion
              id='Info'
              buttonContent={
                <EuiTitle size='s'>
                  <h3>Information</h3>
                </EuiTitle>
              }
              paddingSize='l'
              initialIsOpen={true}
            >
              <EuiFlexGroup>
                <EuiFlexItem>
                  {renderInfo('decoders/file', item.name, 'File')}
                </EuiFlexItem>
                <EuiFlexItem>
                  {renderInfo('integrations', item.module, 'Integration')}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiAccordion>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem style={{ marginTop: 8 }}>
            <EuiAccordion
              id='Details'
              buttonContent={
                <EuiTitle size='s'>
                  <h3>Details</h3>
                </EuiTitle>
              }
              paddingSize='l'
              initialIsOpen={true}
            >
              {renderDetails(item.details)}
            </EuiAccordion>
          </EuiFlexItem>
        </EuiFlexGroup>
        {/* Table */}
        <EuiFlexGroup>
          <EuiFlexItem style={{ marginTop: 8 }}>
            <EuiAccordion
              id='Related'
              buttonContent={
                <EuiTitle size='s'>
                  <h3>Related decoders</h3>
                </EuiTitle>
              }
              paddingSize='none'
              initialIsOpen={true}
            >
              <div className='flyout-row related-rules-row'>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <TableWzAPI
                      tableColumns={columns()}
                      tableInitialSortingField='name'
                      endpoint={`/decoders?filename=${item.name}`}
                      tablePageSizeOptions={[10, 25]}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
            </EuiAccordion>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </>
  );
};
