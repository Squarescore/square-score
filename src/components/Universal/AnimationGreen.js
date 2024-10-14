import React from 'react';

const AnimationGreen = () => {
  const containerStyle = {
    position: 'relative',
    width: '100px',
    height: '70px',
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

  const cornerSquareStyle = (position) => ({
    position: 'absolute',
    width: '16px',
    height: '16px',
    border: '6px solid lightgrey',
    borderRadius: '6px',
    backgroundColor: '#f4f4f4',
    ...position,
    animation: `moveGreenBackground 1.6s infinite ${position.animationDelay || '0s'}`,
  });

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
        <div style={cornerSquareStyle({ top: 0, right: 0, transform: 'rotate(60deg)' })} />
        <div style={cornerSquareStyle({ bottom: 0, right: 0, transform: 'rotate(120deg)', animationDelay: '.4s' })} />
        <div style={cornerSquareStyle({ bottom: 0, left: 0, transform: 'rotate(240deg)', animationDelay: '.8s' })} />
        <div style={cornerSquareStyle({ top: 0, left: 0, transform: 'rotate(300deg)', animationDelay: '1.2s' })} />
      </div>
      <style jsx>{`
        @keyframes moveGreenBackground {
          0%, 100% { 
            background-color: #AEF2A3; 
            border-color: #2BB514;
          }
          24%, 74% { 
            background-color: #f4f4f4; 
            border-color: grey;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimationGreen;