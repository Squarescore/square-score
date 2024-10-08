import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, auth } from '../Universal/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../Universal/Navbar';
import { ArrowRight, CalendarClock, CalendarX2, BookOpen, BookOpenCheck, Eye, EyeOff, SquareMinus, SquareCheck, DoorOpen, YoutubeIcon, ArrowRightSquare, SquareX } from 'lucide-react';
import { useLocation } from 'react-router-dom';
function StudentAssignmentsHome({ studentUid: propStudentUid }) {
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const studentUid = propStudentUid || auth.currentUser.uid;
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const [className, setClassName] = useState('');
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [mostRecentScore, setMostRecentScore] = useState(null);
  const [classChoice, setClassChoice] = useState('');
  const [showDueDate, setShowDueDate] = useState(true);
  const [hoveredAssignment, setHoveredAssignment] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
const [confirmAssignment, setConfirmAssignment] = useState(null);

const tabStyles = {
  active: { background: '#CCFFC3', color: '#00CD09', borderColor: '#00CD09'  },
  completed: { background: '#B9C4FF', color: '#020CFF', borderColor: '#020CFF' },
  upcoming: { background: '#FFF0A1', color: '#FC8518', borderColor: '#FCAE18'  },
  overdue: { background: '#FFE6E6', color: '#CC0000', borderColor: '#CC0000'  }
};

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
            let assignmentDocRef;
            if (assignmentId.endsWith('AMCQ')) {
              assignmentDocRef = doc(db, 'assignments(Amcq)', assignmentId);
            } else if (assignmentId.endsWith('ASAQ')) {
              assignmentDocRef = doc(db, 'assignments(Asaq)', assignmentId);
            } else if (assignmentId.endsWith('MCQ')) {
              assignmentDocRef = doc(db, 'assignments(mcq)', assignmentId);
            } else {
              assignmentDocRef = doc(db, 'assignments(saq)', assignmentId);
            } 
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
  
    if (now < assignDateTime) return 'grey';
    if (now > dueDateTime) return 'red';
    return '#AEF2A3'; // Light green for active assignments
  }; useEffect(() => {
    const fetchCompletedAssignments = async () => {
      const saqGradesQuery = query(
        collection(db, 'grades(saq)'),
        where('studentUid', '==', studentUid),
        where('classId', '==', classId)
      );
  
      const amcqGradesQuery = query(
        collection(db, 'grades(AMCQ)'),
        where('studentUid', '==', studentUid),
        where('classId', '==', classId)
      );

      const mcqGradesQuery = query(
        collection(db, 'grades(mcq)'),
        where('studentUid', '==', studentUid),
        where('classId', '==', classId)
      );
      
      const [saqSnapshot, amcqSnapshot, mcqSnapshot] = await Promise.all([
        getDocs(saqGradesQuery),
        getDocs(amcqGradesQuery),
        getDocs(mcqGradesQuery)
      ]);
  
      const saqGrades = saqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'SAQ' }));
      const amcqGrades = amcqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'AMCQ' }));
      const mcqGrades = mcqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'MCQ' }));
  
      const allGrades = [...saqGrades, ...amcqGrades, ...mcqGrades].sort((a, b) => b.submittedAt.toDate() - a.submittedAt.toDate());
      setCompletedAssignments(allGrades);
    };
  
    fetchCompletedAssignments();
  }, [classId, studentUid]);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const navigateToTest = async (assignmentId, type, assignDate, dueDate, assignmentName, saveAndExit) => {
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
    const progressRef = doc(db, 'assignments(progress:saq)', `${assignmentId}_${studentUid}`);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists() && progressDoc.data().status === 'Paused') {
      alert("This assignment is currently paused by your teacher.");
      return;
    }
  
    setConfirmAssignment({ id: assignmentId, type, assignmentName, saveAndExit });
    setShowConfirm(true);
  };

const getAssignmentStyle = (assignment) => {
  const borderColor = getBorderColor(assignment);
  return {
    border: `4px solid ${borderColor}`,
    cursor: borderColor === '#AEF2A3' ? 'pointer' : 'not-allowed',
    opacity: borderColor === '#AEF2A3' ? 1 : 0.5
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
        border: '10px solid #f4f4f4',
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
      
        <h1 style={{fontSize: '30px', marginTop: '0px', marginRight: '20px',color: saveAndExit ? 'green' : 'grey'}}>   Save and exit:</h1> 
        {saveAndExit ? <SquareCheck size={40} color="#00a832" /> : <SquareMinus size={40} color="#9c9c9c" />}
        </div>
        <div style={{display: 'flex'}}>
   
        <h1 style={{fontSize: '30px', marginTop: '0px', marginRight: '65px', color: lockdown ? 'green' : 'grey'}}>   Lockdown:</h1>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginLeft: '-40px', }}>
        {assignmentPairs.map((pair, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {pair.map((grade) => {
              const isAMCQ = grade.type === 'AMCQ';
              const isSAQ = grade.type === 'SAQ';
              const isMCQ = grade.type === 'MCQ';
              const percentage = Math.round(isAMCQ ? grade.SquareScore : grade.percentageScore);
              const percentageMCQ = Math.round((isMCQ ? grade.rawTotalScore / grade.maxRawScore : 0) * 100);
              const letterGrade = getLetterGrade(percentage);
  
              return (
                <div key={grade.id} style={{
                  backgroundColor: 'white',
                  border: grade.viewable ? '4px solid #f4f4f4' : '4px solid #f4f4f4',
                  borderRadius: '15px',
                  padding: '15px',
                  width: '400px',
                  fontFamily: "'montserrat', sans-serif",
                  position: 'relative',
                  height: '70px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: grade.viewable ? 'pointer' : 'not-allowed',
                }}
                onClick={() => {
                  if (grade.viewable) {
                    navigate(`/studentresults${isAMCQ ? 'AMCQ' : (isSAQ ? '' : 'mcq')}/${grade.assignmentId}/${studentUID}/${classId}`);
                  }
                }}    >
                  <div>
                    <h2 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>{grade.assignmentName}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{width: '24px', height: '24px', background: '#627BFF', border: '6px solid blue', borderRadius: '5px'}}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold' , color: 'white', marginLeft: '5px',lineHeight: '26px',
                  fontFamily: "'montserrat', sans-serif",}}>
                        {isAMCQ || isMCQ ? `${percentage}` : `${letterGrade}`}
                      </span>
                      </div>
                      <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {isAMCQ || isMCQ ? `${percentage}%` : `${percentage}%`}
                      </span>
                      <div style={{ fontSize: '14px', color: 'lightgrey' , fontStyle: 'italic', fontWeight: 'bold'}}>
                  {grade.submittedAt ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : 'N/A'}
                  </div>
                 
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: isAMCQ ? '#2BB514' : (isSAQ ? '#020CFF' : '#2BB514') }}>
                        {isAMCQ ? 'MCQ*' : (isSAQ ? 'SAQ' : 'MCQ')}
                      </span>
                      <span style={{color: grade.viewable ? 'grey' : 'lightgrey', marginTop: '5px' }}>
                    {grade.viewable ? <Eye size={25} strokeWidth={2.8} /> : <EyeOff size={25} strokeWidth={2.8} />}
                  </span>
                    </div>
                  </div>
                 
                  <div style={{position: 'absolute', background: grade.viewable ? '#B9C4FF' : '#f4f4f4',color: grade.viewable ? '#020CFF' : 'grey', height: '25px', border: grade.viewable ? '4px solid #020CFF' : '4px solid lightgrey',  width: '400px', padding: '5px 15px', borderTopLeftRadius: '15px', borderTopRightRadius: '15px',  top: '-4px', left: '-4px'}}>
                 
                  <h2 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>{grade.assignmentName}</h2>
                  <span style={{ position: 'absolute', top: '6px', right: '10px', color: grade.viewable ? '#020CFF' : 'grey' }}>
                    {grade.viewable ? <ArrowRight size={25} strokeWidth={2.8} /> : ''}
                  </span>
                  </div>


                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };





  const renderAssignments = (assignments) => {
    return assignments.map(assignment => {
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
  
      return (
        <div key={assignment.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <li
            key={assignment.id}
            style={{
              backgroundColor: 'white',
              fontSize: '30px',
              color: 'black',
              height: '80px',
              width: '700px',
              marginLeft: '-40px',
              cursor: 'default',
              fontFamily: "'montserrat', sans-serif",
              transition: '.3s',
              listStyleType: 'none',
              textAlign: 'center',
              marginTop: '30px',
              padding: '10px',
              borderRadius: '15px',
              ...getAssignmentStyle(assignment)
            }}
            onMouseEnter={(e) => {
              setHoveredAssignment(assignment.id);
              const now = new Date();
              const assignDateTime = new Date(assignment.assignDate);
              const dueDateTime = new Date(assignment.dueDate);
              if (now >= assignDateTime && now <= dueDateTime) {
                e.currentTarget.style.borderColor = '#2BB514';
                e.currentTarget.style.borderTopRightRadius = '0px';
                e.currentTarget.style.borderBottomRightRadius = '0px';
              }
            }}
            onMouseLeave={(e) => {
              setHoveredAssignment(null);
              e.currentTarget.style.borderTopRightRadius = '15px';
              e.currentTarget.style.borderBottomRightRadius = '15px';
              e.currentTarget.style.borderColor = getBorderColor(assignment);
            }}
          >
            <div style={{ display: 'flex', color: 'black', textAlign: 'left', height: '29px', width: '700px', fontFamily: "'montserrat', sans-serif", position: 'relative', fontWeight: 'bold', fontSize: '30px', marginLeft: '10px' }}>
            {assignment.assignmentName}
              <h1 style={{ position: 'absolute', right: '15px', top: '-15px', fontSize: '25px', width: '60px', textAlign: 'left' }}>
                {formatDisplay}
              </h1>
            </div>
            {assignment.inProgress && (
              <div style={{ position: 'absolute', bottom: '15px', right: '140px', backgroundColor: '#FFECA8', paddingLeft: '15px', fontWeight: 'bold', color: '#FFAA00',paddingRight: '15px',fontFamily: "'montserrat', sans-serif", border: '4px solid #FFAA00' ,fontSize: '15px',borderRadius: '5px' }}>
                In Progress     {assignment.status === 'Paused' && (
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
            <div style={{ marginTop: '10px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', marginLeft: '10px' }}>
                <button
                  onClick={() => setShowDueDate(false)}
                  style={{
                    background:showDueDate ? 'white' : '#f4f4f4',
                    color: showDueDate ? '#B6B6B6' : '#B6B6B6',
                    border: showDueDate ? '4px solid white' : '4px solid #B6B6B6',
                    lineHeight: '18px',
                    fontWeight: 'bold',
                    padding: '0px 10px',
                    cursor: 'pointer',
                    fontSize: '20px',
                    height: '30px',
                    position: 'relative',
                    alignItems: 'center',
                    fontFamily: "'montserrat', sans-serif",
                    borderRadius: '5px'
                 
                  }}
                >
                  Assigned
                </button>
                <button
                  onClick={() => setShowDueDate(true)}
                  style={{
                    background:showDueDate ? '#f4f4f4' : 'white',
                    color: showDueDate ? '#B6B6B6' : '#B6B6B6',
                    border: showDueDate ? ' 4px solid #B6B6B6' : '4px solid white',
                    lineHeight: '18px',
                    fontWeight: 'bold',
                    padding: '0px 10px',
                    cursor: 'pointer',
                    fontSize: '20px',
                    height: '30px',
                    position: 'relative',
                    alignItems: 'center',
                    fontFamily: "'montserrat', sans-serif",
                    borderRadius: '5px'
                  }}
                >
                  Due
                </button>
                
              </div>
              <h1 style={{ color: 'lightgrey', fontSize: '15px', fontFamily: "'montserrat', sans-serif'", fontWeight: 'bold', fontStyle:'italic',marginLeft: '20px', width: '360px', textAlign: 'left' }}>
                {showDueDate ? formatDate(assignment.dueDate) : formatDate(assignment.assignDate)}
              </h1>
            </div>
            <button
  onClick={() => navigateToTest(
    assignment.id, 
    format, 
    assignment.assignDate, 
    assignment.dueDate, 
    assignment.assignmentName,
    assignment.saveAndExit
  )}
  style={{
    position: 'absolute',
    left: '683px',
    top: '84px',
    transform: 'translateY(-50%)',
    background: '#AEF2A3',
    color: 'white',
    padding: 0,
    cursor: 'pointer',
    borderRadius: '0 15px 15px 0',
    height: '107px',
    width: hoveredAssignment === assignment.id && isActiveAssignment(assignment) ? '70px' : '3px',
    opacity: hoveredAssignment === assignment.id && isActiveAssignment(assignment) ? 1 : 0,
    transition: 'width .4s ease-in-out, left .4s ease-in-out, opacity 0.3s ease-in-out',
    fontFamily: "'montserrat', sans-serif",
    fontSize: '20px',
    fontWeight: 'bold',
    border: '4px solid #2BB514',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }}
>
  <div
    style={{
      width: '40px',
      cursor: 'pointer',
      opacity: hoveredAssignment === assignment.id && isActiveAssignment(assignment) ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      transitionDelay: '0.15s'
    }}
    
  >
    <ArrowRight size={40} color="#499a32" strokeWidth={3} />
  </div>
</button>
          </li>
        </div>
      );
    });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="student" />
      {showConfirm && (
  <RetroConfirm 
    onConfirm={() => {
      setShowConfirm(false);
      if (confirmAssignment.type === 'AMCQ') {
        navigate(`/TakeAmcq/${confirmAssignment.id}`);
      } else if (confirmAssignment.type === 'ASAQ') {
        navigate(`/TakeAsaq/${confirmAssignment.id}`);
      } else if (confirmAssignment.type === 'MCQ') {
        navigate(`/TakeMcq/${confirmAssignment.id}`);
      } else {
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
        width:'100px',
        height: '100%',
        background: 'rgb(245,245,245,.8)',
        backdropFilter: 'blur(5px)',
        zIndex: '90',
        transition: 'width 0.3s ease',
        overflow: 'hidden'
      }}
 
    >
         <div style={{
        marginTop: '66px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '20px'
      }}>
           {[
          { label: 'active', icon: BookOpen },
          { label: 'completed', icon: BookOpenCheck },
          { label: 'upcoming', icon: CalendarClock },
          { label: 'overdue', icon: CalendarX2 }
        ].map(({label, icon: Icon}) => (
          <div key={label}>
             <div style={{ 
              height: '4px', 
              width: '80px', 
              background: '#E8E8E8', 
              marginLeft: '10px',  
              marginBottom: '10px',
            }}></div>
            <button
              onClick={() => setActiveTab(label)}
              style={{
                fontSize: '15px',
                fontFamily: "'montserrat', sans-serif",
                background: activeTab === label ? tabStyles[label].background : 'transparent',
                border: activeTab === label ? `4px solid ${tabStyles[label].borderColor}` : '4px solid transparent',
                color: activeTab === label ? tabStyles[label].color : '#676767',
                borderRadius: '10px',
                padding: '5px 5px',
                width: '80px',
                marginLeft: '10px',
                height: '80px',
                marginBottom: '-10px',
                cursor: 'pointer',
                fontWeight:  'bold',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== label) {
                  e.currentTarget.style.color = 'black';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== label) {
                  e.currentTarget.style.color = '#676767';
                }
              }}
            >
              <Icon 
                size={40} 
                style={{marginTop: '3px'}}
                color={activeTab === label ? tabStyles[label].color : '#9C9C9C'} 
                strokeWidth={activeTab === label ? 2.1 : 2} 
              />
              <h1 style={{ 
                whiteSpace: 'nowrap', 
                fontSize: label === 'completed' ? '11px' : '12px',
                marginTop: '0px',
                fontWeight: activeTab === label ? '700': '500',
                marginLeft: '0px'
              }}>
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </h1>
            </button>
           
          </div>
        ))}
</div>
          </div>
      <div style={{ width: '850px', marginRight: 'auto', marginLeft: 'auto', marginTop: '160px', }}>
        <div style={{ display: 'flex', marginBottom: '50px', width: '800px', position: 'relative', alignItems: 'center' }}>
        <h1 style={{ fontSize: '60px', fontFamily: "'montserrat', sans-serif", textAlign: 'left', margin: '0', flex: '1' }}>
            Assignments
          </h1>
          <div style={{
            width: '100px', 
            position: 'absolute',
            left: '440px',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: 'bold' ,
            background: tabStyles[activeTab].background, 
            
            paddingLeft: '20px',
 paddingRight: '80px ',
 borderRadius: '10px',
 borderLeft: '6px solid ',
  borderColor:   `${tabStyles[activeTab].borderColor}` || 'grey',
 height: '40px',
 lineHeight: '40px',
  backgroundColor: `${tabStyles[activeTab].background}` || 'white', 
  color: `${tabStyles[activeTab].color}` || 'grey',
  fontSize: '20px', 
          }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
          </div>
        <div style={{ position: 'relative' }}>
          <ul style={{ listStyleType: 'none', marginTop: '-30px' }}>
            {activeTab === 'completed' ? (
              completedAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '20px' }}>
                  No completed assignments
                </div>
              ) : (
                renderCompletedAssignments()
              )
            ) : (
              filteredAssignments[activeTab].length === 0 ? (
                <div style={{ textAlign: 'left', fontSize: '20px', fontFamily: "'montserrat', sans-serif", color: 'grey', marginTop: '50px', marginLeft: '-40px' }}>
                  No {activeTab} assignments
                </div>
              ) : (
                renderAssignments(filteredAssignments[activeTab])
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StudentAssignmentsHome;
