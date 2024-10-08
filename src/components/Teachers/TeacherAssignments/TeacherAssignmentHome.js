import React, { useState } from 'react';

const TeacherAssignmentHome = ({ onFormatSelect }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);

  const formatButtons = [
    
    { shortLabel: 'SAQ', longLabel: 'Adaptive Short Answer', color: '#020CFF', hasAsterisk: true, value: 'ASAQ' },
    
    { shortLabel: 'SAQ', longLabel: 'Short Answer', color: '#020CFF', hasAsterisk: false, value: 'SAQ' },
    { shortLabel: 'MCQ', longLabel: 'Adaptive Multiple Choice', color: 'green', hasAsterisk: true, value: 'AMCQ' },
    { shortLabel: 'MCQ', longLabel: 'Multiple Choice', color: 'green', hasAsterisk: false, value: 'MCQ' },
  ];

  return (

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center', marginLeft: '-110px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
       {formatButtons.map(format => (
          <button
            key={format.value}
            style={{
              padding: '5px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: 'transparent',
              color: format.color,
              height: '40px',
              marginTop: '-5px',
              fontSize: '20px',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: 'bold',
              position: 'relative',
              width: '101%',
              marginLeft: '50px',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              textAlign: 'left'
            }}
            onClick={() => {
              setSelectedFormat(format.value);
              onFormatSelect(format.value);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f4f4f4';
            }}
            onMouseLeave={(e) => {
              
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ width: '80px', marginLeft: '10px' }}>{format.shortLabel}</span>   
            
            {format.hasAsterisk && (
              <span style={{
                position: 'absolute',
                left: '60px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: 'bold',
                fontFamily: "'montserrat', sans-serif",
                color: '#FCCA18',
                fontSize: '24px'
              }}>
                *
              </span>
            )}
            <span style={{ marginLeft: '20px', color: 'grey', fontWeight: '600' }}>{format.longLabel}</span>
         
          </button>
        ))}
      </div>
    </div>
  );
};

export default TeacherAssignmentHome;