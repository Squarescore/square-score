// ActionButton.js
import React, { useState, useEffect, useRef } from 'react';
import { PencilRuler, SendHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

const ActionButton = ({
  onSaveDraft,
  onPublish,
  isPublishDisabled,
  styles = {},
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(
    isPublishDisabled ? 'Save Draft' : 'Publish'
  );
  const dropdownRef = useRef(null);

  // Handle clicks outside the dropdown to close it
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle action selection from dropdown
  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setIsDropdownOpen(false);
  };

  // Execute the selected action
  const handleButtonClick = () => {
    if (selectedAction === 'Save Draft') {
      onSaveDraft();
    } else if (selectedAction === 'Publish' && !isPublishDisabled) {
      onPublish();
    }
  };

  // Dynamic styles based on props and state
  const containerStyle = {
    display: 'inline-flex',
    position: 'relative',
    ...styles.container,
  };

  const dropdownButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '50px',
    height: '50px',
    backgroundColor: styles.dropdownBgColor || '#f0f0f0',
    border: `3px solid ${styles.borderColor || '#d1d1d1'}`, // Consistent border color
    borderRight: 'none',
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  };

  const actionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    height: '50px',
    backgroundColor: styles.actionBgColor || '#ffffff',
    border: `3px solid ${styles.borderColor || '#d1d1d1'}`, // Consistent border color
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
    cursor:
      selectedAction === 'Publish' && isPublishDisabled
        ? 'not-allowed'
        : 'pointer',
    opacity:
      selectedAction === 'Publish' && isPublishDisabled ? 0.6 : 1,
    transition: 'background-color 0.3s, opacity 0.3s, color 0.3s',
    color:
      selectedAction === 'Publish' && !isPublishDisabled
        ? '#00D409' // Green text when Publish is active and enabled
        : styles.color || '#000000',
    // Remove dynamic border color change
    // borderColor remains consistent
  };

  const dropdownMenuStyle = {
    position: 'absolute',
    top: '60px',
    left: '0',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d1d1',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 1000,
    width: '150px',
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  return (
    <div style={containerStyle} ref={dropdownRef}>
      {/* Dropdown Selector (Left Part) */}
      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        style={dropdownButtonStyle}
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
      >
        {isDropdownOpen ? (
          <ChevronUp size={20} />
        ) : (
          <ChevronDown size={20} />
        )}
      </button>

      {/* Action Button (Right Part) */}
      <button
        onClick={handleButtonClick}
        disabled={selectedAction === 'Publish' && isPublishDisabled}
        style={actionButtonStyle}
      >
        {selectedAction === 'Save Draft' ? (
          <>
            <PencilRuler size={20} style={{ marginRight: '8px' }} />
            <span>Save Draft</span>
          </>
        ) : (
          <>
            <span>Publish</span>
            <SendHorizontal size={20} style={{ marginLeft: '8px' }} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div style={dropdownMenuStyle}>
          <button
            onClick={() => handleActionSelect('Save Draft')}
            style={{
              ...dropdownItemStyle,
              backgroundColor:
                selectedAction === 'Save Draft' ? '#f5f5f5' : '#ffffff',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#f5f5f5')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                selectedAction === 'Save Draft' ? '#f5f5f5' : '#ffffff')
            }
          >
            <PencilRuler size={16} style={{ marginRight: '8px' }} />
            Save Draft
          </button>
          <button
            onClick={() => handleActionSelect('Publish')}
            style={{
              ...dropdownItemStyle,
              backgroundColor:
                selectedAction === 'Publish' ? '#f5f5f5' : '#ffffff',
              cursor: isPublishDisabled ? 'not-allowed' : 'pointer',
              opacity: isPublishDisabled ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isPublishDisabled) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                selectedAction === 'Publish' ? '#f5f5f5' : '#ffffff')
            }
            disabled={isPublishDisabled}
          >
            <SendHorizontal size={16} style={{ marginRight: '8px' }} />
            Publish
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionButton;
