import { EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import React from 'react';
import { WAZUH_AGENTS_OS_TYPE } from '../../../../common/constants';
import { AgentStatus } from '../../agents/agent-status';
import { Agent } from '../../endpoints-summary/types';
import { WzStat } from '../../wz-stat';
import { GroupTruncate } from '../util/agent-group-truncate';
import WzTextWithTooltipIfTruncated from '../wz-text-with-tooltip-if-truncated';
import './ribbon-item.scss';
import { getAgentOSType } from '../../../react-services';

const FONT_SIZE = 12;

export enum RibbonItemLabel {
  GROUPS = 'groups',
  OPERATING_SYSTEM = 'operating-system',
  STATUS = 'status',
}

export type IRibbonItem<LABEL extends string = string, VALUE = any> = {
  key: React.Key;
  label: LABEL;
  value: VALUE;
  style?: React.CSSProperties;
  isLoading?: boolean;
  icon?: React.ReactNode;
};

const isGroups = (
  item: IRibbonItem,
): item is IRibbonItem<RibbonItemLabel.GROUPS, string[]> => {
  return item.key === RibbonItemLabel.GROUPS;
};

const isOperatingSystem = (
  item: IRibbonItem,
): item is IRibbonItem<RibbonItemLabel.OPERATING_SYSTEM, Agent> => {
  return item.key === RibbonItemLabel.OPERATING_SYSTEM;
};

const isStatus = (
  item: IRibbonItem,
): item is IRibbonItem<RibbonItemLabel.STATUS, Agent> => {
  return item.key === RibbonItemLabel.STATUS;
};

interface RibbonItemProps {
  item: IRibbonItem;
}

const WzRibbonItem = (props: RibbonItemProps) => {
  const { item } = props;

  const elementStyle = { ...(item.style || {}), fontSize: FONT_SIZE };
  const wzWidth100 = { anchorClassName: 'wz-width-100' };
  const tooltipProps = item.key === 'cluster-node' ? wzWidth100 : {};

  const getPlatformIcon = (agent?: Agent) => {
    let icon = '';
    let osType = getAgentOSType(agent);
    if (osType === WAZUH_AGENTS_OS_TYPE.DARWIN) {
      icon = 'apple';
    } else if (
      [WAZUH_AGENTS_OS_TYPE.WINDOWS, WAZUH_AGENTS_OS_TYPE.LINUX].includes(
        osType,
      )
    ) {
      icon = osType;
    }

    return (
      <i
        className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${osType}`}
        aria-hidden='true'
      ></i>
    );
  };

  const getOsName = (agent?: Agent) => {
    const { name, version } = agent?.os || {};

    if (!name && !version) return '-';

    if (!version) return name;

    if (!name) return version;

    return `${name} ${version}`;
  };

  const renderField = function <T>(field?: T): T | string {
    return field !== undefined || field ? field : '-';
  };

  const renderValue = () => {
    return item.isLoading ? (
      <EuiLoadingSpinner size='s' />
    ) : isGroups(item) && item.value?.length ? (
      <GroupTruncate
        groups={item.value}
        length={40}
        label={'more'}
        action={'redirect'}
      />
    ) : isOperatingSystem(item) ? (
      <WzTextWithTooltipIfTruncated
        position='bottom'
        tooltipProps={wzWidth100}
        elementStyle={{
          ...elementStyle,
          maxWidth: item.style?.maxWidth,
        }}
      >
        {getPlatformIcon(item.value)} {getOsName(item.value)}
      </WzTextWithTooltipIfTruncated>
    ) : isStatus(item) ? (
      <AgentStatus
        status={item.value?.status}
        agent={item.value}
        style={elementStyle}
      />
    ) : (
      <WzTextWithTooltipIfTruncated
        position='bottom'
        tooltipProps={tooltipProps}
        elementStyle={elementStyle}
      >
        {item.icon} {renderField(item.value)}
      </WzTextWithTooltipIfTruncated>
    );
  };

  return (
    <EuiFlexItem
      className='wz-ribbon-item'
      data-test-subj={`ribbon-item-${item.key}`}
      key={item.key}
      style={item.style || null}
    >
      <WzStat title={renderValue()} description={item.label} titleSize='xs' />
    </EuiFlexItem>
  );
};

export default WzRibbonItem;
