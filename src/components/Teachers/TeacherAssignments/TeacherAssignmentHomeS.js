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
    <div style={{ marginTop: '20px', width: '100%', maxWidth: '1000px' }}>
      <h1 style={{
        fontSize: '30px',
        fontFamily: "'montserrat', sans-serif",
        color: 'black',
        marginBottom: '20px'
      }}>
        Select Format:
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
              fontFamily: "'montserrat', sans-serif",
              fontWeight: 'bold',
              position: 'relative',
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              textAlign: 'left'
            }}
            onClick={() => {
              setSelectedFormat(format.value);
              onFormatSelect(format.value);
            }}
          >
            <span style={{ width: '80px' }}>{format.shortLabel}</span>
            <span style={{ marginLeft: '20px', fontWeight: 'normal' }}>{format.longLabel}</span>
            {format.hasAsterisk && (
              <span style={{
                position: 'absolute',
                right: '10px',
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
          </button>
        ))}
      </div>
    </div>
  );
};
export default TeacherAssignmentHomeS;