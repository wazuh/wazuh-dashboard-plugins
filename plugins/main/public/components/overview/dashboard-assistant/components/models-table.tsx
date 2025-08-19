import React, { useState } from 'react';
import {
  EuiTitle,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiButtonEmpty,
  EuiBasicTable,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiIcon,
} from '@elastic/eui';
import { formatUINumber } from '../../../../react-services/format-number';
import { ModelTestResult } from './model-test-result';
import {
  useModelTest,
  useDeleteModel,
  useModelsComposed,
} from '../modules/model/hooks';
import { useToast } from '../hooks/use-toast';
import { ModelFieldDefinition } from './types';
import RegisterAgentCommand from './register-agent-command';
import { useFlyout } from '../hooks/use-flyout';
import { ModelStatus } from '../modules/model/domain/enums/model-status';
import StatusIcon from './status-icon';
import { DashboardAssistantNavigationService } from '../services/dashboard-assistant-navigation-service';
import { UseCases } from '../setup';

interface Model {
  id: string;
  name: string;
  version: string;
  description: string;
  apiUrl: string;
  status: ModelStatus;
  createdAt: string;
  agentId?: string;
  agentName?: string;
  inUse?: boolean;
}

type ModelTableColumns =
  | {
      field: keyof ModelFieldDefinition;
      name: string;
      sortable?: boolean;
      truncateText?: boolean;
      render?: (value: any) => React.ReactNode;
    }
  | {
      name: string;
      actions: Array<{
        name: string;
        description: string;
        icon: string;
        type: 'icon';
        onClick: (model: Model) => void;
        enabled?: (model: Model) => boolean;
      }>;
    };

interface ModelsTableProps {
  onAddModel?: boolean;
}

export const ModelsTable = ({ onAddModel }: ModelsTableProps) => {
  const { addSuccessToast, addErrorToast, addInfoToast } = useToast();
  const { isLoading, error, refresh, models } = useModelsComposed();
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const flyoutModelDetails = useFlyout({
    onOpenHandler(model: Model) {
      setSelectedModel(model);
    },
    onCloseHandler() {
      setSelectedModel(null);
    },
  });
  const flyoutTest = useFlyout({
    async onOpenHandler(model: Model) {
      setSelectedModel(model);
      await testModel(model.id);
    },
    onCloseHandler() {
      setSelectedModel(null);
    },
    resetHandler() {
      resetTest();
    },
  });
  const flyoutUse = useFlyout({
    onOpenHandler(model: Model) {
      setSelectedModel(model);
    },
    onCloseHandler() {
      setSelectedModel(null);
    },
  });
  const {
    isLoading: isTestLoading,
    response: testResponse,
    error: testError,
    testModel,
    reset: resetTest,
  } = useModelTest();
  const { deleteModel } = useDeleteModel();

  if (error) {
    return (
      <EuiFlexGroup direction='column' gutterSize='m' alignItems='center'>
        <EuiFlexItem>
          <EuiText color='danger'>
            <h3>Error loading models</h3>
            <p>{error}</p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiButtonEmpty iconType='refresh' onClick={refresh}>
            Retry
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  const columns: ModelTableColumns[] = [
    {
      field: 'name',
      name: 'Name',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'id',
      name: 'ID',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'version',
      name: 'Version',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'agentId',
      name: 'Agent ID',
      sortable: true,
      truncateText: true,
      render: (agentId: string) => agentId || '-',
    },
    {
      field: 'status',
      name: 'Status',
      sortable: true,
      render: (status: ModelStatus) => (
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem grow={false}>
            <StatusIcon status={status} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='s'>{status}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      field: 'inUse',
      name: 'In Use',
      sortable: true,
      render: (inUse: boolean) => (
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon
              type={inUse ? 'check' : 'cross'}
              color={inUse ? 'success' : 'danger'}
              size='m'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      field: 'createdAt',
      name: 'Created',
      sortable: true,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      name: 'Actions',
      actions: [
        {
          name: 'Use',
          description: 'Use model in dashboard assistant',
          icon: 'plusInCircle',
          type: 'icon',
          enabled: (model: Model) => model.status === 'active' && !model.inUse,
          onClick: async (model: Model) => {
            if (!model.agentId) {
              return;
            }
            try {
              await UseCases.registerAgent(model.agentId);
              // ToDo: Check why is needed to wait 500 ms
              await new Promise(resolve => setTimeout(resolve, 500));
              await refresh();
              addSuccessToast(
                'Agent registered',
                `The agent "${model.agentName}" with ID "${model.agentId}" has been successfully registered.`,
              );
            } catch (error) {
              addErrorToast(
                'Error registering agent',
                `Could not register agent "${model.agentName}" with ID "${
                  model.agentId
                }". ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              );
            }
          },
        },
        {
          name: 'View',
          description: 'View model details',
          icon: 'eye',
          type: 'icon',
          onClick: (model: Model) => {
            flyoutModelDetails.open(model);
          },
        },
        {
          name: 'Test',
          description: 'Test model connection',
          icon: 'play',
          type: 'icon',
          onClick: (model: Model) => flyoutTest.open(model),
          enabled: (model: Model) => model.status === 'active',
        },
        {
          name: 'Delete',
          icon: 'trash',
          type: 'icon',
          description: 'Delete model',
          enabled: (model: Model) => !model.inUse,
          onClick: async (model: Model) => {
            try {
              await deleteModel(model.id);
              await refresh();
              addSuccessToast(
                'Model deleted',
                `The model "${model.name}" with ID "${model.id}" has been successfully deleted.`,
              );
            } catch (error) {
              addErrorToast(
                'Error deleting model',
                `Could not delete model "${model.name}" with ID "${
                  model.id
                }". ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              );
            }
          },
        },
      ],
    },
  ];

  const renderActionButtons = () => {
    const buttons = [];

    if (onAddModel) {
      buttons.push(
        <EuiFlexItem key='add-model' grow={false}>
          <EuiButtonEmpty
            color='primary'
            iconType='plusInCircle'
            href={DashboardAssistantNavigationService.RegisterModel()}
          >
            Add model
          </EuiButtonEmpty>
        </EuiFlexItem>,
      );
    }

    buttons.push(
      <EuiFlexItem key='refresh' grow={false}>
        <EuiButtonEmpty iconType='refresh' onClick={refresh}>
          Refresh
        </EuiButtonEmpty>
      </EuiFlexItem>,
    );

    return buttons;
  };

  const header = (
    <EuiFlexGroup wrap alignItems='center' responsive={false}>
      <EuiFlexItem>
        <EuiFlexGroup wrap alignItems='center' responsive={false}>
          <EuiFlexItem className='wz-flex-basis-auto' grow={false}>
            <EuiTitle data-test-subj='models-table-title' size='s'>
              <h1>
                Models{' '}
                {isLoading ? (
                  <EuiLoadingSpinner size='s' />
                ) : (
                  <span>({formatUINumber(models.length)})</span>
                )}
              </h1>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup wrap alignItems='center' responsive={false}>
          {renderActionButtons()}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const table = (
    <EuiBasicTable
      items={models}
      columns={columns}
      loading={isLoading}
      hasActions
      tableLayout='auto'
      noItemsMessage={isLoading ? 'Loading models...' : 'No models found'}
    />
  );

  return (
    <>
      <EuiFlexGroup direction='column' gutterSize='s' responsive={false}>
        <EuiFlexItem>{header}</EuiFlexItem>
        <EuiFlexItem>{table}</EuiFlexItem>
      </EuiFlexGroup>

      {flyoutModelDetails.isOpen && selectedModel && (
        <EuiFlyout onClose={flyoutModelDetails.close} size='m'>
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>Model Details</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiFlexGroup direction='column' gutterSize='m'>
              <EuiFlexItem>
                <EuiText>
                  <strong>Name:</strong> {selectedModel.name}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText>
                  <strong>Version:</strong> {selectedModel.version}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFlexGroup
                  alignItems='center'
                  gutterSize='s'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiText>
                      <strong>Status:</strong>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <StatusIcon status={selectedModel.status} />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText>{selectedModel.status}</EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText>
                  <strong>Created:</strong>{' '}
                  {new Date(selectedModel.createdAt).toLocaleString()}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}

      {flyoutTest.isOpen && selectedModel && (
        <EuiFlyout onClose={flyoutTest.close} size='m'>
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>Test Model: {selectedModel.name}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <ModelTestResult
              isLoading={isTestLoading}
              response={testResponse}
              error={testError}
              modelName={selectedModel.name}
            />
          </EuiFlyoutBody>
        </EuiFlyout>
      )}

      {flyoutUse.isOpen && selectedModel && (
        <EuiFlyout onClose={flyoutUse.close} size='m'>
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2>Register agent command</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <RegisterAgentCommand
              entityId={selectedModel.id}
              targetEntity='model'
            />
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
