import React, { useEffect, useState } from 'react';
import {
  EuiHealth,
  EuiIcon,
  EuiButton,
  EuiDescriptionList,
  EuiPanel,
  EuiPageHeader,
} from '@elastic/eui';
import { useParams } from 'react-router-dom';
import { LastUpdateContentManagerText } from '../common/last-update-content-manager-text.tsx';
import { integrations } from './mock-data-integrations';
import './integrations.scss';
import { IntegrationDescription } from './components/integration-description';

export const IntegrationView = () => {
  const id = useParams().id;
  const [integrationData, setIntegrationData] = useState<{
    image: string;
    title: string;
    description: string;
    isEnable: boolean;
    lastUpdate: {
      lastUpdateDate: string;
      status: string;
    };
    versions: string[];
    compatibility: string;
    author: {
      name: string;
      date: string;
    };
    references: string[];
    module: string;
  }>({
    image: '',
    title: '',
    module: '',
    description: '',
    isEnable: false,
    lastUpdate: { lastUpdateDate: '', status: '' },
    versions: [],
    compatibility: '',
    author: {
      name: '',
      date: '',
    },
    references: [],
  });

  useEffect(() => {
    const integration = integrations.find(
      integration => integration.title === id,
    );

    if (integration) {
      setIntegrationData(integration);
    }
  }, [id]);

  // Header page start

  const headerTitle = (
    <span className='integration-title-header'>
      <EuiIcon
        className='integration-icon-header'
        type={integrationData?.image}
        size='xl'
      />
      <h1>{integrationData?.title}</h1>
      <EuiHealth
        style={{ marginLeft: '10px' }}
        color={integrationData.isEnable ? 'success' : 'danger'}
      >
        {integrationData.isEnable ? 'Enabled' : 'Disabled'}
      </EuiHealth>
    </span>
  );
  const descriptionHeader = LastUpdateContentManagerText(
    integrationData.lastUpdate,
  );

  const toggleEnableOrDisable = () => {
    setIntegrationData({
      ...integrationData,
      isEnable: !integrationData.isEnable,
    });
  };

  const rightSideItems = [
    <EuiButton
      key={`enable-disable-${integrationData.title}`}
      fill
      color={integrationData.isEnable ? 'danger' : 'primary'}
      onClick={toggleEnableOrDisable}
    >
      {integrationData.isEnable ? 'Disable' : 'Enable'}
    </EuiButton>,
  ];
  // Header page end
  // Description list start
  const list = Object.entries(integrationData).map(([key, value]) => ({
    key,
    value,
  }));

  // Description list end

  return (
    <>
      <EuiPageHeader
        pageTitle={headerTitle}
        descriptionHeader={descriptionHeader}
        rightSideItems={rightSideItems}
      />
      <EuiPanel>
        <EuiDescriptionList className='data-integration-card' compressed>
          {list
            .filter(item => item.key !== 'image')
            .map(item => (
              <IntegrationDescription
                key={item.key}
                keyValue={item.key}
                value={item.value}
              />
            ))}
        </EuiDescriptionList>
      </EuiPanel>
    </>
  );
};
