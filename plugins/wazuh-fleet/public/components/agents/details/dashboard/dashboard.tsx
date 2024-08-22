import React from 'react';
import { getPlugins } from '../../../../plugin-services';
import { EuiSpacer } from '@elastic/eui';
import './dashboard.scss';
import { EventsCount } from './events-count';

export interface AgentDashboardProps {
  agentId: string;
}

export const AgentDashboard = ({
  agentId,
  ...restProps
}: AgentDashboardProps) => {
  const SearchBar = getPlugins().data.ui.SearchBar;

  return (
    <div>
      <div className='wz-search-bar-no-padding'>
        <SearchBar />
      </div>
      <EuiSpacer />
      <div style={{ margin: '-8px' }}>
        <EventsCount {...restProps} />
      </div>
    </div>
  );
};
