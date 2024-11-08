// ToggleSwitch.jsx (Enhanced for Accessibility)
import React from 'react';
import PropTypes from 'prop-types';

const ToggleSwitch = ({ label, value, onChange, onLabel = 'On', offLabel = 'Off' }) => {
  const handleKeyPress = (event, newValue) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onChange(newValue);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
      {label && (
        <label style={{
          fontSize: '25px',
          color: 'black',
          marginRight: '38px',
          fontFamily: "'montserrat', sans-serif",
          fontWeight: '600',
        }}>
          {label}
        </label>
      )}
      <div
        role="switch"
        aria-checked={value}
        tabIndex={0}
        onKeyPress={(e) => {
          if (value) {
            handleKeyPress(e, false);
          } else {
            handleKeyPress(e, true);
          }
        }}
        style={{
          display: 'flex',
          borderRadius: '8px',
          justifyContent: 'space-around',
          width: '120px',
          alignItems: 'center',
          background: '#f4f4f4',
          height: '27px',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            height: '20px',
            marginLeft: '4px',
            lineHeight: '20px',
            fontSize: '12px',
            width: '60px',
            textAlign: 'center',
            transition: '.3s',
            borderRadius: '5px',
            fontWeight: value ? '500' : '600',
            backgroundColor: value ? '#f4f4f4' : 'white',
            color: value ? 'grey' : 'black',
            boxShadow: !value ? '1px 1px 5px 1px rgba(0,0,155,0.07)' : 'none',
          }}
          onClick={() => onChange(false)}
        >
          {offLabel}
        </div>
        <div
          style={{
            height: '20px',
            lineHeight: '20px',
            fontSize: '12px',
            marginLeft: 'auto',
            marginRight: '4px',
            width: '60px',
            textAlign: 'center',
            transition: '.3s',
            borderRadius: '5px',
            backgroundColor: value ? 'white' : 'transparent',
            fontWeight: value ? '600' : '500',
            color: value ? 'black' : 'grey',
            boxShadow: value ? '1px 1px 5px 1px rgba(0,0,155,0.07)' : 'none',
          }}
          onClick={() => onChange(true)}
        >
          {onLabel}
        </div>
      </div>
    </div>
  );
};

ToggleSwitch.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onLabel: PropTypes.string,
  offLabel: PropTypes.string,
};

ToggleSwitch.defaultProps = {
  onLabel: 'On',
  offLabel: 'Off',
};

export default ToggleSwitch;
