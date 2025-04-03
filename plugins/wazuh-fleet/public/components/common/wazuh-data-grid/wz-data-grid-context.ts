import React, { createContext } from 'react';

export const WzDataGridContext = createContext();

export const WazuhDataGridContextProvider = WzDataGridContext.Provider;
export const useWzDataGridContext = () => React.useContext(WzDataGridContext);
