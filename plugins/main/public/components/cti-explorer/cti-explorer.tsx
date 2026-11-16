/*
 * Wazuh app - CTI Explorer
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageHeader,
  EuiSpacer,
} from '@elastic/eui';
import {
  CTI_EXPLORER_IOC_TYPE_PARAM,
  isIocType,
  type CveSeverityFilter,
  type VulnerabilityRecordType,
} from '../../../common/cti-explorer/constants';
import type { IocFilters } from '../../../common/cti-explorer/types';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';
import NavigationService from '../../react-services/navigation-service';
import { useRouterSearch } from '../common/hooks/use-router-search';
import { useCtiRequest } from './hooks/use-cti-request';
import {
  fetchIocSummary,
  fetchVulnerabilitySummary,
} from './services/cti-explorer-api';
import { AboutCtiExplorer } from './components/about-cti-explorer';
import { OverviewTab } from './components/overview-tab';
import { IocsTab } from './components/iocs-tab';
import { VulnerabilitiesTab } from './components/vulnerabilities-tab';
import { IocFlyout } from './components/ioc-flyout';
import { VulnerabilityFlyout } from './components/vulnerability-flyout';
import { NORMAL_FONT_WEIGHT, PAGE_DESCRIPTION_STYLE } from './utils/styles';

const TABS = ['overview', 'iocs', 'vulnerabilities'] as const;
type CtiExplorerTab = (typeof TABS)[number];

const TAB_LABELS: Record<CtiExplorerTab, string> = {
  overview: i18n.translate('wazuh.ctiExplorer.tabs.overview', {
    defaultMessage: 'Overview',
  }),
  iocs: i18n.translate('wazuh.ctiExplorer.tabs.iocs', {
    defaultMessage: 'IOCs',
  }),
  vulnerabilities: i18n.translate('wazuh.ctiExplorer.tabs.vulnerabilities', {
    defaultMessage: 'Vulnerabilities',
  }),
};

/** The feeds whose content the page shows. */
const CTI_EXPLORER_FEEDS: Array<'iocs' | 'vulnerabilities'> = [
  'iocs',
  'vulnerabilities',
];

/** The IOC filters that a link opens the list with (`iocType`), if any. */
const getLinkedIocFilters = (iocType?: string): IocFilters | undefined =>
  isIocType(iocType) ? { type: iocType } : undefined;

/**
 * The open tab and the open record live in the URL (`tab`, `ioc`, `record`),
 * so a reload or a shared link opens the same view. A link from another page
 * can also open the IOC list filtered to one type (`iocType`).
 */
export const CtiExplorer = () => {
  const search = useRouterSearch() as Record<string, string | undefined>;
  const tab: CtiExplorerTab = TABS.includes(search.tab as CtiExplorerTab)
    ? (search.tab as CtiExplorerTab)
    : 'overview';

  const { CtiFeedSyncStatus } = getWazuhCheckUpdatesPlugin();

  // Read once for the page: the tabs share them and switching tabs keeps them.
  const iocSummary = useCtiRequest(fetchIocSummary, []);
  const vulnerabilitySummary = useCtiRequest(fetchVulnerabilitySummary, []);
  const linkedIocType = search[CTI_EXPLORER_IOC_TYPE_PARAM];
  // Read on the first render, so the list does not search without the filter first.
  const [iocFilters, setIocFilters] = useState<IocFilters>(
    () => getLinkedIocFilters(linkedIocType) ?? {},
  );
  const [scrollToIocList, setScrollToIocList] = useState(() =>
    Boolean(getLinkedIocFilters(linkedIocType)),
  );
  const [vulnerabilityType, setVulnerabilityType] =
    useState<VulnerabilityRecordType>();
  const [severities, setSeverities] = useState<CveSeverityFilter[]>([]);

  const setParams = useCallback(
    (params: Record<string, string | null>) =>
      NavigationService.getInstance().updateAndNavigateSearchParams(params),
    [],
  );
  const openIoc = (id: string) => setParams({ ioc: id, record: null });
  const openVulnerability = (id: string) =>
    setParams({ record: id, ioc: null });
  const closeFlyout = () => setParams({ ioc: null, record: null });

  // The linked filter is applied once and is then edited like any other: drop
  // it from the URL, replacing the entry so Back returns to the linking page.
  useEffect(() => {
    if (linkedIocType === undefined) {
      return;
    }
    const filters = getLinkedIocFilters(linkedIocType);
    if (filters) {
      setIocFilters(filters);
      setScrollToIocList(true);
    }
    NavigationService.getInstance().updateAndNavigateSearchParams(
      { [CTI_EXPLORER_IOC_TYPE_PARAM]: null },
      { replace: true },
    );
  }, [linkedIocType]);

  const browseIocs = (filters: IocFilters) => {
    setIocFilters(filters);
    setParams({ tab: 'iocs', ioc: null, record: null });
  };
  /** Opens the list with these filters only: none kept from a previous visit. */
  const browseVulnerabilities = (
    type?: VulnerabilityRecordType,
    selectedSeverities: CveSeverityFilter[] = [],
  ) => {
    setVulnerabilityType(type);
    setSeverities(selectedSeverities);
    setParams({ tab: 'vulnerabilities', ioc: null, record: null });
  };

  return (
    <>
      <EuiPageHeader
        pageTitle={i18n.translate('wazuh.ctiExplorer.page.title', {
          defaultMessage: 'CTI Explorer',
        })}
        description={
          <span style={PAGE_DESCRIPTION_STYLE}>
            {i18n.translate('wazuh.ctiExplorer.page.description', {
              defaultMessage:
                'Check a value against the threat intelligence the CTI feed delivers, and browse its indicators of compromise and vulnerability records.',
            })}
          </span>
        }
        rightSideItems={[
          <AboutCtiExplorer key='about' />,
          // Centered on the height of the buttons beside it. Opens the CTI
          // feed app, when it is enabled.
          <EuiFlexGroup
            key='feedSync'
            alignItems='center'
            responsive={false}
            style={{ height: '100%' }}
          >
            <EuiFlexItem grow={false}>
              <CtiFeedSyncStatus feeds={CTI_EXPLORER_FEEDS} />
            </EuiFlexItem>
          </EuiFlexGroup>,
        ]}
        tabs={TABS.map(id => ({
          label: <span style={NORMAL_FONT_WEIGHT}>{TAB_LABELS[id]}</span>,
          isSelected: id === tab,
          onClick: () => setParams({ tab: id }),
          'data-test-subj': `ctiExplorerTab-${id}`,
        }))}
        bottomBorder
      />
      <EuiSpacer size='m' />
      {tab === 'overview' ? (
        <OverviewTab
          iocSummary={iocSummary}
          vulnerabilitySummary={vulnerabilitySummary}
          onBrowseIocs={browseIocs}
          onBrowseVulnerabilities={browseVulnerabilities}
          onOpenIoc={openIoc}
          onOpenVulnerability={openVulnerability}
        />
      ) : null}
      {tab === 'iocs' ? (
        <IocsTab
          summary={iocSummary}
          filters={iocFilters}
          onFiltersChange={setIocFilters}
          onOpenIoc={openIoc}
          scrollToList={scrollToIocList}
          onListScrolled={() => setScrollToIocList(false)}
        />
      ) : null}
      {tab === 'vulnerabilities' ? (
        <VulnerabilitiesTab
          summary={vulnerabilitySummary}
          type={vulnerabilityType}
          onTypeChange={setVulnerabilityType}
          severities={severities}
          onSeveritiesChange={setSeverities}
          onOpenVulnerability={openVulnerability}
        />
      ) : null}
      {search.ioc ? (
        <IocFlyout
          id={search.ioc}
          onClose={closeFlyout}
          onOpenIoc={openIoc}
          onFilter={browseIocs}
        />
      ) : null}
      {search.record ? (
        <VulnerabilityFlyout id={search.record} onClose={closeFlyout} />
      ) : null}
    </>
  );
};
