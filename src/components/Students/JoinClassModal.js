import React, { useState, useRef, useEffect } from 'react';

const JoinClassModal = ({ onSubmit, onClose }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [joinClassError, setJoinClassError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value !== '' && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && index > 0 && code[index] === '') {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const classCode = code.join('');
    if (classCode.length === 6) {
      onSubmit(classCode);
    } else {
      setJoinClassError('Please enter a 6-digit class code.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100
    }}>
      <div style={{
        padding: '50px',
        borderRadius: '15px',
        width: '400px',
        background: 'white',
        border: '1px solid lightgrey'
      }}>
        <h2 style={{ fontSize: '40px', fontFamily: '"montserrat", sans-serif', marginTop: '-10px', marginBottom: '60px', textAlign: 'left', fontWeight: '600', marginLeft: '-20px' }}>Join Class</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  width: '60px',
                  height: '60px',
                  fontSize: '40px',
                  textAlign: 'center',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: 'bold',
                  border: '1px solid lightgrey',
                  borderRadius: '10px',
                  outline: 'none',
                }}
                maxLength={1}
              />
            ))}
          </div>
          {joinClassError && <p style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{joinClassError}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '-20px' }}>
            <button
              type="submit"
              style={{ 
                backgroundColor: '#AEF2A3',
                border: '1px solid #45B434',
                color: '#45B434',
                borderRadius: '5px',
                cursor: 'pointer', 
                marginTop: '30px',
                height: "40px",
                fontFamily: "'montserrat', sans-serif",
                fontWeight: '600',
                fontSize: '16px',
                width: '60%',
                marginLeft: '-20px',
                marginRight: '10px'
              }}
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ 
                backgroundColor: '#f4f4f4',
                height: '50px',
                border: '1px solid lightgrey',
                color: 'grey',
                borderRadius: '5px',
                cursor: 'pointer', 
                marginTop: '30px',
                height: "40px",
                fontFamily: "'montserrat', sans-serif",
                fontWeight: '600',
                fontSize: '16px',
                width: '45%',
                marginRight: '-20px'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinClassModal;