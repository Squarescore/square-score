import React from 'react';
import { GlassContainer } from '../../styles';

const ConfirmationModal = ({ 
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'red',
  confirmColor,
  confirmStyle = {},
  isLoading = false,
  showHoldToConfirm = false,
  holdProgress = 0,
  onHoldStart,
  onHoldEnd
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(5px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <GlassContainer
        variant="clear"
        size={2}
        style={{
          width: '400px',
          backgroundColor: 'white'
        }}
        contentStyle={{
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          userSelect: 'none'
        }}
      >
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '400',
          color: 'black',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          {title}
        </h2>
        <p style={{
          margin: '10px 0px',
          fontSize: '1rem',
          width: '100%',
          color: 'grey',
          lineHeight: '1.3',
          fontFamily: "'Montserrat', sans-serif"
        }}>
          {message}
        </p>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '50px',
              padding: '5px 15px',
              color: 'grey',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '.9rem',
              fontWeight: '400',
              width: '100px',
              fontFamily: "'Montserrat', sans-serif",
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {cancelText}
          </button>
          <GlassContainer
            onClick={showHoldToConfirm ? undefined : onConfirm}
            onMouseDown={showHoldToConfirm && onHoldStart ? (e) => {
              e.preventDefault();
              onHoldStart();
            } : undefined}
            onMouseUp={showHoldToConfirm && onHoldEnd ? (e) => {
              e.preventDefault();
              onHoldEnd();
            } : undefined}
            onMouseLeave={showHoldToConfirm && onHoldEnd ? (e) => {
              e.preventDefault();
              onHoldEnd();
            } : undefined}
            onTouchStart={showHoldToConfirm && onHoldStart ? (e) => {
              e.preventDefault();
              onHoldStart();
            } : undefined}
            onTouchEnd={showHoldToConfirm && onHoldEnd ? (e) => {
              e.preventDefault();
              onHoldEnd();
            } : undefined}
            onTouchCancel={showHoldToConfirm && onHoldEnd ? (e) => {
              e.preventDefault();
              onHoldEnd();
            } : undefined}
            variant={confirmVariant}
            size={0}
            style={{
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              KhtmlUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              touchAction: 'none',
              ...confirmStyle
            }}
            contentStyle={{
              padding: '5px 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{
              color: confirmColor || (confirmVariant === 'red' ? '#ef4444' : 'grey'),
              fontSize: '.9rem',
              fontWeight: '400',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              {isLoading ? 'Processing...' : (showHoldToConfirm ? `${confirmText} (Hold)` : confirmText)}
            </span>
            {showHoldToConfirm && holdProgress > 0 && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${holdProgress}%`,
                backgroundColor: confirmColor ? `${confirmColor}10` : 'rgba(239, 68, 68, 0.1)',
                transition: 'width 0.01s linear',
                zIndex: 1
              }} />
            )}
          </GlassContainer>
        </div>
      </GlassContainer>
    </div>
  );
};

export default ConfirmationModal;