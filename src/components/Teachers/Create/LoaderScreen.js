import React from 'react';
import Loader from '../../Universal/Loader';
const LoaderScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div className="loader" style={{ marginBottom: '20px' }}></div>
      <div style={{
        fontFamily: "'montserrat', sans-serif",
        fontSize: '20px',
        color: 'lightgrey',
        fontWeight: '600'
      }}>
        Saving...
      </div>
    </div>
  );};

  export default LoaderScreen;