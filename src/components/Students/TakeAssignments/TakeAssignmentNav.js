// TakeAssignmentNav.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LockOpen, Eye, EyeOff } from 'lucide-react';

const TakeAssignmentNav = ({
  saveAndExitEnabled,
  onSaveAndExit,
  timer,
  showTimer,
  toggleTimer,
  assignmentName,
  onSubmit,
  lockdownEnabled,
  secondsLeft,
}) => {
  const navigate = useNavigate();

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '200px',
        height: '100%',

        backgroundColor: '#fcfcfc', borderRight: '1px solid lightgrey',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 15,
      }}
    >

<button
        onClick={onSubmit}
        style={{
          marginTop: '30px',
          border: '1px solid lightgrey',
          width: '170px',
          marginLeft: '15px',
                borderRadius: '5px',
                backgroundColor: 'white',
          padding: '10px 30px',
          color: '#2BB514',
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'left',
    fontFamily: "'montserrat', sans-serif",
          cursor: 'pointer',
        }}

        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}                      
      >
        Submit
      </button>

      {/* Left Side */}
        {/* Save & Exit Button */}
        <button
          onClick={saveAndExitEnabled ? onSaveAndExit : null}
          style={{
            color: saveAndExitEnabled ? 'grey' : 'lightgrey',
            cursor: saveAndExitEnabled ? 'pointer' : 'not-allowed',
            
          textAlign: 'left',
          marginLeft: '15px',
            fontSize: '16px',
            padding: '10px 30px',
            backgroundColor: 'white',
          border: '1px solid lightgrey',
          width: '170px',
            marginTop: '20px',
            borderRadius: '5px', 
    fontFamily: "'montserrat', sans-serif",
            
          fontWeight: '600',
            marginRight: '20px',
          }}
        >
          Save & Exit
        </button>

        {/* Timer */}
        {timer > 0 && (
          <div style={{ marginLeft: '50px', position: 'relative', marginTop: '30px', height: "30px",}}>
            <span style={{ fontSize: '20px', fontWeight: '600', color: 'grey', 
    fontFamily: "'montserrat', sans-serif", }}>
              {showTimer ? formatTime(secondsLeft) : ''}
            </span>
            <button
              onClick={toggleTimer}
              style={{
                position: 'absolute',
                top: 0,
                left: '-45px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {showTimer ? <Eye size={25} color="#949494" style={{position: 'absolute',
                top: '0px',
                left: '10px',
                }}
              /> : <EyeOff size={25} color="#949494" style={{position: 'absolute',
                top: '0px',
                left: '10px',}} />}
            </button>
          </div>
        )}

        {/* Lockdown Icon */}
      <div >
            {lockdownEnabled ? <div style={{ marginLeft:  '15px', display: 'flex',  marginTop: '30px', color: 'grey' }}> <Lock size={20} style={{marginTop: '10px'}}/><h1 style={{fontSize: '16px', marginLeft: '10px', fontWeight: '600' }}>Lockdown</h1> </div>: 
          
          <div style={{ marginLeft:  '15px', display: 'flex',  marginTop: '30px', color: 'grey' }}> <LockOpen size={20} style={{marginTop: '10px'}}/><h1 style={{fontSize: '16px', marginLeft: '10px', fontWeight: '600' }}>Disabled</h1> </div>}
          </div>



      {/* Center - Assignment Name */}

      {/* Right Side - Submit Button */}
      
    </div>
  );
};

export default TakeAssignmentNav;
