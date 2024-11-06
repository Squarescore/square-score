// src/Teachers/TeacherAssignmentHome.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SquareX } from "lucide-react";

const TeacherAssignmentHome = ({ onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const navigate = useNavigate();
  const { classId } = useParams();

  const formatButtons = [
    { shortLabel: 'SAQ', longLabel: 'Adaptive Short Answer', color: '#020CFF', hasAsterisk: true, value: 'ASAQ' },
    { shortLabel: 'SAQ', longLabel: 'Short Answer', color: '#020CFF', hasAsterisk: false, value: 'SAQ' },
    { shortLabel: 'MCQ', longLabel: 'Adaptive Multiple Choice', color: 'green', hasAsterisk: true, value: 'AMCQ' },
    { shortLabel: 'MCQ', longLabel: 'Multiple Choice', color: 'green', hasAsterisk: false, value: 'MCQ' },
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

    // Close the modal after selection
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, // Changed from '400px' to 0
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        zIndex: 100, // Ensure it's above other elements
        display: 'flex',
        backdropFilter: 'blur(5px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose} // Close on clicking outside
    >
      <div
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        style={{
          position: 'relative',
          width: '400px', // Adjusted width
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '20px',
          boxShadow: '0 4px 8px rgba(0,0,155,0.1)',
          maxHeight: '80vh', // Ensure it doesn't exceed viewport height
          overflowY: 'auto', // Scroll if content overflows
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '30px',
            width: '30px',
            height: '30px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <SquareX size={30} color="#a3a3a3" strokeWidth={3} />
        </button>

        {/* Modal Header */}
        <h2
          style={{
            fontSize: '24px',
            padding: '10px 0',
            marginBottom: '20px',
            fontFamily: "'Montserrat', sans-serif",
            textAlign: 'center',
            color: 'grey',
            borderRadius: '20px 20px 0px 0px',
            background: '#f4f4f4',
            margin: '-20px',
            border: '10px solid lightgrey',
          }}
        >
          Select Format
        </h2>

        {/* Format Selection Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '40px',
            alignItems: 'center',
          }}
        >
          {formatButtons.map(format => (
            <button
              key={format.value}
              style={{
                padding: '12px 20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: format.color,
                width: '100%',
                fontSize: '18px',
                cursor: 'pointer',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: '600',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
              onClick={() => handleFormatSelect(format.value)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FBFBFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <span style={{ width: '80px', marginLeft: '-10px' }}>{format.shortLabel}</span>
              {format.hasAsterisk && (
                <span style={{
                  position: 'absolute',
                  left: '75px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 'bold',
                  color: '#FCCA18',
                  fontSize: '20px'
                }}>
                  *
                </span>
              )}
              <span style={{ marginLeft: '20px', color: 'grey', fontWeight: '600' }}>{format.longLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentHome;
