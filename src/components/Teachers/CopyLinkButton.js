import React, { useState } from 'react';
import { Link, Check } from 'lucide-react';

const CopyLinkButton = ({ classCode, period, classChoice, color }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCopy = async () => {
    // Create the signup URL with class info encoded
    const baseUrl = 'https://amoeba-education.web.app/signup';
    
    // Encode period and class choice
    const encodedPeriod = encodeURIComponent(`Period ${period}`);
    const encodedClassChoice = encodeURIComponent(classChoice);
    
    const signupUrl = `${baseUrl}/${classCode}+${encodedPeriod}+${encodedClassChoice}`;

    try {
      await navigator.clipboard.writeText(signupUrl);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <button 
      onClick={handleCopy}
      style={{ 
        background: 'transparent', 
        border: 'none', 
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {showSuccess ? (
        <Check size={20} strokeWidth={2.5} color={color} />
      ) : (
        <Link size={20} strokeWidth={2.5} color={color} />
      )}
      {showSuccess && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}>
          Link copied!
        </div>
      )}
    </button>
  );
};

export default CopyLinkButton;