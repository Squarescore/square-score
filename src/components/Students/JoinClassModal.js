import React, { useState, useRef, useEffect } from 'react';

const JoinClassModal = ({ onSubmit, onClose, error }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [joinClassError, setJoinClassError] = useState(error || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    setJoinClassError(error);
  }, [error]);

  const handleChange = (index, value) => {
    // Only allow alphanumeric characters
    const sanitizedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (sanitizedValue.length <= 1) {
      const newCode = [...code];
      newCode[index] = sanitizedValue;
      setCode(newCode);
      setJoinClassError(''); // Clear error when user starts typing
      
      if (sanitizedValue !== '' && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        inputRefs.current[index - 1].focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const classCode = code.join('');
    setJoinClassError('');
    
    try {
      if (classCode.length !== 6) {
        throw new Error('Please enter a valid 6-character class code.');
      }

      if (!/^[A-Z0-9]{6}$/.test(classCode)) {
        throw new Error('Class code can only contain letters and numbers.');
      }

      setIsSubmitting(true);
      const success = await onSubmit(classCode);
      if (success) {
        onClose();
      }
    } catch (err) {
      setJoinClassError(err.message);
    } finally {
      setIsSubmitting(false);
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
        <h2 style={{ 
          fontSize: '40px', 
          fontFamily: '"montserrat", sans-serif', 
          marginTop: '-10px', 
          marginBottom: '60px', 
          textAlign: 'left', 
          fontWeight: '600', 
          marginLeft: '-20px' 
        }}>Join Class</h2>
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
                  border: joinClassError ? '1px solid #ff0000' : '1px solid lightgrey',
                  borderRadius: '10px',
                  outline: 'none',
                  backgroundColor: isSubmitting ? '#f4f4f4' : 'white'
                }}
                maxLength={1}
                disabled={isSubmitting}
              />
            ))}
          </div>
          {joinClassError && (
            <p style={{ 
              color: '#ff0000', 
              marginBottom: '10px', 
              textAlign: 'center',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '14px'
            }}>
              {joinClassError}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '-20px' }}>
            <button
              type="submit"
              disabled={isSubmitting || code.some(c => !c)}
              style={{ 
                backgroundColor: isSubmitting ? '#f4f4f4' : '#AEF2A3',
                border: '1px solid #45B434',
                color: isSubmitting ? 'grey' : '#45B434',
                borderRadius: '5px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer', 
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
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ 
                backgroundColor: '#f4f4f4',
                height: '50px',
                border: '1px solid lightgrey',
                color: 'grey',
                borderRadius: '5px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer', 
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