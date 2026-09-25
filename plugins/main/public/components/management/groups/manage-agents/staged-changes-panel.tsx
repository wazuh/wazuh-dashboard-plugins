import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiSpacer,
  EuiHorizontalRule,
} from '@elastic/eui';

export type StagedAgent = { id: string; name: string };

interface StagedChangesPanelProps {
  adds: StagedAgent[];
  removes: StagedAgent[];
  memberTotal: number;
  onUnstage: (id: string) => void;
  onDiscardAll: () => void;
  onApply: () => void;
}

const stagedRow = (
  agent: StagedAgent,
  sign: string,
  color: string,
  onUnstage: (id: string) => void,
) => (
  // Plain div: `.euiFlexItem` always carries `display:flex;
  // flex-direction:column`, stretching each row to share leftover height.
  <div key={agent.id} style={{ padding: '6px 0' }}>
    <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiText color={color} size='s'>
          {sign}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem className='eui-textTruncate'>
        <EuiText size='s' className='eui-textTruncate'>
          {agent.name}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          data-test-subj={`unstage-${agent.id}`}
          aria-label={i18n.translate(
            'wazuh.endpointGroups.stagedChanges.unstageAriaLabel',
            {
              defaultMessage: 'Unstage {agentName}',
              values: { agentName: agent.name },
            },
          )}
          iconType='cross'
          size='xs'
          onClick={() => onUnstage(agent.id)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
    {/* EuiHorizontalRule for the divider color instead of a hardcoded
        hex, so it stays correct across light/dark themes. */}
    <EuiHorizontalRule margin='none' />
  </div>
);

export const StagedChangesPanel = ({
  adds,
  removes,
  memberTotal,
  onUnstage,
  onDiscardAll,
  onApply,
}: StagedChangesPanelProps) => {
  const total = adds.length + removes.length;
  const hasPending = total > 0;
  // Staged adds offset staged removes toward the same group's final count.
  const removesEmptiesGroup =
    memberTotal > 0 && memberTotal - removes.length + adds.length <= 0;

  return (
    <EuiPanel
      hasBorder
      paddingSize='m'
      style={{ maxHeight: 'calc(100vh - 150px)' }}
    >
      {/* responsive={false}: OUI's responsive breakpoint adds
          flex-wrap:wrap regardless of direction, and wrap on a column
          pushes overflowing content into a new column to the side
          instead of a new row below. */}
      <EuiFlexGroup
        direction='column'
        gutterSize='s'
        responsive={false}
        style={{ height: '100%' }}
      >
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
            <EuiFlexItem>
              <EuiText size='s'>
                <strong>
                  {i18n.translate('wazuh.endpointGroups.stagedChanges.title', {
                    defaultMessage: 'Pending changes',
                  })}
                </strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size='xs' color='subdued'>
                {hasPending
                  ? i18n.translate(
                      'wazuh.endpointGroups.stagedChanges.stagedSummary',
                      {
                        defaultMessage:
                          '{total, plural, other {{total} staged, nothing written yet}}',
                        values: { total },
                      },
                    )
                  : i18n.translate(
                      'wazuh.endpointGroups.stagedChanges.nothingWritten',
                      { defaultMessage: 'nothing written yet' },
                    )}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {!hasPending ? (
          <EuiFlexItem style={{ minHeight: 0 }}>
            {/* No alignItems='center': it sizes the child to its own
                unwrapped content width, overflowing on narrow screens.
                textAlign='center' below centers the text instead. */}
            <EuiFlexGroup
              direction='column'
              justifyContent='center'
              responsive={false}
              style={{ height: '100%' }}
            >
              <EuiFlexItem grow={false}>
                <EuiText size='m' color='subdued' textAlign='center'>
                  {i18n.translate(
                    'wazuh.endpointGroups.stagedChanges.emptyState',
                    {
                      defaultMessage:
                        "Nothing staged yet. Select a row's checkbox in the table to stage it for adding or removing.",
                    },
                  )}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        ) : (
          // minHeight: 0 overrides min-height:auto, letting this list
          // scroll internally instead of pushing the footer off-screen.
          <EuiFlexItem
            style={{ overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}
          >
            {adds.length ? (
              <>
                <EuiText size='xs' color='success'>
                  <strong>
                    {i18n.translate(
                      'wazuh.endpointGroups.stagedChanges.addingHeading',
                      {
                        defaultMessage:
                          '{count, plural, other {Adding {count}}}',
                        values: { count: adds.length },
                      },
                    )}
                  </strong>
                </EuiText>
                <EuiSpacer size='xs' />
                {adds.map(agent => stagedRow(agent, '+', 'success', onUnstage))}
              </>
            ) : null}

            {removes.length ? (
              <>
                <EuiSpacer size='s' />
                <EuiText size='xs' color='danger'>
                  <strong>
                    {i18n.translate(
                      'wazuh.endpointGroups.stagedChanges.removingHeading',
                      {
                        defaultMessage:
                          '{count, plural, other {Removing {count}}}',
                        values: { count: removes.length },
                      },
                    )}
                  </strong>
                </EuiText>
                <EuiSpacer size='xs' />
                {removes.map(agent =>
                  stagedRow(agent, '−', 'danger', onUnstage),
                )}
              </>
            ) : null}

            {removesEmptiesGroup ? (
              <>
                <EuiSpacer size='s' />
                <EuiCallOut
                  size='s'
                  color='warning'
                  title={i18n.translate(
                    'wazuh.endpointGroups.stagedChanges.emptiesGroupWarning',
                    {
                      defaultMessage:
                        'Applying these changes will leave this group with no agents.',
                    },
                  )}
                />
              </>
            ) : null}
          </EuiFlexItem>
        )}

        <EuiFlexItem grow={false}>
          <EuiHorizontalRule margin='xs' />
          <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                data-test-subj='discardAllButton'
                size='s'
                isDisabled={!hasPending}
                onClick={onDiscardAll}
              >
                {i18n.translate(
                  'wazuh.endpointGroups.stagedChanges.discardAllButton',
                  { defaultMessage: 'Discard all' },
                )}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: 'auto' }}>
              <EuiButton
                data-test-subj='applyChangesButton'
                size='s'
                fill
                isDisabled={!hasPending}
                onClick={onApply}
              >
                {i18n.translate(
                  'wazuh.endpointGroups.stagedChanges.applyButton',
                  {
                    defaultMessage:
                      '{total, plural, one {Apply {total} change} other {Apply {total} changes}}',
                    values: { total },
                  },
                )}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
