import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, updateDoc, where, query, getDocs, writeBatch, deleteDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import { db } from '../../Universal/firebase';
import { AnimatePresence } from 'framer-motion';
import CustomDateTimePicker from './CustomDateTimePickerResults';
import 'react-datepicker/dist/react-datepicker.css';
import Exports from './Exports';
import { Settings, ArrowRight, SquareArrowOutUpRight, SquareX, EyeOff, Eye, SquareCheck, SquareMinus, SquareArrowRight } from 'lucide-react';
import Tooltip from './ToolTip';
const TeacherResultsAMCQ = () => {
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
  const assignmentDataRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({});
  const [resetStudent, setResetStudent] = useState(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [averageGrade, setAverageGrade] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [students, setStudents] = useState([]);
    const { classId, assignmentId } = useParams();
    const { teacherId } = useParams(); // Assuming you have teacherId from URL params
  
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

  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <SquareCheck color="#00DE09" size={30} strokeWidth={2.5}/>;
      case 'In Progress':
        return <SquareMinus color="#FFAA00" size={30} strokeWidth={2.5}/>;
      case 'not_started':
        return <SquareX color="lightgrey" size={30} strokeWidth={2.5}/>;
      case 'Paused':
        return <SquareMinus color="#FFA500" size={30} strokeWidth={2.5}/>;
      default:
        return null;
    }
  };
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      try {
        const classesRef = collection(db, 'classes');
        const q = query(classesRef, where('teacherId', '==', teacherId)); // Adjust field name as per your DB
        const querySnapshot = await getDocs(q);
        const classes = [];
        querySnapshot.forEach((doc) => {
          classes.push({ id: doc.id, ...doc.data() });
        });
        setTeacherClasses(classes);
      } catch (error) {
        console.error("Error fetching teacher classes:", error);
      }
    };

    fetchTeacherClasses();
  }, [teacherId]);
  
  useEffect(() => {
    const fetchAssignmentSettings = async () => {
      const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
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
    const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
    const updateData = { [setting]: value };
    
 

    await updateDoc(assignmentRef, updateData);
    setAssignmentSettings(prev => ({ ...prev, [setting]: value }));
  };
  
  const SettingsSection = () => (

    <div style={{ position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 101,}}>
    <div style={{
      width: '790px',
      marginRight: 'auto',
      marginLeft: 'auto', position: 'relative',
      border: '10px solid lightgrey',
      backgroundColor: '#f4f4f4',
  color:'grey',
      borderRadius: '20px',
      marginTop: '-10px'
    }}>
      <div style={{display: 'flex', marginTop: '10px', marginBottom: '-30px', marginLeft: '20px'}}>
       <Settings size={40} />
  
<h1 style={{marginTop: '0px', marginLeft: '20px'}}>Settings</h1>

<button onClick={() => setShowSettings(!showSettings)}  style={{height: '40px', background: 'transparent', border: 'none', cursor: 'pointer',marginLeft: 'auto', marginRight: '10px',color:'grey', marginTop: '0px'}}>  <SquareX size={40} strokeWidth={3} style={{}} />
</button> 
</div>
<div style={{
        marginLeft: '0px',
        borderTop: '10px solid lightgrey',
        background: 'white',
        borderRadius: '0px 0px 10px 10px',
       
        padding: '20px',
        width: '750px',
        marginTop: '20px',
      
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', borderRadius: '10px', marginLeft: '-5px', background: '#F4F4F4' }}>         <h3 style={{
              fontSize: '18px',
              color: 'grey', 
              marginLeft: '20px', 
              marginRight: '-28px',
              fontFamily: "'montserrat', sans-serif",
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
              fontFamily: "'montserrat', sans-serif",
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
          <div style={{display: 'flex', alignItems: 'center', border: '4px solid #f4f4f4', borderRadius: '10px', width: '400px', height: '70px'}}>
            <h3 style={{lineHeight: '30px', marginLeft: '20px', marginRight: '20px',     fontFamily: "'montserrat', sans-serif",}}>Timer</h3>
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
                  <span style={{ marginLeft: '5px' ,    fontFamily: "'montserrat', sans-serif",}}>minutes</span>
                </>
              ) : (
                <span style={{ marginLeft: '10px', color: 'grey',     fontFamily: "'montserrat', sans-serif", }}>Off</span>
              )}
            </div>
          </div>
  
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '4px solid #f4f4f4', borderRadius: '10px', width: '275px', height: '70px', padding: '0 20px'}}>
            <h3 style={{    fontFamily: "'montserrat', sans-serif",}}>Half Credit</h3>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.halfCredit}
              onChange={(e) => updateAssignmentSetting('halfCredit', e.target.checked)}
            />
          </div>
        </div>
  
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '4px solid #f4f4f4', borderRadius: '10px', width: '50%', height: '60px', padding: '0 20px'}}>
            <h3 style={{    fontFamily: "'montserrat', sans-serif",}}>Lockdown</h3>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.lockdown}
              onChange={(e) => updateAssignmentSetting('lockdown', e.target.checked)}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '4px solid #f4f4f4', borderRadius: '10px', width: '35%', height: '60px', padding: '0 20px'}}>
            <h3 style={{    fontFamily: "'montserrat', sans-serif",}}>Save & Exit</h3>
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
    </div>
  );

  const navigateToStudentGrades = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };
  // Fetch assignment data
  const fetchAssignmentData = async () => {
    try {
      const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (assignmentDoc.exists()) {
        const data = assignmentDoc.data();
        setAssignmentData(data);
        setAllViewable(data.viewable || false); 
        assignmentDataRef.current = data;
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
        
        const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);
        
        if (assignmentDoc.exists()) {
          const assignmentData = assignmentDoc.data();
          const name = assignmentData.assignmentName;
          const dueDate = assignmentData.dueDate;
          const assignDate = assignmentData.assignDate;
          console.log("Assignment found:", assignmentData);
          setAssignmentName(name);
          setAssignDate(assignDate ? new Date(assignDate) : null);
          setDueDate(dueDate ? new Date(dueDate) : null);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching assignment name:", error);
      }
    };
  
    fetchAssignmentName();
  }, [assignmentId]);

  // Fetch class and grades data
  useEffect(() => {
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
              name: `${firstName} ${lastName}`,
              isAssigned: studentData.assignmentsToTake?.includes(assignmentId) ||
                          studentData.assignmentsInProgress?.includes(assignmentId) ||
                          studentData.assignmentsTaken?.includes(assignmentId)
            };
          }
          return participant;
        }));
        
        // Sort students by last name
        const sortedStudents = updatedParticipants.sort((a, b) => 
          a.lastName.localeCompare(b.lastName)
        );
        
        setStudents(sortedStudents);
        const assignedStudents = sortedStudents.filter(student => student.isAssigned);
          setAssignedCount(assignedStudents.length);

        const gradesCollection = collection(db, 'grades(AMCQ)');
        const gradesQuery = query(gradesCollection, where('assignmentId', '==', assignmentId));
        const gradesSnapshot = await getDocs(gradesQuery);
        const fetchedGrades = {};
       let totalScore = 0;
          let validGradesCount = 0;
          let submissionsCount = 0;

        gradesSnapshot.forEach((doc) => {
          const gradeData = doc.data();
          fetchedGrades[gradeData.studentUid] = {
            submittedAt: gradeData.submittedAt,
            SquareScore: gradeData.SquareScore,
            viewable: gradeData.viewable || false,
          };
    
            if (gradeData.submittedAt) {
              submissionsCount++;
            }
          if (typeof gradeData.SquareScore === 'number' && !isNaN(gradeData.SquareScore)) {
            totalScore += gradeData.SquareScore;
            validGradesCount++;
          }
        });
    
        setGrades(fetchedGrades);
    

        setSubmissionCount(submissionsCount);
  
      
  
        const calculatedAverage = validGradesCount > 0 ? (totalScore / validGradesCount).toFixed(0) : null;
          setAverageGrade(calculatedAverage);
  
        // Update assignment document with new class average
        if (calculatedAverage !== null) {
          const assignmentRef = doc(db, 'assignments(AMCQ)', assignmentId);
          await updateDoc(assignmentRef, { classAverage: parseFloat(calculatedAverage) });
        }
      }
    } catch (error) {
      console.error("Error fetching class and grades:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchClassAndGrades();
  const classAndGradesInterval = setInterval(fetchClassAndGrades, 10000);

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
      const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
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

  const AdaptiveHeading = ({ text }) => {
    const [fontSize, setFontSize] = useState(60);
    const headingRef = useRef(null);
  
    useEffect(() => {
      const fitText = () => {
        if (headingRef.current) {
          let size = 60;
          headingRef.current.style.fontSize = `${size}px`;
  
          while (headingRef.current.scrollWidth > headingRef.current.offsetWidth && size > 40) {
            size--;
            headingRef.current.style.fontSize = `${size}px`;
          }
  
          setFontSize(size);
        }
      };
  
      fitText();
      window.addEventListener('resize', fitText);
      return () => window.removeEventListener('resize', fitText);
    }, [text]);
  
    return (
      <h1
        ref={headingRef}
        style={{
          fontSize: `${fontSize}px`,
          color: 'black',
          width: '90%',
          fontFamily: "'montserrat', sans-serif",
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          lineHeight: '1.2',
          margin: 0,
          marginBottom: '0px',
          padding: '10px 0',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }}
      >
        {text}
      </h1>
    );
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


    const assignmentRef = doc(db, 'assignments(AMCQ)', assignmentId);
    batch.update(assignmentRef, { viewable: newViewableStatus });

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






  const QuestionBankModal = ({ onClose, setShowQuestionBank, setShowOverlay }) => {
    const [hoveredOptions, setHoveredOptions] = useState({});
  const modalRef = useRef(null);
  const questions = assignmentDataRef.current?.questions || [];
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
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      height: '600px',
      width: '800px',  
      backgroundColor: 'white', 
      border: '10px solid #f4f4f4',
      borderRadius: '20px',
      zIndex: 100,
      transition: 'all 0.3s ease-in-out',
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? 'visible' : 'hidden',
    }}
    
    >
      {isVisible && (
   <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '-10px -10px 0px -10px',
        padding: '10px',
        height: '40px',
        background: '#FCD3FF',
         color: '#D800FB',
        borderRadius: '20px 20px 0px 0px',
        border: '10px solid #D800FB',
      }}
      >
         
        <h2 style={{ 
          fontSize: '30px', 
          fontWeight: 'bold', 
          fontFamily: "'montserrat', sans-serif",
          marginLeft: '30px',
         
          marginTop: '20px',
        
        }}>Questions</h2>
       <button onClick={onClose} style={{ 
          backgroundColor: 'transparent', 
          border: 'none', 
          fontSize: '24px', 
          color: '#D800FB',
          cursor: 'pointer' 
        }}>

          <SquareX size={40}  strokeWidth={2.5}style={{}}/>
        </button>
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
           
            <h3 style={{ fontSize: '30px', fontWeight: 'bold', fontFamily: "'montserrat', sans-serif", width: '100%' }}>
              {question.question}<span style={{fontSize: '20px', color: 'grey'}}>-{question.difficulty}</span>
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
                    fontFamily: "'montserrat', sans-serif",
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
              <p style={{ fontSize: '14px', color: '#ff4d4d', width: '100%', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold' }}>
                Explanation: {question[`explanation_${hoveredOptions[index]}`]}
              </p>
            )}
            {(hoveredOptions[index] === question.correct || !hoveredOptions[index]) && (
              <p style={{ fontSize: '14px', color: '#4CAF50', width: '100%', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold' }}>
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
     
      
          {showQuestionBank && assignmentDataRef.current && (
     
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
      

      








      
<div style={{
        width: '80px',
        position: 'fixed',
        left: '-30px',
        top: '0px',
        height: '100%',
        borderRight: ' 4px solid #f4f4f4',
        justifyContent: 'space-between',
        marginTop: '0px',
        alignSelf: 'center',
        alignItems: 'center',
        marginLeft: '30px',
        marginBottom: '30px'
      }}>
       
      



     
          <h1 style={{position: 'absolute', top: '58px', color: '#20BF00', fontSize: '20px', width: '80px',textAlign: 'center', background: '#DDFFDB', borderRight: '4px solid #20BF00', height: '40px', lineHeight: '40px' }}>MCQ<span style={{color: '#FFD13B'}}>*</span></h1>
    
    <div style={{height: '4px', width: '70px', background: 'transparent', borderRadius: '10px', marginLeft: '10px', marginTop: '120px', marginBottom: '20px'}}></div>

    <Tooltip text="Question Bank">

         <button 
         onClick={() => {
          if (assignmentData && assignmentData.questions) {
            setShowQuestionBank(!showQuestionBank);
            setShowOverlay(!showQuestionBank);
          } else {
            console.log("No questions available");
          }
        }}  style={{
          width: '60px',
          height: '60px',
          borderRadius: '10px',
          fontWeight: 'bold',
          border: '4px solid',
          cursor: 'pointer',
          marginLeft: '10px',
          transition: '.3s',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '5px',
          zIndex: '100',
          borderColor: isHovered ? '#E441FF' : 'transparent',
          backgroundColor: isHovered ? '#F5B6FF' : 'transparent',
          color: isHovered ? '#E441FF' : 'grey',
        }}
        
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
              <img 
        src={isHovered ? '/questionbankpink.svg' : '/QuestionBank.svg'}
        style={{ width: '35px', marginTop: '0px' ,
          opacity: isHovered ? '100%' : '40%',}} 
        alt="Question Bank"
      />
        </button>
        </Tooltip>

        <div style={{height: '4px', width: '70px', background: 'transparent', borderRadius: '10px', marginLeft: '15px', marginTop: '15px', marginBottom: '20px'}}></div>
     

  <Tooltip text="Student Review">

        <div
          title="Allow students to review their responses"
      onClick={toggleAllViewable}
      style={{
        width: '55px',
          height: '55px',
          borderRadius: '10px',
          cursor: 'pointer',
          marginTop: '0px',
          marginLeft: '8px',
          transition: '.3s',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0px',
        border: `4px solid ${allViewable ? '#020CFF' : 'transparent'}`,
        background: allViewable ? '#B0BDFF' : 'transparent',
        color: allViewable ? '#020CFF' : 'grey',
        fontWeight: allViewable ? 'bold' : '600',
     
      }}
    >
      {allViewable ? (
        <Eye size={40}  />
      ) : (
        <EyeOff size={40}  />
      )}
    </div>
</Tooltip>



<div style={{height: '4px', width: '70px', background: 'transparent', borderRadius: '10px', marginLeft: '15px', marginTop: '15px', marginBottom: '20px'}}></div>
     

     <Tooltip text="Assignment Settings">
  
 
     <button
 
       onClick={() => setShowSettings(!showSettings)}
       style={{
         width: '65px',
         height: '65px',
         borderRadius: '10px',
         fontWeight: 'bold',
         border: '4px solid transparent',
         background: 'transparent',
         cursor: 'pointer',
         color: 'grey',
         marginTop: '0px',
         marginLeft: '8px',
         transition: '.3s',
         display: 'flex',
         flexDirection: 'column',
         justifyContent: 'center',
         alignItems: 'center',
         padding: '5px',
       }}
       onMouseEnter={e => {
         e.currentTarget.style.borderColor = 'lightgrey';
         e.currentTarget.style.backgroundColor = '#f4f4f4';
         
         e.currentTarget.style.color = 'grey';
       }}
       onMouseLeave={e => {
         e.currentTarget.style.borderColor = 'transparent';
         
         e.currentTarget.style.color = 'grey';
         e.currentTarget.style.backgroundColor = 'transparent';
       }}
     >
       <Settings size={40} color="#8f8f8f" />
     </button>
 </Tooltip>
     <div style={{height: '4px', width: '70px', background: 'white', borderRadius: '10px', marginLeft: '10px', marginTop: '5px', marginBottom: '25px'}}> </div>
     
     <Tooltip text="Export to other classes">
 
     <Exports assignmentId={assignmentId} />
    </Tooltip>













       </div>













  <div style={{ width: '1000px', display: 'flex', justifyContent: 'align', marginTop: '200px', marginLeft: 'auto', marginRight: 'auto' , }}>
        <div style={{ display: 'flex', width: '800px' , marginRight: 'auto', marginLeft: '120px',  marginTop: '-50px', lineHeight:'0px', borderBottom: '2px solid #e4e4e4', paddingBottom: '15px', marginBottom:'30px' }}>
         <div style={{position: 'relative', width: '650px', height: '150px' }}>
         <AdaptiveHeading text={assignmentName} />
    <h1 style={{  fontSize: '25px', 
      color: 'grey', 
      width: '260px', // Use full width of parent
      fontFamily: "'montserrat', sans-serif",
      wordWrap: 'break-word', // Allow long words to break and wrap
      overflowWrap: 'break-word', // Ensure long words don't overflow
      hyphens: 'auto', // Enable automatic hyphenation
      lineHeight: '1.2', // Adjust line height for better readability
      margin: 0,
      marginBottom: '10px', // Remove default margins
      padding: '10px 0' }}>{submissionCount}/{assignedCount} Submissions</h1>

      </div>
      <Tooltip text="Class Average">
  
        <div style={{background: '#09BA00', border: '10px solid #AEF2A3', width:' 110px', height: '110px', borderRadius: '30px '}}>
      <div style={{fontSize: '45px', fontWeight: 'bold', width: '88px', background: 'white', height: '88px', marginTop: '12px', borderRadius:  '10px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', lineHeight: '90px'}}> 
      {averageGrade !== null ? averageGrade : '-'}
      </div>
        </div>
</Tooltip>

        </div>
        
      </div>
     



<div style={{
        width: '810px',
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0px',
        alignSelf: 'center',
        alignItems: 'center',
        marginLeft: '30px'
      }}>
      
  
     
      </div>
      <AnimatePresence>
  {showSettings && <SettingsSection key="settings" />}
</AnimatePresence>



     
      
     
      

      <ul>
      {students.map((student) => (
  <li key={student.uid} style={{ 
    width: '780px', 
    height: '40px', 
    alignItems: 'center', 
    display: 'flex', 
    justifyContent: 'space-between', 
    marginRight: 'auto', 
    marginLeft: 'auto', 
    border: '2px solid #E8E8E8', 
    backgroundColor: 'white', 
    borderRadius: '10px', 
    padding: '10px', 
    marginBottom: '20px', 
    position: 'relative',
    zIndex: '0', 
  }}>
    <div style={{ marginLeft: '20px', width: '460px', display: 'flex', marginTop: '5px' }}>
      <div 
        style={{ 
          display: 'flex', 
          marginBottom: '10px', 
          cursor: 'pointer',
          transition: 'color 0.3s',
          width: '280px',
          marginTop: '5px'
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
        <h3 style={{ fontWeight: 'normal', color: 'inherit', fontFamily: "'montserrat', sans-serif", fontSize: '20px' }}>{student.lastName},</h3>
        <h3 style={{ fontWeight: '600', color: 'inherit', fontFamily: "'montserrat', sans-serif", fontSize: '20px', marginLeft: '10px' }}>{student.firstName}</h3>
      </div>
    </div>

    {student.isAssigned ? (
      <>
        <div style={{ fontWeight: 'bold', textAlign: 'center', color: 'black', fontFamily: "'montserrat', sans-serif", marginTop: '0px', width: '100px', marginRight: '20px', marginLeft: '-40px' }}>
          {grades[student.uid] ? (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '-2px', width: '130px',  }}>
              <p style={{ fontWeight: 'bold', width: '23px', fontSize: '22px', backgroundColor: '#566DFF', height: '23px', border: '4px solid #003BD4', lineHeight: '23px', color: 'white', borderRadius: '7px', fontFamily: "'montserrat', sans-serif" }}>
                {calculateLetterGrade(grades[student.uid].SquareScore)}
              </p>
              <p style={{ fontSize: '25px', color: 'grey', marginLeft: '20px' }}>
                {`${Math.round(grades[student.uid].SquareScore)}%`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '-2px',width: '130px',  }}>
              <p style={{ fontWeight: 'bold', width: '23px', fontSize: '22px', backgroundColor: '#C0C0C0', height: '23px', border: '4px solid #A8A8A8', lineHeight: '23px', color: 'white', borderRadius: '7px', fontFamily: "'montserrat', sans-serif" }}>
                Z
              </p>
              <p style={{ fontSize: '25px', color: 'lightgrey', marginLeft: '20px' }}>
                00%
              </p>
            </div>
          )}
        </div>
        <div style={{ color: 'lightgrey', width: '360px',  display: 'flex', alignItems: 'center', marginLeft: '20px', marginTop: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{marginRight: '10px ', marginLeft: '10px'}}>  
              {getStatusIcon(grades[student.uid] && grades[student.uid].submittedAt ? 'completed' : assignmentStatuses[student.uid])}
            </div>
            <h1 style={{ 
              fontSize: grades[student.uid] && grades[student.uid].submittedAt ? '17px' : '20px', 
              fontFamily: "'montserrat', sans-serif", 
              fontWeight: '600',
              fontStyle: grades[student.uid] && grades[student.uid].submittedAt ? 'italic' : 'normal',
              color: grades[student.uid] && grades[student.uid].submittedAt ? '#808080' : getStatusColor(assignmentStatuses[student.uid]),
              textTransform: assignmentStatuses[student.uid] === 'completed' ? 'uppercase' : 'capitalize',
              cursor: assignmentStatuses[student.uid] === 'Paused' ? 'pointer' : 'default',
              marginRight: '10px',
              marginTop: '10px'
            }}
            onMouseEnter={() => assignmentStatuses[student.uid] === 'Paused' && setHoveredStatus(student.uid)}
            onMouseLeave={() => setHoveredStatus(null)}
            onClick={() => assignmentStatuses[student.uid] === 'Paused' && togglePauseAssignment(student.uid)}
            >
              {grades[student.uid] && grades[student.uid].submittedAt ? 
                ` ${new Date(grades[student.uid].submittedAt.toDate()).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}` : 
                (hoveredStatus === student.uid && assignmentStatuses[student.uid] === 'Paused' 
                  ? 'Unpause' 
                  : assignmentStatuses[student.uid])
              }
            </h1>
          </div>
        </div>
        <button
          style={{ 
            backgroundColor: 'transparent', 
            color: resetStatus[student.uid] === 'success' ? 'lightgreen' : 'red', 
            marginLeft: 'auto', 
            cursor: 'pointer', 
            textAlign: 'left', 
            borderColor: 'transparent', 
            fontFamily: "'montserrat', sans-serif", 
            fontWeight: 'bold', 
            fontSize: '16px', 
            marginTop: '-0px',
            marginRight: '20px' 
          }} 
          onClick={() => handleReset(student.uid)}
        >
          {resetStatus[student.uid] === 'success' ? 'Success' : 'Reset'}
        </button>
      </>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
        <h1 style={{fontSize: '16px', color: 'lightgrey', marginRight: '200px', width: '120px' }}>Not Assigned</h1>
        <button
          style={{ 
            backgroundColor: 'transparent', 
            color: '#2BB514', 
            cursor: 'pointer', 
            borderColor: 'transparent', 
            fontFamily: "'montserrat', sans-serif", 
            fontWeight: 'bold', 
            fontSize: '16px', 
            marginRight: '10px' 
          }} 
          onClick={() => handleAssign(student.uid)}
        >
          Assign
        </button>
      </div>
    )}

    {student.isAssigned && assignmentStatuses[student.uid] === 'completed' && (
      <div
        style={{
          position: 'absolute',
          right: '-80px',
          top: '-4px',
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
          navigate(`/teacherStudentResultsAMCQ/${assignmentId}/${student.uid}/${classId}`);
        }}
      >
        <SquareArrowRight size={50} color="#09BA00" strokeWidth={2.5} />
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(5px)',
    zIndex: 98,  // Make sure this is below the question bank but above other content
  }} />
)}
    </div>
  );
};


export default TeacherResultsAMCQ;
