import React from 'react';
import {
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
} from '@elastic/eui';
import { REGISTER_AGENT_DATA } from '../utils/register-agent-data';
import { SwitchComponent } from './switch';

export const OsCard = () => (
  <div>
    <EuiSpacer size='s' />
    <EuiFlexGroup gutterSize='l' wrap>
      {REGISTER_AGENT_DATA.map((data, index) => (
        <EuiFlexItem key={index}>
          <EuiCard
            icon={<EuiIcon size='xl' type='logoLogging' />}
            title='Bordered'
            display='plain'
            hasBorder
            description='This one has a plain background color and border.'
            onClick={() => {}}
          >
            <SwitchComponent data={data} cardIndex={index} />
          </EuiCard>
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  </div>
);
