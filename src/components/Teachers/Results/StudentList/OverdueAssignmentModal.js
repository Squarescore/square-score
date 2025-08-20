// OverdueModal.js

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Ensure the path is correct
import CustomDueDatePicker2 from './DateModal2';

const OverdueModal = ({ 
  student, 
  onDismiss, 
  onGoToSettings, 
  assignmentId,

  onChangeDate, 
  studentSpecialDate, 
}) => {  
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Handle closing the modal when 'Esc' key is pressed
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onDismiss]);

  // Handler for date change from CustomDueDatePicker2
  const handleDateChange = (newDate) => {
    onChangeDate(newDate);
    setIsDatePickerOpen(false);
  };


  // Handle closing the modal when 'Esc' key is pressed
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onDismiss]);

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        display: 'flex',
        alignItems: 'center',
        backdropFilter: 'blur(5px)',
        justifyContent: 'center',
        zIndex: 120,
      }}
      onClick={onDismiss} // Allows clicking outside the modal to dismiss
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          padding: '25px',
          border: '1px solid lightgrey',
          borderRadius: '15px',
          width: '400px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()} // Prevents modal from closing when clicking inside
      >
        <h2 style={{ marginTop: 0 , 
          fontFamily: "'montserrat', sans-serif",
          fontWeight: '600',
          
          }}>Overdue Assignment</h2>


          
        <p style={{
          fontFamily: "'montserrat', sans-serif",
          
          
          }}>
        This assignment is overdue. <strong>{student.firstName} {student.lastName} </strong> 
       won't be able to access it with out change to the date.<br></br> 
         You can : </p>
        <div style={{   marginTop: '20px' }}>
     
          <button
            onClick={onGoToSettings}
            style={{
              padding: '8px 0px',
              color: 'blue',
              background: 'white',
              marginLeft: '0px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
            }}
          >
            - Change due date for all students (settings)
          </button>
      
          {/* Replace the "Change Date" button with CustomDueDatePicker2 */}
          <CustomDueDatePicker2
            selected={null} // No initial selection; adjust if needed
            onChange={handleDateChange}
            settingName="dueDate" // Ensure CustomDueDatePicker2 accepts this prop
            assignmentId={assignmentId}
            studentRef={student.ref || null} // Ensure student.ref is correctly passed
            onClose={() => setIsDatePickerOpen(false)}
            isModal={false} // Since it's within the modal, set appropriately
          />
               <button
            onClick={onDismiss}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              marginLeft: 'auto',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
            }}
          >
            Dismiss
          </button>

        </div>

        
      </div>
    </div>
  );
};

OverdueModal.propTypes = {
  student: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    // ... other student properties if needed
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
  onGoToSettings: PropTypes.func.isRequired,
  assignmentId: PropTypes.string.isRequired,
};

export default OverdueModal;
