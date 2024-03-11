import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiCard } from '@elastic/eui';
import { VisualizationBasic } from '../../../common/charts/visualizations/basic';
import { useService } from '../../../common/hooks/use-service';

interface AgentsByStatusCardProps {
  title?: string;
  description?: string;
  betaBadgeLabel?: string;
  noDataTitle?: string;
  noDataMessage?: string;
  reload?: number;
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
  reload,
  getInfo,
  onClickLabel,
  ...props
}: AgentsByStatusCardProps) => {
  const { data, isLoading } = useService<any>(getInfo, undefined, reload);

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
            isLoading={isLoading}
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
