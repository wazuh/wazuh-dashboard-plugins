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

interface SettingsAboutBottomInfoProps {
  pluginAppName: string;
}

export const SettingsAboutBottomInfo = ({ pluginAppName }: SettingsAboutBottomInfoProps) => {
  const googleGroupsSVG = getHttp().basePath.prepend(getAssetURL('images/icons/google_groups.svg'));

  const Section = ({ title, content }: { title: string; content: React.ReactNode }) => (
    <EuiFlexItem>
      <EuiPanel paddingSize="l" hasShadow={false}>
        <EuiFlexGroup gutterSize="l" direction="row" responsive>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="l" direction="row" responsive>
              <EuiFlexItem>
                <EuiTitle size="m">
                  <h2>{title}</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        {content}
      </EuiPanel>
    </EuiFlexItem>
  );

  return (
    <EuiFlexGroup gutterSize="l" direction="row" responsive>
      <Section
        title={`Welcome to the ${pluginAppName}`}
        content={
          <EuiText size="m">
            <p>
              {pluginAppName} provides management and monitoring capabilities, giving users control
              over the Wazuh infrastructure. You can monitor your agents status and configuration,
              query and visualize your alert data and monitor manager rules and configuration.
            </p>
          </EuiText>
        }
      />
      <Section
        title="Community"
        content={
          <>
            <EuiText size="m">
              <p>Enjoy your Wazuh experience and please don't hesitate to give us your feedback.</p>
            </EuiText>
            <EuiSpacer size="l" />
            <EuiFlexGroup
              alignItems="center"
              justifyContent="center"
              gutterSize="xl"
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="logoSlack"
                  iconSize="xxl"
                  href="https://wazuh.com/community/join-us-on-slack/"
                  target="_blank"
                >
                  Wazuh Slack
                </EuiButtonIcon>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType={googleGroupsSVG}
                  iconSize="xxl"
                  href="https://groups.google.com/forum/#!forum/wazuh"
                  target="_blank"
                >
                  Wazuh forum
                </EuiButtonIcon>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="logoGithub"
                  iconSize="xxl"
                  href="https://github.com/wazuh/wazuh-kibana-app"
                  target="_blank"
                >
                  Wazuh dashboard Github
                </EuiButtonIcon>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        }
      />
    </EuiFlexGroup>
  );
};
