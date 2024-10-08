import React, { useState } from 'react';

const TeacherAssignmentHome = ({ onFormatSelect }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);

  const formatButtons = [
    { label: 'SAQ', color: '#020CFF', hasAsterisk: true, value: 'ASAQ' },
    { label: 'SAQ', color: '#020CFF', hasAsterisk: false, value: 'SAQ' },
    { label: 'MCQ', color: 'green', hasAsterisk: true, value: 'AMCQ' },
    { label: 'MCQ', color: 'green', hasAsterisk: false, value: 'MCQ' }
  ];

  return (

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {formatButtons.map(format => (
          <button
            key={format.value}
            style={{
              padding: '10px',
              border: selectedFormat === format.value ? `4px solid ${format.color}` : '4px solid #D7D7D7',
              borderRadius: '10px',
              backgroundColor: 'white',
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

export default TeacherAssignmentHome;