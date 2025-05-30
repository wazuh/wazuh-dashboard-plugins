/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiToolTip,
  EuiIcon,
} from '@elastic/eui';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { formatNumWithCommas } from '../../helpers';

export interface HitsCounterProps {
  /**
   * the number of query hits
   */
  hits: number;
  /**
   * displays the reset button
   */
  showResetButton: boolean;
  /**
   * resets the query
   */
  onResetQuery: () => void;
  tooltip?: {
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    iconType: string;
    ariaLabel: string;
  };
}

export function HitsCounter({
  hits,
  showResetButton,
  onResetQuery,
  tooltip,
}: HitsCounterProps) {
  return (
    <I18nProvider>
      <EuiFlexGroup
        gutterSize='s'
        className='dscResultCount'
        responsive={false}
        justifyContent='center'
        alignItems='center'
      >
        <EuiFlexItem grow={false}>
          <EuiText>
            <strong data-test-subj='discoverQueryHits'>
              {formatNumWithCommas(hits)}
            </strong>{' '}
            <FormattedMessage
              id='discover.hitsPluralTitle'
              defaultMessage='{hits, plural, one {hit} other {hits}}'
              values={{
                hits,
              }}
            />{' '}
            {tooltip && tooltip.content && (
              <EuiToolTip
                position={tooltip.position || 'top'}
                content={tooltip.content}
              >
                <EuiIcon
                  tabIndex={0}
                  style={{ width: '19px', height: '19px', marginBottom: '2px' }}
                  type={tooltip.iconType || 'iInCircle'}
                  aria-label={tooltip.ariaLabel || 'Info'}
                />
              </EuiToolTip>
            )}
          </EuiText>
        </EuiFlexItem>
        {showResetButton && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType='refresh'
              data-test-subj='resetSavedSearch'
              onClick={onResetQuery}
              size='s'
              aria-label={i18n.translate('discover.reloadSavedSearchButton', {
                defaultMessage: 'Reset search',
              })}
            >
              <FormattedMessage
                id='discover.reloadSavedSearchButton'
                defaultMessage='Reset search'
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </I18nProvider>
  );
}
