import React, { useCallback, useEffect, useState } from 'react';
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
  { key: 'name', label: 'Name' },
  { key: 'context', label: 'Context' },
  { key: 'type', label: 'Type' },
  {
    key: 'resource',
    label: 'Resource',
    isLink: true,
    dataTestSubj: 'ctiConsumersResourceItem',
  },
  { key: 'is_public', label: 'Public' },
  { key: 'status', label: 'Status' },
  { key: 'local_offset', label: 'Local offset' },
  { key: 'remote_offset', label: 'Remote offset' },
];

function formatFieldValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
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
      setError(fetchError?.message || 'Could not load consumers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsumers();
  }, [fetchConsumers]);

  return (
    <EuiAccordion id='cti-consumers-accordion' buttonContent='Consumers'>
      <EuiSpacer size='m' />
      {loading ? (
        <EuiLoadingSpinner size='m' data-test-subj='ctiConsumersLoading' />
      ) : error ? (
        <EuiCallOut
          title='Could not load consumers'
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
            Retry
          </EuiButton>
        </EuiCallOut>
      ) : !consumers || consumers.length === 0 ? (
        <EuiText color='subdued' data-test-subj='ctiConsumersEmpty'>
          No consumers
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
