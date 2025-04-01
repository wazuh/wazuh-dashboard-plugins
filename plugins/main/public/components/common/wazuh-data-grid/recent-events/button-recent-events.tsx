import React from 'react';
import { EuiTitle, EuiToolTip, EuiIcon } from '@elastic/eui';

export const ButtonExploreEvents = ({ onClick }: { onClick: () => void }) => {
  return (
    <EuiTitle size='xs'>
      <h3>
        Explore events
        <span style={{ marginLeft: 16 }}>
          <EuiToolTip position='top' content='Explore recent events'>
            <EuiIcon
              className='euiButtonIcon euiButtonIcon--primary'
              onMouseDown={onClick}
              type='popout'
              aria-label='Explore recent events'
            />
          </EuiToolTip>
        </span>
      </h3>
    </EuiTitle>
  );
};
