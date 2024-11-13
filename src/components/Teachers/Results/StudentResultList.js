// StudentResultsList.js
import React from 'react';
import { ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';

// Wrap the component with React.memo for performance optimization
const getGradeColors = (grade) => {
  if (grade === undefined || grade === null) return { color: 'grey', background: '#f4f4f4' };
  if (grade < 50) return { color: '#FF0000', background: '#FFECEC' };
  if (grade < 70) return { color: '#FF8C00', background: '#FFF3E6' };
  if (grade < 80) return { color: '#FFD700', background: '#FFFBE6' };
  if (grade < 90) return { color: '#90EE90', background: '#F0FFF0' };
  return { color: '#008000', background: '#E6FFE6' };
};

const StudentResultsList = React.memo(
  ({
    students,
    grades,
    assignmentStatuses,
    navigateToStudentGrades,
    navigateToStudentResults,
    getStatusIcon,
    getStatusColor,
    calculateLetterGrade,
    hoveredStatus,
    setHoveredStatus,
    togglePauseAssignment,
    handleReset,
    resetStatus,
    handleAssign,
    gradeField,
  }) => {
    return (
      <ul
        style={{
          background: 'white',
          width: '100%', 
          listStyleType: 'none',
          padding: 0,
          marginTop: '20px',
        }}
      >
        {students.map((student) => {
          const studentGrade = grades[student.uid];
          const status = assignmentStatuses[student.uid];
          const isPaused = status === 'Paused';
          const isCompleted = status === 'completed';
          const isAssigned = student.isAssigned;
          const score = studentGrade ? studentGrade[gradeField] : undefined;
          const gradeColors = getGradeColors(score);

          return (
            <li
              key={student.uid}
              style={{
                width: 'calc(100% - 200px)',
                marginLeft: '200px',
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '2px solid #f4f4f4',
                
                position: 'relative',
                minHeight: '80px',
              }}
           
            >
          
              {/* Student Name */}
              <div style={{ 
                marginLeft: '4%', 
                width: '460px', 
                display: 'flex', 
                marginTop: '5px',
                position: 'relative',
                zIndex: 1
              }}>
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
                  onClick={() => navigateToStudentGrades(student.uid)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'blue';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'inherit';
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  <h3 style={{ fontWeight: '600', fontSize: '20px' }}>
                    {student.lastName},
                  </h3>
                  <h3 style={{ fontWeight: '600', fontSize: '20px', marginLeft: '10px' }}>
                    {student.firstName}
                  </h3>
                </div>

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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '-13px',
                        width: '170px',
                      }}
                    >
                      <p style={{ 
                        fontSize: '20px', 
                        padding: '5px', 
                        borderRadius: '5px',
                        color: gradeColors.color,
                        backgroundColor: gradeColors.background
                      }}>
                        {score !== undefined ? `${Math.round(score)}%` : '00%'}
                      </p>
                      <p
                        style={{
                          fontWeight: '500',
                          width: '23px',
                          fontSize: '22px',
                          marginLeft: 'auto',
                          height: '23px',

                          lineHeight: '23px',
                          color:   'black',
                          borderRadius: '7px',
                        }}
                      >
                        {score !== undefined ? calculateLetterGrade(score) : 'Z'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Status */}
              {isAssigned && (
                <>
                  <div
                    style={{
                      color: 'lightgrey',
                      width: '360px',
                      display: 'flex',
                      alignItems: 'center',
                      position: 'absolute',
                      right: 'calc(4% + 200px)',
                      fontFamily: "'montserrat', sans-serif",
                      zIndex: 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ marginRight: '10px', marginLeft: '10px' }}>
                        {getStatusIcon(
                          studentGrade && studentGrade.submittedAt
                            ? 'completed'
                            : status
                        )}
                      </div>
                      <h1
                        style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: studentGrade && studentGrade.submittedAt
                            ? '#808080'
                            : getStatusColor(status),
                          textTransform: status === 'completed' ? 'uppercase' : 'capitalize',
                          cursor: status === 'Paused' ? 'pointer' : 'default',
                          marginRight: '10px',
                          marginTop: '10px',
                        }}
                        onMouseEnter={() =>
                          status === 'Paused' && setHoveredStatus(student.uid)
                        }
                        onMouseLeave={() => setHoveredStatus(null)}
                        onClick={() =>
                          status === 'Paused' && togglePauseAssignment(student.uid)
                        }
                      >
                        {studentGrade && studentGrade.submittedAt
                          ? ` ${new Date(studentGrade.submittedAt.toDate()).toLocaleString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}`
                          : hoveredStatus === student.uid && status === 'Paused'
                          ? 'Unpause'
                          : status}
                      </h1>
                    </div>

                    {studentGrade?.submittedAt && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '-40px',
                          top: '-10px',
                          height: '38px',
                          width: '50px',
                          padding: '11px',
                          zIndex: 2,
                          backgroundColor: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '4px solid transparent',
                          borderBottomRightRadius: '10px',
                          borderTopRightRadius: '10px',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToStudentResults(student.uid);
                        }}
                      >
                        <ArrowRight size={30} color="#09BA00" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>

                  {/* Reset Button */}
                  <button
                    style={{
                      backgroundColor: 'transparent',
                      color: resetStatus[student.uid] === 'success' ? 'lightgreen' : 'red',
                      cursor: 'pointer',
                      borderColor: 'transparent',
                      fontWeight: '500',
                      fontSize: '20px',
                      width: '100px',
                      textAlign: 'left',
                      marginRight: '4%',
                      fontFamily: "'montserrat', sans-serif",
                      position: 'relative',
                      zIndex: 1,
                    }}
                    onClick={() => handleReset(student.uid)}
                  >
                    {resetStatus[student.uid] === 'success' ? 'Success' : 'Reset'}
                  </button>
                </>
              )}

              {/* Not Assigned */}
              {!isAssigned && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  marginRight: '4%',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <h1
                    style={{
                      fontSize: '20px',
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
                      fontSize: '20px',
                      fontWeight: '500',
                      width: '100px',
                      textAlign: 'left',
                      fontFamily: "'montserrat', sans-serif",
                    }}
                    onClick={() => handleAssign(student.uid)}
                  >
                    Assign
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Check if students length has changed
    if (prevProps.students.length !== nextProps.students.length) {
      return false;
    }

    // Iterate through each student to check if relevant props have changed
    for (let i = 0; i < prevProps.students.length; i++) {
      const student = prevProps.students[i];
      const prevGrade = prevProps.grades[student.uid];
      const nextGrade = nextProps.grades[student.uid];

      // If grade data has changed
      if (prevGrade !== nextGrade) {
        return false;
      }

      // If assignment status has changed
      if (prevProps.assignmentStatuses[student.uid] !== nextProps.assignmentStatuses[student.uid]) {
        return false;
      }

      // If reset status has changed
      if (prevProps.resetStatus[student.uid] !== nextProps.resetStatus[student.uid]) {
        return false;
      }
    }

    return true; // Props are equal, skip re-render
  }
);

// Define PropTypes for type checking
StudentResultsList.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      uid: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      isAssigned: PropTypes.bool.isRequired,
    })
  ).isRequired,
  grades: PropTypes.objectOf(
    PropTypes.shape({
      [PropTypes.string]: PropTypes.number, // e.g., SquareScore or percentageScore
      submittedAt: PropTypes.object, // Firestore Timestamp
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
  getStatusColor: PropTypes.func.isRequired,
  calculateLetterGrade: PropTypes.func.isRequired,
  hoveredStatus: PropTypes.string,
  setHoveredStatus: PropTypes.func.isRequired,
  togglePauseAssignment: PropTypes.func.isRequired,
  handleReset: PropTypes.func.isRequired,
  resetStatus: PropTypes.objectOf(PropTypes.string).isRequired,
  handleAssign: PropTypes.func.isRequired,
  gradeField: PropTypes.string.isRequired, // 'SquareScore' or 'percentageScore'
};

export default StudentResultsList;
