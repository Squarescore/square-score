import React from 'react';

const AnimationAll = () => {
  const containerStyle = {
    position: 'relative',
    width: '92px',
    height: '62px',
  };

  const centerSquareStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '26px',
    height: '26px',
    border: '7px solid black',
    backgroundColor: '#fff',
    borderRadius: '10px',
    zIndex: 1,
  };

  const cornerSquareStyle = (position, colorIndex) => ({
    position: 'absolute',
    width: '16px',
    height: '16px',
    border: '4px solid lightgrey',
    borderRadius: '6px',
    backgroundColor: '#f4f4f4',
    ...position,
    animation: `moveColors 1.4s infinite ${-colorIndex * .6}s`,
  });

  const colors = [
    { bg: '#C7CFFF', border: '#020CFF' },
    { bg: '#F5B6FF', border: '#E441FF' },
    { bg: '#FFEAAF', border: '#FFAE00' },
    { bg: '#AEF2A3', border: '#2BB514' },
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      margin: 0,
      backgroundColor: '#ffffff',
      overflow: 'hidden',
    }}>
      <div style={containerStyle}>
        <div style={centerSquareStyle} />
        <div style={cornerSquareStyle({ top: 0, right: 0, transform: 'rotate(60deg)' }, 0)} />
        <div style={cornerSquareStyle({ bottom: 0, right: 0, transform: 'rotate(120deg)' }, 1)} />
        <div style={cornerSquareStyle({ bottom: 0, left: 0, transform: 'rotate(240deg)' }, 2)} />
        <div style={cornerSquareStyle({ top: 0, left: 0, transform: 'rotate(300deg)' }, 3)} />
      </div>
      <style jsx>{`
           @keyframes moveColors {
          0%, 100% { 
            background-color: ${colors[0].bg}; 
            border-color: ${colors[0].border};
          }
          25% { 
            background-color: ${colors[1].bg}; 
            border-color: ${colors[1].border};
          }
          50% { 
            background-color: ${colors[2].bg}; 
            border-color: ${colors[2].border};
          }
          75% { 
            background-color: ${colors[3].bg}; 
            border-color: ${colors[3].border};
          }
        }
      `}</style>
    </div>
  );
};

export default AnimationAll;