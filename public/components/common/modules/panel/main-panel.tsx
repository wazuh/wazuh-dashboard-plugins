import React from 'react';
import {
    EuiFlexGroup,
    EuiFlexItem,
    EuiPage,
    EuiPageSideBar,
    EuiPageBody,
} from '@elastic/eui';
import { ModuleSidePanel, ModuleStats, ModuleBody } from './';


export const MainPanel = ({ sidePanelChildren, children, moduleStatsList = [], ...props }) => {

    return (
        <EuiFlexGroup style={{ margin: '0 8px' }}>
            <EuiFlexItem>
                {sidePanelChildren && <ModuleSidePanel>
                    {sidePanelChildren}
                </ModuleSidePanel >
                }
                <EuiPageBody>
                    <ModuleBody>{children}</ModuleBody>
                </EuiPageBody>
            </EuiFlexItem>
        </EuiFlexGroup>
    );
};

