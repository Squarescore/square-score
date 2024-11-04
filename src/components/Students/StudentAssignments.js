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
function StudentAssignmentsHome({ studentUid: propStudentUid }) {
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const studentUid = propStudentUid || auth.currentUser.uid;
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const isActiveOrCompleted = activeTab === 'active' || activeTab === 'completed';

  
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
const tabStyles = {
  active: { background: '#CCFFC3', color: '#00CD09', borderColor: '#00CD09'  },
  completed: { background: '#B9C4FF', color: '#020CFF', borderColor: '#020CFF' },
  upcoming: { background: '#FFF0A1', color: '#FC8518', borderColor: '#FCAE18'  },
  overdue: { background: '#FFE6E6', color: 'red', borderColor: 'red'  }
};
const periodStyles = {
  1: { background: '#A3F2ED', color: '#1CC7BC', borderColor: '#1CC7BC' },
  2: { background: '#F8CFFF', color: '#E01FFF', borderColor: '#E01FFF' },
  3: { background: '#FFCEB2', color: '#FD772C', borderColor: '#FD772C' },
  4: { background: '#FFECA9', color: '#F0BC6E', borderColor: '#F0BC6E' },
  5: { background: '#AEF2A3', color: '#4BD682', borderColor: '#4BD682' },
  6: { background: '#BAA9FF', color: '#8364FF', borderColor: '#8364FF' },
  7: { background: '#8296FF', color: '#3D44EA', borderColor: '#3D44EA' },
  8: { background: '#FF8E8E', color: '#D23F3F', borderColor: '#D23F3F' }
};

// Get period number from class name
const getPeriodNumber = (className) => {
  const match = className.match(/Period (\d)/);
  return match ? parseInt(match[1]) : null;
};
const periodNumber = getPeriodNumber(className);
const periodStyle = periodStyles[periodNumber] || { background: '#F4F4F4', color: 'grey' };

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
    const fetchClassData = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (classDoc.exists()) {
        setClassName(classDoc.data().className);
        setClassChoice(classDoc.data().classChoice);
      }

      const studentScoresRef = doc(classDocRef, 'studentScores', studentUid);
      const studentScoresDoc = await getDoc(studentScoresRef);

      if (studentScoresDoc.exists()) {
        const data = studentScoresDoc.data();
        setAverageScore(data.averageScore);
        setMostRecentScore(data.mostRecentScore);
      }
    };

    fetchClassData();
  }, [classId, studentUid]);


  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const studentDocRef = doc(db, 'students', studentUid);
        const studentDoc = await getDoc(studentDocRef);

        if (studentDoc.exists()) {
          const assignmentsToTake = studentDoc.data().assignmentsToTake || [];
          const assignmentsInProgress = studentDoc.data().assignmentsInProgress || [];

          const classAssignments = assignmentsToTake.filter(assignmentId => 
            assignmentId.startsWith(classId)
          );

          const inProgressAssignments = assignmentsInProgress.filter(assignmentId => 
            assignmentId.startsWith(classId)
          );

          const assignmentPromises = [...classAssignments, ...inProgressAssignments].map(async (assignmentId) => {
            let assignmentDocRef = doc(db, 'assignments', assignmentId);
           
            const assignmentDoc = await getDoc(assignmentDocRef);
            if (assignmentDoc.exists()) {
              return { 
                id: assignmentId, 
                ...assignmentDoc.data(), 
                inProgress: assignmentsInProgress.includes(assignmentId)
              };
            }
            return null;
          });

          const assignmentDetails = await Promise.all(assignmentPromises);
          const filteredAssignments = assignmentDetails.filter(assignment => assignment !== null);
          setAssignments(filteredAssignments);
        } else {
          console.log('Student document does not exist');
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    fetchAssignments();
  }, [classId, studentUid]);


  const isActiveAssignment = (assignment) => {
    const now = new Date();
    const assignDateTime = new Date(assignment.assignDate);
    const dueDateTime = new Date(assignment.dueDate);
    return now >= assignDateTime && now <= dueDateTime;
  };
  const getBorderColor = (assignment) => {
    const now = new Date();
    const assignDateTime = new Date(assignment.assignDate);
    const dueDateTime = new Date(assignment.dueDate);
  
    if (now < assignDateTime) return '#FFE3A6';
    if (now > dueDateTime) return '#FFD4D4';
    return '#EEEEEE'; // Light green for active assignments
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

  
  const handleBack = () => {
    navigate(-1);
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







  
const getAssignmentStyle = (assignment) => {
  const borderColor = getBorderColor(assignment);
  return {
    borderTop: `2px solid ${borderColor}`,
    cursor: borderColor === '#EEEEEE' ? 'default' : 'not-allowed',
  };
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
        border: '10px solid white',
        
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' ,
        fontFamily: 'Arial, sans-serif',
        zIndex: 100000
      }}>
        <div style={{
          backgroundColor: '#AEF2A3',
          color: '#2BB514',
          fontFamily: '"montserrat", sans-serif',
          border: '10px solid #2BB514', 
          borderTopRightRadius: '30px',
          borderTopLeftRadius: '30px',
          marginTop: '-10px',
          marginLeft: '-10px',
          width: '460px',
          opacity: '80%',
          textAlign: 'left',
          fontSize: '40px',
          padding: '12px 0px 10px 40px',
          fontWeight: 'bold'
        }}>
          Confirm
          <button 
            onClick={onCancel}
            style={{
              width: '50px',
              height: '50PX',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: 'bold',
              fontSize: '24px',
              position: 'absolute',
              right: '15px',
              top: '5px',
              borderRadius: '10px',
              color: '#2BB514',
              fontFamily: '"montserrat", sans-serif',
              backgroundColor: 'transparent',
              border: '5px solid transparent',
              cursor: 'pointer',
              transition: '.3s'
            }}
         >
          <SquareX size={40}/>
          
          </button>
        </div>
        <div style={{ padding: '20px 40px 10px 40px', textAlign: 'left', fontWeight: 'bold', fontFamily: '"montserrat", sans-serif', fontSize: '30px',  }}>
       <h1 style={{marginBottom: '20px',  fontSize: '40px', marginTop: '0px' }}>Enter {assignmentName}? </h1>
       
        <div style={{display: 'flex',}}>
      
        <h1 style={{fontSize: '30px', marginTop: '0px', marginRight: '20px',color: saveAndExit ? 'green' : 'grey', fontWeight: '600'}}>   Save and exit:</h1> 
        {saveAndExit ? <SquareCheck size={40} color="#00a832" /> : <SquareMinus size={40} color="#9c9c9c" />}
        </div>
        <div style={{display: 'flex'}}>
   
        <h1 style={{fontSize: '30px', marginTop: '0px', marginRight: '65px', color: lockdown ? 'green' : 'grey', fontWeight: '600'}}>   Lockdown:</h1>
        {lockdown ? <SquareCheck size={40} color="#00a832" /> : <SquareMinus size={40} color="#9c9c9c" />}
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
              width: '120px',
              marginRight: 'auto',
              marginLeft: '30px',
              height: '40PX',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: 'bold',
              fontSize: '24px',
              borderRadius: '10px',
              marginTop: '-10px',
              fontFamily: '"montserrat", sans-serif',
              backgroundColor: '#AEF2A3',
              border: '5px solid #45B434',
              color: '#45B434',
              cursor: 'pointer',
              transition: '.3s',
              marginBottom: '10px'
            }}
     
          >
            Enter
          </button>
         
        </div>
      </div>
    </div>
  );
  const filterAssignments = (assignments) => {
    const now = new Date();
    const filtered = {
      overdue: assignments.filter(a => new Date(a.dueDate) < now),
      active: assignments.filter(a => new Date(a.assignDate) <= now && new Date(a.dueDate) >= now),
      upcoming: assignments.filter(a => new Date(a.assignDate) > now)
    };
    return filtered;
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
    const assignmentPairs = [];
    for (let i = 0; i < completedAssignments.length; i += 2) {
      assignmentPairs.push(completedAssignments.slice(i, i + 2));
    }
  
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginLeft: '0px',
        width: '820px'
      }}>
        {assignmentPairs.map((pair, rowIndex) => (
        <div key={rowIndex} style={{
          display: 'flex',
          gap: '20px',
        }}>
           {pair.map((grade) => {
            const isAMCQ = grade.type === 'AMCQ';
            const isSAQ = grade.type === 'SAQ';
            const isMCQ = grade.type === 'MCQ';
            const percentage = Math.round(
              isAMCQ ? grade.SquareScore :
              isMCQ ? (grade.rawTotalScore / grade.maxRawScore) * 100 :
              grade.percentageScore
            );
               const letterGrade = getLetterGrade(percentage);

            return (
              <div key={grade.id} style={{
                backgroundColor: 'white',
                boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
                borderRadius: '15px',
                padding: '20px 0px',
                width: '400px',
                fontFamily: "'montserrat', sans-serif",
                position: 'relative',
                cursor: grade.viewable ? 'pointer' : 'not-allowed',
              }}
              onClick={() => {
                if (grade.viewable) {
                  navigate(`/studentresults${isAMCQ ? 'AMCQ' : (isSAQ ? '' : 'mcq')}/${grade.assignmentId}/${studentUID}/${classId}`);
                }
              }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  width: '380px', 
                  marginLeft: '20px', 
                  marginBottom: '20px', 
                  marginTop: '-0px'
                }}>
                  {grade.assignmentName}
                </h2>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginTop: '-5px', 
                  width: '400px' 
                }}>
                  <div style={{
                    width: '360px',
                    display: 'flex',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '5px',
                      marginTop: '0px',
                      textAlign: 'center'
                    }}>
                      <span style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: 'black',
                        lineHeight: '20px',
                        fontFamily: "'montserrat', sans-serif",
                        textAlign: 'center'
                      }}>
                        {letterGrade}
                      </span>
                    </div>

                    <span style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      width: '70px', 
                      marginLeft: '20px',
                      color: 'grey'
                    }}>
                      {percentage}%
                    </span>

                    <SquareCheck 
                      size={25} 
                      style={{
                        zIndex: '10',
                        width: '40px',
                        marginTop: '0px',
                        color: '#00DE09'
                      }}
                    />

                    <div style={{ 
                      fontSize: '14px',
                      color: 'grey',
                      fontStyle: 'italic',
                      fontWeight: 'bold',
                      marginLeft: '0px',
                      height: '20px',
                      marginTop: '5px',
                      width: '170px'
                    }}>
                      <span style={{ fontWeight: '600' }}>
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

                    <div style={{ 
                      fontSize: '16px',
                      fontWeight: 'bold',
                      width: '50px',
                      marginTop: '5px',
                      textAlign: 'left',
                      marginLeft: '10px',
                      color: isAMCQ ? '#2BB514' : (isSAQ ? '#020CFF' : '#2BB514')
                    }}>
                      {isAMCQ ? 'MCQ*' : (isSAQ ? 'SAQ' : 'MCQ')}
                    </div>
                  </div>

                  <span style={{ 
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    color: grade.viewable ? '#020CFF' : 'grey'
                  }}>
                    {grade.viewable ? <Eye size={25} strokeWidth={2} /> : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};




const renderAssignments = (assignments) => {
  return assignments.map((assignment, index) => {
    const getStatusIcon = () => {
      if (activeTab === 'active') {
        return '';
      } else if (activeTab === 'overdue') {
        return <CalendarX2 size={30} style={{ color: '#ff0000', strokeWidth: 2 }} />;
      } else if (activeTab === 'upcoming') {
        return <CalendarClock size={30} style={{ color: '#9C9C9C', strokeWidth: 2 }} />;
      }
      return null;
    };
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

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      };
      return date.toLocaleDateString('en-US', options);
    };

    // Get border color but don't apply top border if it's the first item
    const borderColor = getBorderColor(assignment);
    const style = {
      backgroundColor: 'white',
      fontSize: '30px',
      color: 'black',
      width: '800px',
      marginLeft: '0px',
      padding: '15px 10px',
      display: 'flex',
      fontFamily: "'montserrat', sans-serif",
      transition: '.3s',
      listStyleType: 'none',
      textAlign: 'center',
      position: "relative",
      ...(index !== 0 && { borderTop: `2px solid #f4f4f4` }),
      cursor: borderColor === '#EEEEEE' ? 'default' : 'not-allowed',
    };

    return (
      <div key={assignment.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <li
          key={assignment.id}
          style={style}
          onMouseEnter={(e) => {
            const now = new Date();
            const assignDateTime = new Date(assignment.assignDate);
            const dueDateTime = new Date(assignment.dueDate);
            if (now >= assignDateTime && now <= dueDateTime) {
              // Your mouse enter logic
            }
          }}
        >
          {/* Rest of your assignment rendering code stays exactly the same */}
          {isActiveOrCompleted && (
            <ArrowRight 
              onClick={() => navigateToTest(
                assignment.id, 
                format, 
                assignment.assignDate, 
                assignment.dueDate, 
                assignment.assignmentName,
                assignment.saveAndExit,
                assignment.lockdown 
              )}
              size={25}
              strokeWidth={2.4} 
              style={{ position: 'absolute', right: '10px', top: '17px', color: '#2BB514', cursor: 'pointer'}}
            />
          )}
          
          {/* Add the status icon */}
          <div style={{ position: 'absolute', right: '10px', top: '16px' }}>
            {getStatusIcon()}
          </div>
          {assignment.inProgress && (
            <div style={{ position: 'absolute', right: '60px', top: '20px', paddingLeft: '15px', fontWeight: 'bold', fontFamily: "'montserrat', sans-serif", border: '2px dashed lightgrey', fontSize: '15px', borderRadius: '5px', height:' 21px', width: '6px' }}>
              <Check style={{ marginLeft: '-14px', marginTop: '3px', color: 'lightgrey'}} size={15} strokeWidth={4}/>
              {assignment.status === 'Paused' && (
                <div style={{ 
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
                }}>
                  Paused
                </div>
              )}
            </div>
          )}
          <div style={{ 
            display: 'flex',  
            textAlign: 'left',  
            marginLeft: '0px',
            height: '30px', 
            width: '290px', 
            fontWeight: '700',
            fontSize: '18px',  
            lineHeight: '36px'
          }}>
            {assignment.assignmentName}
          </div>
      
            <h1 style={{ 
              color: 'lightgrey', 
              fontSize: '14px', 
              fontWeight: '600', 
              fontFamily: "'montserrat', sans-serif",
              marginTop: '10px', 
              fontStyle: 'italic',
              marginLeft: '10px', 
              width: '290px', 
              textAlign: 'left' 
            }}>
              {showDueDate ? formatDate(assignment.dueDate) : formatDate(assignment.assignDate)}
            </h1>
    
          <h1 style={{ 
            right: '95px',  
            top: '12px',  
            width: '60px', 
            textAlign: 'left', 
            fontSize: '16px', 
            position: 'absolute' 
          }}>
            {formatDisplay}
          </h1>
        </li>
      </div>
    );
  });
};

  return (
    <div style={{    minHeight: '100vh',
      width: '100%',
      backgroundColor: '#FCFCFC',
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
      
      if (format === 'AMCQ') {
        navigate(`/TakeAmcq/${confirmAssignment.id}`);
      } else if (format === 'ASAQ') {
        navigate(`/TakeAsaq/${confirmAssignment.id}`);
      } else if (format === 'MCQ') {
        navigate(`/TakeMcq/${confirmAssignment.id}`);
      } else if (format === 'SAQ') {
        navigate(`/taketests/${confirmAssignment.id}`);
      }
    }}
    onCancel={() => setShowConfirm(false)}
    assignmentName={confirmAssignment ? confirmAssignment.assignmentName : ''}
    saveAndExit={confirmAssignment ? confirmAssignment.saveAndExit : false}
    lockdown={confirmAssignment ? confirmAssignment.lockdown : false}
  />
)}
<div
      style={{
        position: 'fixed',
        width:'90px',
        height: '100%',
        background: 'white',
        boxShadow: '1px 1px 2px 1px rgb(0,0,0,.07)',
        backdropFilter: 'blur(5px)',
        zIndex: '90',
        transition: 'width 0.3s ease',
      }}
 
    >

      
         <div style={{
        marginTop: '166px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '20px'
      }}>
          {[
  { label: 'active', icon: BookOpen, tooltip: 'Active' },
  { label: 'completed', icon: BookOpenCheck, tooltip: 'Completed' },
  { label: 'upcoming', icon: CalendarClock, tooltip: 'Upcoming' },
  { label: 'overdue', icon: CalendarX2, tooltip: 'Overdue' }
].map(({label, icon: Icon, tooltip}) => (
  <div key={label}>
    <div style={{ 
      height: '4px', 
      width: '80px', 
      background: 'white', 
      marginLeft: '10px',  
      marginBottom: '25px',
    }}></div>
    <button
      onClick={() => setActiveTab(label)}
      style={{
        fontSize: '15px',
        fontFamily: "'montserrat', sans-serif",
        background: activeTab === label ? tabStyles[label].background : 'transparent',
        border: '4px solid transparent',
        boxShadow: activeTab === label ? '1px 1px 2px 1px rgb(0,0,0,.07)' : 'none',
        color: activeTab === label ? tabStyles[label].color : '#676767',
        borderRadius: '10px',
        padding: '5px 5px',
        width: '70px',
        marginLeft: '10px',
        height: '70px',
        marginBottom: '-10px',
        cursor: 'pointer',
        fontWeight: 'bold',
        alignItems: 'center',
        transition: 'all .3s ease',
      }}
      onMouseEnter={(e) => {
        if (activeTab !== label) {
          e.currentTarget.style.color = 'black';
          e.currentTarget.style.boxShadow = '1px 1px 2px 1px rgb(0,0,0,.07)';
          e.currentTarget.style.background = '#FAFAFA';
        }
      }}
      onMouseLeave={(e) => {
        if (activeTab !== label) {
          e.currentTarget.style.color = '#676767';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      <Tooltip text={tooltip}>
        <Icon 
          size={40} 
          style={{
            marginTop: '3px',
            transition: 'all .3s ease'
          }}
          color={activeTab === label ? tabStyles[label].color : '#9C9C9C'} 
          strokeWidth={activeTab === label ? 2.1 : 1.7} 
        />
      </Tooltip>
    </button>
  </div>
))}
</div>
          </div>

          <div style={{ width: '840px', marginRight: 'auto', marginLeft: 'auto', marginTop: '160px', }}>
          <div style={{ display: 'flex', width: '860px' }}>
          <div style={{   height: '150px',  paddingLeft: '30px', background: 'white', borderRadius: '15px',  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', width: '450px', marginLeft: '40px'}}> 
          <h1 style={{ 
          fontSize: `${textSize}px`,
          fontFamily: '"montserrat", sans-serif',
          fontWeight: '600',
          marginBottom: '10px',
          transition: 'font-size 0.3s ease',
          textAlign: 'left',
          color: '#2c2c2c'
        }}>
          {studentName}
        </h1>
        <h2 style={{ 
          fontSize: '24px',
          fontFamily: '"montserrat", sans-serif',
          fontWeight: '600',
          color: 'grey',
          textAlign: 'left'
        }}>
          Grade: {calculatedAverage}%
        </h2>
          </div>
          <div style={{   height: '150px',   position:'relative', background: 'white', borderRadius: '15px',  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', width: '315px', marginLeft: 'auto', }}> 
            <h1 style={{position: 'absolute', overflow: 'hidden',
                    textOverflow: 'ellipsis', top: '-15px',  backgroundColor: periodStyle.background,
                          color: periodStyle.color, border: '8px solid', width: '300px', fontSize: '20px', textAlign: 'center', height: '30px', paddingTop: '05px', borderRadius: '15px 15px 0px 0px ' }}>{classChoice}</h1>
            <h1 style={{textAlign: 'center', lineHeight: '130px', fontSize: '45px', fontWeight: '600',color: '#7C7C7C'}}>{className}</h1>
          </div>

          
          </div>
  <div style={{ 
    display: 'flex', 
    marginBottom: '40px', 
    marginTop: '50px',
    width: '780px', 
    position: 'relative', 
    marginLeft: '40px' 
  }}>
    <h1 style={{ 
      fontSize: '30px', 
      fontFamily: "'montserrat', sans-serif", 
      textAlign: 'left', 
      margin: '0', 
      flex: '1', 
      fontWeight: '600',
      marginBottom: '15px',
      marginLeft: '20px', 
    }}>
      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Assignments
    </h1>
    
    {activeTab !== 'completed' && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{
          fontSize: '15px',
          color: '#676767',
          fontWeight: '600',
          fontFamily: "'montserrat', sans-serif",
        }}>
           Show Dates By:
        </span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => setShowDueDate(false)}
            style={{
              background: showDueDate ? '#fcfcfc' : '#f4f4f4',
              color: '#B6B6B6',
              border: showDueDate ? '4px solid #fcfcfc' : '4px solid #f4f4f4',
              lineHeight: '18px',
              fontWeight: 'bold',
              padding: '0px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              height: '25px',
              position: 'relative',
              alignItems: 'center',
              fontFamily: "'montserrat', sans-serif",
              borderRadius: '5px'
            }}
          >
            {activeTab === 'upcoming' ? 'Assigns' : 'Assigned'}
          </button>
          <button
            onClick={() => setShowDueDate(true)}
            style={{
              background: showDueDate ? '#f4f4f4' : '#fcfcfc',
              color: '#B6B6B6',
              border: showDueDate ? '4px solid #f4f4f4' : '4px solid #fcfcfc',
              lineHeight: '18px',
              fontWeight: 'bold',
              padding: '0px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              height: '25px',
              position: 'relative',
              alignItems: 'center',
              fontFamily: "'montserrat', sans-serif",
              borderRadius: '5px'
            }}
          >
            Due
          </button>
        </div>
      </div>
    )}
  </div>
        <div style={{ position: 'relative' }}>

         
          <ul style={{ listStyleType: 'none', marginTop: '-30px' }}>
            {activeTab === 'completed' ? (
              completedAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '20px' }}>
                  No completed assignments
                </div>
              ) : (
                <div style={{width: '820px',  }}>
                {renderCompletedAssignments()}
                </div>
              )
            ) : (
              filteredAssignments[activeTab].length === 0 ? (
                <div style={{ textAlign: 'left', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '50px', marginLeft: '0px' }}>
                  No {activeTab} assignments
                </div>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '20px', 
                  borderRadius: '15px', 
                  boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , padding: '15px', background: 'white' }}>
              
              {renderAssignments(filteredAssignments[activeTab])}
</div>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StudentAssignmentsHome;
