import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  EuiBasicTableColumn,
  EuiButton,
  EuiCallOut,
  EuiCode,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiInMemoryTable,
  EuiLink,
  EuiSwitch,
  EuiTab,
  EuiTabs,
  EuiToolTip,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { UseFormReturn } from '../../../../common/form/types';
import { InputForm } from '../../../../common/form';
import { WzButtonPermissionsModalConfirm } from '../../../../common/buttons';
import AdvancedOptions from '../advanced-options/advanced-options';
import { ENROLLMENT_TOKEN_TEXTS } from '../../utils/register-agent-data';
import {
  createEnrollmentToken,
  getEnrollmentTokens,
  revokeEnrollmentToken,
  ENROLLMENT_TOKEN_WIZARD_DEFAULT_TTL,
  ENROLLMENT_TOKEN_DESCRIPTION_ALLOWED_SYMBOLS,
  ENROLLMENT_TOKEN_DESCRIPTION_MAX_LENGTH,
  ENROLLMENT_TOKEN_TTL_MAX_DAYS,
  EnrollmentTokenSummary,
} from '../../../../../services/enrollment-tokens';
import { EnrollmentToken } from '../../interfaces/types';
import { enrollmentTokens } from '../../../../../utils/applications';
import NavigationService from '../../../../../react-services/navigation-service';
import { formatUIDate } from '../../../../../react-services/time-service';
import { getEnrollmentTokenStatus } from '../../../../enrollment-tokens/utils/token-status';
import { getToasts } from '../../../../../kibana-services';
import '../group-input/group-input.scss';

interface EnrollmentTokenInputProps {
  formFields: UseFormReturn['fields'];
  enrollmentToken: EnrollmentToken | null;
  onEnrollmentTokenChange: (enrollmentToken: EnrollmentToken | null) => void;
}

const ENDPOINT_FIELDS = ['serverAddress', 'serverPort', 'serverPath'] as const;

/* The three fields that parameterize a mint request. */
const TOKEN_REQUEST_FIELDS = [
  'enrollmentTokenTtl',
  'enrollmentTokenMaxUses',
  'enrollmentTokenDescription',
] as const;

/* How many of the newest tokens are looked at when searching for unused ones
left over from earlier mints. */
const UNUSED_TOKENS_LOOKUP_LIMIT = 100;

const UNUSED_TOKENS_PAGE_SIZE = 5;

const columnName = (id: string, defaultMessage: string) =>
  i18n.translate(
    `wazuh.endpointsSummary.enrollmentTokenInput.revokeUnusedModal.columns.${id}`,
    { defaultMessage },
  );

/* What the operator needs to tell the tokens apart before revoking them. */
const UNUSED_TOKEN_COLUMNS: EuiBasicTableColumn<EnrollmentTokenSummary>[] = [
  {
    field: 'id',
    name: columnName('id', 'ID'),
    sortable: true,
    render: (id: string) => <EuiCode>{id}</EuiCode>,
  },
  {
    field: 'description',
    name: columnName('description', 'Description'),
    sortable: true,
    render: (description?: string | null) => description || '-',
  },
  {
    field: 'created',
    name: columnName('created', 'Created'),
    sortable: true,
    render: (created?: string) => formatUIDate(created),
  },
  {
    field: 'expires',
    name: columnName('expires', 'Expires'),
    sortable: true,
    render: (expires?: string) => formatUIDate(expires),
  },
];

type TokenSource = 'generate' | 'existing';

/* A token is either minted here or reused from an earlier deployment, never
both, so the two are read one at a time rather than side by side with whichever
one is not in use disabled. The open tab is the whole of the step. */
const TOKEN_SOURCE_TABS: { id: TokenSource; name: string }[] = [
  {
    id: 'generate',
    name: i18n.translate(
      'wazuh.endpointsSummary.enrollmentTokenInput.tabs.generate',
      {
        defaultMessage: 'Generate a new token',
      },
    ),
  },
  {
    id: 'existing',
    name: i18n.translate(
      'wazuh.endpointsSummary.enrollmentTokenInput.tabs.existing',
      {
        defaultMessage: 'Use an existing token',
      },
    ),
  },
];

const EnrollmentTokenInput = ({
  formFields,
  enrollmentToken,
  onEnrollmentTokenChange,
}: EnrollmentTokenInputProps) => {
  const { serverAddress, serverPort, serverPath } = formFields;
  const existingTokenField = formFields.existingEnrollmentToken;
  const existingTokenValue = String(existingTokenField?.value ?? '').trim();
  const existingTokenIsUsable =
    existingTokenValue.length > 0 && !existingTokenField?.error;

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Other tokens that are still active and have enrolled nobody, found after a
  mint. They are offered for revocation rather than revoked: an earlier command
  may be in use on a machine that has not enrolled yet. */
  const [unusedTokens, setUnusedTokens] = useState<EnrollmentTokenSummary[]>(
    [],
  );
  /* More tokens exist than the lookup reads, so the count is a lower bound. */
  const [unusedTokensTruncated, setUnusedTokensTruncated] = useState(false);
  /* Bumped on every mint so that the answer to a lookup or a revoke that
  started before it is not applied over the fresh list. */
  const generationRef = useRef(0);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  /* Not part of the validated form state: plain booleans with no validation of
  their own, both off because that is what the manager defaults to. */
  const [embedCa, setEmbedCa] = useState(false);
  const [noCredential, setNoCredential] = useState(false);
  /* The token minted on this step is held here as well as handed up, so that
  leaving the tab and coming back restores it. The server returns the token text
  once, and a second look at the other tab is not a reason to have to mint
  another one. */
  const [generatedToken, setGeneratedToken] = useState<EnrollmentToken | null>(
    enrollmentToken?.source === 'generated' ? enrollmentToken : null,
  );
  /* A token already in the field -- a form restored from an earlier visit, or
  an operator who arrived with one -- is what the step is about, so it opens on
  that tab rather than hiding what is in effect. */
  const [tokenSource, setTokenSource] = useState<TokenSource>(() =>
    existingTokenValue.length > 0 || existingTokenField?.error
      ? 'existing'
      : 'generate',
  );

  const endpoint = ENDPOINT_FIELDS.map(field => formFields[field]?.value ?? '');
  const endpointKey = endpoint.join('|');
  const previousEndpointKey = useRef(endpointKey);

  /* The token carries the manager address it was minted for, and the command
  takes the connection target from the token rather than from these fields. A
  token kept across an edit of the address would therefore deploy agents to the
  previous manager without saying so, so editing the endpoint discards it. A
  stored token is left alone: it was not minted from these fields, so they say
  nothing about the manager it names. */
  useEffect(() => {
    if (previousEndpointKey.current === endpointKey) {
      return;
    }
    previousEndpointKey.current = endpointKey;
    setError(null);
    setGeneratedToken(null);
  }, [endpointKey]);

  /* The open tab owns the token the deployment command is built from. A token
  committed on the other one is dropped on the way out, so nothing the operator
  can no longer see reaches the command, and coming back re-commits it. */
  useEffect(() => {
    if (tokenSource === 'existing') {
      if (!existingTokenIsUsable) {
        if (enrollmentToken) {
          onEnrollmentTokenChange(null);
        }
        return;
      }
      if (
        enrollmentToken?.source !== 'existing' ||
        enrollmentToken.token !== existingTokenValue
      ) {
        setError(null);
        onEnrollmentTokenChange({
          source: 'existing',
          token: existingTokenValue,
        });
      }
      return;
    }
    if (enrollmentToken !== generatedToken) {
      onEnrollmentTokenChange(generatedToken);
    }
  }, [tokenSource, existingTokenValue, existingTokenIsUsable, generatedToken]);

  /* What was typed on the tab being left is kept, so coming back to it restores
  the work -- with one exception. A value that does not validate is cleared,
  because the wizard reports field errors in a banner above the deployment
  commands and withholds the commands until they are gone, and an error on an
  input that is no longer rendered cannot be corrected. */
  const selectTokenSource = (nextSource: TokenSource) => {
    if (nextSource === tokenSource) {
      return;
    }
    const fieldsBeingLeft =
      tokenSource === 'existing'
        ? [existingTokenField]
        : TOKEN_REQUEST_FIELDS.map(name => formFields[name]);
    for (const leftField of fieldsBeingLeft) {
      if (leftField?.error) {
        leftField.onChange({ target: { value: '' } });
      }
    }
    setError(null);
    setTokenSource(nextSource);
  };

  const endpointIsInvalid =
    !serverAddress?.value ||
    ENDPOINT_FIELDS.some(field => Boolean(formFields[field]?.error));
  const tokenRequestIsInvalid = TOKEN_REQUEST_FIELDS.some(field =>
    Boolean(formFields[field]?.error),
  );

  const findUnusedTokens = async (mintedId: string, generation: number) => {
    try {
      const { tokens, total } = await getEnrollmentTokens(
        0,
        UNUSED_TOKENS_LOOKUP_LIMIT,
        '-created',
      );
      if (generation !== generationRef.current) {
        return;
      }
      setUnusedTokens(
        tokens.filter(
          token =>
            token.id &&
            token.id !== mintedId &&
            (token.uses ?? 0) === 0 &&
            getEnrollmentTokenStatus(token) === 'active',
        ),
      );
      setUnusedTokensTruncated(total > UNUSED_TOKENS_LOOKUP_LIMIT);
    } catch {
      /* The lookup only informs a suggestion, so failing to make it is not
      worth interrupting a token that was minted. */
      if (generation === generationRef.current) {
        setUnusedTokens([]);
      }
    }
  };

  const revokeUnusedTokens = async () => {
    const generation = generationRef.current;
    const candidates = unusedTokens;
    setIsRevoking(true);
    setRevokeError(null);
    const results = await Promise.allSettled(
      candidates.map(token => revokeEnrollmentToken(token.id as string)),
    );
    setIsRevoking(false);
    if (generation !== generationRef.current) {
      return;
    }
    const failed = candidates.filter(
      (_, index) => results[index].status === 'rejected',
    );
    setUnusedTokens(failed);
    if (failed.length === 0) {
      getToasts().addSuccess(
        i18n.translate(
          'wazuh.endpointsSummary.enrollmentTokenInput.revokeUnusedSuccess',
          {
            defaultMessage:
              '{count, plural, one {# unused enrollment token was} other {# unused enrollment tokens were}} revoked.',
            values: { count: candidates.length },
          },
        ),
      );
    } else {
      const reason = (
        results.find(result => result.status === 'rejected') as
          | PromiseRejectedResult
          | undefined
      )?.reason;
      setRevokeError(
        reason?.message ||
          i18n.translate(
            'wazuh.endpointsSummary.enrollmentTokenInput.revokeUnusedError',
            {
              defaultMessage: 'Some enrollment tokens could not be revoked.',
            },
          ),
      );
    }
  };

  const generateEnrollmentToken = async () => {
    setIsGenerating(true);
    setError(null);
    setRevokeError(null);
    setUnusedTokens([]);
    setUnusedTokensTruncated(false);
    const generation = ++generationRef.current;
    try {
      const token = await createEnrollmentToken({
        address: serverAddress.value,
        port: serverPort?.value,
        prefix: serverPath?.value,
        ttl:
          String(formFields.enrollmentTokenTtl?.value ?? '').trim() ||
          ENROLLMENT_TOKEN_WIZARD_DEFAULT_TTL,
        maxUses: formFields.enrollmentTokenMaxUses?.value,
        description: formFields.enrollmentTokenDescription?.value,
        embedCa,
        noCredential,
      });
      const minted: EnrollmentToken = { ...token, source: 'generated' };
      setGeneratedToken(minted);
      onEnrollmentTokenChange(minted);
      void findUnusedTokens(minted.id, generation);
    } catch (requestError) {
      /* Whatever the manager answered is shown as it wrote it. It is the
      manager that checks the address against the names in its listener
      certificate, and a second rule computed here would drift from the one it
      actually enforces. */
      setGeneratedToken(null);
      onEnrollmentTokenChange(null);
      setError(
        requestError?.message ||
          i18n.translate(
            'wazuh.endpointsSummary.enrollmentTokenInput.generateErrorFallback',
            {
              defaultMessage: 'The enrollment token could not be generated.',
            },
          ),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Fragment>
      <EuiFlexGroup gutterSize='s' wrap>
        {ENROLLMENT_TOKEN_TEXTS.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiText className='stepSubtitle'>
              {data.subtitle}{' '}
              <EuiToolTip
                content={i18n.translate(
                  'wazuh.endpointsSummary.enrollmentTokenInput.navigateTooltip',
                  {
                    defaultMessage: 'Navigate to {appTitle}',
                    values: { appTitle: enrollmentTokens.title },
                  },
                )}
              >
                <EuiLink
                  href={NavigationService.getInstance().getAppURL(
                    enrollmentTokens.id,
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  external
                >
                  {i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.manageTokensLink',
                    {
                      defaultMessage: 'Manage the minted tokens',
                    },
                  )}
                </EuiLink>
              </EuiToolTip>
            </EuiText>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <EuiSpacer size='s' />
      <EuiTabs size='s'>
        {TOKEN_SOURCE_TABS.map(tab => (
          <EuiTab
            key={tab.id}
            isSelected={tokenSource === tab.id}
            onClick={() => selectTokenSource(tab.id)}
          >
            {tab.name}
          </EuiTab>
        ))}
      </EuiTabs>
      <EuiSpacer size='m' />
      {tokenSource === 'existing' ? (
        <>
          <EuiFlexGroup wrap>
            <EuiFlexItem grow={true}>
              <InputForm
                {...existingTokenField}
                label={
                  <span className='registerAgentLabels'>
                    {i18n.translate(
                      'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenLabel',
                      {
                        defaultMessage: 'Enrollment token',
                      },
                    )}
                  </span>
                }
                footer={
                  <EuiText size='xs' color='subdued'>
                    {i18n.translate(
                      'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenHelp',
                      {
                        defaultMessage:
                          'Paste a token kept from an earlier deployment to reuse it. The server returns a token once, so one that was not saved cannot be recovered and a new one has to be generated on the other tab.',
                      },
                    )}
                  </EuiText>
                }
                fullWidth={false}
                placeholder={i18n.translate(
                  'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenPlaceholder',
                  {
                    defaultMessage: 'Paste a stored enrollment token',
                  },
                )}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          {enrollmentToken?.source === 'existing' ? (
            <>
              <EuiSpacer size='m' />
              <EuiCallOut
                color='success'
                title={i18n.translate(
                  'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenInUseTitle',
                  {
                    defaultMessage: 'Using the token provided',
                  },
                )}
                iconType='check'
                className='warningForAgentName'
              >
                <p>
                  {i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.existingTokenInUseDescription',
                    {
                      defaultMessage:
                        'The deployment command below installs the agent with this token. Its manager address, its lifetime and the enrollments it has left are not shown here: the server returns them only when it mints a token, and it is the server that refuses an expired or exhausted one at enrollment time.',
                    },
                  )}
                </p>
              </EuiCallOut>
            </>
          ) : null}
        </>
      ) : (
        <>
          {/* Every input here parameterizes the token rather than the agent,
          and the server has a default for each, so the tab is the button until
          the operator asks for the rest. */}
          <AdvancedOptions
            fields={TOKEN_REQUEST_FIELDS.map(name => formFields[name])}
          >
            <EuiFlexGroup wrap>
              <EuiFlexItem grow={true} className='registerAgentFormColumn'>
                <InputForm
                  {...formFields.enrollmentTokenTtl}
                  label={
                    <span className='registerAgentLabels'>
                      <FormattedMessage
                        id='wazuh.endpointsSummary.enrollmentTokenInput.lifetimeLabel'
                        defaultMessage='Lifetime - {optional}'
                        values={{
                          optional: (
                            <em>
                              {i18n.translate(
                                'wazuh.endpointsSummary.enrollmentTokenInput.lifetimeOptional',
                                {
                                  defaultMessage: 'optional',
                                },
                              )}
                            </em>
                          ),
                        }}
                      />
                    </span>
                  }
                  footer={
                    <EuiText size='xs' color='subdued'>
                      <FormattedMessage
                        id='wazuh.endpointsSummary.enrollmentTokenInput.lifetimeHelp'
                        defaultMessage='Seconds, or a number followed by {days}, {hours}, {minutes} or {seconds}, up to {maxDays} days. If left empty, {defaultTtl} is used.'
                        values={{
                          days: <EuiCode>d</EuiCode>,
                          hours: <EuiCode>h</EuiCode>,
                          minutes: <EuiCode>m</EuiCode>,
                          seconds: <EuiCode>s</EuiCode>,
                          maxDays: ENROLLMENT_TOKEN_TTL_MAX_DAYS,
                          defaultTtl: (
                            <EuiCode>
                              {ENROLLMENT_TOKEN_WIZARD_DEFAULT_TTL}
                            </EuiCode>
                          ),
                        }}
                      />
                    </EuiText>
                  }
                  fullWidth={false}
                  placeholder={ENROLLMENT_TOKEN_WIZARD_DEFAULT_TTL}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={true} className='registerAgentFormColumn'>
                <InputForm
                  {...formFields.enrollmentTokenMaxUses}
                  label={
                    <span className='registerAgentLabels'>
                      <FormattedMessage
                        id='wazuh.endpointsSummary.enrollmentTokenInput.maxUsesLabel'
                        defaultMessage='Enrollments allowed - {optional}'
                        values={{
                          optional: (
                            <em>
                              {i18n.translate(
                                'wazuh.endpointsSummary.enrollmentTokenInput.maxUsesOptional',
                                {
                                  defaultMessage: 'optional',
                                },
                              )}
                            </em>
                          ),
                        }}
                      />
                    </span>
                  }
                  footer={
                    <EuiText size='xs' color='subdued'>
                      {i18n.translate(
                        'wazuh.endpointsSummary.enrollmentTokenInput.maxUsesHelp',
                        {
                          defaultMessage:
                            'How many agents the token can enroll. If left empty, or set to 0, the token allows unlimited enrollments.',
                        },
                      )}
                    </EuiText>
                  }
                  fullWidth={false}
                  placeholder={i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.maxUsesPlaceholder',
                    {
                      defaultMessage: 'Unlimited',
                    },
                  )}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size='m' />
            <EuiFlexGroup wrap>
              <EuiFlexItem grow={true}>
                <InputForm
                  {...formFields.enrollmentTokenDescription}
                  label={
                    <span className='registerAgentLabels'>
                      <FormattedMessage
                        id='wazuh.endpointsSummary.enrollmentTokenInput.descriptionLabel'
                        defaultMessage='Description - {optional}'
                        values={{
                          optional: (
                            <em>
                              {i18n.translate(
                                'wazuh.endpointsSummary.enrollmentTokenInput.descriptionOptional',
                                {
                                  defaultMessage: 'optional',
                                },
                              )}
                            </em>
                          ),
                        }}
                      />
                    </span>
                  }
                  footer={
                    <EuiText size='xs' color='subdued'>
                      {i18n.translate(
                        'wazuh.endpointsSummary.enrollmentTokenInput.descriptionHelp',
                        {
                          defaultMessage:
                            'Kept with the token on the server so it can be told apart from the others when they are listed later. It is not sent to the agent. Up to {maxLength} characters; letters, digits, spaces and the symbols {symbols} are allowed.',
                          values: {
                            maxLength: ENROLLMENT_TOKEN_DESCRIPTION_MAX_LENGTH,
                            symbols:
                              ENROLLMENT_TOKEN_DESCRIPTION_ALLOWED_SYMBOLS,
                          },
                        },
                      )}
                    </EuiText>
                  }
                  fullWidth={false}
                  placeholder={i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.descriptionPlaceholder',
                    {
                      defaultMessage: 'What this token is for',
                    },
                  )}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size='m' />
            {/* Paired into the same two columns the fields above use: both are
            short, so side by side they cost one row of height instead of two.
            They wrap onto their own lines with the rest when the panel
            narrows. */}
            <EuiFlexGroup wrap>
              <EuiFlexItem grow={true} className='registerAgentFormColumn'>
                <EuiFormRow
                  label={i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.embedCaLabel',
                    {
                      defaultMessage: 'Embed CA',
                    },
                  )}
                  helpText={i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.embedCaHelp',
                    {
                      defaultMessage:
                        'Carries the CA certificate inside the token instead of its pin, so the agent does not fetch it from the manager when it enrolls. It makes the token larger.',
                    },
                  )}
                >
                  <EuiSwitch
                    label={i18n.translate(
                      'wazuh.endpointsSummary.enrollmentTokenInput.embedCaSwitch',
                      {
                        defaultMessage: 'Carry the CA certificate in the token',
                      },
                    )}
                    checked={embedCa}
                    onChange={event => setEmbedCa(event.target.checked)}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={true} className='registerAgentFormColumn'>
                <EuiFormRow
                  label={i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.noCredentialLabel',
                    {
                      defaultMessage: 'Without credential',
                    },
                  )}
                  helpText={i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.noCredentialHelp',
                    {
                      defaultMessage:
                        'Mints a token carrying only the address and the pin. It can point an agent at the manager but cannot authenticate its enrollment. If you enable it, check that the Wazuh manager configuration has <use_password> set to "no".',
                    },
                  )}
                >
                  <EuiSwitch
                    label={i18n.translate(
                      'wazuh.endpointsSummary.enrollmentTokenInput.noCredentialSwitch',
                      {
                        defaultMessage: 'Mint the token without a credential',
                      },
                    )}
                    checked={noCredential}
                    onChange={event => setNoCredential(event.target.checked)}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
          </AdvancedOptions>
          <EuiSpacer size='m' />
          <EuiFlexGroup wrap>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill={!enrollmentToken}
                isLoading={isGenerating}
                isDisabled={
                  endpointIsInvalid || tokenRequestIsInvalid || isRevoking
                }
                onClick={generateEnrollmentToken}
              >
                {enrollmentToken?.source === 'generated'
                  ? i18n.translate(
                      'wazuh.endpointsSummary.enrollmentTokenInput.regenerateButton',
                      {
                        defaultMessage: 'Generate a new token',
                      },
                    )
                  : i18n.translate(
                      'wazuh.endpointsSummary.enrollmentTokenInput.generateButton',
                      {
                        defaultMessage: 'Generate token',
                      },
                    )}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          {endpointIsInvalid ? (
            <>
              <EuiSpacer size='m' />
              <EuiCallOut
                color='warning'
                title={i18n.translate(
                  'wazuh.endpointsSummary.enrollmentTokenInput.invalidEndpointWarning',
                  {
                    defaultMessage:
                      'Enter a valid server address before generating the token.',
                  },
                )}
                iconType='iInCircle'
                className='warningForAgentName'
              />
            </>
          ) : null}
          {error ? (
            <>
              <EuiSpacer size='m' />
              <EuiCallOut
                color='danger'
                title={i18n.translate(
                  'wazuh.endpointsSummary.enrollmentTokenInput.generateErrorTitle',
                  {
                    defaultMessage:
                      'The server refused to generate the enrollment token',
                  },
                )}
                iconType='alert'
                className='warningForAgentName'
              >
                <p>{error}</p>
              </EuiCallOut>
            </>
          ) : null}
          {enrollmentToken?.source === 'generated' ? (
            <>
              <EuiSpacer size='m' />
              <EuiCallOut
                color='success'
                title={i18n.translate(
                  'wazuh.endpointsSummary.enrollmentTokenInput.generatedTitle',
                  {
                    defaultMessage: 'Enrollment token generated',
                  },
                )}
                iconType='check'
                className='warningForAgentName'
              >
                <p>
                  {i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.generatedValidUntil',
                    {
                      defaultMessage:
                        'Token successfully generated, valid until {expiration}.',
                      values: {
                        expiration: formatUIDate(enrollmentToken.expires),
                      },
                    },
                  )}
                </p>
                <p>
                  {i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.generatedDescription',
                    {
                      defaultMessage:
                        'The token itself is returned once and cannot be retrieved again. It is not shown here: copy it, or the deployment command below, before leaving this page.',
                    },
                  )}
                </p>
                {/* The token authenticates the enrollment, so it is handed over
                through the clipboard rather than rendered where it can be read
                off the screen. */}
                <EuiCopy
                  textToCopy={enrollmentToken.token}
                  beforeMessage={i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.copyTokenTooltip',
                    {
                      defaultMessage: 'Copy the token to the clipboard',
                    },
                  )}
                >
                  {copy => (
                    <EuiButton size='s' iconType='copy' onClick={copy}>
                      {i18n.translate(
                        'wazuh.endpointsSummary.enrollmentTokenInput.copyTokenButton',
                        {
                          defaultMessage: 'Copy token',
                        },
                      )}
                    </EuiButton>
                  )}
                </EuiCopy>
              </EuiCallOut>
            </>
          ) : null}
          {enrollmentToken?.source === 'generated' &&
          (unusedTokens.length > 0 || revokeError) ? (
            <>
              <EuiSpacer size='m' />
              <EuiCallOut
                color='warning'
                iconType='alert'
                className='warningForAgentName'
                title={i18n.translate(
                  'wazuh.endpointsSummary.enrollmentTokenInput.unusedTokensTitle',
                  {
                    defaultMessage:
                      '{atLeast, select, true {At least } other {}}{count, plural, one {# earlier token is} other {# earlier tokens are}} still active and unused',
                    values: {
                      count: unusedTokens.length,
                      atLeast: String(unusedTokensTruncated),
                    },
                  },
                )}
              >
                <p>
                  {i18n.translate(
                    'wazuh.endpointsSummary.enrollmentTokenInput.unusedTokensDescription',
                    {
                      defaultMessage:
                        'Tokens that have enrolled no agent can still be used until they expire. Revoke them if you no longer need them, or review them in {appTitle}.',
                      values: { appTitle: enrollmentTokens.title },
                    },
                  )}
                </p>
                {revokeError ? <p>{revokeError}</p> : null}
                <EuiFlexGroup wrap gutterSize='s' alignItems='center'>
                  <EuiFlexItem grow={false}>
                    <WzButtonPermissionsModalConfirm
                      size='s'
                      color='warning'
                      permissions={[
                        {
                          action: 'enrollment_token:delete',
                          resource: '*:*:*',
                        },
                      ]}
                      isLoading={isRevoking}
                      isDisabled={unusedTokens.length === 0}
                      modalTitle={i18n.translate(
                        'wazuh.endpointsSummary.enrollmentTokenInput.revokeUnusedModalTitle',
                        {
                          defaultMessage:
                            'Do you want to revoke these enrollment tokens?',
                        },
                      )}
                      modalProps={{
                        buttonColor: 'danger',
                        children: (
                          <EuiText size='s'>
                            <p>
                              {i18n.translate(
                                'wazuh.endpointsSummary.enrollmentTokenInput.revokeUnusedModalBody',
                                {
                                  defaultMessage:
                                    'Revoking cannot be undone. Agents that have not enrolled yet with these tokens will no longer be able to.',
                                },
                              )}
                            </p>
                            <EuiSpacer size='s' />
                            <EuiInMemoryTable
                              items={unusedTokens}
                              columns={UNUSED_TOKEN_COLUMNS}
                              itemId='id'
                              sorting={{
                                sort: { field: 'created', direction: 'desc' },
                              }}
                              pagination={
                                unusedTokens.length > UNUSED_TOKENS_PAGE_SIZE
                                  ? { pageSize: UNUSED_TOKENS_PAGE_SIZE }
                                  : false
                              }
                            />
                          </EuiText>
                        ),
                      }}
                      onConfirm={revokeUnusedTokens}
                    >
                      {i18n.translate(
                        'wazuh.endpointsSummary.enrollmentTokenInput.revokeUnusedButton',
                        {
                          defaultMessage: 'Revoke unused tokens',
                        },
                      )}
                    </WzButtonPermissionsModalConfirm>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiLink
                      href={NavigationService.getInstance().getAppURL(
                        enrollmentTokens.id,
                      )}
                      target='_blank'
                      rel='noopener noreferrer'
                      external
                    >
                      {enrollmentTokens.title}
                    </EuiLink>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiCallOut>
            </>
          ) : null}
        </>
      )}
    </Fragment>
  );
};

export default EnrollmentTokenInput;
