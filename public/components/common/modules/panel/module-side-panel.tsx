import { EuiCollapsibleNav, EuiButtonEmpty } from '@elastic/eui';
import React, { useState } from 'react';
import './module-side-panel.scss';

export const ModuleSidePanel = ({ navIsDocked = false, children, ...props }) => {
  const [navIsOpen, setNavIsOpen] = useState(false);


  return (
    <EuiCollapsibleNav
      isOpen={navIsOpen}
      isDocked={navIsDocked}
      showCloseButton={true}
      maskProps={{ headerZindexLocation: 'below', className: 'wz-no-display' }}
      button={
        <EuiButtonEmpty className={'sidepanel-infoBtnStyle'} onClick={() => setNavIsOpen(!navIsOpen)} iconType={'iInCircle'}>
        </EuiButtonEmpty>
      }
      onClose={() => setNavIsOpen(false)}>
      <div>
        <EuiButtonEmpty style={{ float: 'right' }} onClick={() => setNavIsOpen(!navIsOpen)} iconType={'cross'}>
        </EuiButtonEmpty>
        <div className={'wz-padding-16'}>
          {children}
        </div>
      </div>
    </EuiCollapsibleNav>
  );
};