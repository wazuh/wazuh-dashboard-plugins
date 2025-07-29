import React, { useState, useEffect, useCallback } from 'react';
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
import { ModelForm } from './components/model-form';
import { DeploymentStatus } from './components/deployment-status';
import { getWzCurrentAppID } from '../../../kibana-services';
import { dashboardAssistant } from '../../../utils/applications';
import NavigationService from '../../../react-services/navigation-service';
import { useAssistantInstallation } from './common/installation-manager/hooks/use-assistant-installation';

interface ModelConfig {
  name: string;
  versions: string[];
}

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
  onClickDeploy?: () => void;
  disabled?: boolean;
  modelConfig?: ModelConfig[];
  formConfig?: FormConfig;
}

export const ModelRegister = ({ onClickDeploy, disabled = false, formConfig }: ModelRegisterProps) => {
  // Use the assistant installation hook
  const { install, setModel, isLoading: isInstalling, error: installError, result, modelData, isSuccess } = useAssistantInstallation();

  // Default form configuration
  const defaultFormConfig: FormConfig = {
    title: 'Register your preferred AI model',
    description: 'Select and configure the AI model that will power your dashboard assistant\'s conversational capabilities and data insights',
    learnMoreText: 'Learn more',
    buttons: {
      cancel: 'Cancel',
      deploy: 'Deploy'
    },
    maxWidth: '600px',
    padding: '24px'
  };
  // Model configuration data
  const modelConfig = [
    {
      name: 'OpenAI GPT',
      versions: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k']
    },
    {
      name: 'Anthropic Claude',
      versions: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-2.1', 'claude-2.0', 'claude-instant-1.2']
    },
    {
      name: 'Google Gemini',
      versions: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-1.0-pro-vision']
    },
    {
      name: 'Amazon Bedrock - Titan',
      versions: ['amazon.titan-text-express-v1', 'amazon.titan-text-lite-v1', 'amazon.titan-embed-text-v1', 'amazon.titan-embed-text-v2']
    },
    {
      name: 'Amazon Bedrock - Claude',
      versions: ['anthropic.claude-3-5-sonnet-20241022-v2:0', 'anthropic.claude-3-5-haiku-20241022-v1:0', 'anthropic.claude-3-opus-20240229-v1:0', 'anthropic.claude-3-sonnet-20240229-v1:0']
    },
    {
      name: 'Amazon Bedrock - Llama',
      versions: ['meta.llama3-2-90b-instruct-v1:0', 'meta.llama3-2-11b-instruct-v1:0', 'meta.llama3-2-3b-instruct-v1:0', 'meta.llama3-2-1b-instruct-v1:0']
    },
    {
      name: 'Microsoft Azure OpenAI',
      versions: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-35-turbo', 'gpt-35-turbo-16k']
    },
    {
      name: 'Cohere',
      versions: ['command-r-plus', 'command-r', 'command', 'command-nightly', 'command-light', 'command-light-nightly']
    },
    {
      name: 'Mistral AI',
      versions: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mistral-7b', 'open-mixtral-8x7b', 'open-mixtral-8x22b']
    },
    {
      name: 'Deepseek',
      versions: ['deepseek-chat', 'deepseek-coder', 'deepseek-math']
    },
    {
      name: 'Hugging Face',
      versions: ['microsoft/DialoGPT-large', 'facebook/blenderbot-400M-distill', 'microsoft/DialoGPT-medium', 'facebook/blenderbot-1B-distill']
    },
    {
      name: 'Ollama',
      versions: ['llama3.2:latest', 'llama3.1:latest', 'llama3:latest', 'mistral:latest', 'codellama:latest', 'phi3:latest']
    }
  ];

  const config = formConfig || defaultFormConfig;
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    apiUrl: '',
    apiKey: ''
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [isDeploymentVisible, setIsDeploymentVisible] = useState(false);

  const handleFormChange = useCallback((data: any) => {
    setFormData(data);
    setModel({
      name: data.name,
      version: data.version,
      apiUrl: data.apiUrl,
      apiKey: data.apiKey,
      description: `${data.name} ${data.version} model`
    });
  }, [setModel]);

  const handleValidationChange = useCallback((isValid: boolean) => {
    setIsFormValid(isValid);
  }, []);

  const handleCancel = () => {
    setFormData({
      name: '',
      version: '',
      apiUrl: '',
      apiKey: ''
    });
  };

  const handleDeploy = async () => {
    console.log('Deploying model with data:', formData);
    setIsDeploymentVisible(true);
    
    // Execute the installation using the hook
    await install();
    
    if (onClickDeploy) {
      onClickDeploy();
    }
  };

  const handleCloseDeployment = () => {
    setFormData({
      name: '',
      version: '',
      apiUrl: '',
      apiKey: ''
    });
    setIsDeploymentVisible(false);
  };

  const handleStepComplete = (stepId: string, status: 'pending' | 'loading' | 'success' | 'error') => {
    console.log(`Step ${stepId} completed with status: ${status}`);
  };

  const handleAllComplete = (allSuccess: boolean) => {
    if (allSuccess) {
      console.log('All deployment steps completed successfully');
    } else {
      console.log('Some deployment steps failed');
    }
  };

  // Effect to handle installation errors
  useEffect(() => {
    if (installError) {
      console.error('Installation error:', installError);
    }
  }, [installError]);

  // Effect to handle successful installation
  useEffect(() => {
    if (isSuccess && result) {
      console.log('Installation completed successfully:', result);
    }
  }, [isSuccess, result]);

  const handleOnClickCheckStatus = () => {
    if (getWzCurrentAppID() === dashboardAssistant.id) {
      NavigationService.getInstance().navigate(
        `${dashboardAssistant.id}`,
      );
    }
  }

  const deploymentSteps = [
    { 
      id: 'cluster', 
      label: 'Enabling cluster settings', 
      error: 'Failed to enable cluster settings. Check your permissions.' 
    },
    { 
      id: 'connector', 
      label: 'Creating connector', 
      error: 'Unable to create connector. Verify network connectivity.' 
    },
    { 
      id: 'model', 
      label: 'Registering model group', 
      error: 'Model group registration failed. Check model configuration.' 
    },
    { 
      id: 'register', 
      label: 'Registering model', 
      error: 'Model registration failed. Verify model parameters.' 
    },
    { 
      id: 'deploy', 
      label: 'Checking deployment status', 
      error: 'Deployment check failed. Review deployment logs.' 
    },
  ];

  return (
    <>
      <div style={{ minHeight: '100vh', display: 'flex' }}>
        <EuiFlexGroup 
          direction="column" 
          justifyContent="center" 
          alignItems="center" 
          style={{ minHeight: '100vh', width: '100%' }}
        >
          <EuiFlexItem grow={false} style={{ maxWidth: config.maxWidth || '600px', width: '100%' }}>
            <EuiPanel paddingSize="l">
              <EuiTitle size="l">
                <h2>{config.title}</h2>
              </EuiTitle>
              
              <EuiSpacer size="s" />
              
              <EuiText color="subdued">
                <p>
                  {config.description}{' '}
                  <EuiLink href="#" target="_blank">
                    {config.learnMoreText}
                  </EuiLink>
                </p>
              </EuiText>
              
              <EuiSpacer size="l" />
              
              <ModelForm
                  onChange={handleFormChange}
                  onValidationChange={handleValidationChange}
                  disabled={disabled}
                  modelConfig={modelConfig}
                />
              
              <EuiSpacer size="xl" />
                
              <EuiFlexGroup justifyContent="flexEnd" gutterSize="m">
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty onClick={handleCancel}>
                    {config.buttons.cancel}
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton 
                    fill 
                    onClick={handleDeploy}
                    disabled={!isFormValid || isInstalling}
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
        <EuiFlyout 
          onClose={handleCloseDeployment} 
          size="m" 
          type="push"
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2>Model Deployment</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          
          <EuiFlyoutBody>
            <DeploymentStatus
              steps={deploymentSteps}
              title="Model Deployment"
              autoStart={true}
              stepDelay={2000}
              onStepComplete={handleStepComplete}
              onAllComplete={handleAllComplete}
              onClose={handleCloseDeployment}
              onCheckButton={handleOnClickCheckStatus}
            />
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  )
}