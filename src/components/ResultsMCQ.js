import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, updateDoc, where, query, getDocs, writeBatch, deleteDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Navbar from './Navbar';
import { db } from './firebase';
import { AnimatePresence } from 'framer-motion';
import CustomDateTimePicker from './CustomDateTimePickerResults';
import 'react-datepicker/dist/react-datepicker.css';
const TeacherResultsMCQ = () => {
  // State hooks
  const [allViewable, setAllViewable] = useState(false);
  const [assignmentData, setAssignmentData] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [assignDate, setAssignDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [grades, setGrades] = useState({});
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [hoveredStudent, setHoveredStudent] = useState(null);
  const [showQuestionContent, setShowQuestionContent] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({});
  const [resetStudent, setResetStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [students, setStudents] = useState([]);
    const { classId, assignmentId } = useParams();
    const [showOverlay, setShowOverlay] = useState(false);
    
  const [showSettings, setShowSettings] = useState(false);
  const [assignmentSettings, setAssignmentSettings] = useState({
    assignDate: null,
    dueDate: null,
    halfCredit: false,
    lockdown: false,
    saveAndExit: true,
    scaleMin: '0',
    scaleMax: '2',
    timer: '0',
    timerOn: false,
  });
  const navigate = useNavigate();
  useEffect(() => {
    const fetchAssignmentSettings = async () => {
      const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (assignmentDoc.exists()) {
        const data = assignmentDoc.data();
        setAssignmentSettings({
          assignDate: data.assignDate ? new Date(data.assigned) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          halfCredit: data.halfCredit || false,
          lockdown: data.lockdown || false,
          saveAndExit: data.saveAndExit !== undefined ? data.saveAndExit : true,
          scaleMin: data.scale?.min || '0',
          scaleMax: data.scale?.max || '2',
          timer: data.timer || '0',
          timerOn: data.timer > 0,
        });
      }
    };

    fetchAssignmentSettings();
  }, [assignmentId]);

  const updateAssignmentSetting = async (setting, value) => {
    const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
    const updateData = { [setting]: value };
    
    if (setting === 'scaleMin' || setting === 'scaleMax') {
      updateData.scale = {
        min: setting === 'scaleMin' ? value : assignmentSettings.scaleMin,
        max: setting === 'scaleMax' ? value : assignmentSettings.scaleMax,
      };
    }

    await updateDoc(assignmentRef, updateData);
    setAssignmentSettings(prev => ({ ...prev, [setting]: value }));
  };
  
  const SettingsSection = () => (
    <div style={{
      width: '780px',
      marginRight: 'auto',
      marginLeft: 'auto', position: 'relative',
      marginTop: '-10px'
    }}>
      <div style={{width: '150px', position: 'absolute', top: '-6px', left: '10px', height: '32px', background: 'lightgrey'}}></div>
      <div style={{
        marginLeft: '10px',
        border: '6px solid lightgrey',
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        width: '750px',
        marginTop: '20px',
      
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', borderRadius: '10px', marginLeft: '-5px', background: '#F4F4F4' }}>
            <h3 style={{
              fontSize: '18px',
              color: 'grey', 
              marginLeft: '20px', 
              marginRight: '-28px',
              fontFamily: "'Radio Canada', sans-serif",
            }}>Assigned:</h3>
            <CustomDateTimePicker
              selected={assignDate}
              onChange={(date) => {
                setAssignDate(date);
                if (dueDate) {
                  updateDates(date, dueDate);
                }
              }}
          
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', borderRadius: '10px', marginLeft: '10px', background: '#F4F4F4' }}>
            <h3 style={{
              fontSize: '18px',
              color: 'grey', 
              marginLeft: '20px', 
              marginRight: '-28px',
              fontFamily: "'Radio Canada', sans-serif",
            }}>Due:</h3>
            <CustomDateTimePicker
                selected={dueDate}
                onChange={(date) => {
                  setDueDate(date);
                  if (assignDate) {
                    updateDates(assignDate, date);
                  }
                }}
            />
          </div>
        </div>
  
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{display: 'flex', alignItems: 'center', border: '6px solid #f4f4f4', borderRadius: '10px', width: '400px', height: '70px'}}>
            <h3 style={{lineHeight: '30px', marginLeft: '20px', marginRight: '20px',     fontFamily: "'Radio Canada', sans-serif",}}>Timer</h3>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                className="greenSwitch"
                checked={assignmentSettings.timerOn}
                onChange={(e) => {
                  updateAssignmentSetting('timerOn', e.target.checked);
                  if (!e.target.checked) {
                    updateAssignmentSetting('timer', '0');
                  }
                }}
              />
              {assignmentSettings.timerOn ? (
                <>
                  <input
                    type="number"
                    value={assignmentSettings.timer}
                    onChange={(e) => updateAssignmentSetting('timer', e.target.value)}
                    style={{ width: '50px', marginLeft: '10px', padding: '5px', outline: 'none', border: 'none', background: '#f4f4f4', fontSize: '20px',  borderRadius: '5px'}}
                  />
                  <span style={{ marginLeft: '5px' ,    fontFamily: "'Radio Canada', sans-serif",}}>minutes</span>
                </>
              ) : (
                <span style={{ marginLeft: '10px', color: 'grey',     fontFamily: "'Radio Canada', sans-serif", }}>Off</span>
              )}
            </div>
          </div>
  
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '6px solid #f4f4f4', borderRadius: '10px', width: '275px', height: '70px', padding: '0 20px'}}>
            <h3 style={{    fontFamily: "'Radio Canada', sans-serif",}}>Half Credit</h3>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.halfCredit}
              onChange={(e) => updateAssignmentSetting('halfCredit', e.target.checked)}
            />
          </div>
        </div>
  
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '6px solid #f4f4f4', borderRadius: '10px', width: '50%', height: '60px', padding: '0 20px'}}>
            <h3 style={{    fontFamily: "'Radio Canada', sans-serif",}}>Lockdown</h3>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.lockdown}
              onChange={(e) => updateAssignmentSetting('lockdown', e.target.checked)}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '6px solid #f4f4f4', borderRadius: '10px', width: '35%', height: '60px', padding: '0 20px'}}>
            <h3 style={{    fontFamily: "'Radio Canada', sans-serif",}}>Save & Exit</h3>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.saveAndExit}
              onChange={(e) => updateAssignmentSetting('saveAndExit', e.target.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const navigateToStudentGrades = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };
  // Fetch assignment data
  const fetchAssignmentData = async () => {
    try {
      const assignmentRef = doc(db, 'assignments(mcq)', assignmentId);
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
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);
  // Fetch assignment name and dates
  useEffect(() => {
    const fetchAssignmentName = async () => {
      try {
        console.log("Fetching assignment with ID:", assignmentId);
        
        const assignmentQuery = query(
          collection(db, 'assignments(mcq)'),
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
          setAssignDate(assignDate ? new Date(assignDate) : null);
          setDueDate(dueDate ? new Date(dueDate) : null);
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
        // Fetch full names for all participants
        const updatedParticipants = await Promise.all(classData.participants.map(async (participant) => {
          const studentDocRef = doc(db, 'students', participant.uid);
          const studentDoc = await getDoc(studentDocRef);
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            const firstName = studentData.firstName.trim();
            const lastName = studentData.lastName.trim();
            return {
              ...participant,
              firstName,
              lastName,
              name: `${firstName} ${lastName}`
            };
          }
          return participant;
        }));
        
        // Sort students by last name
        const sortedStudents = updatedParticipants.sort((a, b) => 
          a.lastName.localeCompare(b.lastName)
        );
        
        setStudents(sortedStudents);
    
        const gradesCollection = collection(db, 'grades(mcq)');
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
        
        const assignmentRef = doc(db, 'assignments(mcq)', assignmentId);
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
        const progressRef = doc(db, 'assignments(progress:mcq)', `${assignmentId}_${student.uid}`);
        const progressDoc = await getDoc(progressRef);
        const gradeRef = doc(db, 'grades(mcq)', `${assignmentId}_${student.uid}`);
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
  const updateDates = async (newAssignDate, newDueDate) => {
    try {
      const assignmentRef = doc(db, 'assignments(mcq)', assignmentId);
      await updateDoc(assignmentRef, {
        assignDate: newAssignDate.toISOString(),
        dueDate: newDueDate.toISOString()
      });
      console.log("Dates updated successfully");
    } catch (error) {
      console.error("Error updating dates:", error);
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

  const handleAssign = async (studentId) => {
    const batch = writeBatch(db);
    const studentRef = doc(db, 'students', studentId);
    batch.update(studentRef, {
      assignmentsToTake: arrayUnion(assignmentId)
    });
    
    await batch.commit();
    
    setSelectedStudents(prev => [...prev, studentId]);
    setTimeout(() => {
      setSelectedStudents(prev => prev.map(id => id === studentId ? `${id}-checked` : id));
    }, 1000);
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
      const gradeRef = doc(db, 'grades(mcq)', `${assignmentId}_${studentUid}`);
      batch.delete(gradeRef);
  
      // Delete the progress document if it exists
      const progressRef = doc(db, 'assignments(progress:MCQ)', `${assignmentId}_${studentUid}`);
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
      const gradeRef = doc(db, 'grades(mcq)', `${assignmentId}_${student.uid}`);
      
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
      const progressRef = doc(db, 'assignments(progress:MCQ)', `${assignmentId}_${studentUid}`);
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





  const AssignModal = ({ 
    students, 
    selectedStudents, 
    setSelectedStudents, 
    assignmentId, 
    onClose, 
    onAssign 
  }) => {
    
    const handleStudentClick = async (studentId) => {
      if (!selectedStudents.includes(studentId)) {
        await onAssign(studentId);  // Assign to this specific student
      }
    };
  
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(250, 250, 250, 0.5)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
      }} onClick={onClose}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '30px',
          width: '1000px',
          maxHeight: '80vh',
          border: '10px solid #54AAA4',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }} onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={onClose} 
            style={{
              position: 'absolute',
              top: '10px',
              right: '20px',
              fontFamily: "'Radio Canada', sans-serif",
              fontWeight: 'bold',
              fontSize: '40px',
              background: 'none',
              border: 'none',
              color: '#54AAA4',
              cursor: 'pointer',
              zIndex: 1,
            }}
          >
            X
          </button>
          <h2 style={{
            textAlign: 'center',
            padding: '20px',
            margin: 0,
            backgroundColor: '#A3F2ED ',
            color: '#54AAA4',
            fontFamily: "'Radio Canada', sans-serif",
            fontSize: '28px',
            borderBottom: '10px solid #54AAA4',
          }}>
            Assign to New Students
          </h2>
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 180px)',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', }}>
              {students.map((student) => {
                const isSelected = selectedStudents.includes(student.uid);
                const isChecked = selectedStudents.includes(`${student.uid}-checked`);
                return (
                  <div 
                    key={student.uid} 
                    style={{
                      width: '20%',
                      margin: '10px 5px',
                      padding: '15px',
                      border: isSelected || isChecked ? '3px solid #FFB802' : '3px solid #e0e0e0',
                      color: 'black',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: isSelected ? '#FFE768' : 'white',
                      fontFamily: "'Radio Canada', sans-serif",
                      position: 'relative',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStudentClick(student.uid);
                    }}
                  >
                    {student.firstName} {student.lastName}
                    {(isSelected || isChecked) && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '20px',
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }; 

const QuestionBankModal = ({ questions, onClose, setShowQuestionBank, setShowOverlay }) => {
  const [hoveredOptions, setHoveredOptions] = useState({});
  const modalRef = useRef(null);
  
  const [isVisible, setIsVisible] = useState(false);
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

  const handleMouseLeave = () => {
    setShowQuestionBank(false);
    setShowOverlay(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);


  return (
    <div style={{ 
      position: 'fixed', 
      top: '70px',
      right: '15px',
      height: 'calc(100vh - 95px)',
      width: '700px',  
      backgroundColor: 'white', 
      borderLeft: '15px solid #FCCA18',
      borderBottom: '15px solid #FCCA18',
      borderBottomLeftRadius: '30px',
      overflow: 'hidden',
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out',
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? 'visible' : 'hidden',
      
    }}
    
    onMouseLeave={handleMouseLeave}
    >
      {isVisible && (
   <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
      }}
      >
         <button onClick={onClose} style={{ 
          backgroundColor: 'transparent', 
          border: 'none', 
          fontSize: '24px', 
         
          cursor: 'pointer' 
        }}>×</button>
        <h2 style={{ 
          fontSize: '50px', 
          fontWeight: 'bold', 
          fontFamily: "'Rajdhani', sans-serif",
          margin: 0,
          marginRight: '269px',
          marginTop: '-21px',
        
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
                    width: '600px',
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
      </>
        )}
    </div>
  );
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
          width: showQuestionBank ? '770px' : '350px',
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
              setShowOverlay(!showQuestionBank);
            } else {
              console.log("No questions available");
            }
          }} style={{
            fontSize: '50px',
            fontWeight: 'bold',
            userSelect: 'none',
            color: 'black',
            marginRight: showQuestionBank ? '162px' : '30px',
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
    onClose={() => {
      setShowQuestionBank(false);
      setShowOverlay(false);
    }}
    setShowQuestionBank={setShowQuestionBank}  // Add this line
    setShowOverlay={setShowOverlay}
  />
)}
        </div>
      </div>
      <div style={{ width: '1000px', display: 'flex', justifyContent: 'align', marginTop: '100px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ display: 'flex', width: '780px' , marginRight: 'auto', marginLeft: '120px', height: ' auto', lineHeight:'0px'}}>
         <div style={{position: 'relative'}}>
          <h1 style={{  fontSize: '60px', 
      color: 'black', 
      width: '100%', // Use full width of parent
      fontFamily: "'Rajdhani', sans-serif",
      wordWrap: 'break-word', // Allow long words to break and wrap
      overflowWrap: 'break-word', // Ensure long words don't overflow
      hyphens: 'auto', // Enable automatic hyphenation
      lineHeight: '1.2', // Adjust line height for better readability
      margin: 0,
      marginBottom: '30px', // Remove default margins
      padding: '10px 0' }}>{assignmentName} </h1>
      <button style={{position: 'absolute', top: '10px', right: '-62px', zIndex: '1', background: 'transparent', border: 'none', 
        cursor: 'pointer'
      }}
    
      ><img style={{width: '30px'}} src='/Export.png'/></button>
      </div>
        
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
        marginTop: '0px',
        alignSelf: 'center',
        alignItems: 'center',
        marginLeft: '30px'
      }}>
        <button onClick={() => setShowSettings(!showSettings)} style={{
          width: '150px',
          fontSize: '20px',
          height: '50px',
          borderRadius: '10px',
          fontWeight: 'bold',
          border: '6px solid lightgrey',
          background: 'lightgrey',
          cursor: 'pointer',
          color: 'black',
          marginLeft: '10px',
          lineHeight: '10px',
          transition: '.3s',
          display: 'flex',
        }}>
          <img style={{width:'30px', opacity: '40%'}} src='/Settings.png'/>
          <p style={{marginTop: '12px', marginLeft:'10px', color: 'grey'}}>Settings</p>
        </button>
<div style={{width: '280px', fontSize: '20px', height:'45px', borderRadius: '10px', fontWeight: 'bold',  border: '6px solid #F4F4F4', background:' white', cursor: 'pointer', display:'flex',
alignItems: 'center',
marginLeft: '10px',
transition: '.3s',


}}
>
   <h1 style={{fontSize: '20px', marginLeft:'20px'}}>Student Review </h1>
       
          <input type="checkbox" 
           className="greenSwitch"
           style={{marginLeft:'30px'}}
           checked={allViewable} onChange={toggleAllViewable} />
         
  
       
        </div>
         
        <button onClick={() => setIsAssignModalOpen(true)} style={{
          width: '310px',
          fontSize: '20px',
          height: '50px',
          borderRadius: '10px',
          fontWeight: 'bold',
          border: '6px solid #54AAA4',
          background: '#A3F2ED ',
          cursor: 'pointer',
          color: '#54AAA4',
          marginLeft: '10px',
          transition: '.3s',
        }}
       >
          Assign to New Students
        </button>

     
      </div>
      <AnimatePresence>
  {showSettings && <SettingsSection key="settings" />}
</AnimatePresence>



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
            zIndex: '0',
          }}
          onMouseEnter={() => setHoveredStudent(student.uid)}
          onMouseLeave={() => setHoveredStudent(null)}
          > 
            <div style={{
              width: '60px',
              height: '55px',
              border: '7px solid #566DFF',
              backgroundColor: '#003BD4',
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
            <div 
      style={{ 
        display: 'flex', 
        marginBottom: '-15px', 
        cursor: 'pointer',
        transition: 'color 0.3s'
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
      <h3 style={{ fontWeight: 'normal', color: 'inherit', fontFamily: "'Radio Canada', sans-serif", fontSize: '23px' }}>{student.lastName},</h3>
      <h3 style={{ fontWeight: 'bold', color: 'inherit', fontFamily: "'Radio Canada', sans-serif", fontSize: '23px', marginLeft: '10px' }}>{student.firstName}</h3>
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
                color: '#FCCA18'
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
                right: '-78px',
                top: '-6px',
                height: '80px',
                width: '50px',
                padding: '10px',
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
                navigate(`/teacherStudentResultsMCQ/${assignmentId}/${student.uid}/${classId}`);
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

     
      {showOverlay && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(5px)',
    zIndex: 98,  // Make sure this is below the question bank but above other content
  }} />
)}
    </div>
  );
};


export default TeacherResultsMCQ;
