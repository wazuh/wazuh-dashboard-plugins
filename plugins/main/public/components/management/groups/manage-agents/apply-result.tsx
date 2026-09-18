import React from 'react';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiInMemoryTable,
  EuiLoadingSpinner,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { ErrorAgent } from '../../../endpoints-summary/services/paginated-agents-request';

interface ApplyResultViewProps {
  status: 'loading' | 'complete' | 'danger';
  title: string;
  hasFailures: boolean;
  errorAgents?: ErrorAgent[];
  onDismiss: () => void;
}

// No pagination: the Server API groups every failed agent under one
// message per distinct reason, so this table is almost always a single
// row — paging controls for that would be pure chrome.
const errorsTable = (errors: ErrorAgent[]) => (
  <EuiInMemoryTable
    items={errors}
    tableLayout='auto'
    columns={[
      { field: 'error.code', name: 'Code', align: 'left', width: '100px' },
      { field: 'error.message', name: 'Error', align: 'left' },
      {
        field: 'id',
        name: 'Agent IDs',
        align: 'left',
        render: (ids: string[]) => ids.join(', '),
      },
    ]}
  />
);

// Inline dismissible banner for the group manage-agents apply outcome. The
// caller composes the whole title (a single apply can add and remove agents
// together), so this component only owns presentation: loading state,
// dismiss, and showing failed agents/reasons directly — no accordion to
// open first.
export const ApplyResultView = ({
  status,
  title,
  hasFailures,
  errorAgents = [],
  onDismiss,
}: ApplyResultViewProps) => {
  if (status === 'loading') {
    return (
      <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size='m' />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size='s'>Applying changes&hellip;</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  const isDanger = status === 'danger';

  return (
    <EuiCallOut
      color={isDanger ? 'danger' : hasFailures ? 'warning' : 'success'}
      iconType={isDanger || hasFailures ? 'alert' : 'check'}
      title={
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem>{title}</EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              data-test-subj='applyResultDismiss'
              aria-label='Dismiss'
              iconType='cross'
              onClick={onDismiss}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      }
    >
      {hasFailures ? (
        <>
          <EuiSpacer size='s' />
          {errorsTable(errorAgents)}
        </>
      ) : null}
    </EuiCallOut>
  );
};
