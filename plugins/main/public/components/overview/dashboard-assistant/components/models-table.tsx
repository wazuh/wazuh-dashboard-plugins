import React, { useState } from 'react';
import {
  EuiTitle,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiButtonEmpty,
  EuiIcon,
  EuiBasicTable,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
} from '@elastic/eui';
import { formatUINumber } from '../../../../react-services/format-number';
import NavigationService from '../../../../react-services/navigation-service';
import { dashboardAssistant } from '../../../../utils/applications';
import { ModelTestResult } from './model-test-result';
import {
  useModelTest,
  useDeleteModel,
  useModels,
} from '../modules/model/hooks';
import { ModelFieldDefinition } from './types';
import RegisterAgentCommand from './register-agent-command';
import { useFlyout } from '../hooks/use-flyout';

interface Model {
  id: string;
  name: string;
  version: string;
  description: string;
  apiUrl: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
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
  const { isLoading, error, refresh, getTableData } = useModels();
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

  const tableModels = getTableData();

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <EuiIcon type='dot' color='success' />;
      case 'inactive':
        return <EuiIcon type='dot' color='subdued' />;
      case 'error':
        return <EuiIcon type='dot' color='danger' />;
      default:
        return <EuiIcon type='dot' color='subdued' />;
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    await deleteModel(modelId);
    await refresh();
  };

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
      field: 'status',
      name: 'Status',
      sortable: true,
      render: (status: string) => (
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem grow={false}>{getStatusIcon(status)}</EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='s'>{status}</EuiText>
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
          onClick: (model: Model) => flyoutUse.open(model),
        },
        {
          name: 'View',
          description: 'View model details',
          icon: 'eye',
          type: 'icon',
          onClick: (model: Model) => flyoutModelDetails.open(model),
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
          onClick: async (model: Model) => handleDeleteModel(model.id),
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
            href={NavigationService.getInstance().getUrlForApp(
              dashboardAssistant.id,
              {
                path: `#${dashboardAssistant.redirectTo()}/register-model`,
              },
            )}
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
                  <span>({formatUINumber(tableModels.length)})</span>
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
      items={tableModels}
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
                    {getStatusIcon(selectedModel.status)}
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
