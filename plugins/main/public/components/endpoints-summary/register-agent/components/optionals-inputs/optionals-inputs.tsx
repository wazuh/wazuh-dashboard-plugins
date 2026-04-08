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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
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
    'user-manual/reference/ossec-conf/client.html#enrollment-agent-name',
    PLUGIN_VERSION_SHORT,
  );
  const popoverAgentName = (
    <span>
      {i18n.translate('wazuh.registerAgent.optionalInputs.learnAbout', {
        defaultMessage: 'Learn about',
      })}{' '}
      <EuiLink
        href={agentNameDocLink}
        target='_blank'
        rel='noopener noreferrer'
      >
        {i18n.translate('wazuh.registerAgent.optionalInputs.assigningAgentName', {
          defaultMessage: 'Assigning an agent name.',
        })}
      </EuiLink>
    </span>
  );

  const warningForAgentName = i18n.translate('wazuh.registerAgent.optionalInputs.agentNameWarning', {
    defaultMessage: 'The agent name must be unique. It can\'t be changed once the agent has been enrolled.',
  });
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
                <p className='registerAgentLabels'>
                  {i18n.translate('wazuh.registerAgent.optionalInputs.assignAgentNameLabel', {
                    defaultMessage: 'Assign an agent name:',
                  })}
                </p>
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
        placeholder={i18n.translate('wazuh.registerAgent.optionalInputs.agentNamePlaceholder', {
          defaultMessage: 'Agent name',
        })}
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
