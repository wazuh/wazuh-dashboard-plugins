import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiBasicTable, EuiPanel, EuiTitle, Random } from '@elastic/eui';

export const MockupTables = ({ toggleDrilldown, ...props }) => {
    const random = new Random();
    const tables = [        
        {
            title: 'Events',
            minWidth: '750px',
            width: '750px',
            columns: [
                {
                    field: 'rule',
                    name: 'Description',
                    render: (rule) => (<span onClick={toggleDrilldown}>{rule.description}</span>),
                },
                {
                    field: 'rule',
                    name: 'Level',
                    render: (rule) => (<span onClick={toggleDrilldown}>{rule.level}</span>),
                },
            ],
        },
    ];
    const generateItems = () => {

        const rules = [
            {
                level: 1,
                description: 'A simple rule',
            },
            {
                level: 5,
                description: 'A worrysome rule',
            },
            {
                level: 12,
                description: 'Oh snap',
            },
        ];
        const subscriptions = ['netflix', 'spotify', 'prime'];
        const tenant = ['David', 'Doctor', 'Crowlie'];
        const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((id) => {
            return {
                id,
                rule: random.oneOf(rules),
                tenant: random.oneOf(tenant),
                subscription: random.oneOf(subscriptions),
                count: random.integer(0, 10),
            };
        });
        return items;
    };
    const TitlePanel = ({ title, children, panelProps, titleProps = { size: 's' } }) => {
        return <EuiPanel {...panelProps}>
            <EuiTitle {...titleProps}><h2>{title}</h2></EuiTitle>
            {children}
        </EuiPanel>
    }
    const renderTables = (items, tables) => {
        const table = tables[0];
        return <EuiFlexItem style={{ minWidth: table.minWidth, width: table.width || '' }}>
            <TitlePanel title={table.title}>
                <EuiBasicTable items={items} columns={table.columns} />
            </TitlePanel>
        </EuiFlexItem>

    };


    return <EuiFlexGroup wrap>{renderTables(generateItems(), tables)}</EuiFlexGroup>
}