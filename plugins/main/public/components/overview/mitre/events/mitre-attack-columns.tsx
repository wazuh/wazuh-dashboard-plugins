import { EuiLink } from '@elastic/eui';
import { AppNavigate } from '../../../../react-services';
import { tDataGridColumn } from '../../../common/data-grid';
import React from 'react';
import dompurify from 'dompurify';

const navigateTo = (ev, section, params) => {
  AppNavigate.navigateToModule(ev, section, params);
};

const renderTechniques = (value: []) => {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {value.length &&
        value.map(technique => (
          <div>
            <EuiLink
              key={technique}
              onClick={e =>
                navigateTo(e, 'overview', {
                  tab: 'mitre',
                  tabView: 'intelligence',
                  tabRedirect: 'techniques',
                  idToRedirect: technique,
                })
              }
            >
              {technique}
            </EuiLink>
          </div>
        ))}
    </div>
  );
};

export const mitreAttackColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    displayAsText: 'Time',
    render: (value, row, cellFormatted) => {
      const sanitizedCellValue = dompurify.sanitize(cellFormatted);
      return <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />;
    },
  },
  {
    id: 'agent.name',
    displayAsText: 'Agent Name',
    render: (value: string, item: any) => {
      return (
        <EuiLink
          onClick={e =>
            navigateTo(e, 'agents', { tab: 'welcome', agent: item.agent.id })
          }
        >
          {value}
        </EuiLink>
      );
    },
  },
  {
    id: 'rule.mitre.id',
    displayAsText: 'Technique(s)',
    render: value => renderTechniques(value),
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.description', displayAsText: 'Description' },
  { id: 'rule.level', displayAsText: 'Level' },
  {
    id: 'rule.id',
    displayAsText: 'Rule ID',
    render: value => (
      <EuiLink
        onClick={e =>
          navigateTo(e, 'manager', {
            tab: 'rules',
            redirectRule: value,
          })
        }
      >
        {value}
      </EuiLink>
    ),
  },
];
