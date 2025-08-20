import React, { useState, useEffect, useRef } from 'react';
import { GlassContainer } from '../../styles';

const JoinClassTab = ({ onSubmit, error }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setLocalError('Please enter a complete class code');
      return;
    }

    setIsSubmitting(true);
    setLocalError('');
    try {
      await onSubmit(code);
      // Reset form after successful submission
      setCode('');
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      marginTop: '140px',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginBottom: '40px',
    }}>
      <GlassContainer
        variant="clear"
        size={0}
        contentStyle={{
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontFamily: "'montserrat', sans-serif", 
          fontWeight: '400',
          color: 'black',
          margin: 0
        }}>
          Class Code
        </h3>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.slice(0, 6))}
          maxLength={6}
          style={{
            fontFamily: "'montserrat', sans-serif",
            fontSize: '1rem',
            background: "white",
            letterSpacing: '4px', 
            fontWeight: '600',
            borderRadius: '100px',
            border: '1px solid #ddd',
            width: '180px',
            padding: '10px 20px',
            outline: 'none',
          }}
        />

        {(localError || error) && (
          <p style={{
            color: '#ff4444',
            fontSize: '14px',
            fontWeight: '500',
            margin: 0,
            fontFamily: "'montserrat', sans-serif",
          }}>
            {localError || error}
          </p>
        )}

        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '10px'
        }}>
          <GlassContainer
            variant={code.length === 6 ? "green" : "clear"}
            size={0}
            enableRotation={true}
            onClick={code.length === 6 ? handleSubmit : undefined}
            style={{
              flex: 1,
              cursor: code.length === 6 ? 'pointer' : 'not-allowed',
              opacity: code.length === 6 ? 1 : 0.7,
            }}
            contentStyle={{
              padding: '10px',
              width: '80px',
              height: '15px',
              textAlign: 'center',
              fontSize: '1rem',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: '500'
            }}
          >
            <p style={{
              fontSize: '1rem', 
              color: code.length === 6 ? '#29c60f' : '#999',
              textAlign: 'center', 
              width: '80px', 
              marginTop: '-3px',
              margin: 0
            }}>
              {isSubmitting ? 'Joining...' : 'Join'}
            </p>
          </GlassContainer>

          <button
            onClick={() => window.history.back()}
            style={{
              flex: 1,
              padding: '5px 15px',
              width: '100px', 
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: '500',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '1rem',
              color: 'grey',
            }}
          >
            Cancel
          </button>
        </div>
      </GlassContainer>
    </div>
  );
};

export default JoinClassTab;