import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiAccordion,
  EuiButton,
  EuiCallOut,
  EuiDescriptionList,
  EuiFlexGrid,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { GenericRequest } from '../../react-services';
import type {
  CtiConsumer,
  CtiConsumersResponse,
} from '../../../common/cti-consumers';

const CTI_CONSUMER_FIELDS: Array<{ key: keyof CtiConsumer; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'context', label: 'Context' },
  { key: 'type', label: 'Type' },
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

export const CtiConsumersAccordion: React.FC = () => {
  const [consumers, setConsumers] = useState<CtiConsumer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsumers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GenericRequest.request<CtiConsumersResponse>(
        'GET',
        '/api/cti-consumers',
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
            <EuiFlexGrid columns={2}>
              {CTI_CONSUMER_FIELDS.map(field => (
                <EuiFlexItem key={String(field.key)}>
                  <EuiDescriptionList
                    type='column'
                    listItems={[
                      {
                        title: field.label,
                        description: formatFieldValue(consumer[field.key]),
                      },
                    ]}
                  />
                </EuiFlexItem>
              ))}
            </EuiFlexGrid>
            <EuiFlexItem data-test-subj='ctiConsumersResourceItem'>
              <EuiDescriptionList
                type='column'
                listItems={[
                  { title: 'Resource', description: consumer.resource },
                ]}
              />
            </EuiFlexItem>
          </EuiPanel>
        ))
      )}
    </EuiAccordion>
  );
};
