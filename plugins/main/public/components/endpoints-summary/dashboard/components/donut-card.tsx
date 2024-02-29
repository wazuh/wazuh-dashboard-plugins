import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiCard } from '@elastic/eui';
import { useApiService } from '../../../common/hooks/useApiService';
import { VisualizationBasic } from '../../../common/charts/visualizations/basic';

interface AgentsByStatusCardProps {
  title?: string;
  description?: string;
  betaBadgeLabel?: string;
  noDataTitle?: string;
  noDataMessage?: string;
  getInfo: () => Promise<any[]>;
  onClickLabel?: (status: any) => void;
  [key: string]: any;
}

const DonutCard = ({
  title = '',
  description = '',
  betaBadgeLabel,
  noDataTitle = 'No results',
  noDataMessage = 'No results were found',
  getInfo,
  onClickLabel,
  ...props
}: AgentsByStatusCardProps) => {
  const [loading, data] = useApiService<any>(getInfo, undefined);

  const handleClick = (item: any) => {
    if (onClickLabel) {
      onClickLabel(item);
    }
  };

  return (
    <EuiCard
      title={title}
      description={description}
      betaBadgeLabel={betaBadgeLabel}
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
            noDataTitle={noDataTitle}
            noDataMessage={noDataMessage}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCard>
  );
};

export default DonutCard;
