import React, { useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiAccordion,
  EuiButton,
  EuiCallOut,
  EuiFlexGrid,
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

  const fetchConsumers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCore().http.get<CtiConsumersResponse>(
        routes.ctiConsumers,
      );
      setConsumers(response.data ?? []);
    } catch (fetchError: any) {
      setConsumers(null);
      setError(
        fetchError?.message ||
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
        consumers.map(consumer => (
          <EuiPanel
            key={consumer.name}
            paddingSize='m'
            hasBorder
            style={{ marginBottom: 8 }}
          >
            <EuiFlexGrid columns={2} gutterSize='m'>
              {CTI_CONSUMER_FIELDS.map(field => (
                <ConsumerField
                  key={String(field.key)}
                  title={field.label}
                  value={formatFieldValue(consumer[field.key])}
                  href={field.isLink ? consumer.resource : undefined}
                  dataTestSubj={field.dataTestSubj}
                />
              ))}
            </EuiFlexGrid>
          </EuiPanel>
        ))
      )}
    </EuiAccordion>
  );
};
