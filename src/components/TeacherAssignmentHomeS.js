import React, { useState } from 'react';

const TeacherAssignmentHomeS = ({ onFormatSelect }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);

  const formatButtons = [
    { label: 'SAQ', color: '#020CFF', hasAsterisk: true, value: 'ASAQ' },
    { label: 'SAQ', color: '#020CFF', hasAsterisk: false, value: 'SAQ' },
    { label: 'MCQ', color: 'green', hasAsterisk: true, value: 'AMCQ' },
    { label: 'MCQ', color: 'green', hasAsterisk: false, value: 'MCQ' }
  ];

  return (

      <div style={{ display: 'flex', marginTop: '20px', flexWrap: 'wrap',  width: '1000px' , gap: '100px', }}>
        <h1 style={{fontSize: '30px', 
              fontFamily: "'Rajdhani', sans-serif", color: 'black', marginTop: '5px'}}> Select Format:</h1>
        {formatButtons.map(format => (
          <button
            key={format.value}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor: 'transparent',
              color: format.color,
              height: '50px',
              fontSize: '20px',
              cursor: 'pointer',
              fontFamily: "'Radio Canada', sans-serif",
              fontWeight: 'bold',
              position: 'relative',
              width: '80px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={() => {
              setSelectedFormat(format.value);
              onFormatSelect(format.value);
            }}
          >
            {format.label}
            {format.hasAsterisk && (
              <span style={{
                position: 'absolute',
                right: '3px',
                top: '-3px',
                fontWeight: 'bold',
                fontFamily: "'Radio Canada', sans-serif",
                color: '#FCCA18',
                fontSize: '24px'
              }}>
                *
              </span>
            )}
          </button>
        ))}
      </div>
  
  );
};

export default TeacherAssignmentHomeS;