import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCode,
  EuiCopy,
  EuiIcon,
  EuiLink,
  EuiLoadingSpinner,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { LinkCtiProps, CtiDeviceAuthorization } from '../types';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
import {
  CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC,
  CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC,
  CTI_ENVIRONMENT_EXISTS_HELP_DELAY_SEC,
  WAZUH_CLOUD_PORTAL_HREF,
  routes,
  statusCodes,
} from '../../../../common/constants';
import { CtiDeviceAuthLinks } from './cti-device-auth-links';
import { CtiConsumersAccordion } from './cti-consumers-accordion';
import { useCtiRegistrationPermission } from '../hooks/use-cti-registration-permission';

type CtiHrefLinkProps = {
  href: string;
  children: React.ReactNode;
};

/** Whether a failed-status message carries the given OAuth `error` (alone or as `error: description`). */
function isOAuthError(message: string, error: string): boolean {
  return message === error || message.startsWith(`${error}:`);
}

const CtiHrefLink: React.FC<CtiHrefLinkProps> = ({ href, children }) => {
  const placeholder = href.length === 0;
  return (
    <EuiLink
      data-test-subj={placeholder ? 'ctiHrefLinkPlaceholder' : undefined}
      href={placeholder ? '#' : href}
      rel={placeholder ? undefined : 'noopener noreferrer'}
      target={placeholder ? undefined : '_blank'}
      onClick={
        placeholder
          ? (event: React.MouseEvent) => {
              event.preventDefault();
            }
          : undefined
      }
    >
      {children}
    </EuiLink>
  );
};

export const ModalCti: React.FC<LinkCtiProps> = ({
  handleModalToggle,
  statusCTI,
  refetchStatus,
  onDeviceFlowStarted,
}) => {
  const alreadyRegistered = statusCTI.status === statusCodes.SUCCESS;
  /**
   * Registering needs a privilege on the indexer that the device flow only evaluates
   * at the very end, after the environment already exists on the CTI side. Probing on
   * open lets us warn instead of inviting a user into a flow that cannot complete.
   */
  const permission = useCtiRegistrationPermission(!alreadyRegistered);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showEnvironmentExistsHelp, setShowEnvironmentExistsHelp] =
    React.useState(false);
  const [deviceAuth, setDeviceAuth] =
    React.useState<CtiDeviceAuthorization | null>(() =>
      ctiFlowState.getDeviceAuthLinks(),
    );
  const [serverSnapshotReady, setServerSnapshotReady] = React.useState(() => {
    if (
      statusCTI.status === statusCodes.SUCCESS ||
      statusCTI.status === statusCodes.REGISTRATION_FAILED
    ) {
      return true;
    }
    return Boolean(ctiFlowState.getDeviceAuthLinks());
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refetchStatus();
      if (cancelled) {
        return;
      }
      setDeviceAuth(ctiFlowState.getDeviceAuthLinks());
      setServerSnapshotReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refetchStatus]);

  useEffect(() => {
    if (statusCTI.status === statusCodes.SUCCESS) {
      setDeviceAuth(null);
    }
    if (statusCTI.status === statusCodes.REGISTRATION_FAILED) {
      setDeviceAuth(null);
    }
  }, [statusCTI.status]);

  useEffect(() => {
    const hasActiveDeviceFlow =
      Boolean(ctiFlowState.getDeviceCode()) &&
      !ctiFlowState.isRegistrationComplete() &&
      !ctiFlowState.isRegistered();
    const latestDeviceAuth = ctiFlowState.getDeviceAuthLinks();

    if (!hasActiveDeviceFlow) {
      if (deviceAuth) {
        setDeviceAuth(null);
      }
      return;
    }

    if (!latestDeviceAuth) {
      if (deviceAuth) {
        setDeviceAuth(null);
      }
      return;
    }

    if (!deviceAuth) {
      setDeviceAuth(latestDeviceAuth);
    }
  }, [statusCTI, deviceAuth]);

  useEffect(() => ctiFlowState.openModal(), []);

  // Closing during a pending activation cancels it, so ask first. Requesting
  // a close again while the confirmation is shown backs out of it.
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const requestClose = () => {
    if (!deviceAuth) {
      handleModalToggle();
      return;
    }
    setConfirmingCancel(confirming => !confirming);
  };

  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    // EUI's own Escape handler lives on the modal's wrapper div, so it only
    // fires while focus is inside. Each flow transition here (register ->
    // device-flow -> success) unmounts the previously focused element,
    // dropping focus to document.body and silently breaking Escape.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartRegistration = async () => {
    setError(null);
    setLoading(true);
    try {
      /* eslint-disable camelcase -- POST body/response match OAuth device authorization field names */
      const ctiResponse = await getCore().http.post<{
        device_code?: string;
        user_code?: string;
        verification_uri?: string;
        verification_uri_complete?: string;
        interval?: number;
        expires_in?: number;
      }>(routes.token, {
        body: JSON.stringify({}),
      });

      if (
        typeof ctiResponse.device_code === 'string' &&
        ctiResponse.device_code.length > 0
      ) {
        ctiFlowState.setDeviceCode(ctiResponse.device_code);
      }

      const rawInterval = ctiResponse.interval;
      const intervalSec =
        typeof rawInterval === 'number' && rawInterval > 0
          ? rawInterval
          : CTI_DEFAULT_DEVICE_POLL_INTERVAL_SEC;
      ctiFlowState.setPollIntervalSec(intervalSec);

      const rawExpires = ctiResponse.expires_in;
      const expiresInSec =
        typeof rawExpires === 'number' && rawExpires > 0
          ? rawExpires
          : CTI_DEFAULT_DEVICE_CODE_EXPIRES_IN_SEC;
      ctiFlowState.setDeviceAuthExpiry(expiresInSec);
      ctiFlowState.setDeviceAuthPendingFor(0);

      const verificationUri =
        ctiResponse.verification_uri ??
        ctiResponse.verification_uri_complete ??
        '';
      const userCode = ctiResponse.user_code ?? '';
      const verificationUriComplete =
        ctiResponse.verification_uri_complete ??
        (verificationUri && userCode
          ? `${verificationUri}${
              verificationUri.includes('?') ? '&' : '?'
            }user_code=${encodeURIComponent(userCode)}`
          : '');

      const links: CtiDeviceAuthorization = {
        user_code: userCode,
        verification_uri: verificationUri || verificationUriComplete,
        verification_uri_complete: verificationUriComplete,
      };
      setDeviceAuth(links);
      ctiFlowState.setDeviceAuthLinks(links);
      /* eslint-enable camelcase */
      setLoading(false);

      if (verificationUriComplete) {
        window.open(verificationUriComplete, 'wazuh_cti');
      }

      onDeviceFlowStarted?.();
    } catch {
      setLoading(false);
      setError(
        i18n.translate('wazuhCheckUpdates.ctiRegistration.connectionError', {
          defaultMessage:
            'There was an error connecting to the CTI service. Please try again later.',
        }),
      );
    }
  };

  const awaitingServerSnapshot =
    (!serverSnapshotReady || permission.loading) &&
    statusCTI.status === statusCodes.NOT_FOUND &&
    !deviceAuth;

  const showInProgress =
    Boolean(deviceAuth) &&
    statusCTI.status === statusCodes.NOT_FOUND &&
    !ctiFlowState.isRegistrationComplete();

  /*
   * Wazuh Cloud rejects the user code with "Environment already exists" when a
   * deployment with this environment UID is still registered there. The rejection rolls
   * back, so the code stays pending and polling only ever sees `authorization_pending`
   * until it expires. The dashboard cannot detect the rejection, so once the code has
   * been pending longer than a normal activation takes, explain it and the way out:
   * delete that deployment, then enter the same code again (Wazuh Cloud hands out the
   * same pending code until it expires, so a new one cannot be requested).
   */
  useEffect(() => {
    if (!showInProgress) {
      setShowEnvironmentExistsHelp(false);
      return undefined;
    }
    const pendingMs = ctiFlowState.getDeviceAuthPendingMs();
    const remainingMs =
      pendingMs === null
        ? 0
        : CTI_ENVIRONMENT_EXISTS_HELP_DELAY_SEC * 1000 - pendingMs;
    if (remainingMs <= 0) {
      setShowEnvironmentExistsHelp(true);
      return undefined;
    }
    setShowEnvironmentExistsHelp(false);
    const timeoutId = setTimeout(
      () => setShowEnvironmentExistsHelp(true),
      remainingMs,
    );
    return () => clearTimeout(timeoutId);
  }, [showInProgress]);

  const environmentUid = ctiFlowState.getEnvironmentUid();

  const showSuccess = statusCTI.status === statusCodes.SUCCESS;

  const showRegistrationFailed =
    statusCTI.status === statusCodes.REGISTRATION_FAILED;

  const registrationFailedMessage = isOAuthError(
    statusCTI.message,
    'expired_token',
  )
    ? i18n.translate('wazuhCheckUpdates.ctiRegistration.failedExpiredBody', {
        defaultMessage:
          'The user code expired before the activation was completed in Wazuh Cloud. If Wazuh Cloud showed "Environment already exists", delete this deployment in CTI > Deployments in Wazuh Cloud, then register again.',
      })
    : statusCTI.message;

  const showPermissionDenied =
    serverSnapshotReady &&
    !permission.loading &&
    !permission.accessAllowed &&
    !showSuccess &&
    !showRegistrationFailed &&
    !deviceAuth;

  const showRegistrationIntro =
    serverSnapshotReady &&
    !permission.loading &&
    !showPermissionDenied &&
    !showSuccess &&
    !showRegistrationFailed &&
    !deviceAuth;

  const subscriptionPlanName =
    ctiFlowState.getSubscription()?.message?.plan?.name;

  const ctiTemporarilyUnreachable =
    showSuccess && ctiFlowState.getSubscription()?.message === null;

  return (
    <EuiModal onClose={requestClose}>
      <EuiModalHeader>
        <div>
          <EuiModalHeaderTitle>
            <EuiTitle>
              {showSuccess ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <EuiIcon
                    type='checkInCircleFilled'
                    color='success'
                    size='xl'
                    aria-hidden
                  />
                  <FormattedMessage
                    id='wazuhCheckUpdates.ctiRegistration.modalTitleSuccess'
                    defaultMessage='Your Wazuh XDR registration is complete'
                  />
                </span>
              ) : showRegistrationFailed ? (
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.modalTitleFailed'
                  defaultMessage='CTI registration'
                />
              ) : awaitingServerSnapshot ? (
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.modalTitleLoading'
                  defaultMessage='CTI registration'
                />
              ) : deviceAuth ? (
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.modalTitleInProgress'
                  defaultMessage='Complete activation in Wazuh Cloud'
                />
              ) : (
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.modalTitle'
                  defaultMessage='Wazuh XDR registration'
                />
              )}
            </EuiTitle>
          </EuiModalHeaderTitle>
          {deviceAuth && !showSuccess && !showRegistrationFailed ? (
            <>
              <EuiSpacer size='s' />
              <EuiText
                size='s'
                color='subdued'
                data-test-subj='ctiModalDeviceFlowSubtitle'
              >
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.modalSubtitleDeviceFlow'
                  defaultMessage='Complete your registration in Wazuh Cloud using the user code on the activation page. Alternatively, you can click on the link below.'
                />
              </EuiText>
            </>
          ) : null}
        </div>
      </EuiModalHeader>

      <EuiModalBody>
        {awaitingServerSnapshot ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '24px 0',
            }}
          >
            <EuiLoadingSpinner size='xl' data-test-subj='ctiModalSyncSpinner' />
          </div>
        ) : null}
        {showRegistrationIntro ? (
          <EuiText>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.modalBodyAdditional'
              defaultMessage='Register your Wazuh XDR to receive the latest Cyber Threat Intelligence content. For more information, visit our {documentationCTIWazuh}.'
              values={{
                documentationCTIWazuh: (
                  <EuiLink
                    href='https://cti.wazuh.com/vulnerabilities/cves'
                    target='_blank'
                  >
                    <FormattedMessage
                      id='wazuhCheckUpdates.ctiRegistration.modalBodyAdditionalLink'
                      defaultMessage='documentation'
                    />
                  </EuiLink>
                ),
              }}
            />
          </EuiText>
        ) : null}
        {showPermissionDenied ? (
          <EuiCallOut
            title={
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.permissionDeniedTitle'
                defaultMessage='You cannot register this environment'
              />
            }
            color='warning'
            iconType='alert'
            data-test-subj='ctiRegistrationPermissionDenied'
          >
            <EuiText size='s'>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.permissionDeniedBody'
                defaultMessage='Registering Wazuh XDR requires privileges your user does not have.'
              />
            </EuiText>
            {permission.missingPrivileges.length > 0 ? (
              <>
                <EuiSpacer size='s' />
                <EuiText size='s'>
                  <FormattedMessage
                    id='wazuhCheckUpdates.ctiRegistration.permissionDeniedMissingLabel'
                    defaultMessage='Missing privileges:'
                  />
                </EuiText>
                <EuiSpacer size='xs' />
                <EuiText size='s'>
                  <ul>
                    {permission.missingPrivileges.map(privilege => (
                      <li key={privilege}>
                        <EuiCode>{privilege}</EuiCode>
                      </li>
                    ))}
                  </ul>
                </EuiText>
              </>
            ) : null}
          </EuiCallOut>
        ) : null}
        {deviceAuth && !showSuccess && !showRegistrationFailed && (
          <>
            <CtiDeviceAuthLinks deviceAuth={deviceAuth} />
          </>
        )}
        {showInProgress && (
          <>
            <EuiSpacer size='m' />
            <div
              className='ctiRegistrationActivationPending'
              data-test-subj='ctiRegistrationInProgress'
            >
              <EuiText size='s' color='subdued'>
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.waitingForActivation'
                  defaultMessage='Checking activation status'
                />
              </EuiText>
              <EuiLoadingSpinner size='m' />
            </div>
            {showEnvironmentExistsHelp ? (
              <>
                <EuiSpacer size='m' />
                <EuiCallOut
                  size='s'
                  color='primary'
                  iconType='questionInCircle'
                  data-test-subj='ctiRegistrationEnvironmentExistsHelp'
                  title={
                    <FormattedMessage
                      id='wazuhCheckUpdates.ctiRegistration.environmentExistsTitle'
                      defaultMessage='Did Wazuh Cloud show "Environment already exists"?'
                    />
                  }
                >
                  <EuiText size='s'>
                    <p>
                      <FormattedMessage
                        id='wazuhCheckUpdates.ctiRegistration.environmentExistsBody'
                        defaultMessage='This deployment is still registered in Wazuh Cloud. Wazuh Cloud does not report it to the dashboard, so the activation stays pending until the user code expires. To register again:'
                      />
                    </p>
                    <ol>
                      <li>
                        {environmentUid ? (
                          <>
                            <FormattedMessage
                              id='wazuhCheckUpdates.ctiRegistration.environmentExistsStepDeleteId'
                              defaultMessage='In Wazuh Cloud, go to CTI > Deployments and delete the deployment with this ID:'
                            />
                            <br />
                            <EuiCode data-test-subj='ctiRegistrationDeploymentId'>
                              {environmentUid}
                            </EuiCode>
                            <EuiCopy textToCopy={environmentUid}>
                              {(copy: () => void) => (
                                <EuiButtonEmpty
                                  size='xs'
                                  color='text'
                                  iconType='copyClipboard'
                                  onClick={copy}
                                  data-test-subj='ctiRegistrationCopyDeploymentId'
                                >
                                  <FormattedMessage
                                    id='wazuhCheckUpdates.ctiRegistration.copyDeploymentId'
                                    defaultMessage='Copy deployment ID'
                                  />
                                </EuiButtonEmpty>
                              )}
                            </EuiCopy>
                          </>
                        ) : (
                          <FormattedMessage
                            id='wazuhCheckUpdates.ctiRegistration.environmentExistsStepDelete'
                            defaultMessage='In Wazuh Cloud, go to CTI > Deployments and delete this deployment.'
                          />
                        )}
                      </li>
                      <li>
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiRegistration.environmentExistsStepRetry'
                          defaultMessage='Enter the same user code again. The registration then completes here.'
                        />
                      </li>
                    </ol>
                  </EuiText>
                </EuiCallOut>
              </>
            ) : null}
          </>
        )}
        {showSuccess && (
          <>
            <div data-test-subj='ctiRegistrationSuccessContent'>
              <EuiText size='s'>
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.successManageBody'
                  defaultMessage='To manage your Wazuh XDR registration, unlock additional capabilities, or explore other services, please visit your {cloudLink}.'
                  values={{
                    cloudLink: (
                      <CtiHrefLink href={WAZUH_CLOUD_PORTAL_HREF}>
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiRegistration.successCloudLink'
                          defaultMessage='Wazuh Cloud'
                        />
                      </CtiHrefLink>
                    ),
                  }}
                />
              </EuiText>
              {subscriptionPlanName ? (
                <>
                  <EuiSpacer size='m' />
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <EuiText size='s'>
                      <strong>
                        <FormattedMessage
                          id='wazuhCheckUpdates.ctiRegistration.successPlanLabel'
                          defaultMessage='Plan:'
                        />
                      </strong>
                    </EuiText>
                    <EuiBadge
                      color='hollow'
                      data-test-subj='ctiRegistrationPlan'
                    >
                      {subscriptionPlanName}
                    </EuiBadge>
                  </span>
                </>
              ) : null}
              {ctiTemporarilyUnreachable && (
                <>
                  <EuiSpacer size='m' />
                  <EuiCallOut
                    title={
                      <FormattedMessage
                        id='wazuhCheckUpdates.ctiRegistration.ctiUnreachableTitle'
                        defaultMessage='CTI temporarily unreachable'
                      />
                    }
                    color='warning'
                    iconType='alert'
                    data-test-subj='ctiRegistrationUnreachableCallOut'
                  >
                    <FormattedMessage
                      id='wazuhCheckUpdates.ctiRegistration.ctiUnreachableBody'
                      defaultMessage='Your registration is unchanged. Plan details will refresh once CTI is reachable again.'
                    />
                  </EuiCallOut>
                </>
              )}
              <EuiSpacer size='m' />
              <CtiConsumersAccordion />
            </div>
          </>
        )}
        {showRegistrationFailed && (
          <>
            <EuiSpacer size='m' />
            <EuiCallOut
              title={
                <FormattedMessage
                  id='wazuhCheckUpdates.ctiRegistration.failedTitle'
                  defaultMessage='Registration could not be completed'
                />
              }
              color='danger'
              iconType='alert'
            >
              {registrationFailedMessage ? (
                <EuiText size='s' data-test-subj='ctiRegistrationFailedMessage'>
                  {registrationFailedMessage}
                </EuiText>
              ) : null}
            </EuiCallOut>
          </>
        )}
        {error && (
          <EuiCallOut
            title={
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.errorTitle'
                defaultMessage='Registration Error'
              />
            }
            color='danger'
            iconType='alert'
            style={{ marginTop: deviceAuth ? 16 : 0, marginBottom: '16px' }}
          >
            {error}
          </EuiCallOut>
        )}
        {deviceAuth && confirmingCancel && (
          <EuiCallOut
            size='s'
            color='warning'
            iconType='alert'
            data-test-subj='ctiCancelConfirmMessage'
            title={
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalCancelConfirmMessage'
                defaultMessage='Are you sure you want to cancel the registration?'
              />
            }
            style={{ marginTop: 16 }}
          />
        )}
      </EuiModalBody>

      <EuiModalFooter>
        {showSuccess || showRegistrationFailed ? (
          <EuiButtonEmpty onClick={handleModalToggle}>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.modalButtonClose'
              defaultMessage='Close'
            />
          </EuiButtonEmpty>
        ) : awaitingServerSnapshot ? (
          <EuiButtonEmpty onClick={handleModalToggle}>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.modalButtonClose'
              defaultMessage='Close'
            />
          </EuiButtonEmpty>
        ) : deviceAuth && confirmingCancel ? (
          <>
            <EuiButtonEmpty onClick={() => setConfirmingCancel(false)}>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalButtonKeepWaiting'
                defaultMessage='Keep waiting'
              />
            </EuiButtonEmpty>
            <EuiButton color='danger' onClick={handleModalToggle} fill>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalButtonConfirmCancel'
                defaultMessage='Cancel registration'
              />
            </EuiButton>
          </>
        ) : deviceAuth ? (
          <EuiButtonEmpty onClick={requestClose}>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.modalButtonCancel'
              defaultMessage='Cancel'
            />
          </EuiButtonEmpty>
        ) : showPermissionDenied ? (
          <EuiButtonEmpty onClick={handleModalToggle}>
            <FormattedMessage
              id='wazuhCheckUpdates.ctiRegistration.modalButtonClose'
              defaultMessage='Close'
            />
          </EuiButtonEmpty>
        ) : (
          <>
            <EuiButtonEmpty onClick={handleModalToggle}>
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalButtonCancel'
                defaultMessage='Cancel'
              />
            </EuiButtonEmpty>
            <EuiButton
              isLoading={loading}
              onClick={handleStartRegistration}
              fill
            >
              <FormattedMessage
                id='wazuhCheckUpdates.ctiRegistration.modalButtonRegister'
                defaultMessage='Register'
              />
            </EuiButton>
          </>
        )}
      </EuiModalFooter>
    </EuiModal>
  );
};
