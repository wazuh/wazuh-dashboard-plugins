import React from 'react';

export const LogoMicrosoftGraphAPI = ({
  className = '',
}: {
  className?: string;
}) => (
  <svg
    version='1.1'
    xmlns='http://www.w3.org/2000/svg'
    width='32'
    height='32'
    viewBox='0 0 48 48'
    className={`euiIcon ${className}`}
  >
    <g
      fill='none'
      stroke='currentColor'
      strokeWidth='2.2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M34.9,3.2H13.1c-0.7,0-1.4,0.4-1.8,1L0.5,23c-0.4,0.6-0.4,1.4,0,2.1l10.9,18.7c0.4,0.6,1.1,1,1.8,1h21.7c0.7,0,1.4-0.4,1.8-1L47.5,25c0.4-0.6,0.4-1.4,0-2.1L36.7,4.3C36.3,3.6,35.6,3.2,34.9,3.2z' />
      <polyline points='11.3,3.1 15.6,11.1 35.4,3.1' />
      <polyline points='11.3,3.1 15.6,11.1 0.2,23.3' />
      <polyline points='0.2,24 15.6,11.1 16.5,37.1' />
      <polyline points='0.2,24 16.5,37.1 11.5,44.8' />
      <polyline points='11.5,44.8 16.5,37.1 36.2,45.2' />
      <polyline points='16.5,37.1 36.7,24 36.2,45.2' />
      <polyline points='16.5,37.1 15.6,11.1 36.7,24' />
      <polyline points='15.6,11.1 36.2,2.8 36.7,24' />
      <line x1='36.7' y1='24' x2='48.1' y2='24' />
    </g>
  </svg>
);
