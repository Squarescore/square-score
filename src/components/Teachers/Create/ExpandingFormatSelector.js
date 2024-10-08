import React, { useState, useEffect } from 'react';
import { Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const FormatOption = ({ format, onClick, isVisible, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!format) return null;

  return (
    <div
      style={{
        padding: '5px 10px',
        width: isSelected ? '160px' : '80px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: isSelected ? '40px' : '25px',
        textAlign: isSelected ? 'left' : 'center',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        opacity: isSelected ? '100%' : isHovered ? '100%' : '80%',
        justifyContent: 'center',
        color: format.color,
        backgroundColor: !isSelected && isHovered ? '#f4f4f4' : 'transparent',
        borderRadius: '5px',
        margin: '0px 10px 0px 0px',
        transition: 'all 0.3s ease',
      }}
      onClick={() => onClick(format.value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {format.label}
      {format.hasAsterisk && (
        <span style={{
          marginLeft: '2px',
          color: '#FCCA18',
          fontWeight: 'bold'
        }}>*</span>
      )}
    </div>
  );
};

const CustomExpandingFormatSelector = ({ classId, selectedFormat, onFormatChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [allFormats, setAllFormats] = useState([]);
  const [selectedFormatObject, setSelectedFormatObject] = useState(null);
  const navigate = useNavigate();

  const formatOptions = [
    { label: 'SAQ', color: '#020CFF', hasAsterisk: true, value: 'ASAQ' },
    { label: 'SAQ', color: '#020CFF', hasAsterisk: false, value: 'SAQ' },
    { label: 'MCQ', color: '#2BB514', hasAsterisk: true, value: 'AMCQ' },
    { label: 'MCQ', color: '#2BB514', hasAsterisk: false, value: 'MCQ' }
  ];

  const getDropdownOptions = () => {
    const currentFormat = formatOptions.find(f => f.value === selectedFormat);
    const currentFormatBase = selectedFormat.replace(/^A/, '');
    const alternateCurrentFormat = formatOptions.find(f => 
      f.label === currentFormatBase && f.hasAsterisk !== (selectedFormat.startsWith('A'))
    );
    const otherFormats = formatOptions.filter(f => f.label !== currentFormatBase);

    return { alternateCurrentFormat, currentFormat, otherFormats };
  };

  const handleFormatSelect = (newFormat) => {
    if (newFormat === selectedFormat) return;

    const newAssignmentId = uuidv4();
    const fullNewAssignmentId = `${classId}+${newAssignmentId}+${newFormat}`;
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
  };

  useEffect(() => {
    const { currentFormat, alternateCurrentFormat, otherFormats } = getDropdownOptions();
    const formats = [currentFormat, alternateCurrentFormat, ...otherFormats];
    setAllFormats(formats);

    const selected = formats.find(format => format.value === selectedFormat) || formats[0];
    setSelectedFormatObject(selected);
  }, [selectedFormat]);

  if (!selectedFormatObject) return null;

  return (
    <div style={{
      fontSize: '40px',
      marginTop: '5px',
      marginLeft: '10px',
      marginRight: '10px',
      color: '#2BB514',
      display: 'flex',
      userSelect: 'none',
      alignItems: 'center',
      position: 'relative',
      zIndex: 11,
    }}>
      <div
        style={{
          border: isExpanded ? '4px dashed #f4f4f4' : '4px solid white',
          backgroundColor: 'transparent',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'width 0.3s ease',
          width: isExpanded ? `${allFormats.length * 143}px` : '210px',
          overflow: 'hidden',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <FormatOption
            format={selectedFormatObject}
            onClick={() => {}}
            isVisible={true}
            isSelected={true}
          />
          <Repeat
            style={{
              color: 'grey',
              marginLeft: '-10px',
              transition: 'transform 0.3s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            strokeWidth={2.5}
            size={30}
          />
        </div>
        <div style={{
          display: 'flex',
          position: 'absolute',
          left: '230px',
          width: isExpanded ? '400px' : '0px',
          opacity: isExpanded ? '100%' : '0%',
          transition: 'transform 0.3s ease',
        }}>
          {allFormats.filter(format => format.value !== selectedFormat).map((format) => (
             <FormatOption
             key={format.value}
             format={format}
             onClick={(value) => {
               handleFormatSelect(value);
               setIsExpanded(false);
             }}
             isVisible={isExpanded}
             isSelected={false}
           />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomExpandingFormatSelector;