import React from 'react';
import { X, ZoomIn } from 'lucide-react';

const QuestionResultsModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
  
      <div style={{
        height: '100%',
        position: ' absolute', 
        zIndex: '10',
        width:' calc(100% - 200px)',
        backgroundColor:"white",
        border: '1px solid blue',
      }}>
       
        {/* Modal panel */}
        <div style={{
          display: 'inline-block',
          width: '100%',
          maxWidth: '1152px', // 6xl in pixels
          margin: '2rem auto',
          overflow: 'hidden',
          textAlign: 'left',
          transition: 'all 0.3s',
          transform: 'scale(1)',
          backgroundColor: 'white',
          borderRadius: '1rem',
          position: 'relative'
        }}>
          {/* Close button */}
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '1rem',
              padding: '0.5rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              zIndex: 51
            }}
          >
            <X style={{
              height: '1.5rem',
              width: '1.5rem',
              color: '#6B7280'
            }} />
          </button>

          {/* Modal content */}
          <div style={{
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1rem'
          }}>
            {children}
          </div>
        </div>
      </div>

  );
};

export default QuestionResultsModal;