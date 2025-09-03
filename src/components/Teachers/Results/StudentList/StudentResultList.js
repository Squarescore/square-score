// StudentResultsList.js

import React, { useEffect, useState } from 'react';
import ConfirmationModal from '../../../Universal/ConfirmationModal';
import {
  CalendarClock,
  CalendarX2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Circle,
  Check,  X,
  Pause,
  Play,
  RotateCcw,
  Slash,
  AlertTriangle,
  Sparkles,
  TriangleAlert,
  Calendar,
} from 'lucide-react';
import PropTypes from 'prop-types';
import GradeDistributionChart from './GradeDistributionChart';
import CustomDueDatePicker from './DateModal';
import { db } from '../../../Universal/firebase';
import { doc } from 'firebase/firestore';
import DateEditor from './DateEditor';
import OverdueModal from './OverdueAssignmentModal';
import SuccessToast from './SuccessToast';
import Loader from '../../../Universal/Loader';
import { CustomSwitch, GlassContainer } from '../../../../styles';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Add custom styles for the date picker
const datePickerStyles = `
  .custom-datepicker-calendar {
    width: 300px !important;
    font-family: 'montserrat', sans-serif !important;
    border: 1px solid #ddd !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    background: white !important;
  }
  .custom-datepicker-calendar .react-datepicker__header {
    background: white !important;
    border-bottom: 1px solid #ddd !important;
    border-top-left-radius: 8px !important;
    border-top-right-radius: 8px !important;
    padding: 10px !important;
  }
  .custom-datepicker-calendar .react-datepicker__time-container {
    width: 100px !important;
    border-left: 1px solid #ddd !important;
  }
  .custom-datepicker-calendar .react-datepicker__time-box {
    width: 100% !important;
    text-align: center !important;
  }
  .custom-datepicker-calendar .react-datepicker__time-list {
    height: 200px !important;
  }
  .custom-datepicker-calendar .react-datepicker__time-list-item {
    height: 30px !important;
    line-height: 30px !important;
    padding: 0 !important;
    font-size: 14px !important;
    color: grey !important;
  }
  .custom-datepicker-calendar .react-datepicker__time-list-item:hover {
    background: #f0f0f0 !important;
  }
  .custom-datepicker-calendar .react-datepicker__time-list-item--selected {
    background: #2BB514 !important;
    color: white !important;
  }
  .custom-datepicker-calendar .react-datepicker__day {
    width: 30px !important;
    line-height: 30px !important;
    margin: 2px !important;
    color: grey !important;
    border-radius: 15px !important;
  }
  .custom-datepicker-calendar .react-datepicker__day:hover {
    background: #f0f0f0 !important;
    border-radius: 15px !important;
  }
  .custom-datepicker-calendar .react-datepicker__day--selected {
    background: #2BB514 !important;
    color: white !important;
    border-radius: 15px !important;
  }
`;

// Add style tag to head
const styleTag = document.createElement('style');
styleTag.textContent = `
  ${datePickerStyles}
  
  .student-list-item {
    transition: transform 0.2s ease !important;
  }
  
  .student-list-item:hover:not(.menu-open) {
    transform: scale(1.01) !important;
  }
`;
document.head.appendChild(styleTag);

// 1) Helper to format the due date:
function formatDueDate(dueDate) {
  if (!dueDate) return 'No Due Date';
  const options = {
    weekday: 'short', // "Mon"
    month: '2-digit', // "12"
    day: '2-digit',   // "16"
    year: 'numeric',  // "2024"
    hour: '2-digit',  // "01"
    minute: '2-digit',// "40"
    hour12: true      // "PM"
  };
  return dueDate.toLocaleString('en-US', options);
}

// 2) Determine assignment status (renamed "Closed" to "Overdue"):
const determineAssignmentStatus = (assignDate, dueDate) => {
  if (!assignDate || !dueDate) {
    return {
      status: 'No Dates ',
      colors: { background: '#F5F5F5', text: '#858585' , icon: 'red' },
      icon: CalendarX2,
      tooltip: 'No dates have been set for this assignment'
    };
  }
  const now = new Date();
  if (now < assignDate) {
    return {
      status: 'Upcoming',
      colors: { background: '#FFF4DC', text: '#EFAA14' , icon: '#EFAA14' },
      icon: CalendarClock,
      tooltip: 'Assignment will be available soon'
    };
  }
  if (now > dueDate) {
    return {
      status: 'Closed',
      colors: { background: '#F5F5F5', text: '#858585', icon: 'red',  },
      icon: CalendarX2,
      tooltip: 'Assignment is no longer accepting submissions'
    };
  }
  return {
    status: 'Active',
    colors: { background: '#E6E9FF', text: '#020CFF' , icon: '#020CFF' },
    icon: Circle,
    tooltip: 'Assignment is currently accepting submissions'
  };
};

// Keep existing getGradeColors for class grade overall
const getGradeColors = (grade) => {
  if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
  if (grade < 60) return { color: '#c63e3e', variant: 'red' };
  if (grade < 70) return { color: '#ff8800', variant: 'orange' };
  if (grade < 80) return { color: '#ffc300', variant: 'yellow' };
  if (grade < 90) return { color: '#29c60f', variant: 'green' };
  if (grade < 100) return { color: '#006400', variant: 'darkgreen' };
  return { color: '#f198ff', variant: 'pink' };
};

// New function for individual student grades
const getStudentGradeColors = (grade) => {
  if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
  if (grade < 60) return { color: '#c63e3e', variant: 'red' };
  if (grade < 70) return { color: '#ff8800', variant: 'orange' };
  if (grade < 80) return { color: '#ffc300', variant: 'yellow' };
  if (grade < 90) return { color: '#29c60f', variant: 'green' };
  if (grade < 100) return { color: '#006400', variant: 'darkgreen' };
  return { color: '#f198ff', variant: 'pink' };
};

// Action menu for each student
const ActionMenu = ({
  studentUid,
  handleReset,
  resetStatus,
  onClose,
  position,
  status,
  togglePauseAssignment,
  assignmentId,  
  studentSpecialDate, 
  handleSubmitAssignment, 
  handleRenewAccess,
  studentName
}) => {
  const [selectedDate, setSelectedDate] = useState(studentSpecialDate || null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };



  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          cursor: 'default',
          bottom: 0,
          background: 'rgba(0, 0, 0, 0)',
          zIndex: 10,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      
      <GlassContainer
        variant="clear"
        size={0}
        style={{
          position: 'absolute',
          right: '30px',
          top: '0px',
          zIndex: 20,
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        }}
        contentStyle={{
          padding: '15px',
          minWidth: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Student Name Header */}
        <div style={{
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '5px',
          width: '100%',
          paddingBottom: '10px',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1rem',
            padding: '0rem 1rem',
            fontWeight: '500',
            color: '#6B7280',
            textAlign: 'left',
          }}>
            {studentName}
          </h3>
        </div>
    
      {/* Custom date picker matching CustomDateTimePicker.js style */}
      <DatePicker
        selected={selectedDate}
        onChange={(date) => {
          handleDateChange(date);
          onClose();
        }}
        showTimeSelect
        timeFormat="hh:mm aa"
        timeIntervals={15}
        dateFormat="   eee h:mm aa MM/dd/yy "
        popperProps={{
          strategy: "fixed"
        }}
        popperPlacement="bottom"
        popperModifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 5]
            }
          }
        ]}
        customInput={
          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #E5E7EB',
              borderRadius: '81px',
              padding: '8px 12px',
              background: 'white',
            width: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'montserrat', sans-serif",
              fontSize: '14px',
              color: '#6B7280',
              gap: '8px',
              height: '36px',
            }}
    
          >
            <Calendar size={16} strokeWidth={1.5} /> 
            <span>Custom Due Date</span>
          </button>
        }
        calendarClassName="custom-datepicker-calendar"
      />

      {status !== 'completed' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSubmitAssignment(studentUid);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '81px',
            background: 'white',
            color: 'grey',
            width: '100%',
            cursor: 'pointer',
            fontFamily: "'montserrat', sans-serif",
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            gap: '8px',
            height: '36px',
          }}
    
        >
          <Check size={16} strokeWidth={1.5} />
          Submit Assignment
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRenewAccess(studentUid);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 15px',
            border: '1px solid #E5E7EB',
            borderRadius: '81px',
            background: 'white',
            width: '100%',
            color: 'grey',
            cursor: 'pointer',
            fontFamily: "'montserrat', sans-serif",
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            gap: '8px',
            height: '36px',
          }}
     
        >
          <Sparkles size={16} strokeWidth={1.5} />
          Renew Access
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePauseAssignment(studentUid);
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          
            padding: '8px 15px',
          border: '1px solid #E5E7EB',
          borderRadius: '81px',
          background: 'white',
          color: status === 'Paused' ? 'grey' : 'grey',
          cursor: 'pointer',
            width: '100%',
          fontFamily: "'montserrat', sans-serif",
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          gap: '8px',
          height: '36px',
        }}
    
      >
        {status === 'Paused' ? (
          <>
            <Play size={16} strokeWidth={1.5} />
            Unpause Student
          </>
        ) : (
          <>
            <Pause size={16} strokeWidth={1.5} />
            Pause Student
          </>
        )}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowResetConfirmation(true);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 15px',
          border: '1px solid #E5E7EB',
          borderRadius: '81px',
          background: 'white',
          color: 'grey',
          width: '100%',
          cursor: 'pointer',
          fontFamily: "'montserrat', sans-serif",
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          gap: '8px',
          height: '36px',
        }}
      >
        <RotateCcw size={16} strokeWidth={1.5} />
        Reset Student
      </button>
    </GlassContainer>
    
    {showResetConfirmation && (
      <div 
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
          cursor: 'default'
        }}
      >
        <div onClick={e => e.stopPropagation()}>
          <ConfirmationModal
          title={`Reset "${studentName}"?`}
          message="This action cannot be undone. All answers and progress for this assignment will be permanently deleted. You can renew access later by clicking 'Renew Access' in the action menu."
          onConfirm={(e) => {
            e?.stopPropagation();
            handleReset(studentUid);
            setShowResetConfirmation(false);
            onClose();
          }}
          onCancel={(e) => {
            e?.stopPropagation();
            setShowResetConfirmation(false);
          }}
          confirmText="Reset"
          confirmVariant="red"
                    confirmColor="#ef4444"
     
          
          />
        </div>
        </div>
    )}
    </>
  );
};

const StudentResultsList = React.memo(
  ({
    students,
    grades,
    assignmentStatuses,
    navigateToStudentGrades,
    navigateToStudentResults,
    getStatusColor,
    calculateLetterGrade,
    hoveredStatus,
    setHoveredStatus,
    togglePauseAssignment,
    handleReset,
    resetStatus,
    handleAssign,  gradingStudentUid,    
    gradeField,
    submissionCount,   handleSubmitAssignment, 
    handleRenewAccess, 
    averageGrade,
    assignmentType,
    allViewable: initialAllViewable,
    toggleAllViewable,
    assignmentId,
    pausedCount,
    unassignedCount,
    inProgressCount,
    notStartedCount,
    assignDate,
    dueDate,

    onTabChange,
    periodStyle = { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" }, // Default to period 1 style
  }) => {
    console.log("Rendering StudentResultsList with gradingStudentUid:", gradingStudentUid);
  
    const [localAllViewable, setLocalAllViewable] = useState(initialAllViewable);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ right: '4%', top: '100%' });
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
    const [selectedStudentForAssign, setSelectedStudentForAssign] = useState(null);
    
    // Determine assignment status from the dates
    const assignmentOverallStatus = determineAssignmentStatus(assignDate, dueDate);

    // For the stacked bar logic
    const total =
      submissionCount + inProgressCount + pausedCount + notStartedCount + unassignedCount || 0;

    const MIN_WIDTH = 5; // minimal px for zero counts
    const getBarWidth = (count) => {
      if (!total || total === 0) return `${MIN_WIDTH}px`;
      const percentage = ((count / total) * 100).toFixed(1);
      return percentage === '0.0' ? `${MIN_WIDTH}px` : `${percentage}%`;
    };

    const tooltipStyle = {
      position: 'absolute',
      top: '-35px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      color: 'grey',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      zIndex: 1000
    };

    // Sync localAllViewable with parent
    useEffect(() => {
      setLocalAllViewable(initialAllViewable);
    }, [initialAllViewable]);

    const handleToggleViewable = async () => {
      if (isUpdating) return;
      setIsUpdating(true);
      try {
        setLocalAllViewable(!localAllViewable);
        await toggleAllViewable();
      } catch (error) {
        setLocalAllViewable(localAllViewable);
        console.error('Error toggling viewable status:', error);
      } finally {
        setIsUpdating(false);
      }
    };

    const handleModalClose = (success) => {
      setIsOverdueModalOpen(false);
      setSelectedStudentForAssign(null);
      if (success) {
        setSuccessMessage("Assignment successfully assigned");
      }
    };
    const handleMenuToggle = (studentUid, event) => {
      if (activeMenu === studentUid) {
        setActiveMenu(null);
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
          right: `${window.innerWidth - rect.right + 10}px`,
          top: `${rect.bottom + 5}px`,
        });
        setActiveMenu(studentUid);
      }
    };
    const handleAssignWithCheck = async (studentUid) => {
      try {
        // Assign the assignment first
        await handleAssign(studentUid);
        console.log(`Assignment assigned to student ${studentUid}`);
      } catch (error) {
        console.error('Error assigning assignment:', error);
        // Optionally, notify the user about the failure
        return;
      }

      const now = new Date();
      if (now > dueDate) {
        // Current date is past the due date, show overdue modal
        const student = students.find((s) => s.uid === studentUid);
        setSelectedStudentForAssign(student);
        setIsOverdueModalOpen(true);
      }
    };
    useEffect(() => {
      if (gradingStudentUid) {
        console.log(`Currently grading student: ${gradingStudentUid}`);
      }
    }, [gradingStudentUid]);
    // Pencil icon logic — for example usage, you might pass in a prop onClick or do a navigate
    const handleEditClick = () => {
      console.log('Pencil icon clicked -> navigate to settings or open modal');
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'completed':
          return { icon: Check, color: '#00DE09', variant: 'green' };
        case 'In Progress':
          return { icon: Circle, color: '#FFAA00', variant: 'yellow' };
        case 'not_started':
          return { icon: X, color: 'lightgrey', variant: 'clear' };
        case 'Paused':
          return { icon: Pause, color: '#FFA500', variant: 'orange' };
        default:
          return { icon: X, color: 'lightgrey', variant: 'clear' };
      }
    };

    // Use a safe version of periodStyle that always has the required properties
    const safeStyle = periodStyle || { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" };

    return (
      <>
      <div style={{}}>
        {/* TOP SECTION */}
        <div
          style={{
            display: 'flex',
            marginTop: '-80px',
            height: '240px',
            paddingLeft: 'calc(210px + 4%)',
            paddingRight: 'calc(4% + 20px)',
            justifyContent: 'space-between',
           
          }}
        >
          {/* LEFT COLUMN */}











          <div style={{marginTop: '30px'}}>
            <GlassContainer 
              size={0}
              variant="clear"
              style={{zIndex: '1'}}
              contentStyle={{ 
                height: '140px',
                width: '450px',
                padding: '15px 25px',
              }}
            >
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '30px'
              }}>
                {/* Submissions status + Count + Bar */}
                <div style={{
                  fontSize: '16px',
                  display: 'flex',
                  fontWeight: '500',
                  color: '#555',
                }}>
                  {/* Status Badge */}
                  <div style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'montserrat', sans-serif",
                    color: assignmentOverallStatus.colors.text,
                    backgroundColor: 'transparent',
                    padding: '2px 0px',
                    borderRadius: '4px',
                  }}>
                    <span>{assignmentOverallStatus.status}</span>
                    {React.createElement(assignmentOverallStatus.icon, {
                      size: 14,
                      color: assignmentOverallStatus.colors.icon
                    })}
                  </div>

                  {(() => {
                    const now = new Date();
                    if (!assignDate || now < assignDate) {
                      return (
                        <DateEditor 
                          date={assignDate}
                          label="Assign Date"
                          onTabChange={onTabChange}
                        />
                      );
                    } else {
                      return (
                        <DateEditor 
                          date={dueDate}
                          label="Due Date"
                          onTabChange={onTabChange}
                        />
                      );
                    }
                  })()}
                </div>

                {/* Single Stacked Bar */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    fontWeight: '500',
                    width: '420px',
                    fontSize: '16px',
                    color: 'grey'
                  }}>
                    {submissionCount} Submissions
                  </span>
                  <div style={{
                    display: 'flex',
                    width: '80%',
                    height: '10px',
                    borderRadius: '4px',
                  }}>
                    {/* Submissions (Blue) */}
                    <div
                      style={{
                        position: 'relative',
                        marginLeft: 'auto',
                        backgroundColor: '#020CFF',
                        width: getBarWidth(submissionCount),
                        borderRight: '2px solid white',
                        borderRadius: '10px 0px 0px 10px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() =>
                        setHoveredSegment({ label: 'Submissions', count: submissionCount })
                      }
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {hoveredSegment?.label === 'Submissions' && (
                        <div style={tooltipStyle}>Submissions: {hoveredSegment.count}</div>
                      )}
                    </div>

                    {/* In Progress (Green) */}
                    <div
                      style={{
                        position: 'relative',
                        backgroundColor: '#009006',
                        width: getBarWidth(inProgressCount),
                        borderRight: '2px solid white',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() =>
                        setHoveredSegment({ label: 'In Progress', count: inProgressCount })
                      }
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {hoveredSegment?.label === 'In Progress' && (
                        <div style={tooltipStyle}>In Progress: {hoveredSegment.count}</div>
                      )}
                    </div>

                    {/* Paused (Yellow) */}
                    <div
                      style={{
                        position: 'relative',
                        backgroundColor: '#FFAE00',
                        width: getBarWidth(pausedCount),
                        borderRight: '2px solid white',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setHoveredSegment({ label: 'Paused', count: pausedCount })}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {hoveredSegment?.label === 'Paused' && (
                        <div style={tooltipStyle}>Paused: {hoveredSegment.count}</div>
                      )}
                    </div>

                    {/* Not Started (Grey) */}
                    <div
                      style={{
                        position: 'relative',
                        backgroundColor: '#D9D9D9',
                        width: getBarWidth(notStartedCount),
                        borderRight: '2px solid white',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() =>
                        setHoveredSegment({ label: 'Not Started', count: notStartedCount })
                      }
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {hoveredSegment?.label === 'Not Started' && (
                        <div style={tooltipStyle}>Not Started: {hoveredSegment.count}</div>
                      )}
                    </div>

                    {/* Unassigned (Light Grey) */}
                    <div
                      style={{
                        position: 'relative',
                        backgroundColor: '#F5F5F5',
                        width: getBarWidth(unassignedCount),
                        borderRadius: '0px 10px 10px 0px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() =>
                        setHoveredSegment({ label: 'Unassigned', count: unassignedCount })
                      }
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {hoveredSegment?.label === 'Unassigned' && (
                        <div style={tooltipStyle}>Unassigned: {hoveredSegment.count}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Student Review Switch */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <label style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: 'grey'
                  }}>
                    Student Review:
                  </label>
                  {localAllViewable ? (
                    <Eye size={20} style={{ color: '#020CFF', marginRight: 'auto', marginLeft: '20px' }} />
                  ) : (
                    <EyeOff size={20} style={{ color: 'grey', marginRight: 'auto', marginLeft: '20px' }} />
                  )}
                  <CustomSwitch
  checked={localAllViewable}
  onChange={handleToggleViewable}
  
  disabled={isUpdating}
  variant="teal" // or any other glass variant
 // optional
/>
            

                </div>
              </div>
            </GlassContainer>
          </div>























          {/* RIGHT COLUMN: Grade Distribution Chart */}
          <div
            style={{
              width: 'calc(100% - 450px)',
              paddingLeft: '20px',
              position: 'relative', 
            }}
          >
            <GlassContainer
              variant={averageGrade ? getGradeColors(averageGrade).variant : 'blue'}
              size={0}
              style={{
                position: 'absolute',
                top: '10px',
                right: '-20px',
                zIndex: '20',
              }}
              contentStyle={{
                padding: '5px 10px',
                fontSize: '16px',
                fontWeight: '500',
                color: averageGrade ? getGradeColors(averageGrade).color : '#858585',
              }}
            >
              {averageGrade !== null ? `${averageGrade}%` : '-'}
            </GlassContainer>
            <GradeDistributionChart 
              grades={grades} 
              assignmentType={assignmentType} 
              periodStyle={safeStyle}
            />
          </div>
        </div>

        {/* BELOW: the existing student list */}
        <ul
          style={{
            background: 'white',
            width: '100%',
            listStyleType: 'none',
            padding: 0,
            marginTop: '0px',
          }}
        >
          {students.map((student) => {
            const studentGrade = grades[student.uid];
           
            const status = assignmentStatuses[student.uid];
            const isAssigned = student.isAssigned;
            const score = studentGrade ? studentGrade[gradeField] : undefined;
            const gradeColors = getGradeColors(score);
            const isMenuOpen = activeMenu === student.uid;
            const specialDate = student.specialDueDate; // Our new field
          
            return (
              <li
                key={student.uid}
                className={`student-list-item ${isMenuOpen ? 'menu-open' : ''}`}
                style={{
                  width: 'calc(92% - 200px)',
                  marginLeft: 'calc(200px + 2%)',
                  alignItems: 'center',
                  display: 'flex',
                  padding: '0px 2%',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #EDEDED',
                  position: 'relative',
                  minHeight: '80px',
                  cursor: studentGrade?.submittedAt ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease',
                  transform: isMenuOpen ? 'none' : 'scale(1)',
             
                }}
                onClick={() => {
                  // If submitted, go to the detailed results
                  if (studentGrade?.submittedAt) {
                    navigateToStudentResults(student.uid);
                  }
                }}
              >
                {/* Student Name */}
                <div
                  style={{
                    width: '490px',
                    display: 'flex',
                    marginTop: '5px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'color 0.3s',
                      marginTop: '5px',
                      position: 'relative',
                      zIndex: 1,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToStudentGrades(student.uid);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'blue';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'inherit';
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    <h3 style={{ fontWeight: '500', fontSize: '16px' }}>
                      {student.lastName},
                    </h3>
                    <h3
                      style={{ fontWeight: '500', fontSize: '16px', marginLeft: '10px' }}
                    >
                      {student.firstName}
                    </h3>
                  </div>

                  {/* Score / Grade */}
                  {isAssigned && (
  


<div
  style={{
    fontWeight: '500',
    textAlign: 'center',
    height: '50px',
    marginTop: '10px',
    width: '170px',
    position: 'relative',
    marginLeft: 'auto',
    zIndex: 1,
  }}
>
  {gradingStudentUid === student.uid ? (
    // Case 1: Currently grading - show loader
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Loader />
    </div>
  ) : student.gradedUnsuccessfully ? (
    // Case 2: Grading failed - show error and retry button
    <div style={{ display: 'flex', width: '220px' }}>
      <div
        style={{
          fontSize: '14px',
          color: 'red',
          marginTop: '10px',
          display: 'flex',
          lineHeight: '10px'
        }}
      >
        <TriangleAlert size={16} style={{ marginTop: '3px' }} />
        <p style={{ marginTop: '7px', marginLeft: '10px' }}>Grading Failed</p>
      </div>
      <button
        style={{
          fontSize: '14px',
          padding: '4px 8px',
          marginLeft: 'auto',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: '#FADDFF',
          color: '#E01FFF',
          display: 'flex',
          height: '25px',
          marginTop: '9px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleSubmitAssignment(student.uid);
        }}
      >
        <p style={{ marginLeft: '2px', marginTop: '1px' }}>Grade</p>
        <Sparkles size={14} style={{ marginLeft: '4px', marginTop: '2px' }} />
      </button>
    </div>
  ) : (
    // Case 3: Regular grade display
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: '10px',
        width: '170px',
      }}
    >
      <GlassContainer
        variant={getStudentGradeColors(score).variant}
        size={0}
        style={{
          marginRight: '10px'
        }}
        contentStyle={{
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{display:'flex', gap:'8px'}}>
        <span style={{
          fontSize: '.8rem',
          color: getStudentGradeColors(score).color,
          fontWeight: '500'
        }}>
          {score !== undefined ? calculateLetterGrade(score) : 'Z'}
        </span>
         <span style={{
          width: '1px',
          marginTop: '3px',
          background: getStudentGradeColors(score).color,
          height: '10px',
        }}/>
         
        <span style={{
          fontSize: '.8rem',
          color: getStudentGradeColors(score).color,
          fontWeight: '500'
        }}>
          {score !== undefined ? `${Math.round(score)}%` : '00%'}
        </span>
    </div>
      </GlassContainer>
  
    </div>
  )}
</div>



)}


                </div>

                {/* Assignment Status (if assigned) */}





                
                {specialDate && (
                  <div
                    style={{ position: 'absolute', right: '100px', zIndex: '10' }}
                    onMouseEnter={(e) => {
                      const tooltip = e.currentTarget.querySelector('.triangle-tooltip');
                      if (tooltip) tooltip.style.display = 'block';
                    }}
                    onMouseLeave={(e) => {
                      const tooltip = e.currentTarget.querySelector('.triangle-tooltip');
                      if (tooltip) tooltip.style.display = 'none';
                    }}
                  >
                    {/* AlertTriangle from lucide-react, or any icon you want */}
                    <AlertTriangle size={16} color="#FFAE00" />


                    {/* Hover tooltip with the date */}
                    <div
                      className="triangle-tooltip"
                      style={{
                        display: 'none',
                        position: 'absolute',
                        bottom: '120%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '6px 8px',
                        backgroundColor: '#FFF9E6',
                        color: '#FFAE00',
                        borderRadius: '4px',
                        fontSize: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Custom Due Date:
                      <br />
                      {formatDueDate(specialDate)}
                    </div>
                  </div>
                )}


                {isAssigned && (
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                    }}
                  >
                    <div
                      style={{
                        color: 'lightgrey',
                        display: 'flex',
                        alignItems: 'center',
                        fontFamily: "'montserrat', sans-serif",
                        position: 'absolute',
                        right: '40px',
                        transform: 'translateX(50%)',
                        marginTop: '0',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          position: 'absolute',
                          right: '0px',
                         
                            maxWidth: '400px'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '0',
                          }}
                        >
                          <GlassContainer
                            variant={getStatusIcon(
                              studentGrade && studentGrade.submittedAt
                                ? 'completed'
                                : status
                            ).variant}
                            size={0}
                            style={{
                              marginRight: '10px'
                            }}
                            contentStyle={{
                              padding: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {React.createElement(
                              getStatusIcon(
                                studentGrade && studentGrade.submittedAt
                                  ? 'completed'
                                  : status
                              ).icon,
                              {
                                size: 12,
                                color: getStatusIcon(
                                  studentGrade && studentGrade.submittedAt
                                    ? 'completed'
                                    : status
                                ).color,
                                strokeWidth: 2.5
                              }
                            )}
                          </GlassContainer>
                        </div>
                        <h1
                          style={{
                            fontSize: '.8rem',
                            fontWeight: '500',
                            color:
                              studentGrade && studentGrade.submittedAt
                                ? '#808080'
                                : getStatusColor(status),
                            textTransform: status === 'completed' ? 'uppercase' : 'capitalize',
                            cursor: status === 'Paused' ? 'pointer' : 'default',
                            marginRight: 'auto',
                            marginTop: '10px',
                            width: '260px',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (status === 'Paused') {
                              togglePauseAssignment(student.uid);
                            }
                          }}
                          onMouseEnter={() =>
                            status === 'Paused' && setHoveredStatus(student.uid)
                          }
                          onMouseLeave={() => setHoveredStatus(null)}
                        >
                          {/* If submitted, show submission date; if hovered & paused, show "Unpause" */}
                          {studentGrade && studentGrade.submittedAt
                            ? ` ${new Date(studentGrade.submittedAt.toDate()).toLocaleString(
                                undefined,
                                {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                }
                              )}`
                            : hoveredStatus === student.uid && status === 'Paused'
                            ? 'Unpause'
                            : status}
                        </h1>
                        
                      </div>












 
                 








                
                    </div>

                    {/* Action button (3-dots) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuToggle(student.uid, e);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        position: 'relative',
                        cursor: 'pointer',
                        border: 'none',
                        borderRadius: '4px',
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <MoreHorizontal size={20} color="grey" />
                    </button>

                    {/* Action Menu for Pause/Reset */}
                    {isMenuOpen && (
  <ActionMenu
    studentUid={student.uid}
    handleReset={handleReset}
    studentSpecialDate={specialDate} 
    resetStatus={resetStatus}
    onClose={() => setActiveMenu(null)}
    position={menuPosition}
    status={status}
    togglePauseAssignment={togglePauseAssignment}
    studentName={`${student.lastName}, ${student.firstName}`}
    assignmentId={assignmentId}
    handleSubmitAssignment={handleSubmitAssignment}
    handleRenewAccess={handleRenewAccess}
  />
)}

                  </div>
                )}

                {/* Not Assigned */}
                {!isAssigned && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginRight: '4%',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <h1
                      style={{
                        fontSize: '16px',
                        color: 'lightgrey',
                        marginRight: '200px',
                        width: '200px',
                        fontWeight: '500',
                        fontFamily: "'montserrat', sans-serif",
                      }}
                    >
                      Not Assigned
                    </h1>
                    <button
                      style={{
                        backgroundColor: 'transparent',
                        color: '#2BB514',
                        cursor: 'pointer',
                        borderColor: 'transparent',
                        fontSize: '16px',
                        fontWeight: '500',
                        width: '100px',
                        textAlign: 'right',
                        fontFamily: "'montserrat', sans-serif",
                      }}
                      onClick={() => handleAssignWithCheck(student.uid)} // Use the modified handleAssign

                    >
                      Assign
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          
        </ul>
      {isOverdueModalOpen && selectedStudentForAssign && (
  <OverdueModal
    student={selectedStudentForAssign}
    onDismiss={() => handleModalClose(false)}
    onGoToSettings={() => {
      handleModalClose(true);
      onTabChange('settings');
    }}
    onChangeDate={(newDate) => {
      handleModalClose(true);
    }}
    assignmentId={assignmentId}
  />
)}


{successMessage && (
  <SuccessToast
    message={successMessage}
    onClose={() => setSuccessMessage(null)}
  />
)}
</div>
      </>
    );
  },
  (prevProps, nextProps) => {
    // Include a check for gradingStudentUid
    if (prevProps.gradingStudentUid !== nextProps.gradingStudentUid) return false;

    // Existing comparison logic
    if (prevProps.students.length !== nextProps.students.length) return false;

    for (let i = 0; i < prevProps.students.length; i++) {
      const student = prevProps.students[i];
      const prevGrade = prevProps.grades[student.uid];
      const nextGrade = nextProps.grades[student.uid];

      if (prevGrade !== nextGrade) {
        return false;
      }
      if (
        prevProps.assignmentStatuses[student.uid] !==
        nextProps.assignmentStatuses[student.uid]
      ) {
        return false;
      }
      if (prevProps.resetStatus[student.uid] !== nextProps.resetStatus[student.uid]) {
        return false;
      }
    }

    return true;
  }
);
StudentResultsList.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      uid: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      isAssigned: PropTypes.bool.isRequired,
      handleSubmitAssignment: PropTypes.func.isRequired,
  handleRenewAccess: PropTypes.func.isRequired,
  gradingStudentUid: PropTypes.string,
 // New prop type
    })
  ).isRequired,
  grades: PropTypes.objectOf(
    PropTypes.shape({
      [PropTypes.string]: PropTypes.number,
      submittedAt: PropTypes.object,
      viewable: PropTypes.bool,
      questions: PropTypes.arrayOf(
        PropTypes.shape({
          flagged: PropTypes.bool,
        })
      ),
    })
  ).isRequired,
  assignmentStatuses: PropTypes.objectOf(PropTypes.string).isRequired,
  navigateToStudentGrades: PropTypes.func.isRequired,
  navigateToStudentResults: PropTypes.func.isRequired,
  getStatusIcon: PropTypes.func.isRequired,
  assignmentType: PropTypes.oneOf(['AMCQ', 'OE']).isRequired,
  getStatusColor: PropTypes.func.isRequired, onTabChange: PropTypes.func.isRequired,
  calculateLetterGrade: PropTypes.func.isRequired,
  hoveredStatus: PropTypes.string,
  setHoveredStatus: PropTypes.func.isRequired,
  togglePauseAssignment: PropTypes.func.isRequired,
  handleReset: PropTypes.func.isRequired,
  resetStatus: PropTypes.objectOf(PropTypes.string).isRequired,
  handleAssign: PropTypes.func.isRequired,
  gradeField: PropTypes.string.isRequired,
  assignmentId: PropTypes.string.isRequired,
  submissionCount: PropTypes.number.isRequired,
  averageGrade: PropTypes.number,
  allViewable: PropTypes.bool.isRequired,
  toggleAllViewable: PropTypes.func.isRequired,

  pausedCount: PropTypes.number.isRequired,
  unassignedCount: PropTypes.number.isRequired,
  inProgressCount: PropTypes.number.isRequired,
  notStartedCount: PropTypes.number.isRequired,
  assignDate: PropTypes.instanceOf(Date),
  dueDate: PropTypes.instanceOf(Date),
  periodStyle: PropTypes.shape({
    variant: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    borderColor: PropTypes.string.isRequired
  }).isRequired,
};

export default StudentResultsList;
