import { useLocation } from 'react-router-dom';

export const getAppUrl = () => useLocation().pathname.split('/')[1];
