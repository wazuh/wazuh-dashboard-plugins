import React, { useState, useEffect } from 'react';
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


interface Model {
  id: string;
  name: string;
  version: string;
  apiUrl: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
}

interface ModelsTableProps {
  models?: Model[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddModel?: () => void;
}

export const ModelsTable = ({
  models = [],
  isLoading = false,
  onRefresh,
  onAddModel
}: ModelsTableProps) => {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <EuiIcon type="dot" color="success" />;
      case 'inactive':
        return <EuiIcon type="dot" color="subdued" />;
      case 'error':
        return <EuiIcon type="dot" color="danger" />;
      default:
        return <EuiIcon type="dot" color="subdued" />;
    }
  };

  const handleViewModel = (model: Model) => {
    setSelectedModel(model);
    setIsFlyoutVisible(true);
  };

  const closeFlyout = () => {
    setIsFlyoutVisible(false);
    setSelectedModel(null);
  };

  const columns = [
    {
      field: 'name',
      name: 'Name',
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
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            {getStatusIcon(status)}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s">{status}</EuiText>
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
          name: 'View',
          description: 'View model details',
          icon: 'eye',
          type: 'icon',
          onClick: (model: Model) => handleViewModel(model),
        },
      ],
    },
  ];

  const renderActionButtons = () => {
    const buttons = [];
    
    if (onAddModel) {
      buttons.push(
        <EuiFlexItem key="add-model" grow={false}>
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
        </EuiFlexItem>
      );
    }
    
    if (onRefresh) {
      buttons.push(
        <EuiFlexItem key="refresh" grow={false}>
          <EuiButtonEmpty iconType="refresh" onClick={onRefresh}>
            Refresh
          </EuiButtonEmpty>
        </EuiFlexItem>
      );
    }
    
    return buttons;
  };

  const header = (
    <EuiFlexGroup wrap alignItems="center" responsive={false}>
      <EuiFlexItem>
        <EuiFlexGroup wrap alignItems="center" responsive={false}>
          <EuiFlexItem className="wz-flex-basis-auto" grow={false}>
            <EuiTitle data-test-subj="models-table-title" size="s">
              <h1>
                Models{' '}
                {isLoading ? (
                  <EuiLoadingSpinner size="s" />
                ) : (
                  <span>({formatUINumber(models.length)})</span>
                )}
              </h1>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup wrap alignItems="center" responsive={false}>
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
        tableLayout="auto"
        noItemsMessage={isLoading ? 'Loading models...' : 'No models found'}
      />
  );

  return (
    <>
      <EuiFlexGroup direction="column" gutterSize="s" responsive={false}>
        <EuiFlexItem>{header}</EuiFlexItem>
        <EuiFlexItem>{table}</EuiFlexItem>
      </EuiFlexGroup>

      {isFlyoutVisible && selectedModel && (
        <EuiFlyout onClose={closeFlyout} size="m">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2>Model Details</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiFlexGroup direction="column" gutterSize="m">
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
                <EuiText>
                  <strong>API URL:</strong> {selectedModel.apiUrl}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
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
                  <strong>Created:</strong> {new Date(selectedModel.createdAt).toLocaleString()}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};