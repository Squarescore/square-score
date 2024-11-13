import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const FormatOption = ({ format, onClick, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!format) return null;

  return (
    <div
      style={{
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',fontFamily: "'montserrat', sans-serif",
        cursor: 'pointer',
        backgroundColor: isSelected ? '#f0f0f0' : isHovered ? '#f4f4f4' : 'white',
        color: format.color,
        fontSize: '14px',
        fontWeight: isSelected ? '700' : '500',
        transition: 'background-color 0.2s ease',
      }}
      onClick={() => onClick(format.value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {format.label}
      {format.hasAsterisk && (
        <span style={{ marginLeft: '5px', color: '#FCCA18', fontWeight: 'bold' }}>*</span>
      )}
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
    { label: 'SAQ', color: '#020CFF', hasAsterisk: true, value: 'ASAQ' },
    { label: 'SAQ', color: '#020CFF', hasAsterisk: false, value: 'SAQ' },
    { label: 'MCQ', color: '#2BB514', hasAsterisk: true, value: 'AMCQ' },
    { label: 'MCQ', color: '#2BB514', hasAsterisk: false, value: 'MCQ' }
  ];

  const handleFormatSelect = (newFormat) => {
    if (newFormat === selectedFormat) return;

    const timestamp = Date.now();
    const fullNewAssignmentId = `${classId}+${timestamp}+${newFormat}`;
    let navigationPath = '';

    switch (newFormat) {
      case 'SAQ':
        navigationPath = `/class/${classId}/createassignment/${fullNewAssignmentId}`;
        break;
      case 'ASAQ':
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
        isAdaptive: newFormat === 'ASAQ' || newFormat === 'AMCQ',
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
          border: '1px solid #ccc',
          borderRadius: '5px',
          backgroundColor: 'white',
          cursor: 'pointer',
          minWidth: '80px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: selectedFormatObject.color, fontWeight: '600',fontFamily: "'montserrat', sans-serif", }}>
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
            top: '100%',
            left: '0',
            zIndex: 1000,
            backgroundColor: 'white',
            borderRadius: '8px',
            marginTop: '5px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {allFormats.map((format) => (
            <FormatOption
              key={format.value}
              format={format}
              onClick={handleFormatSelect}
              isSelected={format.value === selectedFormat}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdownFormatSelector;
