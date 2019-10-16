import React from 'react';
import { EuiToolTip, EuiLink } from '@elastic/eui';
import RulesetHandler from './ruleset-handler';

const columns = {
  rules: [
    {
      name: 'ID',
      align: 'left',
      sortable: true,
      width: '5%',
      render: item => {
        return (
          <EuiToolTip position="top" content={`Show rule ID ${item.id} information`}>
            <EuiLink onClick={async () => {
              const result = await RulesetHandler.getRuleInformation(item.file);
              console.log(result)
            }
            }>
              {item.id}
            </EuiLink>
          </EuiToolTip>
        )
      }
    },
    {
      field: 'description',
      name: 'Description',
      align: 'left',
      sortable: true,
      width: '30%'
    },
    {
      field: 'groups',
      name: 'Groups',
      align: 'left',
      sortable: true,
      width: '10%'
    },
    {
      field: 'pci',
      name: 'PCI',
      align: 'left',
      sortable: true,
      width: '10%'
    },
    {
      field: 'gdpr',
      name: 'GDPR',
      align: 'left',
      sortable: true,
      width: '10%'
    },
    {
      field: 'hipaa',
      name: 'HIPAA',
      align: 'left',
      sortable: true,
      width: '10%'
    },
    {
      field: 'nist-800-53',
      name: 'NIST 800-53',
      align: 'left',
      sortable: true,
      width: '10%'
    },
    {
      field: 'level',
      name: 'Level',
      align: 'left',
      sortable: true,
      width: '5%'
    },
    {
      field: 'file',
      name: 'File',
      align: 'left',
      sortable: true,
      width: '15%',
      render: item => {
        return (
          <EuiToolTip position="top" content={`Show ${item} content`}>
            <EuiLink onClick={async () => {
              const result = await RulesetHandler.getRuleContent(item);
              console.log(result)
            }
            }>
              {item}
            </EuiLink>
          </EuiToolTip>
        )
      }
    },
    {
      field: 'path',
      name: 'Path',
      align: 'left',
      sortable: true,
      width: '10%'
    }
  ],
  decoders: [
    {
      name: 'Name',
      align: 'left',
      sortable: true,
      render: item => {
        return (
          <EuiToolTip position="top" content={`Show ${item.name} decoder information`}>
            <EuiLink onClick={async () => {
              const result = await RulesetHandler.getDecoderInformation(item.file);
              console.log(result)
            }
            }>
              {item.name}
            </EuiLink>
          </EuiToolTip>
        )
      }
    },
    {
      field: 'details.program_name',
      name: 'Program name',
      align: 'left',
      sortable: true
    },
    {
      field: 'details.order',
      name: 'Order',
      align: 'left',
      sortable: true
    },
    {
      field: 'file',
      name: 'File',
      align: 'left',
      sortable: true,
      render: item => {
        return (
          <EuiToolTip position="top" content={`Show ${item} content`}>
            <EuiLink onClick={async () => {
              const result = await RulesetHandler.getDecoderContent(item);
              console.log(result)
            }
            }>{item}</EuiLink>
          </EuiToolTip>
        )
      }
    },
    {
      field: 'path',
      name: 'Path',
      align: 'left',
      sortable: true
    }
  ],
  lists: [
    {
      field: 'name',
      name: 'Name',
      align: 'left',
      sortable: true
    },
    {
      field: 'path',
      name: 'Path',
      align: 'left',
      sortable: true
    }
  ],
  files: [
    {
      field: 'file',
      name: 'File',
      align: 'left',
      sortable: true
    }
  ]
}

export default columns;