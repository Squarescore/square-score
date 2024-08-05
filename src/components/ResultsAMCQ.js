import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, updateDoc, where, query, getDocs, writeBatch, deleteDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Navbar from './Navbar';
import { db } from './firebase';

const TeacherResultsAMCQ = () => {
  // State hooks
  const [allViewable, setAllViewable] = useState(false);
  const [assignmentData, setAssignmentData] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [assignDate, setAssignDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [grades, setGrades] = useState({});
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [hoveredStudent, setHoveredStudent] = useState(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({});
  const [resetStudent, setResetStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [students, setStudents] = useState([]);
    const { classId, assignmentId } = useParams();
  const navigate = useNavigate();

  // Fetch assignment data
  const fetchAssignmentData = async () => {
    try {
      const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (assignmentDoc.exists()) {
        setAssignmentData(assignmentDoc.data());
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching assignment data:", error);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId]);

  // Fetch assignment name and dates
  useEffect(() => {
    const fetchAssignmentName = async () => {
      try {
        console.log("Fetching assignment with ID:", assignmentId);
        
        const assignmentQuery = query(
          collection(db, 'assignments(Amcq)'),
          where('assignmentId', '==', assignmentId)
        );
        
        const querySnapshot = await getDocs(assignmentQuery);
        
        if (!querySnapshot.empty) {
          const assignmentDoc = querySnapshot.docs[0];
          const assignmentData = assignmentDoc.data();
          const name = assignmentData.assignmentName;
          const dueDate = assignmentData.dueDate;
          const assignDate = assignmentData.assignDate;
          console.log("Assignment found:", assignmentData);
          setAssignmentName(name);
          setAssignDate(assignDate); 
          setDueDate(dueDate);
        } 
      } catch (error) {
        console.error("Error fetching assignment name:", error);
      }
    };
  
    fetchAssignmentName();
  }, [assignmentId]);

  // Fetch class and grades data
  const fetchClassAndGrades = async () => {
    setLoading(true);
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      const classData = classDoc.data();
    
      if (classData && classData.participants) {
        const sortedStudents = classData.participants.map(student => {
          const [firstName, lastName] = student.name.split(' ');
          return { ...student, firstName, lastName };
        }).sort((a, b) => a.lastName.localeCompare(b.lastName));
    
        setStudents(sortedStudents);
    
        const gradesCollection = collection(db, 'grades(AMCQ)');
        const gradesQuery = query(gradesCollection, where('assignmentId', '==', assignmentId));
        const gradesSnapshot = await getDocs(gradesQuery);
        const fetchedGrades = {};
        let totalScore = 0;
        let totalGradesCount = 0;
    
        gradesSnapshot.forEach((doc) => {
          const gradeData = doc.data();
          fetchedGrades[gradeData.studentUid] = {
            submittedAt: gradeData.submittedAt,
            SquareScore: gradeData.SquareScore,
            viewable: gradeData.viewable || false,
          };
    
          if (gradeData.percentageScore !== undefined) {
            totalScore += gradeData.percentageScore;
            totalGradesCount++;
          }
        });
    
        setGrades(fetchedGrades);
    
        const classAverage = totalGradesCount > 0 ? (totalScore / totalGradesCount).toFixed(2) : 'N/A';
        
        const assignmentRef = doc(db, 'assignments(AMCQ)', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);
        if (assignmentDoc.exists()) {
          await updateDoc(assignmentRef, { classAverage: parseFloat(classAverage) });
        } else {
          console.log("Assignment document does not exist. Cannot update class average.");
        }
      }
    } catch (error) {
      console.error("Error fetching class and grades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchClassAndGrades();
      } catch (error) {
        console.error("Error in fetchClassAndGrades:", error);
      }
    };
  
    fetchData();
    const classAndGradesInterval = setInterval(fetchData, 10000);
  
    return () => clearInterval(classAndGradesInterval);
  }, [classId, assignmentId]);

  // Fetch assignment status for each student
  useEffect(() => {
    const fetchAssignmentStatus = async () => {
      const statusPromises = students.map(async (student) => {
        const progressRef = doc(db, 'assignments(progress:AMCQ)', `${assignmentId}_${student.uid}`);
        const progressDoc = await getDoc(progressRef);
        const gradeRef = doc(db, 'grades(AMCQ)', `${assignmentId}_${student.uid}`);
        const gradeDoc = await getDoc(gradeRef);
  
        let status = 'not_started';
        if (gradeDoc.exists()) {
          status = 'completed';
        } else if (progressDoc.exists()) {
          status = progressDoc.data().status === 'paused' ? 'Paused' : 'In Progress';
        }
  
        return { [student.uid]: status };
      });
  
      const statuses = await Promise.all(statusPromises);
      const combinedStatuses = Object.assign({}, ...statuses);
      setAssignmentStatuses(combinedStatuses);
    };
  
    fetchAssignmentStatus();
  }, [students, assignmentId]);

  // Handlers
  const calculateLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const calculatePercentage = (grade, totalQuestions) => {
    return Math.floor((grade / totalQuestions) * 100);
  };

  const closeResetModal = () => {
    setResetStudent(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date provided';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
        hour12: true
      };
      return date.toLocaleString('en-US', options);
    } catch (error) {
      console.error("Error formatting date:", error, "Date string:", dateString);
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#009006';
      case 'in_progress':
        return '#FFD700';
      case 'not_started':
        return '#808080';
      case 'paused':
        return '#FFA500';
      default:
        return 'lightgrey';
    }
  };

  const handleAssign = async () => {
    const batch = writeBatch(db);
    for (const studentId of selectedStudents) {
      const studentRef = doc(db, 'students', studentId);
      batch.update(studentRef, {
        assignmentsToTake: arrayUnion(assignmentId)
      });
    }
    await batch.commit();
    setIsAssignModalOpen(false);
    setSelectedStudents([]);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleReset = async (studentUid) => {
    setResetStatus(prev => ({ ...prev, [studentUid]: 'resetting' }));
  
    try {
      const batch = writeBatch(db);
  
      // Remove assignment from testsTaken array in student document
      const studentRef = doc(db, 'students', studentUid);
      batch.update(studentRef, {
        testsTaken: arrayRemove(assignmentId),
        assignmentsToTake: arrayUnion(assignmentId)
      });
  
      // Delete the grade document
      const gradeRef = doc(db, 'grades(AMCQ)', `${assignmentId}_${studentUid}`);
      batch.delete(gradeRef);
  
      // Delete the progress document if it exists
      const progressRef = doc(db, 'assignments(progress:AMCQ)', `${assignmentId}_${studentUid}`);
      const progressDoc = await getDoc(progressRef);
      if (progressDoc.exists()) {
        batch.delete(progressRef);
      }
  
      // Commit the batch
      await batch.commit();
  
      // Update local state
      setGrades(prevGrades => {
        const newGrades = { ...prevGrades };
        delete newGrades[studentUid];
        return newGrades;
      });
  
      setAssignmentStatuses(prev => ({
        ...prev,
        [studentUid]: 'not_started'
      }));
  
      // Simulate a delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      setResetStatus(prev => ({ ...prev, [studentUid]: 'success' }));
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentUid]: '' })), 1000);
  
    } catch (error) {
      console.error("Failed to reset:", error);
      setResetStatus(prev => ({ ...prev, [studentUid]: 'failed' }));
    }
  };

  const openResetModal = (student) => {
    setResetStudent(student);
  };

  const toggleAllViewable = async () => {
    const newViewableStatus = !allViewable;
    setAllViewable(newViewableStatus);

    const batch = writeBatch(db);

    for (const student of students) {
      const gradeRef = doc(db, 'grades(AMCQ)', `${assignmentId}_${student.uid}`);
      
      const gradeDoc = await getDoc(gradeRef);
      
      if (gradeDoc.exists()) {
        const gradeData = gradeDoc.data();
        
        const updatedData = {
          viewable: newViewableStatus,
        };

        batch.update(gradeRef, updatedData);

        setGrades(prevGrades => ({
          ...prevGrades,
          [student.uid]: {
            ...prevGrades[student.uid],
            viewable: newViewableStatus,
          }
        }));
      }
    }

    try {
      await batch.commit();
      console.log("Successfully updated viewable status for existing documents");
    } catch (error) {
      console.error("Error updating viewable status:", error);
    }
  };

  const togglePauseAssignment = async (studentUid) => {
    if (assignmentStatuses[studentUid] !== 'Paused') return;

    setResetStatus(prev => ({ ...prev, [studentUid]: 'updating' }));

    try {
      const studentRef = doc(db, 'students', studentUid);
      const progressRef = doc(db, 'assignments(progress:AMCQ)', `${assignmentId}_${studentUid}`);
      const progressDoc = await getDoc(progressRef);

      if (progressDoc.exists()) {
        await updateDoc(progressRef, { status: 'In Progress' });
        await updateDoc(studentRef, {
          assignmentsInProgress: arrayUnion(assignmentId)
        });

        setAssignmentStatuses(prev => ({ ...prev, [studentUid]: 'In Progress' }));
        setResetStatus(prev => ({ ...prev, [studentUid]: 'success' }));
      } else {
        console.error("Progress document does not exist");
        setResetStatus(prev => ({ ...prev, [studentUid]: 'failed' }));
      }
    } catch (error) {
      console.error("Error unpausing assignment:", error);
      setResetStatus(prev => ({ ...prev, [studentUid]: 'failed' }));
    } finally {
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentUid]: '' })), 1000);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      <Navbar userType="teacher" />
      <div style={{
        backgroundColor: 'rgb(255,255,255,.8)',
        backdropFilter: 'blur(5px)',
        width: '100%',
        height: '1000px',
        zIndex: 99
      }}>
        <div style={{
          border: '15px solid #FCCA18',
          padding: '5px',
          zIndex: 100,
          boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
          width: showQuestionBank ? '650px' : '350px',
          fontFamily: "'Radio Canada', sans-serif",
          position: 'fixed',
          top: '-80px',
          right: '-80px',
          backgroundColor: 'white',
          textAlign: 'center',
          borderRadius: showQuestionBank ? '30px 0 0 30px' : '30px',
          height: showQuestionBank ? 'calc(100vh + 30px)' : '200px',
          transition: 'all 0.3s ease-in-out',
        }}>
          <h2 onClick={() => {
            if (assignmentData && assignmentData.questions) {
              setShowQuestionBank(!showQuestionBank);
            } else {
              console.log("No questions available");
            }
          }} style={{
            fontSize: '50px',
            fontWeight: 'bold',
            userSelect: 'none',
            color: 'black',
            marginRight: '40px',
            marginTop: '130px',
            fontFamily: "'Rajdhani', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
          }}>
            Questions
          </h2>
          {showQuestionBank && assignmentData && (
            <QuestionBankModal 
              questions={assignmentData.questions} 
              onClose={() => setShowQuestionBank(false)} 
            />
          )}
        </div>
      </div>
      <style>
        {`
          .tooltip {
            position: relative;
            display: inline-block;
          }
          .tooltip .tooltiptext {
            visibility: hidden;
            width: 320px;
            background-color: rgba(250,250,250,0.8);
            box-shadow: 2px 2px 2px 2px rgb(0,0,0,.1);
            font-size: 14px;
            padding: 10px;
            backdrop-filter: blur(5px); 
            color: grey;
            text-align: left;
            border-radius: 6px;
            position: absolute;
            z-index: 1;
            bottom: -150%;
            left: 300%;
            margin-left: -110px;
            opacity: 0;
            transition: opacity 0.3s;
          }
          .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
          }
          .student-item {
            transition: border-color 0.3s, border-radius 0.3s;
            position: relative;
            z-index: 2;
          }
          .student-item:hover {
            border-color: #54AAA4 !important;
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          .student-arrow {
            transition: opacity 0.3s, transform 0.3s;
            opacity: 0;
            transform: translateX(-10px);
          }
          .student-item:hover .student-arrow {
            opacity: 1;
            transform: translateX(0);
          }
        `}
      </style>
      
      <div style={{
        width: '750px',
        justifyContent: 'align',
        marginTop: '80px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: '30px'
      }}>
        <h1 style={{ fontSize: '78px', color: 'black', fontFamily: "'Radio Canada', sans-serif" }}>
          {assignmentName || ''}
        </h1>
        <div style={{ display: 'flex' }}>
          <h1 style={{
            fontSize: '18px',
            color: 'lightgrey',
            fontFamily: "'Radio Canada', sans-serif",
            marginTop: '-50px',
            marginLeft: '30px'
          }}>
            Assigned: {assignDate ? formatDate(assignDate) : 'No assign date'}
          </h1>
          <h1 style={{
            fontSize: '18px',
            color: 'lightgrey',
            fontFamily: "'Radio Canada', sans-serif",
            marginTop: '-50px',
            marginLeft: '30px'
          }}>
            Due: {dueDate ? formatDate(dueDate) : 'No due date'}
          </h1>
        </div>
      </div>

      {isAssignModalOpen && (
  <AssignModal 
    students={students}
    selectedStudents={selectedStudents}
    setSelectedStudents={setSelectedStudents}
    assignmentId={assignmentId}
    onClose={() => setIsAssignModalOpen(false)}
    onAssign={handleAssign}
  />
)}
      <div style={{
        width: '810px',
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
        alignSelf: 'center',
        alignItems: 'center',
        marginLeft: '30px'
      }}>
        <button onClick={() => setIsAssignModalOpen(true)} style={{
          width: '450px',
          fontSize: '20px',
          height: '50px',
          borderRadius: '10px',
          fontWeight: 'bold',
          border: '6px solid #F4F4F4',
          background: 'white',
          cursor: 'pointer',
          marginLeft: '10px',
          transition: '.3s',
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = 'grey';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = 'lightgrey';
        }}>
          Assign to New Students
        </button>

        <div style={{
          width: '450px',
          fontSize: '20px',
          height: '45px',
          borderRadius: '10px',
          fontWeight: 'bold',
          border: '6px solid #F4F4F4',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          marginLeft: '10px',
          transition: '.3s',
        }}>
          <h1 style={{ fontSize: '20px', marginLeft: '80px' }}>
            Student Review
          </h1>
          <input type="checkbox"
            className="greenSwitch"
            style={{ marginLeft: '30px' }}
            checked={allViewable} onChange={toggleAllViewable} />
        </div>
      </div>

      <ul>
        {students.map((student) => (
          <li key={student.uid} className="student-item" style={{
            width: '780px',
            height: '80px',
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            marginRight: 'auto',
            marginLeft: 'auto',
            border: '6px solid #F4F4F4',
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '10px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: '2',
          }}
          onMouseEnter={() => setHoveredStudent(student.uid)}
          onMouseLeave={() => setHoveredStudent(null)}
          > 
            <div style={{
              width: '60px',
              height: '55px',
              border: '7px solid #003BD4',
              backgroundColor: '#566DFF',
              borderRadius: '15px'
            }}>
              <p style={{
                fontWeight: 'bold',
                width: '40px',
                marginTop: '8px',
                marginRight: 'auto',
                marginLeft: 'auto',
                fontSize: '25px',
                backgroundColor: 'white',
                height: '40px',
                lineHeight: '45px',
                color: 'black',
                borderRadius: '3px',
                fontFamily: "'Rajdhani', sans-serif",
                textAlign: 'center'
              }}>
                {grades[student.uid] && grades[student.uid].SquareScore !== undefined 
                  ? grades[student.uid].SquareScore 
                  : '—'}
              </p>
            </div>
            <div style={{ marginLeft: '20px', width: '400px', marginTop: '-15px' }}>
              <div style={{ display: 'flex', marginBottom: '-20px' }}>
                <h3 style={{
                  fontWeight: 'normal',
                  color: 'grey',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontSize: '23px'
                }}>
                  {student.lastName},
                </h3>
                <h3 style={{
                  fontWeight: 'bold',
                  color: 'black',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontSize: '23px',
                  marginLeft: '10px'
                }}>
                  {student.firstName}
                </h3>
              </div>
              <button style={{
                backgroundColor: 'transparent',
                color: resetStatus[student.uid] === 'success' ? 'lightgreen' : 'red',
                cursor: 'pointer',
                borderColor: 'transparent',
                fontFamily: "'Radio Canada', sans-serif",
                fontWeight: 'bold',
                fontSize: '22px',
                marginLeft: '-10px',
              }} onClick={() => handleReset(student.uid)}>
                {resetStatus[student.uid] === 'success' ? 'Success' : 'Reset'}
              </button>
            </div>
            <div style={{
              color: 'lightgrey',
              width: '400px',
              display: 'flex'
            }}>
              <div>
                <h1 style={{
                  fontSize: '22px',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontWeight: 'normal'
                }}>
                  Completed: {grades[student.uid] && grades[student.uid].submittedAt ? 
                    new Date(grades[student.uid].submittedAt.toDate()).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : 'Not completed'}
                </h1>
                <h1 style={{
                  fontSize: '22px',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontWeight: 'bold',
                  color: getStatusColor(assignmentStatuses[student.uid]),
                  textTransform: assignmentStatuses[student.uid] === 'Completed' ? 'uppercase' : 'capitalize',
                  cursor: assignmentStatuses[student.uid] === 'Paused' ? 'pointer' : 'default'
                }}
                onMouseEnter={() => assignmentStatuses[student.uid] === 'Paused' && setHoveredStatus(student.uid)}
                onMouseLeave={() => setHoveredStatus(null)}
                onClick={() => assignmentStatuses[student.uid] === 'Paused' && togglePauseAssignment(student.uid)}>
                  {hoveredStatus === student.uid && assignmentStatuses[student.uid] === 'Paused' 
                    ? 'Unpause' 
                    : assignmentStatuses[student.uid]}
                </h1>
              </div>
              <span style={{
                position: 'absolute',
                right: '15px',
                top: '60px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '60px',
                marginTop: '0px',
                fontSize: '25px',
                fontFamily: "'Radio Canada', sans-serif",
                color: 'green'
              }}>
                MCQ
              </span>
              <span style={{
                position: 'absolute',
                right: '-38px',
                top: '45px',
                fontSize: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '60px',
                marginTop: '0px',
                fontFamily: "'Radio Canada', sans-serif",
                color: 'yellow'
              }}>
                *
              </span> 
            </div>
            <div className="tooltip">
              <span className="tooltiptext">
                Resetting assignments lets students take assignment again, it also assigns the assignment to new students
              </span>
            </div>
            {hoveredStudent === student.uid && (
              <div className="student-arrow" style={{
                position: 'absolute',
                right: '-75px',
                top: '-3px',
                height: '78px',
                width: '50px',
                padding: '11px',
                zIndex: '1',
                backgroundColor: '#A3F2ED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '6px solid #54AAA4',
                borderBottomRightRadius: '10px',
                borderTopRightRadius: '10px',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/teacherStudentResultsAMCQ/${assignmentId}/${student.uid}/${classId}`);
              }}>
                <img 
                  src='/GradesArrow.png'
                  alt="View student results"
                  style={{ 
                    width: '30px', 
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      <style>{`
        .switch {
          position: relative;
          width: 60px;
          height: 34px;
          margin-right: 30px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #2196F3;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

const AssignModal = ({ 
    students, 
    selectedStudents, 
    setSelectedStudents, 
    assignmentId, 
    onClose, 
    onAssign 
  }) => {
    const handleAssign = async () => {
      await onAssign();
      onClose();  // Use onClose instead of setIsAssignModalOpen
    };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        <button 
         onClick={onClose} 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <img style={{width: '30px'}} src='/redCircleX.png' alt="Close"/>
        </button>
        <h2 style={{
          textAlign: 'center',
          padding: '20px',
          margin: 0,
          backgroundColor: '#54AAA4',
          color: 'white',
          fontFamily: "'Radio Canada', sans-serif",
          fontSize: '28px',
        }}>
          Assign to New Students
        </h2>
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 180px)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {students.map((student) => (
              <div 
                key={student.uid} 
                style={{
                  width: '48%',
                  margin: '10px 0',
                  padding: '15px',
                  border: selectedStudents.includes(student.uid) ? '6px solid #54AAA4' : '6px solid #e0e0e0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: selectedStudents.includes(student.uid) ? '#ECFAF9' : 'white',
                  fontFamily: "'Radio Canada', sans-serif",
                }}
                onClick={() => {
                  if (selectedStudents.includes(student.uid)) {
                    setSelectedStudents(prev => prev.filter(id => id !== student.uid));
                  } else {
                    setSelectedStudents(prev => [...prev, student.uid]);
                  }
                }}
              >
                {student.firstName} {student.lastName}
              </div>
            ))}
          </div>
        </div>
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center',
        }}>
          <button 
            style={{
              padding: '10px 20px',
              backgroundColor: '#54AAA4',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '18px',
              fontFamily: "'Radio Canada', sans-serif",
              transition: 'background-color 0.3s ease',
            }}
            onClick={handleAssign}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#458F8A'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#54AAA4'}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};





const QuestionBankModal = ({ questions, onClose }) => {
  const [hoveredOptions, setHoveredOptions] = useState({});
  const modalRef = useRef(null);

  const optionStyles = {
    a: { background: '#A3F2ED', color: '#00645E' },
    b: { background: '#AEF2A3', color: '#006428' },
    c: { background: '#F8CFFF', color: '#E01FFF' },
    d: { background: '#FFECA8', color: '#CE7C00' },
    e: { background: '#FFD1D1', color: '#FF0000' },
  };

  const handleOptionHover = (index, option) => {
    setHoveredOptions(prev => ({
      ...prev,
      [index]: option
    }));
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: '120px',
      right: '15px',
      width: '650px',  
      backgroundColor: 'white', 
      borderLeft: '15px solid #FCCA18',
      overflow: 'hidden',
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
      }}>
         <button onClick={onClose} style={{ 
          backgroundColor: 'transparent', 
          border: 'none', 
          fontSize: '24px', 
         
          cursor: 'pointer' 
        }}>×</button>
        <h2 style={{ 
          fontSize: '44px', 
          fontWeight: 'bold', 
          fontFamily: "'Rajdhani', sans-serif",
          margin: 0,
        }}>Questions</h2>
       
      </div>
      <div ref={modalRef} style={{
        height: 'calc(100% - 80px)',
        overflowY: 'auto',
        padding: '0 20px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#888 #f1f1f1',
      }}>
        {questions.map((question, index) => (
          <div key={index} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px', textAlign: 'left' }}>
            <p style={{ fontSize: '14px', color: '#666', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>
              Difficulty: {question.difficulty}
            </p>
            <h3 style={{ fontSize: '30px', fontWeight: 'bold', fontFamily: "'Radio Canada', sans-serif", width: '100%' }}>
              {question.question}
            </h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {['a', 'b', 'c', 'd'].slice(0, question.choices).map((option) => (
                <li 
                  key={option} 
                  style={{ 
                    marginBottom: '15px', 
                    padding: '10px', 
                    backgroundColor: optionStyles[option].background,
                    color: optionStyles[option].color,
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontFamily: "'Radio Canada', sans-serif",
                    fontWeight: 'bold',
                    width: '100%',
                    transition: 'all 0.3s',
                    boxShadow: option === question.correct ? '0 4px 4px rgb(0,200,0,.25)' : 
                               (hoveredOptions[index] === option ? '0 4px 4px rgb(100,0,0,.25)' : 'none'),
                  }}
                  onMouseEnter={() => handleOptionHover(index, option)}
                  onMouseLeave={() => handleOptionHover(index, null)}
                >
                  {question[option]}
                  {option === question.correct && ' ✓'}
                </li>
              ))}
            </ul>
            {hoveredOptions[index] && hoveredOptions[index] !== question.correct && (
              <p style={{ fontSize: '14px', color: '#ff4d4d', width: '100%', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>
                Explanation: {question[`explanation_${hoveredOptions[index]}`]}
              </p>
            )}
            {(hoveredOptions[index] === question.correct || !hoveredOptions[index]) && (
              <p style={{ fontSize: '14px', color: '#4CAF50', width: '100%', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold' }}>
                Explanation: {question[`explanation_${question.correct}`]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherResultsAMCQ;
