import React, { Fragment, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiCallOut,
  EuiLink,
} from '@elastic/eui';
import { UseFormReturn } from '../form/types';
import { InputForm } from '../form';
import { OPTIONAL_PARAMETERS_TEXT } from '../../utils/register-agent-data';
import { webDocumentationLink } from '../../services/web-documentation-link';
import { PLUGIN_VERSION_SHORT } from '../../../../../../common/constants';
import '../group-input/group-input.scss';
import { VerificationModeInput } from './verification-mode-input';
import { EnrollmentKeyInput } from './enrollment-key-input';

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
    'user-manual/reference/ossec-conf/client.html#enrollment-agent-name',
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

  return (
    <Fragment>
      <EuiFlexGroup gutterSize='s' wrap>
        {OPTIONAL_PARAMETERS_TEXT.map((data, index) => (
          <EuiFlexItem key={index}>
            <EuiText className='stepSubtitle'>{data.subtitle}</EuiText>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
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
      <VerificationModeInput formField={formFields.verificationMode} />
      <EnrollmentKeyInput formField={formFields.enrollmentKey} />
    </Fragment>
  );
};

export default OptionalsInputs;
