import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React from 'react';
import { getHttp } from '../../../kibana-services';
import { getAssetURL } from '../../../utils/assets';

interface SettingsAboutGeneralInfoProps {
  pluginAppName: string;
}

export const SettingsAboutGeneralInfo = ({
  pluginAppName,
}: SettingsAboutGeneralInfoProps) => {
  const googleGroupsSVG = getHttp().basePath.prepend(
    getAssetURL('images/icons/google_groups.svg'),
  );

  const Section = ({
    title,
    content,
  }: {
    title: string;
    content: React.ReactNode;
  }) => (
    <EuiFlexItem>
      <EuiPanel paddingSize='l'>
        <EuiTitle size='m'>
          <h2>{title}</h2>
        </EuiTitle>
        <EuiSpacer size='l' />
        {content}
      </EuiPanel>
    </EuiFlexItem>
  );

  return (
    <EuiFlexGroup gutterSize='l' direction='row' responsive>
      <Section
        title={`Welcome to the ${pluginAppName}`}
        content={
          <EuiText size='m'>
            <p>
              Dashboard provides management and monitoring capabilities, giving
              users control over the infrastructure. You can monitor your agents
              status and configuration, query and visualize your alert data and
              monitor manager rules and configuration.
            </p>
          </EuiText>
        }
      />
      <Section
        title='Community'
        content={
          <div>
            <EuiText size='m'>
              <p>
                Enjoy your experience and please don't hesitate to give us your
                feedback.
              </p>
            </EuiText>
            <EuiSpacer size='l' />
            <EuiFlexGroup
              alignItems='center'
              justifyContent='center'
              gutterSize='xl'
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  aria-label='Slack'
                  iconType='logoSlack'
                  iconSize='xxl'
                  href='https://wazuh.com/community/join-us-on-slack/'
                  target='_blank'
                >
                  Slack
                </EuiButtonIcon>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  aria-label='Google Groups'
                  iconType={googleGroupsSVG}
                  iconSize='xxl'
                  href='https://groups.google.com/forum/#!forum/wazuh'
                  target='_blank'
                >
                  Google groups
                </EuiButtonIcon>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  aria-label='Github'
                  iconType='logoGithub'
                  iconSize='xxl'
                  href='https://github.com/wazuh/wazuh-kibana-app'
                  target='_blank'
                >
                  Github
                </EuiButtonIcon>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        }
      />
    </EuiFlexGroup>
  );
};
