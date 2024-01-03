import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiCard } from '@elastic/eui';
import { useApiService } from '../../common/hooks/useApiService';
import { VisualizationBasic } from '../../common/charts/visualizations/basic';

interface AgentsByStatusCardProps {
  title?: string;
  description?: string;
  betaBadgeLabel?: string;
  noDataTitle?: string;
  noDataMessage?: string;
  getInfo: () => Promise<any[]>;
  onClickLabel?: (status: any) => void;
}

const DonutCard = ({
  title,
  description,
  betaBadgeLabel,
  noDataTitle,
  noDataMessage,
  getInfo,
  onClickLabel,
}: AgentsByStatusCardProps) => {
  const [loading, data] = useApiService<any>(getInfo, undefined);

  const handleClick = (item: any) => {
    if (onClickLabel) {
      onClickLabel(item);
    }
  };

  return (
    <EuiFlexItem className='agents-status-pie'>
      <EuiCard
        title={title}
        description={description}
        betaBadgeLabel={betaBadgeLabel}
        className='eui-panel'
      >
        <EuiFlexGroup>
          <EuiFlexItem className='align-items-center'>
            <VisualizationBasic
              isLoading={loading}
              type='donut'
              size={{ width: '100%', height: '150px' }}
              showLegend
              data={data?.map((item: any) => ({
                ...item,
                onClick: () => handleClick(item),
              }))}
              noDataTitle={noDataTitle ?? 'No results'}
              noDataMessage={noDataMessage ?? 'No results were found.'}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiCard>
    </EuiFlexItem>
  );
};

export default DonutCard;
