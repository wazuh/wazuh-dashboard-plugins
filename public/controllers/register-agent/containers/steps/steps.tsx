import React, { Fragment, useState } from 'react';
import {
  EuiSteps,
  EuiText,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiPopover,
  EuiButtonEmpty,
  EuiLink,
} from '@elastic/eui';
import { InputForm } from '../../../../components/common/form';
import './steps.scss';
import {
  REGISTER_AGENT_DATA_STEP_THREE,
  REGISTER_AGENT_DATA_STEP_TWO,
} from '../../utils/register-agent-data';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { PLUGIN_VERSION_SHORT } from '../../../../../common/constants';

const popoverServerAddress = (
  <span>
    Learn about{' '}
    <EuiLink
      href={webDocumentationLink(
        'user-manual/reference/ossec-conf/client.html#groups',
        PLUGIN_VERSION_SHORT,
      )}
      target='_blank'
      rel='noopener noreferrer'
    >
      Server address.
    </EuiLink>
  </span>
);

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

export const Steps = ({
  needsPassword,
  hideTextPassword,
  agentGroup,
  form,
  osCard,
}) => {
  const warningForAgentName =
    'The agent name must be unique. It can’t be changed once the agent has been enrolled.';

  const [isPopoverServerAddress, setIsPopoverServerAddress] = useState(false);
  const [isPopoverAgentName, setIsPopoverAgentName] = useState(false);

  const onButtonServerAddress = () =>
    setIsPopoverServerAddress(
      isPopoverServerAddress => !isPopoverServerAddress,
    );
  const closeServerAddress = () => setIsPopoverServerAddress(false);

  const onButtonAgentName = () =>
    setIsPopoverAgentName(isPopoverAgentName => !isPopoverAgentName);
  const closeAgentName = () => setIsPopoverAgentName(false);

  const firstSetOfSteps = [
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Select the package to download and install on your system:</p>
        </EuiTitle>
      ),
      children: osCard,
      status: form.fields.operatingSystemSelection.value
        ? 'complete'
        : 'current',
    },
    {
      title: (
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiPopover
              button={
                <EuiButtonEmpty
                  iconType='questionInCircle'
                  iconSide='right'
                  onClick={onButtonServerAddress}
                  className='stepTitle'
                >
                  Server address
                </EuiButtonEmpty>
              }
              isOpen={isPopoverServerAddress}
              closePopover={closeServerAddress}
              anchorPosition='rightCenter'
            >
              {popoverServerAddress}
            </EuiPopover>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
      children: (
        <Fragment>
          <EuiFlexGroup gutterSize='s' wrap>
            {REGISTER_AGENT_DATA_STEP_TWO.map((data, index) => (
              <EuiFlexItem key={index}>
                <EuiText className='stepSubtitleServerAddress'>
                  {data.subtitle}
                </EuiText>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          <InputForm {...form.fields.serverAddress} label={<></>} />
        </Fragment>
      ),
      status: !form.fields.operatingSystemSelection.value
        ? 'disabled'
        : !form.fields.serverAddress.value &&
          form.fields.operatingSystemSelection.value
        ? 'current'
        : form.fields.operatingSystemSelection.value &&
          form.fields.serverAddress.value
        ? 'complete'
        : '',
    },
    ...(!(!needsPassword || hideTextPassword)
      ? [
          {
            title: (
              <EuiTitle className='stepTitle'>
                <p>Wazuh password</p>
              </EuiTitle>
            ),
            children: <Fragment>{'Phrase to define'}</Fragment>,
          },
        ]
      : []),
    {
      title: (
        <EuiTitle className='stepTitle'>
          <p>Optional settings</p>
        </EuiTitle>
      ),
      children: (
        <Fragment>
          <EuiFlexGroup gutterSize='s' wrap>
            {REGISTER_AGENT_DATA_STEP_THREE.map((data, index) => (
              <EuiFlexItem key={index}>
                <EuiText className='stepSubtitle'>{data.subtitle}</EuiText>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          <InputForm
            {...form.fields.agentName}
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
          {agentGroup}
        </Fragment>
      ),
      status:
        !form.fields.operatingSystemSelection.value ||
        !form.fields.serverAddress.value
          ? 'disabled'
          : form.fields.serverAddress.value !== ''
          ? 'current'
          : form.fields.agentGroups.value.length > 0
          ? 'complete'
          : '',
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
