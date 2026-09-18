import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiCode,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLink,
  EuiSwitch,
  EuiTab,
  EuiTabs,
  EuiToolTip,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { UseFormReturn } from '../../../../common/form/types';
import { InputForm } from '../../../../common/form';
import AdvancedOptions from '../advanced-options/advanced-options';
import { ENROLLMENT_TOKEN_TEXTS } from '../../utils/register-agent-data';
import { createEnrollmentToken } from '../../../../../services/enrollment-tokens';
import { EnrollmentToken } from '../../interfaces/types';
import { enrollmentTokens } from '../../../../../utils/applications';
import NavigationService from '../../../../../react-services/navigation-service';
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

type TokenSource = 'generate' | 'existing';

/* A token is either minted here or reused from an earlier deployment, never
both, so the two are read one at a time rather than side by side with whichever
one is not in use disabled. The open tab is the whole of the step. */
const TOKEN_SOURCE_TABS: { id: TokenSource; name: string }[] = [
  { id: 'generate', name: 'Generate a new token' },
  { id: 'existing', name: 'Use an existing token' },
];

const formatExpiration = (expires: string) => {
  const date = new Date(expires);
  return Number.isNaN(date.getTime()) ? expires : date.toLocaleString();
};

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
  const tokenRequestIsInvalid = Boolean(
    formFields.enrollmentTokenTtl?.error ||
      formFields.enrollmentTokenMaxUses?.error,
  );

  const generateEnrollmentToken = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const token = await createEnrollmentToken({
        address: serverAddress.value,
        port: serverPort?.value,
        prefix: serverPath?.value,
        ttl: formFields.enrollmentTokenTtl?.value,
        maxUses: formFields.enrollmentTokenMaxUses?.value,
        description: formFields.enrollmentTokenDescription?.value,
        embedCa,
        noCredential,
      });
      const minted: EnrollmentToken = { ...token, source: 'generated' };
      setGeneratedToken(minted);
      onEnrollmentTokenChange(minted);
    } catch (requestError) {
      /* Whatever the manager answered is shown as it wrote it. It is the
      manager that checks the address against the names in its listener
      certificate, and a second rule computed here would drift from the one it
      actually enforces. */
      setGeneratedToken(null);
      onEnrollmentTokenChange(null);
      setError(
        requestError?.message || 'The enrollment token could not be generated.',
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
              <EuiToolTip content={`Navigate to ${enrollmentTokens.title}`}>
                <EuiLink
                  href={NavigationService.getInstance().getAppURL(
                    enrollmentTokens.id,
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  external
                >
                  {`Manage the minted tokens`}
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
                  <span className='registerAgentLabels'>Enrollment token</span>
                }
                footer={
                  <EuiText size='xs' color='subdued'>
                    Paste a token kept from an earlier deployment to reuse it.
                    The server returns a token once, so one that was not saved
                    cannot be recovered and a new one has to be generated on the
                    other tab.
                  </EuiText>
                }
                fullWidth={false}
                placeholder='Paste a stored enrollment token'
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          {enrollmentToken?.source === 'existing' ? (
            <>
              <EuiSpacer size='m' />
              <EuiCallOut
                color='success'
                title='Using the token provided'
                iconType='check'
                className='warningForAgentName'
              >
                <p>
                  The deployment command below installs the agent with this
                  token. Its manager address, its lifetime and the enrollments
                  it has left are not shown here: the server returns them only
                  when it mints a token, and it is the server that refuses an
                  expired or exhausted one at enrollment time.
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
                      {'Lifetime - '}
                      <em>optional</em>
                    </span>
                  }
                  footer={
                    <EuiText size='xs' color='subdued'>
                      Seconds, or a number followed by <EuiCode>d</EuiCode>,{' '}
                      <EuiCode>h</EuiCode>, <EuiCode>m</EuiCode> or{' '}
                      <EuiCode>s</EuiCode>. If left empty, the server default of
                      30 days is used.
                    </EuiText>
                  }
                  fullWidth={false}
                  placeholder='30d'
                />
              </EuiFlexItem>
              <EuiFlexItem grow={true} className='registerAgentFormColumn'>
                <InputForm
                  {...formFields.enrollmentTokenMaxUses}
                  label={
                    <span className='registerAgentLabels'>
                      {'Enrollments allowed - '}
                      <em>optional</em>
                    </span>
                  }
                  footer={
                    <EuiText size='xs' color='subdued'>
                      How many agents the token can enroll. If left empty, or
                      set to 0, the token allows unlimited enrollments.
                    </EuiText>
                  }
                  fullWidth={false}
                  placeholder='Unlimited'
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
                      {'Description - '}
                      <em>optional</em>
                    </span>
                  }
                  footer={
                    <EuiText size='xs' color='subdued'>
                      Kept with the token on the server so it can be told apart
                      from the others when they are listed later. It is not sent
                      to the agent.
                    </EuiText>
                  }
                  fullWidth={false}
                  placeholder='What this token is for'
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
                  label='Embed CA'
                  helpText='Carries the CA certificate inside the token instead of its pin, so the agent does not fetch it from the manager when it enrolls. It makes the token larger.'
                >
                  <EuiSwitch
                    label='Carry the CA certificate in the token'
                    checked={embedCa}
                    onChange={event => setEmbedCa(event.target.checked)}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={true} className='registerAgentFormColumn'>
                <EuiFormRow
                  label='Without credential'
                  helpText={
                    'Mints a token carrying only the address and the pin. It can point an agent at the manager but cannot authenticate its enrollment. If you enable it, check that the Wazuh manager configuration has <use_password> set to "no".'
                  }
                >
                  <EuiSwitch
                    label='Mint the token without a credential'
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
                isDisabled={endpointIsInvalid || tokenRequestIsInvalid}
                onClick={generateEnrollmentToken}
              >
                {enrollmentToken?.source === 'generated'
                  ? 'Generate a new token'
                  : 'Generate token'}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          {endpointIsInvalid ? (
            <>
              <EuiSpacer size='m' />
              <EuiCallOut
                color='warning'
                title='Enter a valid server address before generating the token.'
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
                title='The server refused to generate the enrollment token'
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
                title='Enrollment token generated'
                iconType='check'
                className='warningForAgentName'
              >
                <p>
                  Token successfully generated, valid until{' '}
                  {formatExpiration(enrollmentToken.expires)}.
                </p>
                <p>
                  The token itself is returned once and cannot be retrieved
                  again. It is not shown here: copy it, or the deployment
                  command below, before leaving this page.
                </p>
                {/* The token authenticates the enrollment, so it is handed over
                through the clipboard rather than rendered where it can be read
                off the screen. */}
                <EuiCopy
                  textToCopy={enrollmentToken.token}
                  beforeMessage='Copy the token to the clipboard'
                >
                  {copy => (
                    <EuiButton size='s' iconType='copy' onClick={copy}>
                      Copy token
                    </EuiButton>
                  )}
                </EuiCopy>
              </EuiCallOut>
            </>
          ) : null}
        </>
      )}
    </Fragment>
  );
};

export default EnrollmentTokenInput;
