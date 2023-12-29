import { EuiBadge } from "@elastic/eui";
import React from 'react';
import { tDataGridColumn } from '../../hooks/data_grid'

export const threatHuntingColumns: tDataGridColumn[] = [{
    id: 'timestamp'
},
{
    id: 'agent.name'
},
{
    id: 'rule.description'
},
{
    id: 'rule.level'
},
{
    id: 'rule.id'
}]