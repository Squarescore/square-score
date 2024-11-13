import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SquareX } from "lucide-react";
import Navbar from '../../Universal/Navbar';

const TeacherAssignmentHome = ({ onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const navigate = useNavigate();
  const { classId } = useParams();

  const formatButtons = [
    { shortLabel: 'SAQ', longLabel: 'Adaptive Short Answer Questions', color: '#020CFF', hasAsterisk: true, value: 'ASAQ' },
    { shortLabel: 'SAQ', longLabel: 'Short Answer Questions', color: '#020CFF', hasAsterisk: false, value: 'SAQ' },
    { shortLabel: 'MCQ', longLabel: 'Adaptive Multiple Choice Questions' , color: 'green', hasAsterisk: true, value: 'AMCQ' },
    { shortLabel: 'MCQ', longLabel: 'Multiple Choice Questions', color: 'green', hasAsterisk: false, value: 'MCQ' },
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
      case 'SAQ':
        navigationPath = `/class/${classId}/createassignment/${assignmentId}`;
        break;
      case 'ASAQ':
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
        isAdaptive: format === 'ASAQ' || format === 'AMCQ',
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
        zIndex: 10,
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
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '20px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >

        <h1 style={{fontWeight: '600'}}>Select Format</h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', // 2 columns
            gap: '15px',
            marginTop: '40px',
          }}
        >
          {formatButtons.map(format => (
            <button
              key={format.value}
              style={{
                padding: '16px 20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: format.color,
                width: '100%',
                cursor: 'pointer',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: '600',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
              onClick={() => handleFormatSelect(format.value)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f8f8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
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
                color: 'lightgrey', 
                fontWeight: '600', 
                fontSize: '14px',
                lineHeight: '1.2'
              }}>
                {format.longLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentHome;