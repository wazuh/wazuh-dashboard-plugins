import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiSpacer,
} from '@elastic/eui';
import { getCore } from '../../plugin-services';
import { requestCtiContentUpdate } from '../../services/cti-feed';
import { ModalCti } from '../../shared-components/cti-registration/components/modal-cti';
import { useCtiRegistrationModal } from '../../shared-components/cti-registration/hooks/use-cti-registration-modal';
import { SubscriptionPanel } from './subscription-panel';
import { FeedSyncPanel } from './feed-sync-panel';
import { FeedContentPanel } from './feed-content-panel';
import { useCtiConsumers } from './hooks/use-cti-consumers';
import { useFeedContentCounts } from './hooks/use-feed-content-counts';

const UpdateCtiContentButton: React.FC<{ onRequested: () => void }> = ({
  onRequested,
}) => {
  const [requesting, setRequesting] = useState(false);

  const handleClick = async () => {
    setRequesting(true);
    const { toasts } = getCore().notifications;
    try {
      await requestCtiContentUpdate();
      toasts.addSuccess({
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.updateButton.successToastTitle',
          { defaultMessage: 'CTI update requested' },
        ),
        text: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.updateButton.successToastText',
          { defaultMessage: 'The update has been requested successfully' },
        ),
        toastLifeTimeMs: 5000,
      });
      onRequested();
    } catch (error) {
      toasts.addError(error as Error, {
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.updateButton.errorToastTitle',
          { defaultMessage: 'Error updating CTI feeds' },
        ),
      });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <EuiButton
      fill
      iconType='refresh'
      isLoading={requesting}
      onClick={handleClick}
      data-test-subj='ctiFeedUpdateButton'
    >
      {i18n.translate('wazuhCheckUpdates.ctiFeed.updateButton.label', {
        defaultMessage: 'Update CTI content',
      })}
    </EuiButton>
  );
};

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

  // Counts change when a sync lands, so refresh them once the feed settles.
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
            <UpdateCtiContentButton key='update' onRequested={sync.watch} />,
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
              onRetry={sync.refetch}
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
