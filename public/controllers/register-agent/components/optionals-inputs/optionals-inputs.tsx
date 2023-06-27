import React, { Fragment, useState } from 'react';
import { UseFormReturn } from '../../../../components/common/form/types';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPopover,
  EuiButtonEmpty,
  EuiCallOut,
  EuiLink,
} from '@elastic/eui';
import { InputForm } from '../../../../components/common/form';
import { OPTIONAL_PARAMETERS_TEXT } from '../../utils/register-agent-data';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../common/constants';
interface OptionalsInputsProps {
  formFields: UseFormReturn['fields'];
}

const OptionalsInputs = (props: OptionalsInputsProps) => {
  const { formFields } = props;
  const [isPopoverAgentName, setIsPopoverAgentName] = useState(false);
  const onButtonAgentName = () =>
    setIsPopoverAgentName(isPopoverAgentName => !isPopoverAgentName);
  const closeAgentName = () => setIsPopoverAgentName(false);

  const popoverAgentName = (
    <span>
      Learn about{' '}
      <EuiLink
        href={webDocumentationLink(
          'user-manual/reference/ossec-conf/client.html#enrollment-agent-name',
          PLUGIN_VERSION_SHORT,
        )}
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
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiPopover
                  button={
                    <EuiButtonEmpty
                      iconType='questionInCircle'
                      iconSide='right'
                      onClick={onButtonAgentName}
                      style={{
                        flexDirection: 'row',
                        fontStyle: 'normal',
                        fontWeight: 700,
                        fontSize: '12px',
                        lineHeight: '20px',
                        color: '#343741',
                      }}
                    >
                      Assign an agent name
                    </EuiButtonEmpty>
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
        title={warningForAgentName}
        iconType='iInCircle'
        className='warningForAgentName'
      />
      <InputForm {...formFields.agentGroups}></InputForm>
    </Fragment>
  );
};

export default OptionalsInputs;
