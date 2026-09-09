import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { UseFormReturn } from '../../../../common/form/types';
import { InputForm } from '../../../../common/form';
import { ENROLLMENT_TOKEN_TEXTS } from '../../utils/register-agent-data';
import {
  createEnrollmentToken,
  EnrollmentToken,
} from '../../services/enrollment-token-service';
import '../group-input/group-input.scss';

interface EnrollmentTokenInputProps {
  formFields: UseFormReturn['fields'];
  enrollmentToken: EnrollmentToken | null;
  onEnrollmentTokenChange: (enrollmentToken: EnrollmentToken | null) => void;
}

const ENDPOINT_FIELDS = ['serverAddress', 'serverPort', 'serverPath'] as const;

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

  /* The token carries the manager address it was minted for, and the command
  takes the connection target from the token rather than from these fields. A
  token kept across an edit of the address would therefore deploy agents to the
  previous manager without saying so, so editing the endpoint discards it. */
  useEffect(() => {
    if (previousEndpointKey.current === endpointKey) {
      return;
    }
    previousEndpointKey.current = endpointKey;
    setError(null);
    if (enrollmentToken) {
      onEnrollmentTokenChange(null);
    }
  }, [endpointKey]);

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
      });
      onEnrollmentTokenChange(token);
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
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={true}>
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
            fullWidth={false}
            placeholder='30d'
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
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
            fullWidth={false}
            placeholder='Unlimited'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill={!enrollmentToken}
            isLoading={isGenerating}
            isDisabled={endpointIsInvalid || tokenRequestIsInvalid}
            onClick={generateEnrollmentToken}
          >
            {enrollmentToken ? 'Generate a new token' : 'Generate token'}
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
      {enrollmentToken ? (
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
    </Fragment>
  );
};

export default EnrollmentTokenInput;
