// StudentResultsList.js
import React from 'react';
import { ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';

// Wrap the component with React.memo for performance optimization
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
    gradeField, // e.g., 'SquareScore' or 'percentageScore'
  }) => {
    return (
      <ul
        style={{
          background: 'white',
          width: '900px',
          margin: '0 auto',
          boxShadow: '1px 1px 5px 1px rgb(0,0,155,0.07)',
          borderRadius: '20px',
          paddingTop: '20px',
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

          return (
            <li
              key={student.uid}
              style={{
                width: '860px',

                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginLeft: '20px',
                borderBottom: '2px solid #f4f4f4',
                backgroundColor: 'white',
                padding: '0px 0',
                position: 'relative',
                zIndex: '0',
                transition: 'background-color 0.3s',
              }}
            >
              {/* Student Name */}
              <div style={{ marginLeft: '20px', width: '460px', display: 'flex', marginTop: '5px',  
                }}>
                <div
                  style={{
                    display: 'flex',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    transition: 'color 0.3s',
                    width: '260px',
                    marginTop: '5px',
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
                  <h3 style={{ fontWeight: 'normal', fontSize: '20px' }}>
                    {student.lastName},
                  </h3>
                  <h3 style={{ fontWeight: '600', fontSize: '20px', marginLeft: '10px' }}>
                    {student.firstName}
                  </h3>
                </div>
              </div>

              {/* Grades and Status */}
              {isAssigned ? (
                <>
                  {/* Grade Display */}
                  <div
                    style={{
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: 'black',
                      marginTop: '0px',
                      width: '100px',
                      marginRight: '20px',
                      marginLeft: '-140px',
                    }}
                  >
                    {studentGrade ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginTop: '-2px',
                          width: '130px',
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 'bold',
                            width: '23px',
                            fontSize: '22px',
                            backgroundColor: '#566DFF',
                            height: '23px',
                            border: '4px solid #003BD4',
                            lineHeight: '23px',
                            color: 'white',
                            borderRadius: '7px',
                          }}
                        >
                          {calculateLetterGrade(studentGrade[gradeField])}
                        </p>
                        <p style={{ fontSize: '25px', color: 'grey', marginLeft: '20px' }}>
                          {studentGrade[gradeField] !== undefined
                            ? `${Math.round(studentGrade[gradeField])}%`
                            : '00%'}
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginTop: '-2px',
                          width: '130px',
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 'bold',
                            width: '23px',
                            fontSize: '22px',
                            backgroundColor: '#C0C0C0',
                            height: '23px',
                            border: '4px solid #A8A8A8',
                            lineHeight: '23px',
                            color: 'white',
                            borderRadius: '7px',
                          }}
                        >
                          Z
                        </p>
                        <p style={{ fontSize: '25px', color: 'lightgrey', marginLeft: '20px' }}>
                          00%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Assignment Status */}
                  <div
                    style={{
                      color: 'lightgrey',
                      width: '360px',
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '20px',
                      marginTop: '5px',
                      fontFamily: "'montserrat', sans-serif",
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
                          fontSize: studentGrade && studentGrade.submittedAt ? '17px' : '20px',
                          fontWeight: '600',
                          fontStyle: studentGrade && studentGrade.submittedAt ? 'italic' : 'normal',
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
                  </div>

                  {/* Reset Button */}
                  <button
                    style={{
                      backgroundColor: 'transparent',
                      color: resetStatus[student.uid] === 'success' ? 'lightgreen' : 'red',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderColor: 'transparent',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      marginTop: '-0px',
                      marginLeft: '0px',
                      marginRight: '0px',
                      fontFamily: "'montserrat', sans-serif",
                    }}
                    onClick={() => handleReset(student.uid)}
                  >
                    {resetStatus[student.uid] === 'success' ? 'Success' : 'Reset'}
                  </button>
                </>
              ) : (
                // Not Assigned
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                  <h1
                    style={{
                      fontSize: '16px',
                      color: 'lightgrey',
                      marginRight: '200px',
                      width: '120px',
                      fontWeight: '600',
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
                      fontWeight: 'bold',
                      fontSize: '16px',
                      marginRight: '0px',
                      fontFamily: "'montserrat', sans-serif",
                    }}
                    onClick={() => handleAssign(student.uid)}
                  >
                    Assign
                  </button>
                </div>
              )}

              {/* Navigate to Student Results */}
{isAssigned && studentGrade?.submittedAt && (
  <div
    style={{
      position: 'absolute',
      right: '80px',
      top: '10px',
      height: '38px',
      width: '50px',
      padding: '11px',
      zIndex: '2',
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
