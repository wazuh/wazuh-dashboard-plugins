import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiCallOut,
  EuiFieldSearch,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import {
  CatalogIndicator,
  INDICATOR_CATALOG_INDEX,
  INDICATOR_LOOKUP_MAX_LENGTH,
  normalizeVulnerabilityId,
} from '../../../../common/cti-catalog';
import { lookupIndicator } from '../../../services/cti-catalog';
import { useCatalogRequest } from '../hooks/use-catalog-request';
import {
  CatalogErrorCallOut,
  CopyableValue,
  numberFormat,
} from './catalog-shared';
import { IndicatorDetails } from './indicator-details';

const ResultCard: React.FC<{
  indicator: CatalogIndicator;
  onOpen: (indicator: CatalogIndicator) => void;
}> = ({ indicator, onOpen }) => (
  <EuiPanel
    hasBorder
    paddingSize='m'
    data-test-subj='ctiCatalogIndicatorLookupHit'
  >
    <CopyableValue value={indicator.name} />
    <EuiSpacer size='s' />
    <IndicatorDetails indicator={indicator} compact />
    <EuiSpacer size='s' />
    <EuiLink onClick={() => onOpen(indicator)}>
      {i18n.translate('wazuhCheckUpdates.ctiCatalog.indicatorLookup.open', {
        defaultMessage: 'View the full record',
      })}
    </EuiLink>
  </EuiPanel>
);

/**
 * Checks one value against the indicator catalog. Matches are exact (ignoring
 * case); a bare IP address also matches its `ip:port` records. A miss is "not
 * in this catalog", never "safe".
 */
export const IndicatorLookup: React.FC<{
  onOpen: (indicator: CatalogIndicator) => void;
  onOpenVulnerability: (id: string) => void;
}> = ({ onOpen, onOpenVulnerability }) => {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState('');
  const vulnerabilityId = submitted
    ? normalizeVulnerabilityId(submitted)
    : null;

  const { data, error, loading, reload } = useCatalogRequest(
    signal =>
      submitted && !vulnerabilityId ? lookupIndicator(submitted, signal) : null,
    [submitted, vulnerabilityId],
  );

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === submitted) {
      reload();
    }
    setSubmitted(trimmed);
  };

  let result: React.ReactNode = null;
  if (vulnerabilityId) {
    result = (
      <EuiCallOut
        size='s'
        iconType='iInCircle'
        title={i18n.translate(
          'wazuhCheckUpdates.ctiCatalog.indicatorLookup.vulnerabilityId',
          {
            defaultMessage:
              '{id} is a vulnerability id. The vulnerability catalog holds it.',
            values: { id: vulnerabilityId },
          },
        )}
        data-test-subj='ctiCatalogIndicatorLookupVulnerabilityHint'
      >
        <EuiButton
          size='s'
          onClick={() => onOpenVulnerability(vulnerabilityId)}
        >
          {i18n.translate(
            'wazuhCheckUpdates.ctiCatalog.indicatorLookup.openVulnerability',
            { defaultMessage: 'Open it in Vulnerabilities' },
          )}
        </EuiButton>
      </EuiCallOut>
    );
  } else if (error) {
    result = (
      <CatalogErrorCallOut
        error={error}
        index={INDICATOR_CATALOG_INDEX}
        onRetry={reload}
      />
    );
  } else if (data && !loading) {
    result =
      data.total === 0 ? (
        <EuiCallOut
          size='s'
          color='primary'
          iconType='search'
          title={i18n.translate(
            'wazuhCheckUpdates.ctiCatalog.indicatorLookup.notFoundTitle',
            { defaultMessage: 'Not in this catalog' },
          )}
          data-test-subj='ctiCatalogIndicatorLookupNotFound'
        >
          <p>
            {i18n.translate(
              'wazuhCheckUpdates.ctiCatalog.indicatorLookup.notFoundBody',
              {
                defaultMessage:
                  'No indicator record matches {value}. This is not a verdict that the value is safe: the catalog only holds what its providers reported.',
                values: { value: submitted },
              },
            )}
          </p>
        </EuiCallOut>
      ) : (
        <>
          <EuiCallOut
            size='s'
            color='danger'
            iconType='alert'
            title={i18n.translate(
              'wazuhCheckUpdates.ctiCatalog.indicatorLookup.foundTitle',
              {
                defaultMessage:
                  '{count, plural, one {# record} other {# records}} in the indicator catalog',
                values: { count: data.total },
              },
            )}
            data-test-subj='ctiCatalogIndicatorLookupFound'
          >
            <p>
              {i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicatorLookup.foundBody',
                {
                  defaultMessage:
                    'Providers reported this value as malicious. A match is feed knowledge, not evidence that the value was seen on your endpoints.',
                },
              )}
            </p>
            {data.total > data.items.length ? (
              <p>
                {i18n.translate(
                  'wazuhCheckUpdates.ctiCatalog.indicatorLookup.truncated',
                  {
                    defaultMessage: 'Showing the newest {shown} of {total}.',
                    values: {
                      shown: data.items.length,
                      total: numberFormat.format(data.total),
                    },
                  },
                )}
              </p>
            ) : null}
          </EuiCallOut>
          <EuiSpacer size='m' />
          <EuiFlexGrid columns={2} gutterSize='m'>
            {data.items.map(indicator => (
              <EuiFlexItem key={indicator.id}>
                <ResultCard indicator={indicator} onOpen={onOpen} />
              </EuiFlexItem>
            ))}
          </EuiFlexGrid>
        </>
      );
  }

  return (
    <EuiPanel
      hasBorder
      paddingSize='l'
      data-test-subj='ctiCatalogIndicatorLookup'
    >
      <EuiTitle size='xs'>
        <h2>
          {i18n.translate(
            'wazuhCheckUpdates.ctiCatalog.indicatorLookup.title',
            {
              defaultMessage: 'Check an indicator',
            },
          )}
        </h2>
      </EuiTitle>
      <EuiSpacer size='s' />
      <EuiFormRow
        fullWidth
        helpText={i18n.translate(
          'wazuhCheckUpdates.ctiCatalog.indicatorLookup.help',
          {
            defaultMessage:
              'Enter a domain, URL, IP address, host:port or file hash (MD5, SHA-1, SHA-256). The value must match a record exactly, ignoring case. An IP address also matches its host:port records, and a URL also matches its domain. A miss means the value is not in this catalog, not that it is safe.',
          },
        )}
      >
        <EuiFlexGroup gutterSize='s' responsive={false}>
          <EuiFlexItem>
            <EuiFieldSearch
              fullWidth
              value={value}
              maxLength={INDICATOR_LOOKUP_MAX_LENGTH}
              placeholder={i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicatorLookup.placeholder',
                {
                  defaultMessage: 'example.com, 203.0.113.10, a file hash…',
                },
              )}
              onChange={event => setValue(event.target.value)}
              onSearch={submit}
              isClearable
              aria-label={i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicatorLookup.ariaLabel',
                { defaultMessage: 'Indicator to check' },
              )}
              data-test-subj='ctiCatalogIndicatorLookupInput'
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={() => submit(value)}
              isLoading={loading}
              isDisabled={!value.trim()}
              data-test-subj='ctiCatalogIndicatorLookupSubmit'
            >
              {i18n.translate(
                'wazuhCheckUpdates.ctiCatalog.indicatorLookup.submit',
                { defaultMessage: 'Check' },
              )}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
      {result ? (
        <>
          <EuiSpacer size='m' />
          {result}
        </>
      ) : null}
    </EuiPanel>
  );
};
