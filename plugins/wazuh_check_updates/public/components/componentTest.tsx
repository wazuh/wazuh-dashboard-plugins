import React from 'react';

function ColorCircle({ color }: { color: string }) {
  return (
    <div
      style={{
        backgroundColor: color,
        width: '25px',
        height: '25px',
        borderRadius: '50%',
        margin: 'auto',
      }}
    ></div>
  );
}

export default ColorCircle;
