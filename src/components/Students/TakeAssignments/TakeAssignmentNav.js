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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 20px',
        backgroundColor: 'white', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' ,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 5,
      }}
    >
      {/* Left Side */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Save & Exit Button */}
        <button
          onClick={saveAndExitEnabled ? onSaveAndExit : null}
          style={{
            color: saveAndExitEnabled ? 'black' : 'lightgrey',
            cursor: saveAndExitEnabled ? 'pointer' : 'not-allowed',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            
    fontFamily: "'montserrat', sans-serif",
            fontWeight: 'bold',
            marginRight: '20px',
          }}
        >
          Save & Exit
        </button>

        {/* Timer */}
        {timer > 0 && (
          <div style={{ position: 'absolute', left:  '250px',  }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'grey', 
    fontFamily: "'montserrat', sans-serif", }}>
              {showTimer ? formatTime(secondsLeft) : ''}
            </span>
            <button
              onClick={toggleTimer}
              style={{
                position: 'absolute',
                top: 0,
                left: '-35px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {showTimer ? <Eye size={20} color="#949494" /> : <EyeOff size={20} color="#949494" style={{position: 'absolute',
                top: '-9px',
                left: '6px',}} />}
            </button>
          </div>
        )}

        {/* Lockdown Icon */}
        {lockdownEnabled !== undefined && (
          <div style={{ position: 'absolute', left:  '150px', }}>
            {lockdownEnabled ? <Lock size={20} /> : <LockOpen size={20} />}
          </div>
        )}
      </div>

      {/* Center - Assignment Name */}
      <div style={{ fontSize: '20px', fontWeight: 'bold', position: 'absolute', left:  '50%', transform: 'translate(-50%)' }}>{assignmentName}</div>

      {/* Right Side - Submit Button */}
      <button
        onClick={onSubmit}
        style={{
          margin: '-5px',
          border: '3px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
          padding: '10px 30px',
          color: 'grey',
          fontSize: '16px',
          fontWeight: '600',
          
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
    </div>
  );
};

export default TakeAssignmentNav;
