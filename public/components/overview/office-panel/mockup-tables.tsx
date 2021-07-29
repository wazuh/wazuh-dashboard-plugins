import React from 'react';
import {  EuiFlexGroup, EuiFlexItem, EuiBasicTable, EuiPanel, EuiTitle, Random } from '@elastic/eui';

export const MockupTables = () => {
    const tables = [
        {
            title: 'Tenants',
            minWidth: '400px',
            columns: [
                {
                    field: 'tenant',
                    name: 'Tenant',
                },
                {
                    field: 'count',
                    name: 'Count',
                },
            ],
        },
        {
            title: 'Subscriptions',
            minWidth: '400px',
            columns: [
                {
                    field: 'subscription',
                    name: 'Subscription',
                },
                {
                    field: 'count',
                    name: 'count',
                },
            ],
        },
        {
            title: 'Events',
            minWidth: '750px',
            width: '750px',
            columns: [
                {
                    field: 'rule',
                    name: 'Description',
                    render: (rule) => rule.description,
                },
                {
                    field: 'rule',
                    name: 'Level',
                    render: (rule) => rule.level,
                },
            ],
        },
    ];
    const generateItems = () => {
        const random = new Random();
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
        const rendered = tables.map((table, key) => {
            return (
                <EuiFlexItem style={{ minWidth: table.minWidth, width: table.width || '' }} key={key}>
                    <TitlePanel title={table.title}>
                        <EuiBasicTable items={items} columns={table.columns} />
                    </TitlePanel>
                </EuiFlexItem>
            );
        });
        return rendered;
    };


    return <EuiFlexGroup wrap>{renderTables(generateItems(), tables)}</EuiFlexGroup>
}