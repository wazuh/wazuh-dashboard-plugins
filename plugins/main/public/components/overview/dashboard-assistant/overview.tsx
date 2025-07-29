import React, { useState } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiEmptyPrompt,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiToast,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiButtonEmpty
} from '@elastic/eui';
import { DeploymentStatus } from './components/deployment-status';
import { ModelsTable } from './components/models-table';
import { ModelRegister } from './model-register';
import NavigationService from '../../../react-services/navigation-service';
import { dashboardAssistant } from '../../../utils/applications';

// Toast configuration
const toastConfig = {
  lifeTimeMs: 6000,
  successToast: {
    title: 'Deployment completed',
    color: 'success' as const,
    text: 'The dashboard assistant has been configured correctly and is ready to use.',
    iconType: 'check'
  }
};

// Deployment configuration
const deploymentConfig = {
  title: 'Model Deployment',
  autoStart: true,
  stepDelay: 2000,
  flyoutSize: 'm' as const,
  texts: {
    subtitle: 'Assistant Setup in Progress',
    description: 'Installing and configuring your intelligent dashboard assistant. Please wait while we set up the AI components and establish model connections to enable natural language interactions with your data.',
    buttonText: 'Check assistant status',
    learnMoreText: 'Learn more'
  }
};

// Deployment steps configuration
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

// Form configuration
const formConfig = {
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

export const AssistantOverview = () => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [isAddModelVisible, setIsAddModelVisible] = useState(false);
  const [models, setModels] = useState([
    {
      id: '1',
      name: 'Anthropic Claude',
      version: 'claude-3-5-sonnet-20241022',
      apiUrl: 'https://api.anthropic.com/v1/messages',
      status: 'active' as const,
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Amazon Titan',
      version: 'amazon.titan-text-express-v1',
      apiUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com',
      status: 'active' as const,
      createdAt: '2024-01-10T14:20:00Z'
    },
    {
      id: '3',
      name: 'Deepseek',
      version: 'deepseek-chat',
      apiUrl: 'https://api.deepseek.com/v1/chat/completions',
      status: 'inactive' as const,
      createdAt: '2024-01-05T09:15:00Z'
    },
    {
      id: '4',
      name: 'OpenAI GPT',
      version: 'gpt-4-turbo',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      status: 'error' as const,
      createdAt: '2024-01-01T16:45:00Z'
    }
  ]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const handleAddModel = () => {
    setIsAddModelVisible(true);
  };

  const handleRefreshModels = () => {
    // TODO: Implement API call to refresh models
    console.log('Refreshing models...');
  };

  const handleStepComplete = (stepId: string, status: 'pending' | 'loading' | 'success' | 'error') => {
    console.log(`Step ${stepId} completed with status: ${status}`);
    if (status === 'loading') {
      setIsFormDisabled(true);
    }
  };

  const handleAllComplete = (allSuccess: boolean) => {
    console.log(`Deployment ${allSuccess ? 'completed successfully' : 'failed'}`);
    if (allSuccess) {
      const successToast = {
        id: `success-${Date.now()}`,
        ...toastConfig.successToast
      };
      setToasts(currentToasts => [...currentToasts, successToast]);
    }
  };

  const removeToast = (removedToast: any) => {
    setToasts(toasts.filter(toast => toast.id !== removedToast.id));
  };

  const handleCloseFlyout = () => {
    setIsFlyoutVisible(false);
    setIsFormDisabled(false);
  };

  return (
    <div style={{ padding: '24px' }}>
      <EuiPanel>
          { !models.length ? (
          <EuiFlexItem key="add-model" grow={false}>
            <EuiEmptyPrompt
              iconType='watchesApp'
              title={<h2>No modes were registered</h2>}
              body={<p>Add models to deploy the dashboard assistant</p>}
              actions={
                <EuiButtonEmpty
                  color='primary'
                  iconType='plusInCircle'
                  href={NavigationService.getInstance().getUrlForApp(
                    dashboardAssistant.id,
                    {
                      path: `#${dashboardAssistant.redirectTo()}/register-model`,
                    },
                  )}
                >
                  Add model
                </EuiButtonEmpty>
              }
            />
          </EuiFlexItem>
        ) : (
          <ModelsTable
            onAddModel
          />
        )}
      </EuiPanel>
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={removeToast}
        toastLifeTimeMs={toastConfig.lifeTimeMs}
      />
    </div>
  );
}