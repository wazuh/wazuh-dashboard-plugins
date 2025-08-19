import React, { useState, useCallback, useEffect } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiTitle,
  EuiText,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiPanel,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
} from '@elastic/eui';
import { ModelForm } from '.';
import { DeploymentStatus } from '.';
import { getWzCurrentAppID } from '../../../../kibana-services';
import { dashboardAssistant } from '../../../../utils/applications';
import { ProviderModelConfig } from '../provider-model-config';
import { useAssistantInstallation } from '../modules/installation-manager/hooks/use-assistant-installation';
import { ModelFormData } from './types';
import { DashboardAssistantNavigationService } from '../services/dashboard-assistant-navigation-service';
import { withGlobalBreadcrumb } from '../../../common/hocs';
import NavigationService from '../../../../react-services/navigation-service';
import { SECTIONS } from '../../../../sections';
import { ToastProvider, useToast } from '../hooks/use-toast';

interface FormConfig {
  title: string;
  description: string;
  learnMoreText: string;
  buttons: {
    cancel: string;
    deploy: string;
  };
  maxWidth: string;
  padding: string;
}

interface ModelRegisterProps {
  disabled?: boolean;
  modelConfig?: ProviderModelConfig[];
  formConfig?: FormConfig;
}



const ModelRegisterComponent = ({
  disabled = false,
  formConfig,
}: ModelRegisterProps) => {
  const [isDeployed, setIsDeployed] = useState(false);
  const { addSuccessToast, addErrorToast, addInfoToast } = useToast();
  const {
    install,
    setModel,
    isLoading: isInstalling,
    result,
    progress,
    isSuccess
  } = useAssistantInstallation();

  // Default form configuration
  const defaultFormConfig: FormConfig = {
    title: 'Register your preferred AI model',
    description:
      "Select and configure the AI model that will power your dashboard assistant's conversational capabilities and data insights",
    learnMoreText: 'Learn more',
    buttons: {
      cancel: 'Cancel',
      deploy: 'Deploy',
    },
    maxWidth: '600px',
    padding: '24px',
  };

  const config = formConfig || defaultFormConfig;

  const [isFormValid, setIsFormValid] = useState(false);
  const [isDeploymentVisible, setIsDeploymentVisible] = useState(false);

  const handleFormChange = useCallback(
    (data: ModelFormData) => {
      setModel({
        model_provider: data.modelProvider,
        model_id: data.model,
        api_url: data.apiUrl,
        api_key: data.apiKey,
        description: `${data.modelProvider} ${data.model} model`,
      });
    },
    [setModel],
  );

  const handleValidationChange = useCallback((isValid: boolean) => {
    setIsFormValid(isValid);
  }, []);

  const handleCancel = () => {
    navigateToHomeIfCurrentApp();
  };

  const handleDeploy = async () => {
    setIsDeploymentVisible(true);
    // Execute the installation using the hook
    await install();

    setIsDeployed(true);
  };

  const handleCloseDeployment = () => {
    setIsDeploymentVisible(false);
    navigateToHomeIfCurrentApp();
  };

  const navigateToHomeIfCurrentApp = () => {
    if (getWzCurrentAppID() === dashboardAssistant.id) {
      DashboardAssistantNavigationService.Home();
    }
  };

  return (
    <>
      <div style={{ minHeight: '100vh', display: 'flex' }}>
        <EuiFlexGroup
          direction='column'
          justifyContent='center'
          alignItems='center'
          style={{ minHeight: '100vh', width: '100%' }}
        >
          <EuiFlexItem
            grow={false}
            style={{ maxWidth: config.maxWidth || '600px', width: '100%' }}
          >
            <EuiPanel paddingSize='l'>
              <EuiTitle size='l'>
                <h2>{config.title}</h2>
              </EuiTitle>

              <EuiSpacer size='s' />

              <EuiText color='subdued'>
                <p>
                  {config.description}{' '}
                  <EuiLink href='#' target='_blank'>
                    {config.learnMoreText}
                  </EuiLink>
                </p>
              </EuiText>

              <EuiSpacer size='l' />

              <ModelForm
                onChange={handleFormChange}
                onValidationChange={handleValidationChange}
                disabled={disabled}
              />

              <EuiSpacer size='xl' />

              <EuiFlexGroup justifyContent='flexEnd' gutterSize='m'>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    onClick={handleCancel}
                    disabled={isInstalling || isDeployed}
                  >
                    {config.buttons.cancel}
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton
                    fill
                    onClick={handleDeploy}
                    disabled={!isFormValid || isInstalling || isDeployed}
                    isLoading={isInstalling}
                  >
                    {isInstalling ? 'Deploying...' : config.buttons.deploy}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {isDeploymentVisible && (
        <EuiFlyout onClose={handleCloseDeployment} size='m' type='push'>
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>Model Deployment</h2>
            </EuiTitle>
          </EuiFlyoutHeader>

          <EuiFlyoutBody>
            <DeploymentStatus
              progress={progress}
              agentId={result?.data?.agentId}
              title='Model deployment'
              onCheckButton={navigateToHomeIfCurrentApp}
              showCheckButton={isSuccess}
            />
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};

export const ModelRegister = withGlobalBreadcrumb(() => [
  {
    text: 'Dashboard Assistant',
    href: NavigationService.getInstance().getUrlForApp(dashboardAssistant.id, {
        path: `#/${SECTIONS.ASSISTANT}`,
      }),
  },
  {
    text: 'Register model',
  },
])(ModelRegisterComponent);
