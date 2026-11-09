import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonIcon,
  EuiCode,
  EuiCodeBlock,
  EuiCopy,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiLink,
  EuiLoadingContent,
  EuiSpacer,
  EuiStat,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { isSafeHttpUrl } from '../../../../common/cti-explorer/cve-record';
import type {
  IocFilters,
  IocRecord,
} from '../../../../common/cti-explorer/types';
import { useCtiRequest } from '../hooks/use-cti-request';
import { fetchIocRecord } from '../services/cti-explorer-api';
import {
  formatDateTime,
  getIocTypeLabel,
  getMalwareRoleLabel,
  getProviderName,
} from '../utils/labels';
import { getThreatHuntingIocUrl } from '../utils/navigation';
import { NORMAL_FONT_WEIGHT } from '../utils/styles';
import { RequestErrorCallout } from './request-error-callout';

type FlyoutTab = 'overview' | 'json';

interface IocFlyoutProps {
  id: string;
  onClose: () => void;
  onOpenIoc: (id: string) => void;
  /** Lists the IOCs that share a value of this record. */
  onFilter: (filters: IocFilters) => void;
}

const IocFlyoutHeader = ({
  record,
  related,
  titleId,
  tab,
  onTabChange,
}: {
  record: IocRecord;
  related: IocRecord[];
  titleId: string;
  tab: FlyoutTab;
  onTabChange: (tab: FlyoutTab) => void;
}) => {
  const records = [record, ...related];
  const providers = new Set(records.map(item => item.provider));
  const confidence = Math.max(...records.map(item => item.confidence ?? 0));
  return (
    <>
      <EuiText size='xs' color='subdued'>
        {i18n.translate('wazuh.ctiExplorer.iocFlyout.eyebrow', {
          defaultMessage: 'IOC · {type}',
          values: { type: getIocTypeLabel(record.type) },
        })}
      </EuiText>
      <EuiFlexGroup gutterSize='s' alignItems='flexStart' responsive={false}>
        <EuiFlexItem style={{ minWidth: 0 }}>
          <EuiTitle size='s'>
            <h2 id={titleId} className='eui-textBreakAll'>
              {record.name}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCopy textToCopy={record.name}>
            {copy => (
              <EuiButtonIcon
                iconType='copy'
                onClick={copy}
                aria-label={i18n.translate(
                  'wazuh.ctiExplorer.iocFlyout.copyValue',
                  { defaultMessage: 'Copy the value' },
                )}
              />
            )}
          </EuiCopy>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <EuiFlexGroup gutterSize='l' responsive={false} wrap>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={<span style={NORMAL_FONT_WEIGHT}>{confidence}</span>}
            titleSize='xs'
            description={
              related.length
                ? i18n.translate(
                    'wazuh.ctiExplorer.iocFlyout.confidenceHighest',
                    { defaultMessage: 'Confidence (highest)' },
                  )
                : i18n.translate('wazuh.ctiExplorer.iocFlyout.confidence', {
                    defaultMessage: 'Confidence',
                  })
            }
            reverse
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={
              <span style={NORMAL_FONT_WEIGHT}>
                {providers.size > 1
                  ? i18n.translate(
                      'wazuh.ctiExplorer.iocFlyout.providerCount',
                      {
                        defaultMessage: '{count} providers',
                        values: { count: providers.size },
                      },
                    )
                  : getProviderName(record.provider)}
              </span>
            }
            titleSize='xs'
            description={i18n.translate(
              'wazuh.ctiExplorer.iocFlyout.provider',
              { defaultMessage: 'Provider' },
            )}
            reverse
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={
              <span style={NORMAL_FONT_WEIGHT}>
                {record.software?.name ?? '-'}
              </span>
            }
            titleSize='xs'
            description={i18n.translate('wazuh.ctiExplorer.iocFlyout.malware', {
              defaultMessage: 'Malware',
            })}
            reverse
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <EuiButton
        fill
        size='s'
        iconType='search'
        href={getThreatHuntingIocUrl(record.name)}
        data-test-subj='ctiExplorerIocHunt'
      >
        {i18n.translate('wazuh.ctiExplorer.huntInThreatHunting', {
          defaultMessage: 'Hunt in Threat Hunting',
        })}
      </EuiButton>
      <EuiSpacer size='s' />
      <EuiTabs size='s' style={{ marginBottom: '-25px' }}>
        <EuiTab
          isSelected={tab === 'overview'}
          onClick={() => onTabChange('overview')}
        >
          {i18n.translate('wazuh.ctiExplorer.iocFlyout.tabs.overview', {
            defaultMessage: 'Overview',
          })}
        </EuiTab>
        <EuiTab isSelected={tab === 'json'} onClick={() => onTabChange('json')}>
          {i18n.translate('wazuh.ctiExplorer.iocFlyout.tabs.json', {
            defaultMessage: 'JSON',
          })}
        </EuiTab>
      </EuiTabs>
    </>
  );
};

const IocFlyoutOverview = ({
  record,
  related,
  onOpenIoc,
  onFilter,
}: {
  record: IocRecord;
  related: IocRecord[];
  onOpenIoc: (id: string) => void;
  onFilter: (filters: IocFilters) => void;
}) => {
  const filterLink = (label: string, filters: IocFilters, title: string) => (
    <EuiLink
      onClick={() => onFilter(filters)}
      title={title}
      style={NORMAL_FONT_WEIGHT}
    >
      {label}
    </EuiLink>
  );
  const browseTitle = (value: string) =>
    i18n.translate('wazuh.ctiExplorer.iocFlyout.browseBy', {
      defaultMessage: 'Browse the IOCs of {value}',
      values: { value },
    });
  const software = record.software;

  const items = [
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.type', {
        defaultMessage: 'Type',
      }),
      description: filterLink(
        getIocTypeLabel(record.type),
        { type: record.type },
        browseTitle(getIocTypeLabel(record.type)),
      ),
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.provider', {
        defaultMessage: 'Provider',
      }),
      description: record.provider
        ? filterLink(
            getProviderName(record.provider),
            { provider: record.provider },
            browseTitle(getProviderName(record.provider)),
          )
        : '-',
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.source', {
        defaultMessage: 'Published by',
      }),
      description: record.feedName ?? '-',
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.confidence', {
        defaultMessage: 'Confidence',
      }),
      description: record.confidence ?? '-',
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.firstSeen', {
        defaultMessage: 'First seen',
      }),
      description: formatDateTime(record.firstSeen),
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.lastSeen', {
        defaultMessage: 'Last seen',
      }),
      description: formatDateTime(record.lastSeen),
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.family', {
        defaultMessage: 'Malware family',
      }),
      description: software?.name
        ? filterLink(
            software.name,
            { family: software.name },
            browseTitle(software.name),
          )
        : '-',
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.role', {
        defaultMessage: 'Malware role',
      }),
      description: software?.type
        ? filterLink(
            getMalwareRoleLabel(software.type),
            { role: software.type },
            browseTitle(getMalwareRoleLabel(software.type)),
          )
        : '-',
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.aliases', {
        defaultMessage: 'Malware aliases',
      }),
      description: software?.alias.length ? software.alias.join(', ') : '-',
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.tags', {
        defaultMessage: 'Tags',
      }),
      description: record.tags.length ? (
        <EuiFlexGroup gutterSize='xs' wrap responsive={false}>
          {record.tags.map(tag => (
            <EuiFlexItem grow={false} key={tag}>
              <EuiBadge
                color='hollow'
                onClick={() => onFilter({ tag })}
                onClickAriaLabel={browseTitle(tag)}
              >
                {tag}
              </EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ) : (
        '-'
      ),
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.reference', {
        defaultMessage: 'Reference',
      }),
      description: isSafeHttpUrl(record.reference) ? (
        <EuiLink
          href={record.reference}
          target='_blank'
          rel='noopener noreferrer'
          external
          className='eui-textBreakAll'
          style={NORMAL_FONT_WEIGHT}
        >
          {record.reference}
        </EuiLink>
      ) : (
        <span className='eui-textBreakAll'>{record.reference ?? '-'}</span>
      ),
    },
    {
      title: i18n.translate('wazuh.ctiExplorer.iocFlyout.fields.id', {
        defaultMessage: 'Record id',
      }),
      description: <EuiCode transparentBackground>{record.id}</EuiCode>,
    },
  ];

  return (
    <>
      <EuiDescriptionList
        type='column'
        compressed
        listItems={items}
        data-test-subj='ctiExplorerIocFields'
      />
      {related.length ? (
        <>
          <EuiSpacer size='l' />
          <EuiTitle size='xxs'>
            <h3>
              {i18n.translate('wazuh.ctiExplorer.iocFlyout.relatedTitle', {
                defaultMessage: 'Other records of this value',
              })}
            </h3>
          </EuiTitle>
          <EuiText size='xs' color='subdued'>
            <p>
              {i18n.translate('wazuh.ctiExplorer.iocFlyout.relatedText', {
                defaultMessage:
                  'The catalog keeps one record per provider, so a value reported by several providers has several records.',
              })}
            </p>
          </EuiText>
          <EuiSpacer size='s' />
          <EuiBasicTable<IocRecord>
            items={related}
            tableLayout='auto'
            rowProps={(item: IocRecord) => ({
              onClick: () => onOpenIoc(item.id),
              style: { cursor: 'pointer' },
            })}
            columns={[
              {
                field: 'provider',
                name: i18n.translate(
                  'wazuh.ctiExplorer.iocFlyout.related.provider',
                  { defaultMessage: 'Provider' },
                ),
                render: (provider: string | null) => getProviderName(provider),
              },
              {
                field: 'type',
                name: i18n.translate(
                  'wazuh.ctiExplorer.iocFlyout.related.type',
                  { defaultMessage: 'Type' },
                ),
                render: (type: string) => getIocTypeLabel(type),
              },
              {
                field: 'confidence',
                name: i18n.translate(
                  'wazuh.ctiExplorer.iocFlyout.related.confidence',
                  { defaultMessage: 'Confidence' },
                ),
                render: (confidence: number | null) => confidence ?? '-',
              },
              {
                field: 'lastSeen',
                name: i18n.translate(
                  'wazuh.ctiExplorer.iocFlyout.related.lastSeen',
                  { defaultMessage: 'Last seen' },
                ),
                render: (value: string | null) => formatDateTime(value),
              },
            ]}
            data-test-subj='ctiExplorerIocRelated'
          />
        </>
      ) : null}
    </>
  );
};

export const IocFlyout = ({
  id,
  onClose,
  onOpenIoc,
  onFilter,
}: IocFlyoutProps) => {
  const result = useCtiRequest(() => fetchIocRecord(id), [id]);
  const [tab, setTab] = useState<FlyoutTab>('overview');
  const record = result.data?.record;
  const related = result.data?.related ?? [];
  const titleId = 'ctiExplorerIocFlyoutTitle';

  return (
    <EuiFlyout
      onClose={onClose}
      ownFocus
      size='m'
      aria-labelledby={titleId}
      data-test-subj='ctiExplorerIocFlyout'
    >
      <EuiFlyoutHeader hasBorder>
        {record ? (
          <IocFlyoutHeader
            record={record}
            related={related}
            titleId={titleId}
            tab={tab}
            onTabChange={setTab}
          />
        ) : (
          <EuiTitle size='s'>
            <h2 id={titleId}>
              {i18n.translate('wazuh.ctiExplorer.iocFlyout.loadingTitle', {
                defaultMessage: 'IOC record',
              })}
            </h2>
          </EuiTitle>
        )}
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {result.error ? (
          <RequestErrorCallout error={result.error} onRetry={result.reload} />
        ) : !record ? (
          <EuiLoadingContent lines={6} />
        ) : tab === 'json' ? (
          <EuiCodeBlock language='json' isCopyable paddingSize='s'>
            {JSON.stringify(record, null, 2)}
          </EuiCodeBlock>
        ) : (
          <IocFlyoutOverview
            record={record}
            related={related}
            onOpenIoc={onOpenIoc}
            onFilter={onFilter}
          />
        )}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
