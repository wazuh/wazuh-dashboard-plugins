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
import { i18n } from '@osd/i18n';
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
        title={i18n.translate('wazuh.settings.about.welcomeTitle', {
          defaultMessage: 'Welcome to the {pluginAppName}',
          values: { pluginAppName },
        })}
        content={
          <EuiText size='m'>
            <p>
              {i18n.translate('wazuh.settings.about.welcomeDescription', {
                defaultMessage: 'Dashboard provides management and monitoring capabilities, giving users control over the infrastructure. You can monitor your agents status and configuration, query and visualize your alert data and monitor manager rules and configuration.',
              })}
            </p>
          </EuiText>
        }
      />
      <Section
        title={i18n.translate('wazuh.settings.about.communityTitle', {
          defaultMessage: 'Community',
        })}
        content={
          <div>
            <EuiText size='m'>
              <p>
                {i18n.translate('wazuh.settings.about.communityDescription', {
                  defaultMessage: 'Enjoy your experience and please don\'t hesitate to give us your feedback.',
                })}
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
                  aria-label={i18n.translate('wazuh.settings.about.slackAriaLabel', {
                    defaultMessage: 'Slack',
                  })}
                  iconType='logoSlack'
                  iconSize='xxl'
                  href='https://wazuh.com/community/join-us-on-slack/'
                  target='_blank'
                >
                  {i18n.translate('wazuh.settings.about.slackLabel', {
                    defaultMessage: 'Slack',
                  })}
                </EuiButtonIcon>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  aria-label={i18n.translate('wazuh.settings.about.googleGroupsAriaLabel', {
                    defaultMessage: 'Google Groups',
                  })}
                  iconType={googleGroupsSVG}
                  iconSize='xxl'
                  href='https://groups.google.com/forum/#!forum/wazuh'
                  target='_blank'
                >
                  {i18n.translate('wazuh.settings.about.googleGroupsLabel', {
                    defaultMessage: 'Google groups',
                  })}
                </EuiButtonIcon>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  aria-label={i18n.translate('wazuh.settings.about.githubAriaLabel', {
                    defaultMessage: 'Github',
                  })}
                  iconType='logoGithub'
                  iconSize='xxl'
                  href='https://github.com/wazuh/wazuh-kibana-app'
                  target='_blank'
                >
                  {i18n.translate('wazuh.settings.about.githubLabel', {
                    defaultMessage: 'Github',
                  })}
                </EuiButtonIcon>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        }
      />
    </EuiFlexGroup>
  );
};
