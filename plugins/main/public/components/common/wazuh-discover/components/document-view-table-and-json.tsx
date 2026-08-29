import React, { useMemo, useState } from 'react';
import { EuiFlexItem, EuiCodeBlock, EuiTabbedContent } from '@elastic/eui';
import {
  IndexPattern,
  Filter,
} from '../../../../../../../src/plugins/data/common';
import DocViewer from '../../doc-viewer/doc-viewer';
import { useDocViewer } from '../../doc-viewer';
import { useUnsavedChangesGuard } from '../../unsaved-changes-guard';
import { wzDiscoverI18n } from '../i18n';

interface DocumentViewTableAndJsonPropsDoc {
  document: any;
  indexPattern: IndexPattern;
  renderFields?: any;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  onFilter?: () => void;
  onDocumentMutated?: (sourceUpdate?: Record<string, unknown>) => void;
}

type DocumentViewTableAndJsonPropsAdditionalTabsObject = {
  id: string;
  name: string;
  content: React.ReactNode;
  guardUnsavedChanges?: boolean;
}[];

export type DocumentViewTableAndJsonPropsAdditionalTabs =
  | DocumentViewTableAndJsonPropsAdditionalTabsObject
  | ((
      options: DocumentViewTableAndJsonPropsDoc,
    ) => DocumentViewTableAndJsonPropsAdditionalTabsObject);

type DocumentViewTableAndJsonProps = DocumentViewTableAndJsonPropsDoc & {
  additionalTabs?: DocumentViewTableAndJsonPropsAdditionalTabs;
  showFilterButtons: boolean;
};

const GuardedTabbedContent = ({
  tabs,
  guardAction,
}: {
  tabs: Array<{ id: string; name: string; content: React.ReactNode }>;
  guardAction: (action: () => void) => void;
}) => {
  const [selectedTabId, setSelectedTabId] = useState(tabs[0].id);
  return (
    <EuiTabbedContent
      tabs={tabs}
      selectedTab={tabs.find(tab => tab.id === selectedTabId) ?? tabs[0]}
      onTabClick={(tab: { id: string }) => {
        if (tab.id === selectedTabId) {
          return;
        }
        guardAction(() => setSelectedTabId(tab.id));
      }}
    />
  );
};

export const DocumentViewTableAndJson = ({
  document,
  indexPattern,
  renderFields,
  filters,
  setFilters,
  onFilter,
  onDocumentMutated,
  additionalTabs = [],
  showFilterButtons,
}: DocumentViewTableAndJsonProps) => {
  const docViewerProps = useDocViewer({
    doc: document,
    indexPattern: indexPattern as IndexPattern,
  });
  const { active: unsavedChangesGuardActive, guardAction } =
    useUnsavedChangesGuard();

  const { tabs, hasGuardedTab } = useMemo(() => {
    const baseTabs: DocumentViewTableAndJsonPropsAdditionalTabsObject = [
      {
        id: 'table',
        name: wzDiscoverI18n.tableTab,
        content: (
          <DocViewer
            {...docViewerProps}
            renderFields={renderFields}
            filters={filters}
            setFilters={setFilters}
            onFilter={onFilter}
            showFilterButtons={showFilterButtons}
          />
        ),
      },
      {
        id: 'json',
        name: wzDiscoverI18n.jsonTab,
        content: (
          <EuiCodeBlock
            aria-label={wzDiscoverI18n.documentDetailsAria}
            language='json'
            isCopyable
            paddingSize='s'
          >
            {JSON.stringify(document, null, 2)}
          </EuiCodeBlock>
        ),
      },
    ];

    const resolvedAdditionalTabs = Array.isArray(additionalTabs)
      ? additionalTabs
      : additionalTabs({
          document,
          indexPattern,
          renderFields,
          filters,
          setFilters,
          onFilter,
          onDocumentMutated,
        });

    return {
      hasGuardedTab: resolvedAdditionalTabs.some(
        tab => tab.guardUnsavedChanges,
      ),
      tabs: [
        ...baseTabs,
        ...resolvedAdditionalTabs.map(({ guardUnsavedChanges, ...tab }) => ({
          ...tab,
          content:
            typeof tab.content === 'function'
              ? tab.content({
                  document,
                  indexPattern,
                  renderFields,
                  filters,
                  setFilters,
                  onFilter,
                  onDocumentMutated,
                })
              : tab.content,
        })),
      ],
    };
  }, [
    document,
    indexPattern,
    renderFields,
    filters,
    setFilters,
    onFilter,
    additionalTabs,
    showFilterButtons,
    docViewerProps,
  ]);

  const [guardTabSwitch] = useState(
    () => unsavedChangesGuardActive && hasGuardedTab,
  );

  return (
    <EuiFlexItem>
      {guardTabSwitch ? (
        <GuardedTabbedContent tabs={tabs} guardAction={guardAction} />
      ) : (
        <EuiTabbedContent tabs={tabs} />
      )}
    </EuiFlexItem>
  );
};
