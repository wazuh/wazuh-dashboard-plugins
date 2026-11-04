import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiSpacer,
  EuiLoadingContent,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import type { ScopedHistory } from 'opensearch-dashboards/public';
import { ModalCti } from '../../shared-components/cti-registration/components/modal-cti';
import { useCtiRegistrationModal } from '../../shared-components/cti-registration/hooks/use-cti-registration-modal';
import { SubscriptionPanel } from './subscription-panel';
import { FeedSyncPanel } from './feed-sync-panel';
import { FeedContentPanel } from './feed-content-panel';
import { useCtiConsumers } from './hooks/use-cti-consumers';
import { useFeedContentCounts } from './hooks/use-feed-content-counts';
import { CheckForUpdatesAbout } from './check-for-updates-about';
import { CheckForUpdatesButton } from './check-for-updates-button';
import { CtiTimestamp } from './cti-timestamp';
import type { VulnerabilityLookupRequest } from './catalog/vulnerability-lookup';

// Loaded when first opened: the overview never pays for the catalog views.
const IndicatorsTab = React.lazy(async () => ({
  default: (await import('./catalog/indicators-tab')).IndicatorsTab,
}));
const VulnerabilitiesTab = React.lazy(async () => ({
  default: (await import('./catalog/vulnerabilities-tab')).VulnerabilitiesTab,
}));

export type CtiFeedTab = 'overview' | 'indicators' | 'vulnerabilities';

const TABS: Array<{ id: CtiFeedTab; label: string }> = [
  {
    id: 'overview',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.tabs.overview', {
      defaultMessage: 'Overview',
    }),
  },
  {
    id: 'indicators',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.tabs.indicators', {
      defaultMessage: 'Indicators',
    }),
  },
  {
    id: 'vulnerabilities',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.tabs.vulnerabilities', {
      defaultMessage: 'Vulnerabilities',
    }),
  },
];

/** URL query parameter that holds the open tab, so a reload keeps it. */
const TAB_PARAM = 'tab';

const readTab = (history?: ScopedHistory): CtiFeedTab => {
  const value = new URLSearchParams(history?.location.search ?? '').get(
    TAB_PARAM,
  );
  return TABS.some(tab => tab.id === value)
    ? (value as CtiFeedTab)
    : 'overview';
};

/** The open tab, kept in the URL when the app has a history. */
const useTabState = (history?: ScopedHistory) => {
  const [tab, setTab] = useState<CtiFeedTab>(() => readTab(history));

  useEffect(() => history?.listen(() => setTab(readTab(history))), [history]);

  const selectTab = useCallback(
    (next: CtiFeedTab) => {
      setTab(next);
      if (history && readTab(history) !== next) {
        const params = new URLSearchParams(history.location.search);
        params.set(TAB_PARAM, next);
        history.push({ ...history.location, search: params.toString() });
      }
    },
    [history],
  );

  return [tab, selectTab] as const;
};

export interface CtiFeedAppProps {
  /** Opens the registration modal on mount. */
  openRegistration?: boolean;
  /** App history; the open tab is kept in its URL. */
  history?: ScopedHistory;
}

export const CtiFeedApp: React.FC<CtiFeedAppProps> = ({
  openRegistration = false,
  history,
}) => {
  const [tab, selectTab] = useTabState(history);
  // Tabs stay mounted once opened, so their filters and lookups survive a switch.
  const [visited, setVisited] = useState<Set<CtiFeedTab>>(() => new Set([tab]));
  useEffect(() => {
    setVisited(current =>
      current.has(tab) ? current : new Set([...current, tab]),
    );
  }, [tab]);
  const [vulnerabilityRequest, setVulnerabilityRequest] = useState<
    VulnerabilityLookupRequest | undefined
  >();
  const openVulnerability = useCallback(
    (id: string) => {
      setVulnerabilityRequest(current => ({
        id,
        nonce: (current?.nonce ?? 0) + 1,
      }));
      selectTab('vulnerabilities');
    },
    [selectTab],
  );
  const registration = useCtiRegistrationModal(openRegistration);
  const sync = useCtiConsumers();
  const content = useFeedContentCounts();

  // Counts change when a sync lands, so refresh them when a read finds it done.
  const previousSummary = useRef(sync.summary);
  const refetchContent = content.refetch;
  useEffect(() => {
    const wasMoving =
      previousSummary.current === 'syncing' ||
      previousSummary.current === 'pending';
    if (wasMoving && sync.summary === 'upToDate') {
      void refetchContent();
    }
    previousSummary.current = sync.summary;
  }, [sync.summary, refetchContent]);

  return (
    <EuiPage paddingSize='l' className='ctiFeed' data-test-subj='ctiFeedApp'>
      <EuiPageBody>
        <EuiPageHeader
          pageTitle={i18n.translate('wazuhCheckUpdates.ctiFeed.page.title', {
            defaultMessage: 'CTI feed',
          })}
          description={i18n.translate(
            'wazuhCheckUpdates.ctiFeed.page.description',
            {
              defaultMessage:
                'Threat intelligence from Wazuh Cyber Threat Intelligence: your subscription, the sync state of each feed and the content it adds to this environment.',
            },
          )}
          rightSideItems={[
            <EuiFlexGroup
              key='checkForUpdates'
              direction='column'
              alignItems='flexEnd'
              gutterSize='xs'
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiFlexGroup
                  gutterSize='s'
                  alignItems='center'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <CheckForUpdatesAbout />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    {/* The check writes `last_checked_at`, so read it back. */}
                    <CheckForUpdatesButton
                      onRequested={sync.refetchAfterCheck}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <CtiTimestamp
                  timestamp={sync.lastCheckedAt}
                  renderText={time =>
                    i18n.translate(
                      'wazuhCheckUpdates.ctiFeed.page.lastChecked',
                      {
                        defaultMessage: 'Last checked: {time}',
                        values: { time },
                      },
                    )
                  }
                  dataTestSubj='ctiFeedLastCheckedAt'
                />
              </EuiFlexItem>
            </EuiFlexGroup>,
          ]}
        />
        <EuiSpacer size='m' />
        <EuiTabs data-test-subj='ctiFeedTabs'>
          {TABS.map(item => (
            <EuiTab
              key={item.id}
              isSelected={tab === item.id}
              onClick={() => selectTab(item.id)}
              data-test-subj={`ctiFeedTab-${item.id}`}
            >
              {item.label}
            </EuiTab>
          ))}
        </EuiTabs>
        <EuiSpacer size='l' />
        <div hidden={tab !== 'overview'} data-test-subj='ctiFeedOverview'>
          <EuiFlexGroup gutterSize='l' alignItems='stretch'>
            <EuiFlexItem grow={2}>
              <SubscriptionPanel
                statusCTI={registration.statusCTI}
                loading={registration.loading}
                deviceFlowActive={registration.deviceFlowActive}
                onOpenRegistration={registration.openModal}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={3}>
              <FeedSyncPanel
                consumers={sync.consumers}
                summary={sync.summary}
                loading={sync.loading}
                error={sync.error}
                refreshing={sync.refreshing}
                onRefresh={sync.refetch}
                onUpdateRequested={sync.refetchAfterCheck}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='l' />
          <FeedContentPanel
            counts={content.counts}
            loading={content.loading}
            onRefresh={content.refetch}
            onOpenCatalog={key =>
              selectTab(key === 'iocs' ? 'indicators' : 'vulnerabilities')
            }
          />
        </div>
        <Suspense fallback={<EuiLoadingContent lines={8} />}>
          {visited.has('indicators') || tab === 'indicators' ? (
            <div
              hidden={tab !== 'indicators'}
              data-test-subj='ctiFeedIndicators'
            >
              <IndicatorsTab onOpenVulnerability={openVulnerability} />
            </div>
          ) : null}
          {visited.has('vulnerabilities') || tab === 'vulnerabilities' ? (
            <div
              hidden={tab !== 'vulnerabilities'}
              data-test-subj='ctiFeedVulnerabilities'
            >
              <VulnerabilitiesTab lookupRequest={vulnerabilityRequest} />
            </div>
          ) : null}
        </Suspense>
        {registration.isModalOpen ? (
          <ModalCti
            handleModalToggle={registration.toggleModal}
            statusCTI={registration.statusCTI}
            refetchStatus={registration.refetchStatus}
            onDeviceFlowStarted={registration.onDeviceFlowStarted}
          />
        ) : null}
      </EuiPageBody>
    </EuiPage>
  );
};
