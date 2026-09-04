import React, { Fragment, useState } from 'react';
import { UseFormReturn } from '../../../../common/form/types';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiCallOut,
  EuiLink,
  EuiSpacer,
} from '@elastic/eui';
import { InputForm } from '../../../../common/form';
import { OPTIONAL_PARAMETERS_TEXT } from '../../utils/register-agent-data';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../../common/constants';
import '../group-input/group-input.scss';
interface OptionalsInputsProps {
  formFields: UseFormReturn['fields'];
}

const OptionalsInputs = (props: OptionalsInputsProps) => {
  const { formFields } = props;
  const [isPopoverAgentName, setIsPopoverAgentName] = useState(false);
  const onButtonAgentName = () =>
    setIsPopoverAgentName(isPopoverAgentName => !isPopoverAgentName);
  const closeAgentName = () => setIsPopoverAgentName(false);
  const agentNameDocLink = webDocumentationLink(
    'user-manual/agent/agent-enrollment/enrollment-methods/via-agent-configuration/index.html',
    PLUGIN_VERSION_SHORT,
  );
  const popoverAgentName = (
    <span>
      Learn about{' '}
      <EuiLink
        href={agentNameDocLink}
        target='_blank'
        rel='noopener noreferrer'
      >
        Assigning an agent name.
      </EuiLink>
    </span>
  );

  const warningForAgentName =
    'The agent name must be unique. It can’t be changed once the agent has been enrolled.';

  const warningForSslVerification =
    'The agent will accept any certificate the manager presents, so the connection can be intercepted. Only disable verification in trusted networks.';

  const sslVerificationIsEnabled = Boolean(formFields.sslVerification.value);

  return (
    <Fragment>
      <EuiFlexGroup gutterSize='s' wrap>
        {OPTIONAL_PARAMETERS_TEXT.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiText className='stepSubtitle'>{data.subtitle}</EuiText>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      {/* Enrollment authenticates one way, so TLS is the only thing that proves
      the endpoint is talking to the real manager. The switch carries its own
      label, so no form row label is passed here. */}
      <InputForm {...formFields.sslVerification} />
      <EuiSpacer size='m' />
      {sslVerificationIsEnabled ? (
        <InputForm
          {...formFields.managerCa}
          fullWidth={false}
          label={
            <span className='registerAgentLabels'>
              {'Manager CA file path on the endpoint - '}
              <em>optional</em>
            </span>
          }
          footer={
            <EuiText size='xs' color='subdued'>
              If left empty, the endpoint&apos;s system CA store is used, which
              only trusts publicly issued certificates. Supply the manager CA to
              verify a self-signed certificate.
            </EuiText>
          }
          placeholder='/var/ossec/etc/manager-ca.pem'
        />
      ) : (
        <EuiCallOut
          color='warning'
          title={warningForSslVerification}
          iconType='alert'
          className='warningForAgentName'
        />
      )}
      <EuiSpacer size='m' />
      <InputForm
        {...formFields.agentName}
        fullWidth={false}
        label={
          <>
            <EuiFlexGroup
              alignItems='center'
              direction='row'
              responsive={false}
              gutterSize='s'
            >
              <EuiFlexItem grow={false}>
                <p className='registerAgentLabels'>Assign an agent name:</p>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiPopover
                  button={
                    <EuiButtonEmpty
                      iconType='questionInCircle'
                      iconSide='left'
                      onClick={onButtonAgentName}
                      style={{
                        flexDirection: 'row',
                        fontStyle: 'normal',
                        fontWeight: 700,
                      }}
                    ></EuiButtonEmpty>
                  }
                  isOpen={isPopoverAgentName}
                  closePopover={closeAgentName}
                  anchorPosition='rightCenter'
                >
                  {popoverAgentName}
                </EuiPopover>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        }
        placeholder='Agent name'
      />
      <EuiCallOut
        color='warning'
        title={
          <span>
            {warningForAgentName}
            <EuiLink
              target='_blank'
              href={agentNameDocLink}
              rel='noopener noreferrer'
            />
          </span>
        }
        iconType='iInCircle'
        className='warningForAgentName'
      />
      <InputForm {...formFields.agentGroups}></InputForm>
    </Fragment>
  );
};

export default OptionalsInputs;
