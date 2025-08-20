import React from 'react';
import { Pencil } from 'lucide-react';

const DateEditor = ({ date, label, onTabChange }) => {
  const formatDate = (date) => {
    if (!date) return 'Not set';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginLeft: 'auto',
      zIndex: '0'
    }}>
      <div style={{
        fontSize: '12px',
        color: '#666'
      }}>{label}:</div>
      <div style={{
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {formatDate(date)}
      </div>
      <button
        onClick={() => onTabChange('settings')}
        style={{
          padding: '4px',
          borderRadius: '4px',
          cursor: 'pointer',
          border: 'none',
          background: 'none',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Pencil size={14} color="#666" />
      </button>
    </div>
  );
};

export default DateEditor;