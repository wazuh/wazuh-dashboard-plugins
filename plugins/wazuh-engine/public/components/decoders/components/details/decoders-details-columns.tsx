export const columns = () => {
  return [
    {
      field: 'filename',
      name: 'Name',
      align: 'left',
      sortable: true,
    },
    {
      field: 'status',
      name: 'Status',
      align: 'left',
      sortable: true,
    },
    {
      field: 'relative_dirname',
      name: 'Path',
      align: 'left',
      sortable: true,
    },
    {
      field: 'position',
      name: 'Position',
      align: 'left',
      sortable: true,
    },
    {
      field: 'details.order',
      name: 'Order',
      align: 'left',
      sortable: true,
    },
  ];
};
