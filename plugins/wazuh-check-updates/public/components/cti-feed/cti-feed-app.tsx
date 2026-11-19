import React, { useCallback, useEffect, useRef } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiSpacer,
} from '@elastic/eui';
import { ModalCti } from '../../shared-components/cti-registration/components/modal-cti';
import { useCtiRegistrationModal } from '../../shared-components/cti-registration/hooks/use-cti-registration-modal';
import { SubscriptionPanel } from './subscription-panel';
import { FeedSyncPanel } from './feed-sync-panel';
import { useCtiConsumers } from './hooks/use-cti-consumers';
import { useSubscriptionChange } from './hooks/use-subscription-change';
import { useFeedContentCounts } from './hooks/use-feed-content-counts';
import { CheckForUpdatesAbout } from './check-for-updates-about';
import { CheckForUpdatesButton } from './check-for-updates-button';
import { CtiTimestamp } from './cti-timestamp';

export interface CtiFeedAppProps {
  /** Opens the registration modal on mount. */
  openRegistration?: boolean;
}

export const CtiFeedApp: React.FC<CtiFeedAppProps> = ({
  openRegistration = false,
}) => {
  // A plan or registration change made in the CTI console shows as soon as the user
  // comes back to this page.
  const registration = useCtiRegistrationModal(openRegistration, {
    refreshOnFocus: true,
  });
  // Follows a running update until it finishes, so the page and the button catch up.
  const sync = useCtiConsumers({ followSync: true });
  const content = useFeedContentCounts();

  // Counts change when a sync lands, so refresh them when a read finds it done.
  const previousSummary = useRef(sync.summary);
  const refetchContent = content.refetch;
  // The refresh button of Feed sync reads the counts again too: they show in its rows.
  const refetchSyncState = sync.refetch;
  const refreshFeeds = useCallback(() => {
    void refetchSyncState();
    void refetchContent();
  }, [refetchSyncState, refetchContent]);
  useEffect(() => {
    const wasMoving =
      previousSummary.current === 'syncing' ||
      previousSummary.current === 'pending';
    if (wasMoving && sync.summary === 'upToDate') {
      void refetchContent();
    }
    previousSummary.current = sync.summary;
  }, [sync.summary, refetchContent]);

  // A registration or plan change starts a content update on the server: read the feed
  // sync state again, waiting for the indexer to record the check. Covers a change made
  // elsewhere (the CTI console, another tab) as well as clearing the local registration.
  // The update is treated as running from that moment, even before a feed shows it.
  const refetchSync = sync.refetchAfterCheck;
  const followRunningUpdate = sync.followRunningUpdate;
  useSubscriptionChange(
    useCallback(() => {
      followRunningUpdate();
      void refetchSync();
    }, [followRunningUpdate, refetchSync]),
  );

  // The status read turns the card to Open feed; the change above refreshes the feeds.
  const refetchStatus = registration.refetchStatus;
  const onRegistrationCleared = useCallback(() => {
    void refetchStatus();
  }, [refetchStatus]);

  return (
    <EuiPage paddingSize='l' className='ctiFeed' data-test-subj='ctiFeedApp'>
      <EuiPageBody>
        <EuiPageHeader
          className='ctiFeed__header'
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
                      updateInProgress={sync.updateInProgress}
                      onUpdateRunning={sync.followRunningUpdate}
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
        <EuiSpacer size='l' />
        <EuiFlexGroup gutterSize='l' alignItems='stretch'>
          <EuiFlexItem grow={2}>
            <SubscriptionPanel
              statusCTI={registration.statusCTI}
              loading={registration.loading}
              deviceFlowActive={registration.deviceFlowActive}
              onOpenRegistration={registration.openModal}
              onRegistrationCleared={onRegistrationCleared}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={3}>
            <FeedSyncPanel
              consumers={sync.consumers}
              summary={sync.summary}
              loading={sync.loading}
              error={sync.error}
              refreshing={sync.refreshing}
              onRefresh={refreshFeeds}
              onUpdateRequested={sync.refetchAfterCheck}
              updateInProgress={sync.updateInProgress}
              onUpdateRunning={sync.followRunningUpdate}
              contentCounts={content.counts}
              contentLoading={content.loading}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
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
