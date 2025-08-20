import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Universal/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../Universal/Navbar';
import {
  Search,
  Check,
  Pause,
  Circle,
  ChevronDown,
  X
} from 'lucide-react';
import GradeProgressionChart2 from './Results/TeacherStudentView/GradeChart2';
import 'react-datepicker/dist/react-datepicker.css';
import styled from 'styled-components';
import StyledDatePickerComponent from './StyledDatePicker'; // Updated import
import { GlassContainer } from '../../styles';

function TeacherStudentGrades() {
  const [assignments, setAssignments] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredAssignmentId, setHoveredAssignmentId] = useState(null);
  const [startDate, setStartDate] = useState(null); // For date range filtering
  const [endDate, setEndDate] = useState(null);
  const [originalAssignments, setOriginalAssignments] = useState([]);
  const [isGraphExpanded, setIsGraphExpanded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [classData, setClassData] = useState({});

  const { classId, studentUid } = useParams();
  const navigate = useNavigate();

  // Add function to get current period style
  const getCurrentPeriodStyle = () => {
    const period = classData?.period || parseInt(classData?.className?.split(' ')[1]) || 1;
    return periodStyles[period] || periodStyles[1];
  };

  useEffect(() => {
    const fetchAllAssignments = async () => {
      try {
        // Fetch student data and name
        const studentDoc = await getDoc(doc(db, 'students', studentUid));
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          setStudentName(`${studentData.firstName} ${studentData.lastName}`);
  
          // Fetch class data to get period
          const classDoc = await getDoc(doc(db, 'classes', classId));
          if (classDoc.exists()) {
            const classData = classDoc.data();
            setClassData({
              ...classData,
              period: classData.period || parseInt(classData.className?.split(' ')[1]) || 1
            });
          }
  
          // Get graded assignments
          const classGrades = studentData[`class_${classId}`]?.grades || {};
          const gradedAssignments = Object.entries(classGrades).map(
            ([assignmentId, gradeData]) => ({
              id: assignmentId,
              status: 'completed',
              ...gradeData,
              type: assignmentId.split('+').pop(),
              submittedAt: gradeData.submittedAt,
              date: gradeData.submittedAt, // Original submission date
            })
          );
  
          // Get assignments in different states
          const assignmentsToTake = studentData.assignmentsToTake || [];
          const assignmentsInProgress = studentData.assignmentsInProgress || [];
          const assignmentsPaused = studentData.assignmentsPaused || [];
  
          // Filter assignments for this class
          const relevantAssignmentIds = [
            ...new Set([
              ...assignmentsToTake,
              ...assignmentsInProgress,
              ...assignmentsPaused,
            ]),
          ].filter((id) => id.startsWith(classId));
  
          // Fetch details for non-graded assignments
          const assignmentPromises = relevantAssignmentIds.map(async (id) => {
            const assignmentDoc = await getDoc(doc(db, 'assignments', id));
            if (assignmentDoc.exists()) {
              const data = assignmentDoc.data();
              const dueDate = data.dueDate ? new Date(data.dueDate) : new Date();
              return {
                id,
                assignmentName: data.assignmentName,
                type: id.split('+').pop(),
                dueDate: data.dueDate,
                date: {
                  toDate: () => dueDate,
                },
                status: assignmentsPaused.includes(id)
                  ? 'paused'
                  : assignmentsInProgress.includes(id)
                  ? 'in_progress'
                  : 'not_started',
                score: null, // Use null for incomplete assignments
              };
            }
            return null;
          });
  
          let nonGradedAssignments = (await Promise.all(assignmentPromises)).filter(
            (assignment) => assignment !== null
          );
  
          // **Deduplication Step: Remove Non-Graded Assignments that are Already Graded**
          const gradedAssignmentIds = new Set(gradedAssignments.map(a => a.id));
          nonGradedAssignments = nonGradedAssignments.filter(
            (assignment) => !gradedAssignmentIds.has(assignment.id)
          );
  
          // **Final Deduplication Using a Map (Ensures Uniqueness)**
          const uniqueAssignmentsMap = new Map();
  
          // Add graded assignments first
          gradedAssignments.forEach(assignment => {
            uniqueAssignmentsMap.set(assignment.id, assignment);
          });
  
          // Add non-graded assignments, ensuring no duplicates
          nonGradedAssignments.forEach(assignment => {
            if (!uniqueAssignmentsMap.has(assignment.id)) {
              uniqueAssignmentsMap.set(assignment.id, assignment);
            }
          });
  
          // Convert Map back to array
          const allAssignments = Array.from(uniqueAssignmentsMap.values()).sort(
            (a, b) => {
              const dateA =
                a.status === 'completed'
                  ? a.submittedAt.toDate()
                  : new Date(a.dueDate || 0);
  
              const dateB =
                b.status === 'completed'
                  ? b.submittedAt.toDate()
                  : new Date(b.dueDate || 0);
  
              return dateA - dateB; // Adjust sort order as needed
            }
          );
  
          setOriginalAssignments(allAssignments); // Store original data
          setAssignments(allAssignments);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };
  
    fetchAllAssignments();
  }, [classId, studentUid]);
  

  // Function to calculate overall average including incomplete assignments
  const calculateAverageScore = () => {
    if (assignments.length === 0) return 0;

    const totalScore = assignments.reduce((acc, assignment) => {
      if (
        assignment.status === 'completed' &&
        typeof assignment.score === 'number'
      ) {
        return acc + assignment.score;
      } else {
        // Assign zero for incomplete assignments
        return acc + 0;
      }
    }, 0);

    return Math.round(totalScore / assignments.length);
  };

  const averageScore = calculateAverageScore();

  // Function to filter assignments based on search term and date range
  const getFilteredAssignments = () => {
    if (!originalAssignments) return [];
    
    return originalAssignments.filter((assignment) => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        (assignment.assignmentName || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim());

      // Date filter
      const assignmentDate =
        assignment.status === 'completed'
          ? assignment.submittedAt.toDate()
          : new Date(assignment.dueDate || 0);

      const withinStartDate = !startDate || assignmentDate >= startDate;
      const withinEndDate = !endDate || assignmentDate <= endDate;

      return matchesSearch && withinStartDate && withinEndDate;
    });
  };

  useEffect(() => {
    setAssignments(getFilteredAssignments());
  }, [searchTerm, startDate, endDate, originalAssignments]);



  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // Update getGradeColors function
  const getGradeColors = (grade) => {
    if (grade === undefined || grade === null || grade === 0) return { color: '#858585', variant: 'clear' };
    if (grade < 60) return { color: '#c63e3e', variant: 'red' };
    if (grade < 70) return { color: '#ff8800', variant: 'orange' };
    if (grade < 80) return { color: '#ffc300', variant: 'yellow' };
    if (grade < 90) return { color: '#29c60f', variant: 'green' };
    if (grade < 100) return { color: '#006400', variant: 'darkgreen' };
    return { color: '#f198ff', variant: 'pink' };
  };

  // Add period styles
  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };

  // Update getStatusIcon function
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return { icon: Check, color: '#00DE09', variant: 'green' };
      case 'in_progress':
        return { icon: Circle, color: '#FFAA00', variant: 'yellow' };
      case 'not_started':
        return { icon: X, color: 'lightgrey', variant: 'clear' };
      case 'paused':
        return { icon: Pause, color: '#FFA500', variant: 'orange' };
      default:
        return { icon: X, color: 'lightgrey', variant: 'clear' };
    }
  };

  const navigateToResults = (assignment) => {
    if (assignment.status !== 'completed') return;

    const { type, id } = assignment;
    if (type === 'OE') {
      navigate(`/teacherStudentResults/${id}/${studentUid}/${classId}`);
    } else if (type === 'AMCQ') {
      navigate(`/teacherStudentResultsAMCQ/${id}/${studentUid}/${classId}`);
    } else if (type === 'MCQ') {
      navigate(`/teacherStudentResultsMCQ/${id}/${studentUid}/${classId}`);
    }
  };

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <Navbar userType="teacher" />

      <div style={{
        width: 'calc(100% - 200px)',
        marginLeft: '200px',
      }}>
        {/* Fixed Header */}
        <div style={{
          padding: '5px 4%',
          height: '60px',
          position: 'fixed',
          width: '92%',
          top: '0px',
          zIndex: '30',
          background: 'rgb(255,255,255,.95)',
          backdropFilter: 'blur(5px)',
          borderBottom: isScrolled ? '1px solid #ddd' : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'border-bottom 0.3s ease',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Student Name and Grade */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}>
              <h1 style={{ 
                fontSize: '1.3rem', 
                fontWeight: '400',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}>
                {studentName}
                <div 
                  onClick={() => setIsGraphExpanded(!isGraphExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                  }}
                >
                  <GlassContainer
                    size={0}
                    
          enableRotation={true}
                    variant={getGradeColors(averageScore).variant}
                    contentStyle={{
                      padding: '5px 10px',
                      textAlign: 'center',
                      display: 'flex',
                      height: '1rem',
                      
                    }}
                  >
                    <div style={{display: 'flex', marginTop: '-12px'}}>
                      <h1 style={{
                        color: getGradeColors(averageScore).color,
                        fontWeight: '500',
                        fontSize: '1rem',
                        fontFamily: "'Montserrat', sans-serif"
                      }}>
                        {averageScore}%
                      </h1>
                      <ChevronDown 
                        size={20} 
                        strokeWidth={2}
                        style={{
                          transform: isGraphExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                          color: getGradeColors(averageScore).color,
                          marginTop: '10px',
                          marginLeft: '5px'
                        }}
                      />
                    </div>
                  </GlassContainer>
                </div>
              </h1>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: '100px' }} />

        {/* Graph Section */}
        <div style={{
          height: isGraphExpanded ? '300px' : '0',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
          width: '92%',
          margin: '0 auto',
          opacity: isGraphExpanded ? 1 : 0,
        }}>
          <GradeProgressionChart2 
            grades={assignments} 
            periodStyle={getCurrentPeriodStyle()}
          />
        </div>

        {/* Search and Filters Row */}
        <div style={{
          width: '92%',
          margin: '20px auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
        }}>
          {/* Date Range Filters */}
          <div className="date-picker-container" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px'
          }}>
            <label htmlFor="start-date">From:</label>
            <StyledDatePickerComponent
              id="start-date"
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              isClearable
              placeholderText="Start Date"
            />
            <label htmlFor="end-date">To:</label>
            <StyledDatePickerComponent
              id="end-date"
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              isClearable
              placeholderText="End Date"
            />
          </div>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            width: '300px',
            border: '1px solid #ddd',
            borderRadius: '1rem'
          }}>
            <input
              type="text"
              placeholder="Search by Assignment Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '80%',
                padding: '8px 12px',
                paddingLeft: '40px',
                border: 'none',
                outline: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: "'Montserrat', sans-serif",
                background: 'transparent',
              }}
            />
            <Search 
              size={20} 
              color="#858585" 
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
        </div>

        {/* Assignments List */}
        <ul style={{
          padding: 0,
          marginTop: '20px',
          listStyleType: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {assignments.map((assignment) => {
            const isCompleted = assignment.status === 'completed';
            const gradeColors = isCompleted
              ? getGradeColors(assignment.score)
              : { color: 'grey', background: '#f4f4f4' };

            return (
              <li
                key={assignment.id}
                style={{
                  borderTop: '1px solid #ededed',
                  
                  padding: '20px 2%',
                  margin: '0px 2%',
                  
                  marginBottom: '-10px',
                  cursor: isCompleted ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={() => setHoveredAssignmentId(assignment.id)}
                onMouseLeave={() => setHoveredAssignmentId(null)}
                onClick={() => isCompleted && navigateToResults(assignment)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '50%',
                  }}
                >
                  {/* Assignment Name */}
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      textAlign: 'left',
                      maxWidth: '400px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#2c2c2c',
                    }}
                  >
                    {assignment.assignmentName}
                  </div>

                  {isCompleted ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      marginLeft: 'auto',
                      marginRight: '20%',
                    }}>
                      <GlassContainer
                        variant={getGradeColors(assignment.score).variant}
                        size={0}
                        style={{
                          marginRight: '10px',
                            zIndex: '10'
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
                            color: getGradeColors(assignment.score).color,
                            fontWeight: '500'
                          }}>
                            {getLetterGrade(assignment.score)}
                          </span>
                          <span style={{
                            width: '1px',
                            marginTop: '3px',
                            background: getGradeColors(assignment.score).color,
                            height: '10px',
                          }}/>
                          <span style={{
                            fontSize: '.8rem',
                            color: getGradeColors(assignment.score).color,
                            fontWeight: '500'
                          }}>
                            {assignment.score}%
                          </span>
                        </div>
                      </GlassContainer>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      marginLeft: 'auto',
                      marginRight: '85px',
                      color: assignment.status === 'paused'
                        ? '#FF4d00'
                        : assignment.status === 'in_progress'
                        ? '#FFA500'
                        : 'grey',
                      padding: '5px 10px',
                      textAlign: 'left',
                    }}>
                      {assignment.status === 'paused'
                        ? 'Paused'
                        : assignment.status === 'in_progress'
                        ? 'In Progress'
                        : 'Not Started'}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    width: '40%',
                  }}
                >
                  {/* Assignment Date */}
                  <div style={{
                    fontSize: '16px',
                    color: 'grey',
                    fontStyle: 'italic',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    <GlassContainer
                      variant={getStatusIcon(assignment.status).variant}
                      size={0}
                      style={{
                        marginRight: '10px',
                        zIndex: '10'
                      }}
                      contentStyle={{
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {React.createElement(
                        getStatusIcon(assignment.status).icon,
                        {
                          size: 12,
                          color: getStatusIcon(assignment.status).color,
                          strokeWidth: 2.5
                        }
                      )}
                    </GlassContainer>

                    <span style={{color: 'lightgrey', fontSize: '.9rem'}}>
                    {isCompleted
                      ? assignment.submittedAt.toDate().toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : assignment.dueDate
                      ? new Date(assignment.dueDate).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : 'No due date'}
                      </span>
                  </div>

                  {/* Assignment Type */}
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginLeft: 'auto',
                      color:
                        assignment.type === 'AMCQ'
                          ? '#2BB514'
                          : assignment.type === 'OE'
                          ? '#020CFF'
                          : '#2BB514',
                      textAlign: 'right',
                      width: '60px',
                    }}
                  >
                    {assignment.type === 'AMCQ'
                      ? 'MC*'
                      : assignment.type === 'OE'
                      ? 'OE'
                      : 'MC'}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default TeacherStudentGrades;
