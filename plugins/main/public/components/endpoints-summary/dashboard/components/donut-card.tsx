import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiCard } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { VisualizationBasic } from '../../../common/charts/visualizations/basic';

interface DonutChartItem {
  label: string;
  value: number;
  color: string;
}

interface AgentsByStatusCardProps {
  title?: string;
  description?: string;
  betaBadgeLabel?: string;
  noDataTitle?: string;
  noDataMessage?: string;
  data: DonutChartItem[];
  isLoading?: boolean;
  onClickLabel?: (status: any) => void;
  [key: string]: any;
}

const DonutCard = ({
  title = '',
  description = '',
  betaBadgeLabel,
  noDataTitle = i18n.translate('wazuh.endpointsSummary.donutCard.noDataTitle', {
    defaultMessage: 'No results',
  }),
  noDataMessage = i18n.translate(
    'wazuh.endpointsSummary.donutCard.noDataMessage',
    { defaultMessage: 'No results were found' },
  ),
  onClickLabel,
  data,
  isLoading = false,
  ...props
}: AgentsByStatusCardProps) => {
  const handleClick = (item: DonutChartItem) => {
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
        <EuiFlexItem
          className='align-items-center'
          style={{ margin: '12px 0px' }}
        >
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
