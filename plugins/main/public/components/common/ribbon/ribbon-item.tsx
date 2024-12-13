import { EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import React from 'react';
import { WAZUH_AGENTS_OS_TYPE } from '../../../../common/constants';
import { AgentStatus } from '../../agents/agent-status';
import { Agent } from '../../endpoints-summary/types';
import { WzStat } from '../../wz-stat';
import { GroupTruncate } from '../util/agent-group-truncate';
import WzTextWithTooltipIfTruncated from '../wz-text-with-tooltip-if-truncated';
import './ribbon-item.scss';
import { TAgentStatus } from '../../../../common/services/wz_agent_status';
import { getAgentOSType } from '../../../react-services';

const FONT_SIZE = 12;

export enum RibbonItemLabel {
  GROUPS = 'groups',
  OPERATING_SYSTEM = 'operating-system',
  AGENT_STATUS = 'agent-status',
}

export type IRibbonItem<LABEL extends string = string, VALUE = any> = {
  key: React.Key;
  label: LABEL;
  value: VALUE;
  style?: React.CSSProperties;
  isLoading?: boolean;
  condensed?: boolean;
  render?: (value: any) => React.ReactNode;
};

const isGroups = (
  item: IRibbonItem,
): item is IRibbonItem<RibbonItemLabel.GROUPS, string[]> => {
  return item.key === RibbonItemLabel.GROUPS;
};

const isStatus = (
  item: IRibbonItem,
): item is IRibbonItem<RibbonItemLabel.AGENT_STATUS, Agent> => {
  return item.key === RibbonItemLabel.AGENT_STATUS;
};

interface RibbonItemProps {
  item: IRibbonItem;
}

const WzRibbonItem = (props: RibbonItemProps) => {
  const { item } = props;

  const contentStyle = { ...item.style, fontSize: FONT_SIZE };

  const renderOptionalField = function <T>(field?: T): T | string {
    return field !== undefined || field ? field : '-';
  };

  const renderValue = () => {
    return item.isLoading ? (
      <EuiLoadingSpinner size='s' />
    ) : isGroups(item) && item.value?.length ? (
      <GroupTruncate
        groups={item.value}
        length={30}
        label={'more'}
        action={'redirect'}
      />
    ) : isStatus(item) ? (
      <AgentStatus
        status={item.value?.status as TAgentStatus}
        agent={item.value}
        style={contentStyle}
      />
    ) : (
      <WzTextWithTooltipIfTruncated contentStyle={contentStyle}>
        {item.render
          ? item.render(item.value)
          : renderOptionalField(item.value)}
      </WzTextWithTooltipIfTruncated>
    );
  };

  return (
    <EuiFlexItem
      className='wz-ribbon-item'
      grow={false}
      data-test-subj={`ribbon-item-${item.key}`}
      key={item.key}
      style={contentStyle || null}
    >
      <WzStat title={renderValue()} description={item.label} titleSize='xs' />
    </EuiFlexItem>
  );
};

export default WzRibbonItem;
