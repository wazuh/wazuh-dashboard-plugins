import { useReducer } from 'react';

export const useRowSelection = (onClickSelectRow: (selection: Set<any>) => void, results: any) => {
  return useReducer(
    (rowSelection: Set<any>, { action, rowData }: any) => {
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
