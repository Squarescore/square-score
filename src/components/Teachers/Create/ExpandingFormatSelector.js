import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { GlassContainer } from '../../../styles';

const FormatOption = ({ format, onClick, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!format) return null;

  return (
    <div
      style={{
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'montserrat', sans-serif",
        cursor: 'pointer',
        backgroundColor: 'transparent',
        color: format.color,
        fontSize: '14px',
        fontWeight: isSelected ? '600' : '400',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        width: '40px',
        transform: isSelected ? 'scale(1.1)' : isHovered ? 'scale(1.05)' : 'scale(1)',
        position: 'relative',
        zIndex: isSelected || isHovered ? 2 : 1
      }}
      onClick={() => onClick(format.value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {format.label}
        {format.hasAsterisk && (
          <span style={{ color: '#FCCA18', fontWeight: 'bold' }}>*</span>
        )}
      </div>
    </div>
  );
};

const CustomDropdownFormatSelector = ({ classId, selectedFormat, onFormatChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [allFormats, setAllFormats] = useState([]);
  const [selectedFormatObject, setSelectedFormatObject] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const formatOptions = [
    { label: 'MC', color: '#7D00EA', hasAsterisk: true, value: 'AMCQ' },
    { label: 'OE', color: '#00CCB4', hasAsterisk: false, value: 'OE' }
  ];

  const handleFormatSelect = (newFormat) => {
    if (newFormat === selectedFormat) return;

    const timestamp = Date.now();
    const fullNewAssignmentId = `${classId}+${timestamp}+${newFormat}`;
    let navigationPath = '';

    switch (newFormat) {
      case 'OE':
        navigationPath = `/class/${classId}/createassignment/${fullNewAssignmentId}`;
        break;
      case 'AOE':
        navigationPath = `/class/${classId}/SAQA/${fullNewAssignmentId}`;
        break;
      case 'MCQ':
        navigationPath = `/class/${classId}/MCQ/${fullNewAssignmentId}`;
        break;
      case 'AMCQ':
        navigationPath = `/class/${classId}/MCQA/${fullNewAssignmentId}`;
        break;
      default:
        console.error('Invalid format selected');
        return;
    }

    onFormatChange(newFormat);
    navigate(navigationPath, {
      state: {
        assignmentType: newFormat,
        isAdaptive: newFormat === 'AOE' || newFormat === 'AMCQ',
        assignmentId: fullNewAssignmentId,
        classId
      }
    });

    setIsDropdownOpen(false);
  };

  useEffect(() => {
    setAllFormats(formatOptions);

    const selected = formatOptions.find(format => format.value === selectedFormat) || formatOptions[0];
    setSelectedFormatObject(selected);
  }, [selectedFormat]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!selectedFormatObject) return null;

  return (
    <div
      style={{
        fontSize: '24px',
        margin: '10px',
        color: '#2BB514',
        position: 'relative',
        display: 'inline-block',
        userSelect: 'none',
      }}
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsDropdownOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '5px 10px',
          border: '1px solid #ddd',
          borderRadius: '50px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          minWidth: '80px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: selectedFormatObject.color, fontWeight: '500',fontFamily: "'montserrat', sans-serif", }}>
            {selectedFormatObject.label}
          </span>
          {selectedFormatObject.hasAsterisk && (
            <span style={{ marginLeft: '5px', color: '#FCCA18', fontWeight: 'bold' }}>*</span>
          )}
        </div>
        <ChevronDown
          style={{
            color: 'grey',
            transition: 'transform 0.3s ease',
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', marginRight: '-5px'
          }}
          strokeWidth={2}
          size={15}
        />
      </button>
      {isDropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '120%',
            left: '-20px',
            zIndex: 1000,
            borderRadius: '8px',
            marginTop: '5px',
            width: '160px',
            maxHeight: '300px',
          }}
        >
          <GlassContainer variant='clear'
          size={0}
                    enableRotation={true}
          contentStyle={{ padding: '5px 10px'}}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '5px',
              width: '100%',
              position: 'relative'
            }}>
              {/* Vertical Divider */}
              <div style={{
                position: 'absolute',
                top: '0',
                bottom: '0',
                left: '50%',
                width: '1px',
                background: '#ededed',
                transform: 'translateX(-50%)',
                zIndex: 1
              }} />
              {allFormats.map((format, index) => (
                <FormatOption
                  key={format.value}
                  format={format}
                  onClick={handleFormatSelect}
                  isSelected={format.value === selectedFormat}
                />
              ))}
            </div>
          </GlassContainer>
        </div>
      )}
    </div>
  );
};

export default CustomDropdownFormatSelector;
