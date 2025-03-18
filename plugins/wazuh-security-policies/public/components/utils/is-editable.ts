import { useLocation } from 'react-router-dom';

export const isEditable = () =>
  useLocation().pathname.includes('edit') ||
  useLocation().pathname.includes('create');
