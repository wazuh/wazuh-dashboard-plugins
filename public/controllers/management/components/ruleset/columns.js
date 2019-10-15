const columns = {
  rules: [
    {
      field: 'id',
      name: 'ID',
      align: 'left',
      sortable: true
    },
    {
      field: 'description',
      name: 'Description',
      align: 'left',
      sortable: true
    },
    {
      field: 'groups',
      name: 'Groups',
      align: 'left',
      sortable: true
    },
    {
      field: 'pci',
      name: 'PCI',
      align: 'left',
      sortable: true
    },
    {
      field: 'gdpr',
      name: 'GDPR',
      align: 'left',
      sortable: true
    },
    {
      field: 'hipaa',
      name: 'HIPAA',
      align: 'left',
      sortable: true
    },
    {
      field: 'nist-800-53',
      name: 'NIST 800-53',
      align: 'left',
      sortable: true
    },
    {
      field: 'level',
      name: 'Level',
      align: 'left',
      sortable: true
    },
    {
      field: 'field',
      name: 'Field',
      align: 'left',
      sortable: true
    }
  ],
  decoders: [
    {
      field: 'name',
      name: 'Name',
      align: 'left',
      sortable: true
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
      sortable: true
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
  ]
}

export default columns;