import React, { useEffect, useRef } from 'react';
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
import { FeedContentPanel } from './feed-content-panel';
import { useCtiConsumers } from './hooks/use-cti-consumers';
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
        <EuiSpacer size='l' />
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
        />
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
