import React, { useState, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';

const SuccessToast = ({ message = "Date updated successfully", duration = 300000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const toastStyles = {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#22C55E', // green-500
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    animation: 'fadeIn 0.3s ease-in-out',
    zIndex: 50,
    fontFamily: "'Montserrat', sans-serif"
  };

  const iconStyles = {
    width: '20px',
    height: '20px'
  };

  const textStyles = {
    fontWeight: '500',
    margin: 0
  };

  // Add the animation keyframes to the document
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div style={toastStyles}>
      <CheckSquare style={iconStyles} />
      <p style={textStyles}>{message}</p>
    </div>
  );
};

export default SuccessToast;