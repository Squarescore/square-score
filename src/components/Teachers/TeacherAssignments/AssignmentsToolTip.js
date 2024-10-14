import React, { useState } from 'react';

const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' , 
        fontWeight: '600',}}
         onMouseEnter={() => setShow(true)}
         onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          left: '150%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '15px',
          padding: '15px 10px',
          width: '100px',
          height: '10px',
          backgroundColor: '#f4f4f4',
          color: 'grey',
          borderRadius: '7px',
          fontSize: '14px',
          lineHeight: '10px',
          zIndex: 1000,
        }}>
          <div style={{
            position: 'absolute',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)',
            width: '12px',
            height: '12px',
            fontWeight: '600',
            lineHeight: '20px',
            backgroundColor: '#f4f4f4',
          }} />
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;