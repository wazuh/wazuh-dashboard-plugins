import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { UseFormReturn } from '../../../../common/form/types';
import { InputForm } from '../../../../common/form';
import AdvancedOptions from '../advanced-options/advanced-options';
import { ENROLLMENT_TOKEN_TEXTS } from '../../utils/register-agent-data';
import { createEnrollmentToken } from '../../../../../services/enrollment-tokens';
import { EnrollmentToken } from '../../interfaces/types';
import '../group-input/group-input.scss';

interface EnrollmentTokenInputProps {
  formFields: UseFormReturn['fields'];
  enrollmentToken: EnrollmentToken | null;
  onEnrollmentTokenChange: (enrollmentToken: EnrollmentToken | null) => void;
}

const ENDPOINT_FIELDS = ['serverAddress', 'serverPort', 'serverPath'] as const;

/* The three fields that parameterize a mint request. Any of them filled means
the operator is generating a token rather than reusing one. */
const TOKEN_REQUEST_FIELDS = [
  'enrollmentTokenTtl',
  'enrollmentTokenMaxUses',
  'enrollmentTokenDescription',
] as const;

const formatExpiration = (expires: string) => {
  const date = new Date(expires);
  return Number.isNaN(date.getTime()) ? expires : date.toLocaleString();
};

const EnrollmentTokenInput = ({
  formFields,
  enrollmentToken,
  onEnrollmentTokenChange,
}: EnrollmentTokenInputProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { serverAddress, serverPort, serverPath } = formFields;
  const endpoint = ENDPOINT_FIELDS.map(field => formFields[field]?.value ?? '');
  const endpointKey = endpoint.join('|');
  const previousEndpointKey = useRef(endpointKey);

  const existingTokenField = formFields.existingEnrollmentToken;
  const existingTokenValue = String(existingTokenField?.value ?? '').trim();
  /* Anything typed in the field claims the reuse path, even a value that does
  not validate: the generation inputs stay out of the way until it is cleared,
  so the operator is never filling both at once. */
  const isReusingToken = existingTokenValue.length > 0;
  const existingTokenIsUsable = isReusingToken && !existingTokenField?.error;

  /* Exclusivity is decided by what is filled in, never by what was already
  minted: a token generated with all three left empty must still leave the reuse
  field open, or an operator who generated one and then wants to deploy with a
  stored token instead would have no way back. */
  const tokenRequestWasStarted = TOKEN_REQUEST_FIELDS.some(
    field => String(formFields[field]?.value ?? '').trim().length > 0,
  );

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
    if (enrollmentToken?.source === 'generated') {
      onEnrollmentTokenChange(null);
    }
  }, [endpointKey]);

  /* A stored token needs no request, so it becomes the token in hand as soon as
  it is readable, and is dropped again when the field is cleared or broken. A
  generated one is never touched here. */
  useEffect(() => {
    if (existingTokenIsUsable) {
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
    if (enrollmentToken?.source === 'existing') {
      onEnrollmentTokenChange(null);
    }
  }, [existingTokenValue, existingTokenIsUsable]);

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
      });
      onEnrollmentTokenChange({ ...token, source: 'generated' });
    } catch (requestError) {
      /* Whatever the manager answered is shown as it wrote it. It is the
      manager that checks the address against the names in its listener
      certificate, and a second rule computed here would drift from the one it
      actually enforces. */
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
            <EuiText className='stepSubtitle'>{data.subtitle}</EuiText>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      {/* Every input here parameterizes the token rather than the agent, and
      the server has a default for each, so the step is the subtitle and the
      button until the operator asks for the rest. */}
      <AdvancedOptions
        fields={[
          existingTokenField,
          formFields.enrollmentTokenTtl,
          formFields.enrollmentTokenMaxUses,
          formFields.enrollmentTokenDescription,
        ]}
      >
        <EuiFlexGroup wrap>
          <EuiFlexItem grow={true}>
            <InputForm
              {...existingTokenField}
              label={
                <span className='registerAgentLabels'>
                  {'Use existing token - '}
                  <em>optional</em>
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  Paste a token kept from an earlier deployment to reuse it. The
                  server returns a token once, so one that was not saved cannot
                  be recovered and a new one has to be generated below.
                </EuiText>
              }
              disabled={tokenRequestWasStarted}
              fullWidth={false}
              placeholder='Paste a stored enrollment token'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiHorizontalRule margin='m' />
        <EuiText size='xs' color='subdued'>
          Or generate a new token:
        </EuiText>
        <EuiSpacer size='s' />
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
                  <EuiCode>s</EuiCode>. If left empty, the server default of 30
                  days is used.
                </EuiText>
              }
              disabled={isReusingToken}
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
                  How many agents the token can enroll. If left empty, or set to
                  0, the token allows unlimited enrollments.
                </EuiText>
              }
              disabled={isReusingToken}
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
                  Kept with the token on the server so it can be told apart from
                  the others when they are listed later. It is not sent to the
                  agent.
                </EuiText>
              }
              disabled={isReusingToken}
              fullWidth={false}
              placeholder='What this token is for'
            />
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
              isReusingToken || endpointIsInvalid || tokenRequestIsInvalid
            }
            onClick={generateEnrollmentToken}
          >
            {enrollmentToken?.source === 'generated'
              ? 'Generate a new token'
              : 'Generate token'}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      {!isReusingToken && endpointIsInvalid ? (
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
              Token <EuiCode>{enrollmentToken.id}</EuiCode> for{' '}
              <EuiCode>{enrollmentToken.address}</EuiCode>, valid until{' '}
              {formatExpiration(enrollmentToken.expires)}.
            </p>
            <p>
              The token itself is returned once and cannot be retrieved again.
              Copy the deployment command below before leaving this page.
            </p>
          </EuiCallOut>
        </>
      ) : null}
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
              The deployment command below installs the agent with this token.
              Its manager address, its lifetime and the enrollments it has left
              are not shown here: the server returns them only when it mints a
              token, and it is the server that refuses an expired or exhausted
              one at enrollment time.
            </p>
          </EuiCallOut>
        </>
      ) : null}
    </Fragment>
  );
};

export default EnrollmentTokenInput;
