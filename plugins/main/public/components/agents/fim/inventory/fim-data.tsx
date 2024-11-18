import React from 'react';
import { formatUIDate } from '../../../../react-services/time-service';
import {
  EuiIconTip,
  EuiAccordion,
  EuiTitle,
  EuiToolTip,
  EuiIcon,
  EuiCodeBlock,
} from '@elastic/eui';

function renderFileDetailsPermissions(value) {
  return (
    <EuiAccordion
      id={Math.random().toString()}
      paddingSize='none'
      initialIsOpen={false}
      arrowDisplay='none'
      buttonContent={
        <EuiTitle size='s'>
          <h3>
            Permissions
            <span style={{ marginLeft: 16 }}>
              <EuiToolTip position='top' content='Show'>
                <EuiIcon
                  className='euiButtonIcon euiButtonIcon--primary'
                  type='inspect'
                  aria-label='show'
                />
              </EuiToolTip>
            </span>
          </h3>
        </EuiTitle>
      }
    >
      <EuiCodeBlock language='json' paddingSize='l'>
        {JSON.stringify(value, null, 2)}
      </EuiCodeBlock>
    </EuiAccordion>
  );
}

function renderFileDetailsSize(value) {
  if (isNaN(value)) {
    return 0;
  }
  const b = 2;
  if (0 === value) {
    return '0 Bytes';
  }
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(value) / Math.log(1024));
  return (
    parseFloat((value / Math.pow(1024, d)).toFixed(c)) +
    ' ' +
    ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]
  );
}

const dataFIM = [
  {
    field: 'file',
    columns: {
      name: 'File',
      sortable: true,
      width: '250px',
      searchable: true,
      show: true,
    },
    details: null,
    suggestion: { description: 'filter by file' },
    registry: true,
  },
  {
    field: 'date',
    columns: {
      name: (
        <span>
          Last analysis{' '}
          <EuiIconTip
            content='This is not searchable through a search term.'
            size='s'
            color='subdued'
            type='alert'
          />
        </span>
      ),
      sortable: true,
      width: '130px',
      render: formatUIDate,
      searchable: false,
    },
    details: {
      name: 'Last analysis',
      grow: 2,
      icon: 'clock',
      link: true,
      transformValue: formatUIDate,
    },
    suggestion: { description: 'filter by analysis time' },
    registry: true,
  },
  {
    field: 'mtime',
    columns: {
      name: (
        <span>
          Last modified{' '}
          <EuiIconTip
            content='This is not searchable through a search term.'
            size='s'
            color='subdued'
            type='alert'
          />
        </span>
      ),
      sortable: true,
      width: '130px',
      render: formatUIDate,
      searchable: false,
      show: true,
    },
    details: {
      name: 'Last modified',
      grow: 2,
      icon: 'clock',
      link: true,
      transformValue: formatUIDate,
    },
    suggestion: {
      description: 'filter by modification time',
    },
    registry: true,
  },
  {
    field: 'uname',
    columns: {
      name: 'User',
      sortable: true,
      truncateText: true,
      width: '60px',
      searchable: true,
      show: true,
    },
    details: { name: 'User', icon: 'user', link: true },
    suggestion: { description: 'filter by user name' },
  },
  {
    field: 'uid',
    columns: {
      name: 'User ID',
      sortable: true,
      truncateText: true,
      width: '60px',
      searchable: true,
      show: true,
    },
    details: { field: 'uid', name: 'User ID', icon: 'user', link: true },
    suggestion: { description: 'filter by user name' },
  },
  {
    field: 'gname',
    columns: {
      name: 'Group',
      sortable: true,
      truncateText: true,
      width: '60px',
      searchable: true,
      show: true,
    },
    details: {
      field: 'gname',
      name: 'Group',
      icon: 'usersRolesApp',
      onlyLinux: true,
      link: true,
    },
    suggestion: { description: 'filter by group name' },
  },
  {
    field: 'gid',
    columns: {
      name: 'Group ID',
      sortable: true,
      truncateText: true,
      width: '60px',
      searchable: true,
      show: true,
    },
    details: {
      field: 'gid',
      name: 'Group ID',
      onlyLinux: true,
      icon: 'usersRolesApp',
      link: true,
    },
    suggestion: { description: 'filter by group id' },
  },
  {
    field: 'size',
    columns: {
      name: 'Size',
      sortable: true,
      width: '60px',
      searchable: true,
      show: true,
    },
    details: {
      field: 'size',
      name: 'Size',
      icon: 'nested',
      link: true,
      transformValue: value => renderFileDetailsSize(value),
    },
    suggestion: { description: 'filter by size' },
  },
  {
    field: 'inode',
    columns: {
      name: 'Inode',
      width: '60px',
      searchable: true,
      sortable: true,
    },
    details: {
      field: 'inode',
      name: 'Inode',
      icon: 'link',
      onlyLinux: true,
      link: true,
    },
    suggestion: { description: 'filter by Inode checksum' },
  },
  {
    field: 'md5',
    columns: {
      name: 'MD5',
      searchable: true,
      sortable: true,
    },
    details: {
      field: 'md5',
      name: 'MD5',
      checksum: true,
      icon: 'check',
      link: true,
    },
    suggestion: { description: 'filter by MD5 checksum' },
  },
  {
    field: 'sha1',
    columns: {
      name: 'SHA1',
      searchable: true,
      sortable: true,
    },
    details: {
      field: 'sha1',
      name: 'SHA1',
      checksum: true,
      icon: 'check',
      link: true,
    },
    suggestion: { description: 'filter by SHA1 checksum' },
  },
  {
    field: 'sha256',
    columns: {
      name: 'SHA256',
      searchable: true,
      sortable: true,
    },
    details: {
      field: 'sha256',
      name: 'SHA256',
      checksum: true,
      icon: 'check',
      link: true,
    },
    suggestion: { description: 'filter by SHA256 checksum' },
  },
  {
    field: 'perm',
    columns: null,
    details: {
      name: 'Permissions',
      icon: 'lock',
      link: false,
      transformValue: value => renderFileDetailsPermissions(value),
    },
    suggestion: null,
  },
];

// Checks that OS is not windows
function filterByOS(items, agentInfo: string) {
  return items.filter(
    item => item.details?.onlyLinux !== (agentInfo === 'windows'),
  );
}

function getPropertiesColumnsType(items) {
  // Avoid columns that are not rendered from getting into view
  return items
    .filter(({ columns }) => columns)
    .map(({ field, columns }) => ({
      field,
      ...columns,
    }));
}

function getPropertiesRegistryType(items) {
  return items
    .filter(item => item.registry)
    .map(({ field, columns }) => ({ field, ...columns }));
}

function getPropertiesSuggestionsType(items) {
  return items.map(({ field, suggestion }) => ({
    label: field,
    ...suggestion,
  }));
}

function getPropertiesDetailsType(items) {
  // Avoid details that are not rendered from getting into view
  return items
    .filter(({ details }) => details)
    .map(({ field, name, details }) => ({
      field,
      name,
      ...details,
    }));
}

const mappersType = {
  columns: getPropertiesColumnsType,
  suggestions: getPropertiesSuggestionsType,
  details: getPropertiesDetailsType,
  registry: getPropertiesRegistryType,
};

export function getProperties(
  agentInfo: string,
  type: 'columns' | 'suggestions' | 'details' | 'registry',
) {
  // Filter
  const filteredFields = filterByOS(dataFIM, agentInfo);

  // Get mapper by type
  const mapperByType = mappersType[type];

  return mapperByType(filteredFields);
}
