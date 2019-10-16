const columns = {
  rules: [
    {
      field: 'id',
      name: 'ID',
      align: 'left',
      sortable: true,
      width: '5%'      
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
      width: '15%'  
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