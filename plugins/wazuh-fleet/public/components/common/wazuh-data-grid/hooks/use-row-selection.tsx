import { useReducer } from 'react';

export const useRowSelection = (results: any) => {
  return useReducer(
    (rowSelection: Set<any>, { action, rowData, onClickSelectRow }: any) => {
      let next = new Set(rowSelection);

      switch (action) {
        case 'add':
          next.add(rowData);
          break;
        case 'delete':
          next = new Set([...next].filter(item => item._id !== rowData._id));
          break;
        case 'clear':
          next.clear();
          break;
        case 'selectAll':
          next = new Set(results?.hits?.hits);
          break;
      }

      onClickSelectRow(next);
      return next;
    },
    new Set()
  );
};
