import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPanel,
  EuiTitle,
  EuiButtonIcon,
  EuiSpacer,
  EuiHealth,
  EuiSwitch,
  useIsWithinBreakpoints,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../common/hocs';
import { Agent } from '../../../endpoints-summary/types';
import {
  addAgentsToGroupService,
  removeAgentsFromGroupService,
} from '../../../endpoints-summary/services';
import { ErrorAgent } from '../../../endpoints-summary/services/paginated-agents-request';
import { useGroupMemberIds } from './use-group-member-ids';
import { manageAgentsColumns } from './columns';
import { ApplyResultView } from './apply-result';
import { StagedChangesPanel, StagedAgent } from './staged-changes-panel';
import { TableWzAPI, TableWithSearchBarHandle } from '../../../common/tables';
import { WzRequest } from '../../../../react-services/wz-request';
import {
  UI_ORDER_AGENT_STATUS,
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
} from '../../../../../common/constants';

const searchBarWQLFieldSuggestions = [
  { label: 'id', description: 'filter by ID' },
  { label: 'name', description: 'filter by name' },
  { label: 'status', description: 'filter by status' },
  { label: 'group', description: 'filter by group' },
];

// Any WQL field named in tableColumns needs an entry here, or `run()`
// throws on `parameters.suggestions` when validating that field.
export const searchBarWQL = {
  suggestions: {
    field: () => searchBarWQLFieldSuggestions,
    value: async (currentValue: string, { field }: { field: string }) => {
      if (field === 'status') {
        return UI_ORDER_AGENT_STATUS.map(status => ({ label: status }));
      }
      const response = await WzRequest.apiReq('GET', '/agents', {
        params: {
          distinct: true,
          limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
          select: field,
          sort: `+${field}`,
          q: currentValue ? `${field}~${currentValue}` : '',
        },
      });
      const items = response?.data?.data?.affected_items || [];
      if (field === 'group') {
        return items
          .flatMap((item: { group?: string[] }) => item.group || [])
          .filter(
            (value: string, index: number, all: string[]) =>
              all.indexOf(value) === index,
          )
          .sort()
          .map((group: string) => ({ label: group }));
      }
      return items.map((item: Record<string, string>) => ({
        label: item[field],
      }));
    },
  },
};

interface ManageAgentsProps {
  currentGroup: { name: string };
  cancelButton: () => void;
}

type StagedIntent = 'add' | 'remove';
type StagedEntry = StagedAgent & { intent: StagedIntent };

type ApplyState = {
  status: 'loading' | 'complete' | 'danger';
  title: string;
  hasFailures: boolean;
  errorAgents: ErrorAgent[];
};

export const ManageAgents = withErrorBoundary(
  ({ currentGroup, cancelButton }: ManageAgentsProps) => {
    const [reloadToken, setReloadToken] = useState(0);
    const [staged, setStaged] = useState<Record<string, StagedEntry>>({});
    const [applyState, setApplyState] = useState<ApplyState | undefined>();
    const [showMembersOnly, setShowMembersOnly] = useState(false);
    const [visibleItems, setVisibleItems] = useState<Agent[]>([]);
    const visibleItemsRef = useRef<Agent[]>([]);
    // Set synchronously by onPageOrSortChange, in the same call stack as
    // EuiBasicTable's own clearSelection()-then-onSelectionChange([]) on a
    // page/sort change — the only way to tell that apart here from a
    // genuine uncheck, since both call onSelectionChange the same way.
    const pageChangeInFlightRef = useRef(false);
    const tableRef = useRef<TableWithSearchBarHandle>(null);
    const isMobile = useIsWithinBreakpoints(['xs', 's']);

    const {
      memberIds,
      memberTotal,
      isLoading: membershipLoading,
    } = useGroupMemberIds(currentGroup.name, reloadToken);

    const onSelectionChange = (nowChecked: Agent[]) => {
      const nowCheckedIds = new Set(nowChecked.map(a => a.id));
      const candidateRemovals: string[] = [];

      setStaged(prev => {
        let changed = false;
        const next = { ...prev };
        visibleItemsRef.current.forEach(agent => {
          const wasStaged = !!next[agent.id];
          const isNowChecked = nowCheckedIds.has(agent.id);
          if (isNowChecked && !wasStaged) {
            changed = true;
            const isMember = memberIds.has(agent.id);
            next[agent.id] = {
              id: agent.id,
              name: agent.name,
              intent: isMember ? 'remove' : 'add',
            };
          } else if (!isNowChecked && wasStaged) {
            candidateRemovals.push(agent.id);
          }
        });
        // `setSelection` itself re-invokes onSelectionChange, so an
        // unchanged reference here breaks that cycle via React's bailout.
        return changed ? next : prev;
      });

      if (!candidateRemovals.length) {
        return;
      }

      // Deferring the removal decides it once onPageOrSortChange (if any)
      // has already run: both fire synchronously within the very same
      // click, so by the time this microtask runs, pageChangeInFlightRef
      // already reflects whether a page/sort change caused this clear.
      pageChangeInFlightRef.current = false;
      queueMicrotask(() => {
        if (pageChangeInFlightRef.current) {
          return;
        }
        setStaged(prev => {
          const next = { ...prev };
          let changed = false;
          candidateRemovals.forEach(id => {
            if (next[id]) {
              delete next[id];
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      });
    };

    const handleDataChange = (data: { items: Agent[] }) => {
      visibleItemsRef.current = data.items;
      setVisibleItems(data.items);
    };

    // `selection.selected` is read once at mount as `initialSelected` in
    // this OUI version, so checked visuals need an imperative re-sync
    // whenever `visibleItems` or `staged` changes (discard/unstage included).
    useEffect(() => {
      tableRef.current?.setSelection(
        visibleItems.filter(agent => staged[agent.id]),
      );
    }, [visibleItems, staged]);

    const unstage = (id: string) => {
      setStaged(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    };

    const discardAll = () => setStaged({});

    const adds = Object.values(staged).filter(s => s.intent === 'add');
    const removes = Object.values(staged).filter(s => s.intent === 'remove');

    const applyChanges = async () => {
      const addIds = adds.map(a => a.id);
      const removeIds = removes.map(a => a.id);
      const total = addIds.length + removeIds.length;
      if (!total) {
        return;
      }

      setApplyState({
        status: 'loading',
        title: '',
        hasFailures: false,
        errorAgents: [],
      });

      const succeededIds = new Set<string>();
      const errorAgents: ErrorAgent[] = [];
      let succeededCount = 0;
      let totalFailed = 0;

      try {
        if (addIds.length) {
          const response = await addAgentsToGroupService({
            agentIds: addIds,
            groupId: currentGroup.name,
          });
          const { affected_items, failed_items, total_failed_items } =
            response.data.data;
          affected_items.forEach((id: string) => succeededIds.add(id));
          succeededCount += affected_items.length;
          totalFailed += total_failed_items || 0;
          errorAgents.push(...(failed_items || []));
        }

        if (removeIds.length) {
          const response = await removeAgentsFromGroupService({
            agentIds: removeIds,
            groupId: currentGroup.name,
          });
          const { affected_items, failed_items, total_failed_items } =
            response.data.data;
          affected_items.forEach((id: string) => succeededIds.add(id));
          succeededCount += affected_items.length;
          totalFailed += total_failed_items || 0;
          errorAgents.push(...(failed_items || []));
        }

        const hasFailures = totalFailed > 0;
        const title = hasFailures
          ? `Applied ${succeededCount} of ${total} change(s) — ${totalFailed} failed, see below`
          : `Applied ${succeededCount} of ${total} change(s)`;

        setApplyState({ status: 'complete', title, hasFailures, errorAgents });

        // Failed entries stay staged for retry.
        setStaged(prev => {
          const next = { ...prev };
          succeededIds.forEach(id => delete next[id]);
          return next;
        });
        setReloadToken(Date.now());
      } catch (error: any) {
        setApplyState({
          status: 'danger',
          title:
            'Could not apply changes. Check the server API status and try again.',
          hasFailures: false,
          errorAgents: [],
        });
      }
    };

    // Redundant once filtered to this group's own members (every row
    // would read "In this group"), so only appended when browsing the
    // full agent list. `fullWidth` lets the base columns reclaim its share.
    const tableColumns = showMembersOnly
      ? manageAgentsColumns({ fullWidth: true })
      : [
          ...manageAgentsColumns(),
          {
            field: '_membership',
            name: 'Membership',
            show: true,
            width: '24%',
            // Reflects current membership only, never a pending stage.
            render: (_value: unknown, agent: Agent) =>
              memberIds.has(agent.id) ? (
                <EuiHealth color='success'>In this group</EuiHealth>
              ) : (
                <EuiHealth color='subdued'>Not in this group</EuiHealth>
              ),
          },
        ];

    // A fresh object on every render would re-trigger
    // table-with-search-bar's own `[rest.filters]` effect (it compares by
    // reference), which treats that as an external filter change and
    // wipes out whatever WQL query the user just typed into the table's
    // own search bar.
    const tableFilters = useMemo(
      () => (showMembersOnly ? { q: `group=${currentGroup.name}` } : {}),
      [showMembersOnly, currentGroup.name],
    );

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel paddingSize='m'>
          <EuiFlexGroup alignItems='center' gutterSize='s'>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                aria-label='Back'
                color='primary'
                iconType='arrowLeft'
                onClick={cancelButton}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle size='m'>
                <h1>Manage agents of group {currentGroup.name}</h1>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='m' />
          {applyState ? (
            <>
              <ApplyResultView
                status={applyState.status}
                title={applyState.title}
                hasFailures={applyState.hasFailures}
                errorAgents={applyState.errorAgents}
                onDismiss={() => setApplyState(undefined)}
              />
              <EuiSpacer size='m' />
            </>
          ) : null}
          <EuiFlexGroup>
            <EuiFlexItem style={{ minWidth: 0 }} grow={4}>
              <TableWzAPI
                ref={tableRef}
                title={showMembersOnly ? 'Members' : 'All agents'}
                endpoint='/agents'
                filters={tableFilters}
                addOnTitle={
                  <EuiSwitch
                    data-test-subj='showMembersOnlySwitch'
                    label='Show only members'
                    checked={showMembersOnly}
                    onChange={e => setShowMembersOnly(e.target.checked)}
                  />
                }
                tableColumns={tableColumns}
                tableInitialSortingField='id'
                reload={reloadToken}
                downloadCsv={false}
                showReload
                searchTable
                searchBarWQL={searchBarWQL}
                onDataChange={handleDataChange}
                onPageOrSortChange={() => {
                  pageChangeInFlightRef.current = true;
                }}
                tableProps={{
                  itemId: 'id',
                  // Auto layout shrinks an empty table to its header
                  // width, narrower than the pending-changes panel.
                  tableLayout: 'fixed',
                  isSelectable: true,
                  selection: {
                    onSelectionChange,
                    selectable: () => !membershipLoading,
                    selectableMessage: (selectable: boolean) =>
                      selectable ? '' : 'Group membership is still loading',
                  },
                }}
              />
            </EuiFlexItem>
            {!isMobile && (
              <EuiFlexItem grow={false} style={{ alignSelf: 'stretch' }}>
                {/* euiHorizontalRule's own class gives a theme-aware color
                  without a hardcoded hex, resized into a vertical line. */}
                <div
                  className='euiHorizontalRule'
                  style={{ width: 1, height: '100%', margin: 0 }}
                />
              </EuiFlexItem>
            )}
            <EuiFlexItem
              style={
                isMobile
                  ? { minWidth: 0 }
                  : {
                      minWidth: 0,
                      position: 'sticky',
                      top: 16,
                      alignSelf: 'flexStart',
                    }
              }
              grow={2}
            >
              {/* Sticky + flexStart only above mobile: this row wraps to
                full-width stacked items below OUI's responsive breakpoint,
                where sticky positioning has nothing useful to stick to. */}
              <StagedChangesPanel
                adds={adds}
                removes={removes}
                memberTotal={memberTotal}
                onUnstage={unstage}
                onDiscardAll={discardAll}
                onApply={applyChanges}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  },
);
