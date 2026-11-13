import React, { Fragment, useEffect, useMemo, useState } from 'react';
import {
  EuiCallOut,
  EuiCode,
  EuiDescriptionList,
  EuiLoadingSpinner,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  compareEnrollmentTokenEndpoint,
  decodeEnrollmentToken,
  EnrollmentTokenSummary,
  ExpectedEnrollmentEndpoint,
  formatEnrollmentTokenEndpoint,
  getEnrollmentToken,
} from '../../../../../services/enrollment-tokens';
import { formatUIDate } from '../../../../../react-services/time-service';
import { getEnrollmentTokenStatus } from '../../../../enrollment-tokens/utils/token-status';
import { formatEnrollmentsUsage } from '../../../../enrollment-tokens/utils/format-enrollments-usage';

interface ExistingTokenStatusProps {
  /* The pasted token, already trimmed and validated by the form. */
  token: string;
  /* The endpoint entered on the server address step. */
  expectedEndpoint: ExpectedEnrollmentEndpoint;
}

type TokenLookup =
  | { state: 'checking' }
  | { state: 'found'; summary: EnrollmentTokenSummary }
  | { state: 'unknown' }
  | { state: 'failed'; message?: string };

const CHECKING: TokenLookup = { state: 'checking' };

const CALLOUT_CLASS = 'warningForAgentName';

/* Every finding below is a warning and never a block: the manager is what
accepts or refuses the token when the agent enrolls, and what is checked here
is only what the dashboard can see of it now. */
const STALE_TOKEN_TITLE: Record<'revoked' | 'expired' | 'exhausted', string> = {
  revoked: i18n.translate(
    'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.revokedTitle',
    { defaultMessage: 'This token is revoked' },
  ),
  expired: i18n.translate(
    'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.expiredTitle',
    { defaultMessage: 'This token has expired' },
  ),
  exhausted: i18n.translate(
    'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.exhaustedTitle',
    { defaultMessage: 'This token has no enrollments left' },
  ),
};

const formatExpectedEndpoint = ({
  address,
  port,
  prefix,
}: ExpectedEnrollmentEndpoint) => {
  const shownPort = String(port ?? '').trim();
  const shownPrefix = String(prefix ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return `${String(address ?? '').trim()}${shownPort ? `:${shownPort}` : ''}${
    shownPrefix ? `/${shownPrefix}` : ''
  }`;
};

const ExistingTokenStatus = ({
  token,
  expectedEndpoint,
}: ExistingTokenStatusProps) => {
  const decoded = useMemo(() => decodeEnrollmentToken(token), [token]);
  const tokenId = decoded?.id;
  /* Kept with the id it answers for, so that the answer about a token that was
  replaced is never shown for the one pasted after it. */
  const [answer, setAnswer] = useState<{ id: string; lookup: TokenLookup }>();
  const lookup = answer && answer.id === tokenId ? answer.lookup : CHECKING;

  /* The id is the first half of the token key, and the listing names the
  token by it, so the token's state comes from the same listing the Enrollment
  tokens app shows. */
  useEffect(() => {
    if (!tokenId) {
      return;
    }
    let isCurrent = true;
    getEnrollmentToken(tokenId)
      .then(summary => {
        if (isCurrent) {
          setAnswer({
            id: tokenId,
            lookup: summary
              ? { state: 'found', summary }
              : { state: 'unknown' },
          });
        }
      })
      .catch(error => {
        if (isCurrent) {
          setAnswer({
            id: tokenId,
            lookup: { state: 'failed', message: error?.message },
          });
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [tokenId]);

  if (!decoded) {
    return (
      <>
        <EuiSpacer size='m' />
        <EuiCallOut
          color='warning'
          iconType='alert'
          className={CALLOUT_CLASS}
          title={i18n.translate(
            'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.unreadableTitle',
            {
              defaultMessage: 'This text cannot be read as an enrollment token',
            },
          )}
        >
          <p>
            {i18n.translate(
              'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.unreadableDescription',
              {
                defaultMessage:
                  'Check that the whole token was pasted. The deployment command below uses the text as entered, and the manager will refuse it at enrollment if it is not a token it minted.',
              },
            )}
          </p>
        </EuiCallOut>
      </>
    );
  }

  const tokenEndpoint = formatEnrollmentTokenEndpoint(decoded.endpoint);
  const endpointMismatches = compareEnrollmentTokenEndpoint(
    decoded.endpoint,
    expectedEndpoint,
  );
  const status =
    lookup.state === 'found' ? getEnrollmentTokenStatus(lookup.summary) : null;
  const findings: { id: string; title: string; body: string }[] = [];

  if (endpointMismatches.length > 0) {
    findings.push({
      id: 'endpoint',
      title: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.endpointMismatchTitle',
        {
          defaultMessage:
            'This token names a different manager address than the one entered',
        },
      ),
      body: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.endpointMismatchDescription',
        {
          defaultMessage:
            'The token connects agents to {tokenEndpoint}, but the server address step says {enteredEndpoint}. The deployment command takes the address from the token, so the agents will connect to {tokenEndpoint}.',
          values: {
            tokenEndpoint,
            enteredEndpoint: formatExpectedEndpoint(expectedEndpoint),
          },
        },
      ),
    });
  }

  if (!tokenId) {
    findings.push({
      id: 'no-credential',
      title: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.noCredentialTitle',
        { defaultMessage: 'This token carries no credential' },
      ),
      body: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.noCredentialDescription',
        {
          defaultMessage:
            'Its status cannot be checked, because only a token with a credential has an id in the token list. The manager accepts it only when its configuration has <use_password> set to "no".',
        },
      ),
    });
  } else if (lookup.state === 'failed') {
    findings.push({
      id: 'failed',
      title: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.lookupFailedTitle',
        { defaultMessage: 'The status of this token could not be checked' },
      ),
      body:
        lookup.message ||
        i18n.translate(
          'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.lookupFailedDescription',
          {
            defaultMessage:
              'The token list could not be read. The manager still checks the token when the agent enrolls.',
          },
        ),
    });
  } else if (lookup.state === 'unknown') {
    findings.push({
      id: 'unknown',
      title: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.unknownTitle',
        { defaultMessage: 'This manager does not know this token' },
      ),
      body: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.unknownDescription',
        {
          defaultMessage:
            'No token with the id {id} is in the token list. It may have been minted by another manager or removed by a purge. The manager refuses a token it does not know at enrollment.',
          values: { id: tokenId },
        },
      ),
    });
  } else if (status && status !== 'active') {
    findings.push({
      id: 'status',
      title: STALE_TOKEN_TITLE[status],
      body: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.staleDescription',
        {
          defaultMessage:
            'The manager refuses this token at enrollment, so agents installed with the command below will not enroll. Generate a new token on the other tab.',
        },
      ),
    });
  }

  const details = [
    ...(tokenId
      ? [
          {
            title: i18n.translate(
              'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.idLabel',
              { defaultMessage: 'ID' },
            ),
            description: <EuiCode>{tokenId}</EuiCode>,
          },
        ]
      : []),
    {
      title: i18n.translate(
        'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.addressLabel',
        { defaultMessage: 'Manager address' },
      ),
      description: tokenEndpoint,
    },
    ...(tokenId && lookup.state === 'found'
      ? [
          {
            title: i18n.translate(
              'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.expiresLabel',
              { defaultMessage: 'Expires' },
            ),
            description: formatUIDate(lookup.summary.expires),
          },
          {
            title: i18n.translate(
              'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.enrollmentsLabel',
              { defaultMessage: 'Enrollments' },
            ),
            description: formatEnrollmentsUsage(lookup.summary),
          },
        ]
      : []),
  ];

  const isChecking = Boolean(tokenId) && lookup.state === 'checking';

  return (
    <>
      {findings.map(finding => (
        <Fragment key={finding.id}>
          <EuiSpacer size='m' />
          <EuiCallOut
            color='warning'
            iconType='alert'
            className={CALLOUT_CLASS}
            title={finding.title}
            data-test-subj={`existingTokenFinding-${finding.id}`}
          >
            <p>{finding.body}</p>
          </EuiCallOut>
        </Fragment>
      ))}
      <EuiSpacer size='m' />
      <EuiCallOut
        color={findings.length > 0 ? 'primary' : 'success'}
        iconType={findings.length > 0 ? 'iInCircle' : 'check'}
        className={CALLOUT_CLASS}
        title={
          isChecking ? (
            <>
              <EuiLoadingSpinner size='m' />{' '}
              {i18n.translate(
                'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenStatus.checkingTitle',
                { defaultMessage: 'Checking the token' },
              )}
            </>
          ) : (
            i18n.translate(
              'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenInUseTitle',
              { defaultMessage: 'Using the token provided' },
            )
          )
        }
      >
        <p>
          {i18n.translate(
            'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenInUseDescription',
            {
              defaultMessage:
                'The deployment command below installs the agent with this token. The manager checks the token again when the agent enrolls.',
            },
          )}
        </p>
        <EuiDescriptionList
          type='column'
          compressed
          listItems={details}
          data-test-subj='existingTokenDetails'
        />
      </EuiCallOut>
    </>
  );
};

export default ExistingTokenStatus;
