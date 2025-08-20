// CustomDueDatePicker.js

import React, { useState, useEffect } from 'react';
import { updateDoc, doc } from 'firebase/firestore'; // <-- Make sure we import updateDoc
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { db } from '../../../Universal/firebase'; // if we need to fallback to assignment doc

const CustomDueDatePicker = ({
  selected,
  onChange,
  updateAssignmentSetting,
  settingName,
  assignmentId,
  studentRef,
  onClose
}) => {
  const [selectedDate, setSelectedDate] = useState(selected);
  const [tempDate, setTempDate] = useState(selected);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setSelectedDate(selected);
    setTempDate(selected);
  }, [selected]);

  const setDefaultTime = (date) => {
    if (!date) return null;
    const newDate = new Date(date);
    if (!selected && (newDate.getHours() === 0 && newDate.getMinutes() === 0)) {
      newDate.setHours(23, 30, 0);
    }
    return newDate;
  };

  const handleDateSelect = (date) => {
    setTempDate(date);
  };

  // If we have a studentRef, update that doc's "specialDates".
  // Otherwise, fall back to updating the assignment doc's "dueDate" (or any custom logic you want).
  const updateDateInFirestore = async (date) => {
    if (studentRef) {
      try {
        await updateDoc(studentRef, {
          [`specialDates.${assignmentId}`]: date.toISOString()
        });
        return true;
      } catch (error) {
        console.error('Error updating studentRef specialDates:', error);
        return false;
      }
    } else {
      try {
        const assignmentDocRef = doc(db, 'assignments', assignmentId);
        await updateDoc(assignmentDocRef, { [settingName]: date.toISOString() });
        return true;
      } catch (error) {
        console.error('Error updating assignment doc:', error);
        return false;
      }
    }
  };

  const handleDone = async (e) => {
    e.stopPropagation(); // Prevent event bubbling

    // Validate the selected date
    if (!tempDate || !(tempDate instanceof Date) || isNaN(tempDate)) {
      console.warn('Invalid date selected:', tempDate);
      return;
    }

    // Actually update Firestore
    const success = await updateDateInFirestore(tempDate);
    if (success) {
      // If successful, update local states
      setSelectedDate(tempDate);

      // If parent has an onChange handler, call it
      if (onChange) {
        onChange(tempDate);
      }

      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);

      // Close the date menu
      setIsMenuOpen(false);

      // If there's a parent onClose callback, call it
      if (onClose) {
        onClose();
      }
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      setTempDate(selectedDate || setDefaultTime(new Date()));
    }
  };

  return (
    <div className="custom-due-date-container" onClick={(e) => e.stopPropagation()}>
      <button
        style={{
          width: '100%',
          padding: '8px 16px',
          textAlign: 'left',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: "'montserrat', sans-serif",
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background-color 0.2s',
          color: '#555555',
        }}
        onClick={toggleMenu}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f8f8')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        Custom Due Date{' '}
        {selectedDate &&
          `(${selectedDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })})`}
      </button>

      {/* The dropdown with DatePicker */}
      {isMenuOpen && (
        <div
          style={{
            position: 'absolute',
            right: '100%',
            top: '0',
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <DatePicker
            selected={tempDate}
            onChange={handleDateSelect}
            showTimeSelect
            timeFormat="hh:mm aa"
            timeIntervals={30}
            dateFormat="MMMM d, yyyy h:mm aa"
            inline
            minDate={new Date()}
            timeCaption="Time"
          />

          <button
            onClick={handleDone}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '10px',
              backgroundColor: '#555CFF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4047CC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#555CFF')}
          >
            Done
          </button>
        </div>
      )}

      {/* Notification popup */}
      {showNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontFamily: "'montserrat', sans-serif",
          }}
        >
          Due date updated
        </div>
      )}

      {/* Extra CSS for react-datepicker */}
      <style>
        {`
          .react-datepicker {
            font-family: 'montserrat', sans-serif;
            border: none;
            box-shadow: none;
          }

          .react-datepicker__header {
            background-color: white;
            border-bottom: 1px solid #f0f0f0;
          }

          .react-datepicker__current-month {
            color: #333;
            font-weight: 500;
          }

          .react-datepicker__day {
            border-radius: 4px;
            transition: all 0.2s;
          }

          .react-datepicker__day:hover {
            background-color: #f0f0f0;
          }

          .react-datepicker__day--selected {
            background-color: #555CFF;
            color: white;
          }

          .react-datepicker__time-container {
            border-left: 1px solid #f0f0f0;
            width: 150px !important;
          }

          .react-datepicker__time-box {
            width: 150px !important;
          }

          .react-datepicker-popper {
            width: auto !important;
          }

          .react-datepicker__time-list {
            padding: 0 !important;
            width: 150px !important;
          }

          .react-datepicker__time-list-item {
            height: 40px !important;
            line-height: 40px !important;
            padding: 0 10px !important;
            font-size: 14px !important;
          }

          .react-datepicker__time-list-item--selected {
            background-color: #555CFF !important;
          }

          .react-datepicker-time__header {
            padding: 10px 0;
          }
        `}
      </style>
    </div>
  );
};

export default CustomDueDatePicker;
