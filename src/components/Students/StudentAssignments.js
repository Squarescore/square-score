import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, auth } from '../Universal/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../Universal/Navbar';
import { ArrowRight, CalendarClock, CalendarX2, BookOpen, BookOpenCheck, Eye, EyeOff, SquareMinus, SquareCheck, SquareDashedBottom,  SquareX,Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Tooltip from '../Teachers/TeacherAssignments/AssignmentsToolTip';
import { flushSync } from 'react-dom';
import { color } from 'framer-motion';
function StudentAssignmentsHome({ studentUid: propStudentUid }) {
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const studentUid = propStudentUid || auth.currentUser.uid;
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const isActiveOrCompleted = activeTab === 'active' || activeTab === 'completed';
  const [isHovered, setIsHovered] = useState(false);
  const [assignmentsPaused, setAssignmentsPaused] = useState([]);

  // U
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [mostRecentScore, setMostRecentScore] = useState(null);
  const [classChoice, setClassChoice] = useState('');
  const [className, setClassName] = useState('');
  const [showDueDate, setShowDueDate] = useState(true);
  const [hoveredAssignment, setHoveredAssignment] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
const [confirmAssignment, setConfirmAssignment] = useState(null);
const [studentName, setStudentName] = useState('');
const [textSize, setTextSize] = useState(40);
const [calculatedAverage, setCalculatedAverage] = useState(0);
const [hoveredAssignmentId, setHoveredAssignmentId] = useState(null);
  
  
// Set initial tab based on URL path
useEffect(() => {
  const path = location.pathname;
  if (path.includes('/active')) {
    setActiveTab('active');
  } else if (path.includes('/completed')) {
    setActiveTab('completed');
  } else if (path.includes('/upcoming')) {
    setActiveTab('upcoming');
  } else if (path.includes('/overdue')) {
    setActiveTab('overdue');
  } else {
    // Default to active if no specific tab in URL
    setActiveTab('active');
  }
}, [location.pathname]);

// Update URL when tab changes


useEffect(() => {
  if (completedAssignments.length > 0) {
    const totalScore = completedAssignments.reduce((sum, assignment) => {
      const score = assignment.type === 'AMCQ' ? 
        assignment.SquareScore : 
        assignment.percentageScore;
      return sum + score;
    }, 0);
    const average = totalScore / completedAssignments.length;
    setCalculatedAverage(Math.round(average));
  }
}, [completedAssignments]);
useEffect(() => {
  const fetchStudentData = async () => {
    try {
      const studentDoc = await getDoc(doc(db, 'students', studentUid));
      if (studentDoc.exists()) {
        const userData = studentDoc.data();
        const fullName = `${userData.firstName} ${userData.lastName}`;
        setStudentName(fullName);
        // Adjust text size based on name length
        const baseSize = 40;
        const adjustedSize = Math.min(baseSize, (baseSize * 20) / fullName.length);
        setTextSize(adjustedSize);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  fetchStudentData();
}, [studentUid]);


// Get period number from class name

const studentUID = auth.currentUser.uid;
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || // Ctrl+Shift+I or Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
      }
    };

    // Detect if DevTools is open
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        // Optionally, you can redirect or take other actions here
        console.log('DevTools detected');
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Check for DevTools periodically
    const interval = setInterval(detectDevTools, 1000);

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);
  
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const studentDocRef = doc(db, 'students', studentUid);
        const studentDoc = await getDoc(studentDocRef);
  
        if (studentDoc.exists()) {
          const assignmentsToTake = studentDoc.data().assignmentsToTake || [];
          const assignmentsInProgress = studentDoc.data().assignmentsInProgress || [];
          const assignmentsPaused = studentDoc.data().assignmentsPaused || []; // Changed from pausedAssignments
          setAssignmentsPaused(assignmentsPaused);
  
          const classAssignments = assignmentsToTake.filter(assignmentId => 
            assignmentId.startsWith(classId)
          );
  
          const inProgressAssignments = assignmentsInProgress.filter(assignmentId => 
            assignmentId.startsWith(classId)
          );
  
          // Get all assignments including paused ones
          const allAssignmentIds = [...new Set([
            ...classAssignments,
            ...inProgressAssignments,
            ...assignmentsPaused.filter(id => id.startsWith(classId))
          ])];
  
          const assignmentPromises = allAssignmentIds.map(async (assignmentId) => {
            const assignmentDocRef = doc(db, 'assignments', assignmentId);
            const assignmentDoc = await getDoc(assignmentDocRef);
            
            if (assignmentDoc.exists()) {
              return { 
                id: assignmentId, 
                ...assignmentDoc.data(), 
                inProgress: assignmentsInProgress.includes(assignmentId),
                isPaused: assignmentsPaused.includes(assignmentId) // Use assignmentsPaused instead
              };
            }
            return null;
          });
  
          const assignmentDetails = await Promise.all(assignmentPromises);
          const filteredAssignments = assignmentDetails.filter(assignment => assignment !== null);
          setAssignments(filteredAssignments);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
  
    fetchAssignments();
  }, [classId, studentUid]);


  const getAssignmentStatus = (assignment) => {
    if (assignment.isPaused) {
      return {
        text: "Paused",
        color: "#FFA500",
        clickable: false
      };
    }
    if (assignment.inProgress) {
      return {
        text: "In Progress",
        color: "#2BB514",
        clickable: true
      };
    }
    return {
      text: "Not Started",
      color: "grey",
      clickable: true
    };
  };

  

  useEffect(() => {
    const fetchCompletedAssignments = async () => {
      try {
        // Query the unified 'grades' collection where 'studentUid' and 'classId' match
        const gradesQuery = query(
          collection(db, 'grades'),
          where('studentUid', '==', studentUid),
          where('classId', '==', classId)
        );
  
        const gradesSnapshot = await getDocs(gradesQuery);
  
        // Map through the grades and parse the type from the document ID
        const grades = gradesSnapshot.docs.map(doc => {
          const id = doc.id;
          const data = doc.data();
  
          // Parse the 'format' from the document ID
          const format = parseFormatFromId(id);
  
          return { 
            id: doc.id, 
            ...data, 
            type: format,
            submittedAt: data.submittedAt // Ensure this exists or handle accordingly
          };
        });
  
        // Sort grades by 'submittedAt' descending
        const sortedGrades = grades.sort((a, b) => {
          if (a.submittedAt && b.submittedAt) {
            return b.submittedAt.toDate() - a.submittedAt.toDate();
          }
          return 0;
        });
  
        setCompletedAssignments(sortedGrades);
      } catch (error) {
        console.error("Error fetching grades:", error);
      }
    };
  
    fetchCompletedAssignments();
  }, [classId, studentUid]);
  
  // Helper function to parse the format from the document ID
const parseFormatFromId = (id) => {
  // Example ID: "math101+1633072800000+AMCQ_student123"
  // Split the ID by '+' to isolate the format_studentId part
  const parts = id.split('+');

  if (parts.length < 3) return 'UNKNOWN'; // Ensure the ID has enough parts

  const formatStudentId = parts[2]; // "AMCQ_student123"

  // Split by '_' to separate format and studentId
  const formatParts = formatStudentId.split('_');

  if (formatParts.length < 1) return 'UNKNOWN';

  const format = formatParts[0]; // "AMCQ"

  // Validate the format
  const validFormats = ['SAQ', 'AMCQ', 'MCQ'];
  return validFormats.includes(format) ? format : 'UNKNOWN';
};

  
  
  
  const navigateToTest = async (assignmentId, format, assignDate, dueDate, assignmentName, saveAndExit, lockdown) => {
    const now = new Date();
    const assignDateTime = new Date(assignDate);
    const dueDateTime = new Date(dueDate);
  
    if (now < assignDateTime) {
      alert("This assignment is not available yet.");
      return;
    }
  
    if (now > dueDateTime) {
      alert("This assignment is past due.");
      return;
    }
  
    // Check if the assignment is paused
    const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists() && progressDoc.data().status === 'Paused') {
      alert("This assignment is currently paused by your teacher.");
      return;
    }
  
    setConfirmAssignment({ id: assignmentId, format, assignmentName, saveAndExit, lockdown });
    setShowConfirm(true);
  };








  const RetroConfirm = ({ onConfirm, onCancel, assignmentName, saveAndExit, lockdown }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backdropFilter: 'blur(5px)',
      background: 'rgba(255,255,255,0.8)',
      zIndex: 100
    }}>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        borderRadius: '20px',
        backdropFilter: 'blur(5px)',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        backgroundColor: 'rgb(255,255,255,.001)',
        border: '1px solid lightgrey',
        
        fontFamily: 'Arial, sans-serif',
        zIndex: 100000
      }}>
       
        <div style={{ padding: '40px 40px 20px 40px', textAlign: 'left', fontWeight: '600', fontFamily: '"montserrat", sans-serif', fontSize: '30px',  }}>
       <h1 style={{marginBottom: '20px',  fontSize: '25px', fontWeight: '600', marginTop: '0px' }}>Enter {assignmentName}? </h1>
       
        <div style={{display: 'flex',}}>
      
        <h1 style={{fontSize: '20px', marginTop: '0px', marginRight: 'auto',color: saveAndExit ? 'green' : 'grey', fontWeight: '500'}}>   Save and exit:</h1> 
        {saveAndExit ? <SquareCheck size={25} color="#00a832" /> : <SquareMinus size={25} color="#9c9c9c" />}
        </div>
        <div style={{display: 'flex'}}>
   
        <h1 style={{fontSize: '20px', marginTop: '0px', marginRight: 'auto', color: lockdown ? 'green' : 'grey', fontWeight: '500'}}>   Lockdown:</h1>
        {lockdown ? <SquareCheck size={25} color="#00a832" /> : <SquareMinus size={25} color="#9c9c9c" />}
        </div>

      </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '10px'
        }}>
          <button 
            onClick={onConfirm}
            style={{
              width: '100px',
              marginRight: '0px',
              marginLeft: '30px',
              height: '30px',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: '600',
              fontSize: '16px',
              borderRadius: '5px',
              marginTop: '-10px',
              fontFamily: '"montserrat", sans-serif',
              backgroundColor: 'white',
              border: '1px solid lightgrey',
              color: '#45B434',
              cursor: 'pointer',
              transition: '.3s',
              marginBottom: '10px'
            }}
     
          >
            Enter
          </button>
         




          <button 
                onClick={onCancel}
            style={{
              width: '100px',
              marginRight: 'auto',
              marginLeft: '30px',
              height: '30px',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: '600',
              fontSize: '16px',
              borderRadius: '5px',
              marginTop: '-10px',
              fontFamily: '"montserrat", sans-serif',
              backgroundColor: 'white',
              border: '1px solid lightgrey',
              color: 'grey',
              cursor: 'pointer',
              transition: '.3s',
              marginBottom: '10px'
            }}
     
          >
            Cancel
          </button>



        </div>
      </div>
    </div>
  );
  const filterAssignments = (assignments) => {
    const now = new Date();
    
    return {
      overdue: assignments.filter(a => new Date(a.dueDate) < now),
      active: assignments.filter(a => {
        const assignDate = new Date(a.assignDate);
        const dueDate = new Date(a.dueDate);
        return assignDate <= now && dueDate >= now;
      }),
      upcoming: assignments.filter(a => new Date(a.assignDate) > now)
    };
  };

  const filteredAssignments = filterAssignments(assignments);

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

 
  
      
  const renderCompletedAssignments = () => {
    
    const getGradeColors = (grade) => {
      if (grade === undefined || grade === null) return { color: 'grey', background: '#f4f4f4' };
      if (grade < 50) return { color: '#FF0000', background: '#FFCBCB' };
      if (grade < 70) return { color: '#FF4400', background: '#FFC6A8' };
      if (grade < 80) return { color: '#EFAA14', background: '#FFF4DC' };
      if (grade < 90) return { color: '#9ED604', background: '#EDFFC1' };
      if (grade > 99) return { color: '#E01FFF', background: '#F7C7FF' };
      return { color: '#2BB514', background: '#D3FFCC' };
    };
  

    return (
      <div style={{ 
        display: 'flex',marginLeft: "-4%",
      
        flexDirection: 'column',
        gap: '1px',
      }}>
        {completedAssignments.map((grade) => {
          const isAMCQ = grade.type === 'AMCQ';
          const isSAQ = grade.type === 'SAQ';
          const isMCQ = grade.type === 'MCQ';
          const percentage = Math.round(
            isAMCQ ? grade.SquareScore :
            isMCQ ? (grade.rawTotalScore / grade.maxRawScore) * 100 :
            grade.percentageScore
          );
          const letterGrade = getLetterGrade(percentage);
          const gradeColors = getGradeColors(percentage);
          return (
            <div 
              key={grade.id} 
              style={{
                backgroundColor: hoveredAssignmentId === grade.id ? '#FBFEFF' : 'white',
                height: '70px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #EDEDED',
                cursor: grade.viewable ? 'pointer' : 'not-allowed',
                transition: '.3s',
                position: 'relative'
              }}
              onMouseEnter={() => setHoveredAssignmentId(grade.id)}
              onMouseLeave={() => setHoveredAssignmentId(null)}
              onClick={() => {
                if (grade.viewable) {
                  navigate(`/studentresults${isAMCQ ? 'AMCQ' : (isSAQ ? '' : 'mcq')}/${grade.assignmentId}/${studentUID}/${classId}`);
                }
              }}
            >
              {/* Assignment Name - Fixed 4% left margin */}
              <div style={{ 
                marginLeft: '4%',
                width: '350px',
                fontWeight: '600',
                fontSize: '16px',
                fontFamily: "'montserrat', sans-serif",
              }}>
                {grade.assignmentName}
              </div>
  
              {/* Center content - Equally distributed */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                flex: 1,
                marginLeft: '20px',
                marginRight: '20px'
              }}>
                {/* Letter Grade */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: "'montserrat', sans-serif",
                  color: 'black',
                  width: '30px',
                  textAlign: 'center'
                }}>
                  {letterGrade}
                </div>
  
                {/* Percentage */}
                <div style={{
                  fontSize: '16px',
                  padding: '5px',
                  width: '40px',
                  borderRadius: '5px',
                  textAlign: 'center',
                  color: gradeColors.color,
                  backgroundColor: gradeColors.background
                }}>
                 {percentage}%
                </div>
  
                {/* Submission Date with Check Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'grey',
                  fontStyle: 'italic',
                  fontWeight: '600',
                  gap: '5px',
                  width: '210px'
                }}>
                  <SquareCheck 
                    size={20}
                    style={{
                      color: '#00DE09',
                      marginTop: '1px'
                    }}
                  />
                  <span style={{
                    fontSize: '16px',
                    marginTop: '2px'
                  }}>
                    {grade.submittedAt ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
              <div style={{
                marginRight: '3%'
              }}>
                {grade.viewable ? (
                  <Eye 
                    size={20} 
                    color="#020CFF" 
                    strokeWidth={2}
                  />
                ) : (
                  <EyeOff 
                    size={20} 
                    color="transparent" 
                    strokeWidth={2}
                  />
                )}
              </div>
              {/* Format Type - Fixed position from right margin */}
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',marginRight: '4%',
                width: '50px',
                textAlign: 'right',
                color: isAMCQ ? '#2BB514' : (isSAQ ? '#020CFF' : '#2BB514'),
              
              }}>
                {isAMCQ ? 'MCQ*' : (isSAQ ? 'SAQ' : 'MCQ')}
              </div>
  
              {/* Eye Icon - Fixed 4% right margin */}
              
            </div>
          );
        })}
      </div>
    );
  };



const renderAssignments = (assignments) => {
  return assignments.map((assignment) => {
    const status = getAssignmentStatus(assignment);
    const isClickable = status.clickable && (isActiveOrCompleted || !assignment.isPaused);
    


    const format = assignment.id.split('+').pop();
    let formatDisplay;
    if (format === 'SAQ') {
      formatDisplay = <span style={{ color: '#020CFF' }}>SAQ</span>;
    } else if (format === 'ASAQ') {
      formatDisplay = (
        <span>
          <span style={{ color: '#020CFF' }}>SAQ</span>
          <span style={{ color: '#F4C10A' }}>*</span>
        </span>
      );
    } else if (format === 'MCQ') {
      formatDisplay = <span style={{ color: '#2BB514' }}>MCQ</span>;
    } else if (format === 'AMCQ') {
      formatDisplay = (
        <span>
          <span style={{ color: '#2BB514' }}>MCQ</span>
          <span style={{ color: '#F4C10A' }}>*</span>
        </span>
      );
    }

    const formatDate = (dateString, showDueDate, activeTab) => {
      const date = new Date(dateString);
      const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      return ` ${date.toLocaleDateString('en-US', options)}`;
    };

    const isHoveredAssignment = hoveredAssignmentId === assignment.id;
    
    const listItemStyle = {
      backgroundColor: isHoveredAssignment && isActiveOrCompleted ? '#FBFEFF' : 'white',
      fontSize: '30px',
      color: 'black',
      marginLeft: '-4%',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      fontFamily: "'montserrat', sans-serif",
      transition: '.3s',
      listStyleType: 'none',
      textAlign: 'center',
      position: "relative",
      borderBottom: `1px solid #EDEDED ` ,
      cursor: isActiveOrCompleted ? 'pointer' : 'default'
    };
   
      const progressIndicatorStyle = {
        position: 'absolute',
        right: '60px',
        top: '50%',
        color: 'blue',
        transform: 'translateY(-50%)',
        paddingLeft: '15px',
        fontWeight: 'bold',
        fontFamily: "'montserrat', sans-serif",
        fontSize: '15px',
        borderRadius: '5px',
        height: '21px',
        width: '6px',
        display: 'flex',
        alignItems: 'center'
      };
    
      
    
      const pausedLabelStyle = {
        position: 'absolute',
        top: '15px',
        left: '20px',
        backgroundColor: '#FFA500',
        paddingLeft: '15px',
        fontWeight: 'bold',
        color: 'white',
        paddingRight: '15px',
        fontFamily: "'montserrat', sans-serif",
        border: '0px solid white',
        fontSize: '18px',
        borderRadius: '5px'
      };
    
      const assignmentNameStyle = {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'left',
        marginLeft: '4%',
        height: '30px',
        width: '40%',
        overflow: 'hidden',
        maxWidth: '280px',
        fontWeight: '600',
        fontSize: '18px'
      };
    
      const dateDisplayStyle = {
        color: activeTab === 'active' ? 'grey' : (activeTab === 'upcoming' ? '#FC8518' : '#F59999'),
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: "'montserrat', sans-serif",
       
        marginLeft: '5%', marginRight: '5%',
        width: '270px',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        height: '30px'
      };
    
      const formatDisplayStyle = {
        marginLeft: 'auto',
        marginTop: '10px',
        width: '120px',

        textAlign: 'left',
        fontSize: '16px',
      };
      return (
        <li 
          key={assignment.id}
          style={listItemStyle}
          onMouseEnter={() => isClickable && setHoveredAssignmentId(assignment.id)}
          onMouseLeave={() => setHoveredAssignmentId(null)}
          onClick={() => {
            if (isClickable && !assignment.isPaused) {
              navigateToTest(
                assignment.id,
                format,
                assignment.assignDate,
                assignment.dueDate,
                assignment.assignmentName,
                assignment.saveAndExit,
                assignment.lockdown
              );
            }
          }}
        >
       
          {assignment.inProgress && (
            <div style={progressIndicatorStyle}>
             
              {assignment.status === 'Paused' && (
                <div style={pausedLabelStyle}>
                  Paused
                </div>
              )}
            </div>
          )}

          <div style={assignmentNameStyle}>
          {assignment.assignmentName}
          </div>
          <h1 style={dateDisplayStyle}>
   {formatDate(assignment.assignDate)}</h1>
          <h1 style={dateDisplayStyle}>
   {formatDate(assignment.dueDate)}</h1>

          <h1 style={formatDisplayStyle}>
            {formatDisplay}
          </h1>


          <h1 style={{fontSize: '14px', color: 'lightgrey', textAlign: 'right', fontWeight: '600', width: '150px', marginRight: '4%',
            
          }}>
       {status.text}
            
          </h1>
        </li>
    );
  });
};

  return (
    <div style={{    minHeight: '100vh',
      width: '100%',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative' }}>
      <Navbar userType="student" />
  
 {showConfirm && (
 <RetroConfirm 
 onConfirm={() => {
   setShowConfirm(false);
   // Get the format from the assignment ID
   const format = confirmAssignment.id.split('+')[2];
   
   let path = '';
   if (format === 'AMCQ') {
     path = `/TakeAmcq/${confirmAssignment.id}`;
   } else if (format === 'ASAQ') {
     path = `/TakeAsaq/${confirmAssignment.id}`;
   } else if (format === 'MCQ') {
     path = `/TakeMcq/${confirmAssignment.id}`;
   } else if (format === 'SAQ') {
     path = `/taketests/${confirmAssignment.id}`;
   }

   // Navigate with state
   navigate(path, { state: { allowAccess: true }, replace: true });
 }}
 onCancel={() => setShowConfirm(false)}
 assignmentName={confirmAssignment ? confirmAssignment.assignmentName : ''}
 saveAndExit={confirmAssignment ? confirmAssignment.saveAndExit : false}
 lockdown={confirmAssignment ? confirmAssignment.lockdown : false}
/>

)}


          <div style={{  width: 'calc(100% - 200px)', marginLeft: '200px' }}>
          <div style={{ display: 'flex',  }}>
          <div style={{   height: '120px',   background: 'white',  borderBottom: '1px solid lightgrey', width: '100%',  position: 'relative'}}> 
          <h1 style={{ 
        fontSize: '30px',
        marginLeft: '4%',
          fontFamily: '"montserrat", sans-serif',
          fontWeight: '700',
          marginBottom: '10px',
          transition: 'font-size 0.3s ease',
          textAlign: 'left',
          color: '#2c2c2c'
        }}>
           {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Assignments
        </h1>
      
   
        <div style={{height: '80px ', position: 'absolute', marginLeft:'auto',  borderRadius: '15px', width: '80px ',  top:'20px' ,background: 'white', right: '4%', }}>
       <img style={{ width: '80px',   }} src="/Score.svg" alt="logo" />
     
       <div style={{fontSize: '25px', fontWeight: 'bold', width: '80px', height: '80px',position: 'absolute', background: 'transparent',  borderRadius:  '10px', top: '-35px', left: '0px', textAlign: 'center', lineHeight: '150px'}}> 
       {calculatedAverage}
          </div>    
           </div>


          </div>
        

          
          </div>
 



        
          <ul style={{ listStyleType: 'none', marginTop: '0px',  }}>
            {activeTab === 'completed' ? (
              completedAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '20px' }}>
                  No completed assignments
                </div>
              ) : (
                <div style={{width: '100%',  }}>
                {renderCompletedAssignments()}
                </div>
              )
            ) : (
              filteredAssignments[activeTab].length === 0 ? (
                <div style={{ textAlign: 'left', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '20px',}}>
                  No {activeTab} assignments
                </div>
              ) : (
                <div style={{width: '100%' }} >
              

              <div style={{ marginTop: '-30px',
      color: 'grey', display: 'flex', position: 'relative', bottom: '10px', zIndex: '10',   width: '100%',
 
 alignItems: 'center',
        marginLeft: '0%',}}>
      <h1 style={{fontWeight: '600' ,
         fontSize: '14px', width: '40%', maxWidth: '285px',
         }}> Assignment Name</h1>

      <h1 style={{fontWeight: '600' , fontSize: '14px', 
      marginLeft: '5%', marginRight: '5%',
      width: '270px',
      }}>Date Assigned</h1>

<h1 style={{fontWeight: '600' , fontSize: '14px', 
       marginLeft: '5%', marginRight: '5%',
      width: '270px',
      }}>Date Due</h1>


<h1 style={{fontWeight: '600' , fontSize: '14px', 
      marginLeft: 'auto',
      width: '270px',
      marginRight: '4%'
      
      }}>Format</h1>








      </div>






              {renderAssignments(filteredAssignments[activeTab])}
</div>
              )
            )}
          </ul>
        
      </div>
    </div>
  );
}

export default StudentAssignmentsHome;
