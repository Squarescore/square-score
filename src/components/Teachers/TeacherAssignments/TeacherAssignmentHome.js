import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SquareX } from "lucide-react";
import Navbar from '../../Universal/Navbar';
import { GlassContainer } from '../../../styles';

const TeacherAssignmentHome = ({ onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const navigate = useNavigate();
  const { classId } = useParams();

  const formatButtons = [
    { shortLabel: 'MC', longLabel: 'Adaptive Multiple Choice ' , color: '#7D00EA', hasAsterisk: true, value: 'AMCQ' },
    { shortLabel: 'OE', longLabel: 'Open Ended ', color: '#00CCB4', hasAsterisk: false, value: 'OE' },
  ];

  const handleFormatSelect = (format) => {
    if (!classId || !format) {
      console.error('ClassId is empty or no format selected');
      return;
    }

    const timestamp = Date.now();
    const assignmentId = `${classId}+${timestamp}+${format}`;
    let navigationPath = '';

    switch (format) {
      case 'OE':
        navigationPath = `/class/${classId}/createassignment/${assignmentId}`;
        break;
      case 'AOE':
        navigationPath = `/class/${classId}/SAQA/${assignmentId}`;
        break;
      case 'MCQ':
        navigationPath = `/class/${classId}/MCQ/${assignmentId}`;
        break;
      case 'AMCQ':
        navigationPath = `/class/${classId}/MCQA/${assignmentId}`;
        break;
      default:
        console.error('Invalid format selected');
        return;
    }

    navigate(navigationPath, {
      state: {
        assignmentType: format,
        isAdaptive: format === 'AOE' || format === 'AMCQ',
        assignmentId,
        classId,
      },
    });

    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255)', 
        zIndex: 1,
        display: 'flex',
        backdropFilter: 'blur(5px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <Navbar userType="teacher" />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '650px',
          marginTop: '-130px',
          padding: '20px',
          borderRadius: '20px',
          maxHeight: '80vh',
          marginLeft: '100px',
          overflowY: 'auto',
        }}
      >
     
<GlassContainer     variant="clear"
          size={1}
          style={{
          }}
          contentStyle={{padding: '20px'}}>
            
   <h1 style={{fontWeight: '500', fontSize: '1rem', color: 'lightgrey', margin: '0px 20px', marginBottom: '10px'}}>Select Format</h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', // 2 columns
            gap: '15px',
            marginTop: '-0px',
            borderRadius: '8px',
            padding: '1px',
            position: 'relative'
          }}
        >
          
          {/* Vertical Divider */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '0',
            bottom: '0',
            width: '1px',
            backgroundColor: '#ddd',
            transform: 'translateX(-50%)'
          }} />
            <div style={{
            position: 'absolute',
            left: '0',
            top: '50%',
            right: '20px',
            height: '1px',
            backgroundColor: '#eee',
            transform: 'translatey(-50%)'
          }} />
          {formatButtons.map((format, index) => (
            <button
              key={format.value}
              style={{
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: 'white',
                border: 'none',
                color: format.color,
                width: '100%',
                cursor: 'pointer',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: '500',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                transition: 'transform 0.2s ease',
              }}
              onClick={() => handleFormatSelect(format.value)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '8px',
                position: 'relative',
                width: '100%'
              }}>
                <span style={{ 
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  {format.shortLabel}
                </span>
                {format.hasAsterisk && (
                  <span style={{
                    marginLeft: '4px',
                    color: '#FCCA18',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    *
                  </span>
                )}
              </div>
              <span style={{ 
                color: 'grey', 
                fontWeight: '400', 
                fontSize: '14px',
                lineHeight: '1.2'
              }}>
                {format.longLabel}
              </span>
            </button>
          ))}
        </div>
        </GlassContainer>
      </div>
      
    </div>
  );
};

export default TeacherAssignmentHome;