import { EuiCollapsibleNav, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React, { useState } from 'react';

export const ModuleSidePanel = ({ navIsDocked = false, children, ...props }) => {
    const [navIsOpen, setNavIsOpen] = useState(false);

    const infoBtnStyle = { borderRadius: '0 5px 5px 0', background: '#0000000a', zIndex: 2001 };
    return (
        <EuiCollapsibleNav
            isOpen={navIsOpen}
            isDocked={navIsDocked}
            showCloseButton={true}
            maskProps={{ headerZindexLocation: 'below', className: 'wz-no-display' }}
            button={
                <EuiButtonEmpty style={{ position: "fixed", left: 0, ...infoBtnStyle, }} onClick={() => setNavIsOpen(!navIsOpen)} iconType={'iInCircle'}>
                </EuiButtonEmpty>
            }
            onClose={() => setNavIsOpen(false)}>
            <div>
                <EuiButtonEmpty style={{ float: 'right' }} onClick={() => setNavIsOpen(!navIsOpen)} iconType={'cross'}>
                </EuiButtonEmpty>
                <div style={{ padding: 16 }}>
                    {children}
                </div>
            </div>
        </EuiCollapsibleNav>
    );
};