import React, { useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { getCore } from '../../../plugin-services';
import { routes } from '../../../../common/constants';
import type {
  CtiConsumer,
  CtiConsumersResponse,
} from '../../../../common/cti-consumers';

const CTI_CONSUMER_FIELDS: Array<{
  key: keyof CtiConsumer;
  label: string;
  isLink?: boolean;
  dataTestSubj?: string;
}> = [
  {
    key: 'name',
    label: i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.name', {
      defaultMessage: 'Name',
    }),
  },
  {
    key: 'context',
    label: i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.context', {
      defaultMessage: 'Context',
    }),
  },
  {
    key: 'type',
    label: i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.type', {
      defaultMessage: 'Type',
    }),
  },
  {
    key: 'resource',
    label: i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.resource', {
      defaultMessage: 'Resource',
    }),
    isLink: true,
    dataTestSubj: 'ctiConsumersResourceItem',
  },
  {
    key: 'is_public',
    label: i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.isPublic', {
      defaultMessage: 'Public',
    }),
  },
  {
    key: 'status',
    label: i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.status', {
      defaultMessage: 'Status',
    }),
  },
  {
    key: 'local_offset',
    label: i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.localOffset', {
      defaultMessage: 'Local offset',
    }),
  },
  {
    key: 'remote_offset',
    label: i18n.translate(
      'wazuhCheckUpdates.ctiConsumers.fields.remoteOffset',
      {
        defaultMessage: 'Remote offset',
      },
    ),
  },
];

// `status` has no validated enum — the server route passes it through
// verbatim. 'ready', 'running' and 'failed' are the only literal values this
// component gives meaning to (see
// plugins/wazuh-ai-assistant/server/tools/catalog/get-cti-status.ts for
// 'ready'); anything else falls back to showing the raw value.
const CTI_CONSUMER_STATUS_READY = 'ready';
const CTI_CONSUMER_STATUS_RUNNING = 'running';
const CTI_CONSUMER_STATUS_FAILED = 'failed';

type ConsumerSyncState =
  | { kind: 'upToDate' }
  | { kind: 'syncing' }
  | { kind: 'failed' }
  | { kind: 'unknown'; rawStatus: string };

function getConsumerSyncState(consumer: CtiConsumer): ConsumerSyncState {
  if (
    consumer.status === CTI_CONSUMER_STATUS_READY &&
    consumer.local_offset === consumer.remote_offset
  ) {
    return { kind: 'upToDate' };
  }
  if (consumer.status === CTI_CONSUMER_STATUS_RUNNING) {
    return { kind: 'syncing' };
  }
  if (consumer.status === CTI_CONSUMER_STATUS_FAILED) {
    return { kind: 'failed' };
  }
  return { kind: 'unknown', rawStatus: consumer.status };
}

const SyncStatusBadge: React.FC<{ consumer: CtiConsumer }> = ({ consumer }) => {
  const syncState = getConsumerSyncState(consumer);

  switch (syncState.kind) {
    case 'upToDate':
      return (
        <EuiBadge color='success' data-test-subj='ctiConsumerSyncStatus'>
          {i18n.translate(
            'wazuhCheckUpdates.ctiConsumers.syncStatus.upToDate',
            {
              defaultMessage: 'Up to date',
            },
          )}
        </EuiBadge>
      );
    case 'syncing':
      return (
        <EuiBadge color='warning' data-test-subj='ctiConsumerSyncStatus'>
          {i18n.translate('wazuhCheckUpdates.ctiConsumers.syncStatus.syncing', {
            defaultMessage: 'Syncing',
          })}
        </EuiBadge>
      );
    case 'failed':
      return (
        <EuiBadge color='danger' data-test-subj='ctiConsumerSyncStatus'>
          {i18n.translate('wazuhCheckUpdates.ctiConsumers.syncStatus.failed', {
            defaultMessage: 'Failed',
          })}
        </EuiBadge>
      );
    case 'unknown':
      return (
        <EuiBadge color='hollow' data-test-subj='ctiConsumerSyncStatus'>
          {syncState.rawStatus}
        </EuiBadge>
      );
    default:
      return null;
  }
};

function formatFieldValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value
      ? i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.booleanTrue', {
          defaultMessage: 'Yes',
        })
      : i18n.translate('wazuhCheckUpdates.ctiConsumers.fields.booleanFalse', {
          defaultMessage: 'No',
        });
  }
  return String(value ?? '');
}

const truncateStyle: React.CSSProperties = {
  display: 'block',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const ConsumerField: React.FC<{
  title: string;
  value: string;
  href?: string;
  dataTestSubj?: string;
}> = ({ title, value, href, dataTestSubj }) => (
  <EuiFlexItem data-test-subj={dataTestSubj} style={{ minWidth: 0 }}>
    <EuiTitle size='xxs'>
      <h6>{title}</h6>
    </EuiTitle>
    <EuiSpacer size='xs' />
    {href ? (
      <EuiLink
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        title={value}
        style={truncateStyle}
      >
        {value}
      </EuiLink>
    ) : (
      <EuiText size='s'>{value}</EuiText>
    )}
  </EuiFlexItem>
);

export const CtiConsumersAccordion: React.FC = () => {
  const [consumers, setConsumers] = useState<CtiConsumer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedConsumers, setExpandedConsumers] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpanded = useCallback((name: string) => {
    setExpandedConsumers(previous => {
      const next = new Set(previous);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const fetchConsumers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCore().http.get<CtiConsumersResponse>(
        routes.ctiConsumers,
      );
      setConsumers(response.data ?? []);
    } catch (fetchError: unknown) {
      setConsumers(null);
      setError(
        (fetchError instanceof Error && fetchError.message) ||
          i18n.translate('wazuhCheckUpdates.ctiConsumers.error.fallback', {
            defaultMessage: 'Could not load consumers',
          }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsumers();
  }, [fetchConsumers]);

  return (
    <EuiAccordion
      id='cti-consumers-accordion'
      buttonContent={i18n.translate(
        'wazuhCheckUpdates.ctiConsumers.accordion.title',
        {
          defaultMessage: 'Consumers',
        },
      )}
    >
      <EuiSpacer size='m' />
      {loading ? (
        <EuiLoadingSpinner size='m' data-test-subj='ctiConsumersLoading' />
      ) : error ? (
        <EuiCallOut
          title={i18n.translate('wazuhCheckUpdates.ctiConsumers.error.title', {
            defaultMessage: 'Could not load consumers',
          })}
          color='danger'
          iconType='error'
          data-test-subj='ctiConsumersError'
        >
          <p>{error}</p>
          <EuiButton
            color='danger'
            size='s'
            iconType='refresh'
            onClick={fetchConsumers}
          >
            {i18n.translate(
              'wazuhCheckUpdates.ctiConsumers.error.retryButton',
              {
                defaultMessage: 'Retry',
              },
            )}
          </EuiButton>
        </EuiCallOut>
      ) : !consumers || consumers.length === 0 ? (
        <EuiText color='subdued' data-test-subj='ctiConsumersEmpty'>
          {i18n.translate('wazuhCheckUpdates.ctiConsumers.list.empty', {
            defaultMessage: 'No consumers',
          })}
        </EuiText>
      ) : (
        consumers.map(consumer => {
          const isExpanded = expandedConsumers.has(consumer.name);
          return (
            <EuiPanel
              key={consumer.name}
              paddingSize='m'
              hasBorder
              style={{ marginBottom: 8 }}
            >
              <EuiFlexGroup
                justifyContent='spaceBetween'
                alignItems='center'
                responsive={false}
              >
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup
                    alignItems='center'
                    gutterSize='s'
                    responsive={false}
                  >
                    <EuiFlexItem grow={false}>
                      <EuiTitle size='xs'>
                        <h6>{consumer.name}</h6>
                      </EuiTitle>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <SyncStatusBadge consumer={consumer} />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size='xs'
                    iconType={isExpanded ? 'arrowUp' : 'arrowDown'}
                    iconSide='right'
                    aria-expanded={isExpanded}
                    onClick={() => toggleExpanded(consumer.name)}
                    data-test-subj='ctiConsumerDetailsToggle'
                  >
                    {isExpanded
                      ? i18n.translate(
                          'wazuhCheckUpdates.ctiConsumers.details.hide',
                          {
                            defaultMessage: 'Hide details',
                          },
                        )
                      : i18n.translate(
                          'wazuhCheckUpdates.ctiConsumers.details.show',
                          {
                            defaultMessage: 'Show details',
                          },
                        )}
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
              {isExpanded && (
                <>
                  <EuiSpacer size='s' />
                  <EuiFlexGrid
                    columns={2}
                    gutterSize='m'
                    data-test-subj='ctiConsumerDetails'
                  >
                    {CTI_CONSUMER_FIELDS.filter(
                      field => field.key !== 'name',
                    ).map(field => (
                      <ConsumerField
                        key={String(field.key)}
                        title={field.label}
                        value={formatFieldValue(consumer[field.key])}
                        href={field.isLink ? consumer.resource : undefined}
                        dataTestSubj={field.dataTestSubj}
                      />
                    ))}
                  </EuiFlexGrid>
                </>
              )}
            </EuiPanel>
          );
        })
      )}
    </EuiAccordion>
  );
};
