import React from 'react';

const DevToolsColumnSeparator = () => {
  return (
    <div
      className='wz-dev-column-separator'
      role='separator'
      aria-orientation='vertical'
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 16 16'
        className='euiIcon euiIcon--medium euiIcon-isLoaded'
        focusable='false'
        role='img'
        aria-hidden='true'
      >
        <path
          fillRule='evenodd'
          d='M6 2.5c0-.276.232-.5.5-.5.276 0 .5.229.5.5v11c0 .276-.232.5-.5.5a.503.503 0 0 1-.5-.5v-11Zm3 0c0-.276.232-.5.5-.5.276 0 .5.229.5.5v11c0 .276-.232.5-.5.5a.503.503 0 0 1-.5-.5v-11Z'
        ></path>
      </svg>
    </div>
  );
};

export default DevToolsColumnSeparator;
