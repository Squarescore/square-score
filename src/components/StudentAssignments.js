import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';
function StudentAssignmentsHome({ studentUid: propStudentUid }) {
  const { classId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const studentUid = propStudentUid || auth.currentUser.uid;
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get('tab') || 'active');

  const [className, setClassName] = useState('');
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [mostRecentScore, setMostRecentScore] = useState(null);
  const [classChoice, setClassChoice] = useState('');
  const [showDueDate, setShowDueDate] = useState(true);
  const [hoveredAssignment, setHoveredAssignment] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
const [confirmAssignment, setConfirmAssignment] = useState(null);
  const studentUID = auth.currentUser.uid;
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

  useEffect(() => {
    const fetchCompletedAssignments = async () => {
      const gradesQuery = query(
        collection(db, 'grades(saq)'),
        where('studentUid', '==', studentUid),
        where('classId', '==', classId)
      );

      const querySnapshot = await getDocs(gradesQuery);
      const fetchedGrades = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompletedAssignments(fetchedGrades);
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
  const getAssignmentStyle = (assignDate, dueDate) => {
    const now = new Date();
    const assignDateTime = new Date(assignDate);
    const dueDateTime = new Date(dueDate);

    if (now < assignDateTime) {
      return {
        border: '3px solid grey',
        cursor: 'not-allowed',
        opacity: 0.5
      };
    }

    if (now > dueDateTime) {
      return {
        border: '3px solid red',
        cursor: 'not-allowed',
        opacity: 0.5
      };
    }

    return {
      border: '3px solid #AEF2A3',
    };
  };
  const RetroConfirm = ({ onConfirm, onCancel, assignmentName, saveAndExitEnabled }) => (
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
        borderRadius: '30px',
        backdropFilter: 'blur(5px)',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        backgroundColor: 'rgb(255,255,255,.001)',
        border: '0px solid transparent',
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
        fontFamily: 'Arial, sans-serif',
        zIndex: 100000
      }}>
        <div style={{
          backgroundColor: '#AEF2A3',
          color: '#009006',
          fontFamily: '"Rajdhani", sans-serif',
          border: '10px solid #009006', 
          borderTopRightRadius: '30px',
          borderTopLeftRadius: '30px',
          opacity: '80%',
          textAlign: 'center',
          fontSize: '40px',
          padding: '12px 4px',
          fontWeight: 'bold'
        }}>
          Confirm
        </div>
        <div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold', fontFamily: '"Radio Canada", sans-serif', fontSize: '30px' }}>
  Are you sure you want to enter {assignmentName}?<br /> 
  {saveAndExitEnabled 
    ? "You will be able to exit once you start." 
    : "You will not be able to exit once you start."}
</div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '10px'
        }}>
          <button 
            onClick={onConfirm}
            style={{
              width: '200px',
              marginRight: '10px',
              height: '40PX',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: 'bold',
              fontSize: '24px',
              borderRadius: '10px',
              color: '#009006',
              fontFamily: '"Rajdhani", sans-serif',
              border: '0px solid lightgrey',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: '.3s'
            }}
            onMouseEnter={(e) => { e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)'; }}
            onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; }} 
          >
            Enter
          </button>
          <button 
            onClick={onCancel}
            style={{
              width: '200px',
              marginRight: '10px',
              height: '40PX',
              lineHeight: '10PX',
              padding: '5px 5px',
              fontWeight: 'bold',
              fontSize: '24px',
              borderRadius: '10px',
              color: '#980000',
              marginBottom: '10px',
              fontFamily: '"Rajdhani", sans-serif',
              border: '0px solid lightgrey',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: '.3s'
            }}
            onMouseEnter={(e) => { e.target.style.boxShadow = '0px 4px 4px 0px rgba(0, 0, 0, 0.25)'; }}
            onMouseLeave={(e) => { e.target.style.boxShadow = 'none'; }} 
          >
            Cancel
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
    return completedAssignments.map(grade => {
      const percentage = Math.round(grade.percentageScore);
      const letterGrade = getLetterGrade(percentage);
      return (
        <li key={grade.id} style={{ 
          fontSize: '40px', 
          color: 'black', 
          backgroundColor: 'white', 
          fontFamily: "'Radio Canada', sans-serif",
          transition: '.4s',
          border: grade.viewable ? '3px solid #54AAA4' : '3px solid lightgrey',
          listStyleType: 'none',
          textAlign: 'center', 
          marginTop: '20px', 
          height: '69px',
      marginLeft: '-40px',
          padding: '10px', 
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          borderTopRightRadius: grade.viewable ? '0px' : '10px',
          borderBottomRightRadius: grade.viewable ? '0px' : '10px',
        }}>
          <div style={{display: 'flex'}}>
            {grade.viewable && 
            <button style={{
              fontWeight: 'bold',
              position: 'absolute', 
              right: '-57px', 
              top: '50%', 
              width: '60px',
              cursor: 'pointer',
              height: '94px',
              padding: '10px 20px 10px 20px',
              display: 'flex',
              transform: 'translateY(-50%)', 
              color: 'white',
              backgroundColor: '#A3F2ED',
              border: '3px solid #54AAA4',
              borderRadius: '10px',
              marginBottom: '5px',
              borderTopLeftRadius: '0px',
              borderBottomLeftRadius: '0px',
              fontFamily: "'Radio Canada', sans-serif",
              alignItems: 'center', 
              justifyContent: 'center' 
            }} onClick={() => navigate(`/studentresults/${grade.assignmentId}/${studentUID}/${classId}`)}>
              <img style={{width: '30px', cursor: 'pointer', transform: 'scale(1)', transition: '.3s'}}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.06)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }} 
                src='/gradesarrow.png'/>
            </button>}
            <div style={{marginLeft: '10px', width: '800px', textAlign: 'left'}}>
              <h1 style={{color: 'black', fontSize: '25px', marginLeft: '5px'}}>
                {grade.assignmentName}
              </h1>  
              <div style={{display: 'flex', position: 'relative', alignItems: 'center', marginTop: '-30px'}}>
                <p style={{ fontWeight: 'bold', width: '23px',  textAlign: 'center',fontSize: '22px', backgroundColor: '#566DFF', height: '23px', border: '4px solid #003BD4', lineHeight: '23px', color: 'white', borderRadius: '7px', fontFamily: "'Radio Canada', sans-serif" }}>
                  {letterGrade}
                </p>
                <h1 style={{color: 'grey', fontSize: '24px', marginLeft: '40px'}}>
                  {percentage}%
                </h1>
                <span style={{ fontSize: '20px', marginLeft: '40px',fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', marginRight: '-10px', color: grade.viewable ? '#54AAA4' : '#009006' }}>
                  {grade.viewable ? 'Reviewable' : 'Completed'}
                </span>
                <h1 style={{color: 'grey', fontSize: '20px',textAlign: 'left',fontWeight: 'normal', marginLeft: '30px'}}>
                Completed: {grade.submittedAt ? new Date(grade.submittedAt.toDate()).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }) : 'N/A'}
              </h1>
              <span style={{
                position: 'absolute',
                right: '50px',
                bottom: '20px',
                fontWeight: 'bold',
                width: '60px',
                marginTop: '0px',
                fontSize: '25px',
                fontFamily: "'Radio Canada', sans-serif",
                color: '#020CFF',
              }}>
                SAQ
              </span>
              </div>
            </div>
       
            
          </div>
        </li>
      );
    });
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
        formatDisplay = <span style={{ color: '#009006' }}>MCQ</span>;
      } else if (format === 'AMCQ') {
        formatDisplay = (
          <span>
            <span style={{ color: '#009006' }}>MCQ</span>
            <span style={{ color: '#F4C10A' }}>*</span>
          </span>
        );
      }
  
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };
  
      return (
        <div key={assignment.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <li
            key={assignment.id}
            style={{
              backgroundColor: 'white',
              fontSize: '30px',
              color: 'black',
              height: '100px',
              width: '800px',
              marginLeft: '-40px',
              cursor: 'default',
              fontFamily: "'Radio Canada', sans-serif",
              transition: '.3s',
              listStyleType: 'none',
              textAlign: 'center',
              marginTop: '30px',
              padding: '10px',
              borderRadius: '10px',
              ...getAssignmentStyle(assignment.assignDate, assignment.dueDate)
            }}
            onMouseEnter={(e) => {
              setHoveredAssignment(assignment.id);
              if (e.currentTarget.style.cursor !== 'not-allowed') {
                e.currentTarget.style.borderColor = '#2BB514';
                e.currentTarget.style.borderTopRightRadius = '0px';
                e.currentTarget.style.borderBottomRightRadius = '0px';
              }
            }}
            onMouseLeave={(e) => {
              setHoveredAssignment(null);
              e.currentTarget.style.borderTopRightRadius = '10px';
              e.currentTarget.style.borderBottomRightRadius = '10px';
              e.currentTarget.style.borderColor = '#AEF2A3';
            }}
          >
            <div style={{ display: 'flex', color: 'black', textAlign: 'left', height: '29px', width: '700px', fontFamily: "'Radio Canada', sans-serif", position: 'relative', fontWeight: 'bold', fontSize: '40px', marginLeft: '10px' }}>
              {assignment.assignmentName}
              <h1 style={{ position: 'absolute', right: '-60px', bottom: '-35px', fontSize: '35px', width: '60px', textAlign: 'left' }}>
                {formatDisplay}
              </h1>
            </div>
            {assignment.inProgress && (
              <div style={{ position: 'absolute', top: '15px', left: '20px', backgroundColor: '#FFECA8', paddingLeft: '15px', fontWeight: 'bold', color: '#C69007',paddingRight: '15px',fontFamily: "'Radio Canada', sans-serif", border: '0px solid white' ,fontSize: '20px',borderRadius: '5px' }}>
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
              fontFamily: "'Radio Canada', sans-serif", 
              border: '0px solid white',
              fontSize: '20px',
              borderRadius: '5px' 
            }}>
              Paused
            </div>
          )}
              </div>
            )}
            <div style={{ marginTop: '20px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', marginLeft: '10px' }}>
                <button
                  onClick={() => setShowDueDate(false)}
                  style={{
                    background: showDueDate ? 'white' : '#415DF2',
                    color: showDueDate ? 'lightgrey' : 'white',
                    fontWeight: 'bold',
                    border: showDueDate ? '2px solid lightgrey' : '2px solid #415DF2',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    height: '30px',
                    fontSize: '16px',
                    fontFamily: "'Radio Canada', sans-serif",
                    borderRadius: '5px 0 0 5px'
                  }}
                >
                  Assigned
                </button>
                <button
                  onClick={() => setShowDueDate(true)}
                  style={{
                    background: showDueDate ? '#415DF2' : 'white',
                    color: showDueDate ? 'white' : 'lightgrey',
                    fontWeight: 'bold',
                    border: showDueDate ? '2px solid #415DF2' : '2px solid lightgrey',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    height: '30px',
                    position: 'relative',
                    alignItems: 'center',
                    fontFamily: "'Radio Canada', sans-serif",
                    borderRadius: '0px 5px 5px 0px'
                  }}
                >
                  Due
                </button>
              </div>
              <h1 style={{ color: 'grey', fontSize: '24px', fontFamily: "'Radio Canada', sans-serif'", fontWeight: 'BOLD', marginLeft: '30px', width: '700px', textAlign: 'left' }}>
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
                left: '783px',
                top: '92px',
                transform: 'translateY(-50%)',
                background: '#AEF2A3',
                color: 'white',
                padding: 0,
                cursor: 'pointer',
                borderRadius: '0 10px 10px 0',
                height: '124px',
                width: hoveredAssignment === assignment.id ? '90px' : '3px',
                opacity: hoveredAssignment === assignment.id ? 1 : 0,
                transition: 'width .4s ease-in-out, left .4s ease-in-out, opacity 0.3s ease-in-out',
                fontFamily: "'Radio Canada', sans-serif",
                fontSize: '20px',
                fontWeight: 'bold',
                border: '3px solid #2BB514',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <img
                style={{
                  width: '50px',
                  cursor: 'pointer',
                  opacity: hoveredAssignment === assignment.id ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                  transitionDelay: '0.15s'
                }}
                src='/greenarrow.png'
                alt="Enter"
              />
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
      } else {
        navigate(`/taketests/${confirmAssignment.id}`);
      }
    }}
    onCancel={() => setShowConfirm(false)}
    assignmentName={confirmAssignment ? confirmAssignment.assignmentName : ''}
    saveAndExit={confirmAssignment ? confirmAssignment.saveAndExit : false}
  />
)}
      <div style={{position: 'fixed', width: '100%', top: '70px', background: 'rgb(245,245,245,.8)', backdropFilter: 'blur(5px)'
        ,zIndex: '1000'
      }}>
      <div style={{ 
  width: '800px', 
  height: '40PX',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginLeft: 'auto', 
  marginRight: 'auto',
}}>
  {['active', 'completed', 'upcoming', 'overdue'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        fontSize: '15px',
        fontFamily: "'Radio Canada', sans-serif",
        background: 'none',
        border: 'none',
        height: '40px',
        cursor: 'pointer',
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        color: activeTab === tab ? '#181818' : '#676767',
        borderBottom: 'none',
        paddingBottom: '5px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'black';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = activeTab === tab ? '#181818' : '#676767';
      }}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  ))}
</div>
          </div>
      <div style={{ width: '800px', marginRight: 'auto', marginLeft: 'auto', marginTop: '160px', }}>
        <div style={{ display: 'flex', marginBottom: '50px', width: '800px', position: 'relative', alignItems: 'center' }}>
          <h1 style={{ fontSize: '60px', fontFamily: "'Rajdhani', sans-serif", textAlign: 'left', margin: '0', flex: '1' }}>
            Assignments
          </h1>
         
        </div>
        <div style={{ position: 'relative' }}>
          <ul style={{ listStyleType: 'none', marginTop: '-30px' }}>
            {activeTab === 'completed' ? (
              completedAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'Radio Canada', sans-serif", color: 'grey', marginTop: '20px' }}>
                  No completed assignments
                </div>
              ) : (
                renderCompletedAssignments()
              )
            ) : (
              filteredAssignments[activeTab].length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '20px', fontFamily: "'Radio Canada', sans-serif", color: 'grey', marginTop: '20px' }}>
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