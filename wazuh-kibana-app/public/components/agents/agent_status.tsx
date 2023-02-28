import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { agentStatusColorByAgentStatus, agentStatusLabelByAgentStatus } from '../../../common/services/wz_agent_status';

export const AgentStatus = ({  status, children = null, labelProps = {}, style = {} }) => (
	<span className="euiFlexGroup euiFlexGroup--gutterExtraSmall euiFlexGroup--alignItemsCenter euiFlexGroup--directionRow" style={style}>
		<EuiToolTip position="top" content={agentStatusLabelByAgentStatus(status).toLowerCase()}>
			<span className="euiFlexItem euiFlexItem--flexGrowZero">
				<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className={`euiIcon euiIcon--medium`} style={{ color: agentStatusColorByAgentStatus(status) }} focusable="false" role="img" aria-hidden="true">
					<circle cx="8" cy="8" r="4"></circle>
				</svg>
			</span>
		</EuiToolTip>
		<span className="euiFlexItem euiFlexItem--flexGrowZero" {...labelProps}>{children || agentStatusLabelByAgentStatus(status).toLowerCase()}</span>
	</span>
)