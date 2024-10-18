import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, updateDoc, where, query, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { arrayUnion, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import { useRef } from 'react';
import { auth } from '../../Universal/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback } from 'react';
import Tooltip from './ToolTip';
import axios from 'axios';
import { serverTimestamp } from 'firebase/firestore';
import CustomDateTimePicker from './CustomDateTimePickerResults';
import Exports from './Exports';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { Settings, SquareArrowRight, SquareArrowOutUpRight, ArrowRight, SquareDashedMousePointer, SquareX, SquareMinus, SquareCheck, Landmark, Eye, EyeOff, Flag, YoutubeIcon, Trash2 } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import TeacherPreview from '../Create/PreviewSAQ';
const TeacherResults = () => {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [resetStudent, setResetStudent] = useState(null);
  const [resetStatus, setResetStatus] = useState({}); // State to manage reset statuses for each student
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignDate, setAssignDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const { classId, assignmentId } = useParams();
  const [isHovered, setIsHovered] = useState(false);
  const [assignmentData, setAssignmentData] = useState(null);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [averageGrade, setAverageGrade] = useState(null);

  const navigate = useNavigate();
  const [reviewCount, setReviewCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [assignmentName, setAssignmentName] = useState('');
  const chunkSize = 10; // Limit to 10 based on Firebase's 'in' query limit
  const [allViewable, setAllViewable] = useState(false); // New state for the global viewable switch
  const [hoveredStudent, setHoveredStudent] = useState(null);
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [sourceText, setSourceText] = useState('');
  const [timerOn, setTimerOn] = useState(false);
  const [timer, setTimer] = useState('0');
  const [questionBank, setQuestionBank] = useState('10');
  const [questionStudent, setQuestionStudent] = useState('5');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [teacherId, setTeacherId] = useState(null);
  const [showMissingAssignmentsModal, setShowMissingAssignmentsModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [studentsWithoutAssignment, setStudentsWithoutAssignment] = useState([]);
  
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
  const fetchStudentsWithoutAssignment = useCallback(async () => {
    const studentsWithoutAssignment = [];
    for (const student of students) {
      const studentRef = doc(db, 'students', student.uid);
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        if (!studentData.assignmentsTaken?.includes(assignmentId) &&
            !studentData.assignmentsToTake?.includes(assignmentId) &&
            !studentData.assignmentsInProgress?.includes(assignmentId)) {
          studentsWithoutAssignment.push(student);
        }
      }
    }
    setStudentsWithoutAssignment(studentsWithoutAssignment);
  }, [students, assignmentId]);
  const handleDeleteSuccess = () => {
    // You can add any additional actions here if needed
    console.log("Assignment deleted successfully");
  };
  useEffect(() => {
    if (students.length > 0) {
      fetchStudentsWithoutAssignment();
    }
  }, [students, fetchStudentsWithoutAssignment]);
 

  useEffect(() => {
    const fetchTeacherId = async () => {
      const user = auth.currentUser;
      if (user) {
        setTeacherId(user.uid);
      } else {
        console.error("No authenticated user found");
      }
    };
    fetchTeacherId();
  }, []);
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

  const fetchAssignmentQuestions = useCallback(async () => {
    const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    if (assignmentDoc.exists()) {
      const data = assignmentDoc.data();
      if (data.questions) {
        const allQuestions = Object.entries(data.questions).map(([id, questionData]) => ({
          questionId: id,
          ...questionData
        }));
        setGeneratedQuestions(allQuestions);
      }
      setSourceText(data.sourceText || '');
      setQuestionBank(data.questionCount?.bank || '10');
      setQuestionStudent(data.questionCount?.student || '5');
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignmentQuestions();
  }, [fetchAssignmentQuestions]);

  useEffect(() => {
    if (showQuestionBank) {
      fetchAssignmentQuestions();
    }
  }, [showQuestionBank, fetchAssignmentQuestions]);



  const handleCloseQuestionBank = () => {
    setShowQuestionBank(false);
    setShowOverlay(false);
  };
  useEffect(() => {
    fetchAssignmentQuestions();
  }, [fetchAssignmentQuestions]);
  const regenerateQuestionsFirebase = async (questions, additionalInstructions) => {
    try {
      const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/RegenerateSAQ', {
        sourceText,
        questionCount: questionBank,
        QuestionsPreviouslyGenerated: JSON.stringify(questions),
        instructions: additionalInstructions,
        classId,
        teacherId
      });

      const regeneratedQuestions = response.data.questions.map((newQuestion, index) => ({
        ...newQuestion,
        questionId: questions[index] ? questions[index].questionId : `newQuestion${index}`
      }));

      return regeneratedQuestions;
    } catch (error) {
      console.error('Error regenerating questions:', error);
      throw error;
    }
  };

  const handleRegenerateQuestions = async (newInstructions) => {
    try {
      const regeneratedQuestions = await regenerateQuestionsFirebase(generatedQuestions, newInstructions);
      setGeneratedQuestions(regeneratedQuestions);
      
      // Update the assignment document with new questions
      const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
      const updatedQuestions = {};
      regeneratedQuestions.forEach((q, index) => {
        updatedQuestions[`question${index + 1}`] = {
          question: q.question,
          rubric: q.rubric
        };
      });
      await updateDoc(assignmentRef, { questions: updatedQuestions });
    } catch (error) {
      console.error('Error handling question regeneration:', error);
    }
  };

  const handleUpdateQuestions = async (updatedQuestions) => {
    try {
      const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
      const updatedQuestionsObj = {};
      updatedQuestions.forEach((q, index) => {
        updatedQuestionsObj[`question${index + 1}`] = {
          question: q.question,
          rubric: q.rubric
        };
      });
      await updateDoc(assignmentRef, { questions: updatedQuestionsObj });
      setGeneratedQuestions(updatedQuestions);
    } catch (error) {
      console.error('Error updating questions:', error);
    }
  };

  const fetchAssignmentSettings = useCallback(async () => {
    const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    if (assignmentDoc.exists()) {
      const data = assignmentDoc.data();
      setAssignmentSettings({
        assignDate: data.assignDate ? new Date(data.assignDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        halfCredit: data.halfCredit || false,
        lockdown: data.lockdown || false,
        saveAndExit: data.saveAndExit !== undefined ? data.saveAndExit : true,
        scaleMin: data.scale?.min || '0',
        scaleMax: data.scale?.max || '2',
        timer: data.timer || '0',
        timerOn: data.timer > 0,
      });
      setTimer(data.timer ? data.timer.toString() : '0');
      setTimerOn(data.timer > 0);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignmentSettings();
  }, [fetchAssignmentSettings]);

  const updateAssignmentSetting = async (setting, value) => {
    const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
    const updateData = { [setting]: value };
        
    if (setting === 'timer') {
      updateData.timerOn = value !== '0';
      setTimerOn(value !== '0');
    }
    if (setting === 'scaleMin' || setting === 'scaleMax') {
      updateData.scale = {
        min: setting === 'scaleMin' ? value : assignmentSettings.scaleMin,
        max: setting === 'scaleMax' ? value : assignmentSettings.scaleMax,
      };
    }

    await updateDoc(assignmentRef, updateData);
    setAssignmentSettings(prev => ({ ...prev, [setting]: value }));
    
    // Refresh settings after update
    fetchAssignmentSettings();
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

<button onClick={() => setShowSettings(!showSettings)} 
 style={{height: '40px', background: 'transparent', border: 'none', cursor: 'pointer',marginLeft: 'auto', marginRight: '10px',color:'grey', marginTop: '0px'}}>  
  <SquareX size={40} strokeWidth={3} style={{}} />

</button>  </div>
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
          selected={assignmentSettings.assignDate}
          onChange={(date) => updateAssignmentSetting('assignDate', date)}
          updateAssignmentSetting={updateAssignmentSetting}
          settingName="assignDate"
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
          selected={assignmentSettings.dueDate}
          onChange={(date) => updateAssignmentSetting('dueDate', date)}
          updateAssignmentSetting={updateAssignmentSetting}
          settingName="dueDate"
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
      onChange={handleTimerToggle}
    />
    {assignmentSettings.timerOn ? (
      <>
                  <input
          type="number"  value={timer}
          onChange={handleTimerChange}
          style={{ width: '50px', marginLeft: '10px', padding: '5px' }}
        />
                  <span style={{ marginLeft: '5px' ,    fontFamily: "'montserrat', sans-serif",}}>minutes</span>
                </>
              ) : (
                <span style={{ marginLeft: '10px', color: 'grey',     fontFamily: "'montserrat', sans-serif", }}>Off</span>
              )}
            </div>
          </div>
  
          <div style={{ display: 'flex', alignItems: 'center', border: '4px solid #f4f4f4', borderRadius: '10px', width: '300px', height: '70px' }}>
            <h3 style={{marginLeft: '30px', marginRight: '30px' ,    fontFamily: "'montserrat', sans-serif",}}>Scale</h3>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <input
                type="number"
                value={assignmentSettings.scaleMin}
                onChange={(e) => updateAssignmentSetting('scaleMin', e.target.value)}
                style={{ height: '30px', width: '30px', border: '4px solid transparent', background: '#F2A3A3', color: '#B51414', textAlign: 'center', lineHeight: '50px', borderRadius: '10px', fontSize: '25px', fontWeight: 'bold', paddingLeft: '15px'}}
              />
              <h1 style={{marginLeft: '20px', marginRight: '20px'}}>-</h1>
              <input
                type="number"
                value={assignmentSettings.scaleMax}
                onChange={(e) => updateAssignmentSetting('scaleMax', e.target.value)}
                style={{ height: '30px', width: '30px', border: '4px solid lightgreen', background: '#AEF2A3', color: '#2BB514', textAlign: 'center', lineHeight: '50px', borderRadius: '10px', fontSize: '25px', fontWeight: 'bold', paddingLeft: '15px'}}
              />
            </div>
          </div>
        </div>
  
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '4px solid #f4f4f4', borderRadius: '10px', width: '185px', height: '60px', padding: '0 20px'}}>
            <h3 style={{    fontFamily: "'montserrat', sans-serif",}}>Half Credit</h3>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.halfCredit}
              onChange={(e) => updateAssignmentSetting('halfCredit', e.target.checked)}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '4px solid #f4f4f4', borderRadius: '10px', width: '185px', height: '60px', padding: '0 20px'}}>
            <h3 style={{    fontFamily: "'montserrat', sans-serif",}}>Lockdown</h3>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.lockdown}
              onChange={(e) => updateAssignmentSetting('lockdown', e.target.checked)}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '4px solid #f4f4f4', borderRadius: '10px', width: '200px', height: '60px', padding: '0 20px'}}>
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
 
  const toggleAllViewable = async () => {
    const newViewableStatus = !allViewable;
    setAllViewable(newViewableStatus);
  
    const batch = writeBatch(db);
  
    // Update the assignment document
    const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
    batch.update(assignmentRef, { viewable: newViewableStatus });
  
    for (const student of students) {
      const gradeRef = doc(db, 'grades(saq)', `${assignmentId}_${student.uid}`);
      
      // First, check if the document exists
      const gradeDoc = await getDoc(gradeRef);
      
      if (gradeDoc.exists()) {
        const gradeData = gradeDoc.data();
        
        // Update the viewable status
        const updatedData = {
          viewable: newViewableStatus,
        };
  
        // If bs exist, update their flagged status
        if (gradeData.questions && Array.isArray(gradeData.questions)) {
          updatedData.questions = gradeData.questions.map(question => ({
            ...question,
            flagged: question.flagged || false, // Set to false if not already set
          }));
        }
  
        batch.update(gradeRef, updatedData);
  
        // Update local state
        setGrades(prevGrades => ({
          ...prevGrades,
          [student.uid]: {
            ...prevGrades[student.uid],
            viewable: newViewableStatus,
            questions: updatedData.questions || [],
          }
        }));
      }
      // If the document doesn't exist, we don't create a new one
    }
  
    try {
      await batch.commit();
      console.log("Successfully updated viewable status for existing documents");
    } catch (error) {
      console.error("Error updating viewable status:", error);
      // Optionally, revert the local state change here
    }
  };
 
  const togglePauseAssignment = async (studentUid) => {
    if (assignmentStatuses[studentUid] !== 'Paused') return;
  
    setResetStatus(prev => ({ ...prev, [studentUid]: 'updating' }));
  
    try {
      const studentRef = doc(db, 'students', studentUid);
      const progressRef = doc(db, 'assignments(progress:saq)', `${assignmentId}_${studentUid}`);
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
  useEffect(() => {
    const fetchAssignmentName = async () => {
      try {
        const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);
        if (assignmentDoc.exists()) {
          const data = assignmentDoc.data();
          setAssignmentName(data.assignmentName);
          setAssignDate(data.assignDate ? new Date(data.assignDate) : null);
          setDueDate(data.dueDate ? new Date(data.dueDate) : null);
        } else {
          console.error("Assignment not found");
        }
      } catch (error) {
        console.error("Error fetching assignment name:", error);
      }
    };
  
    fetchAssignmentName();
  }, [assignmentId]);

 
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

          const gradesCollection = collection(db, 'grades(saq)');
          const gradesQuery = query(gradesCollection, where('assignmentId', '==', assignmentId));
          const gradesSnapshot = await getDocs(gradesQuery);
          const fetchedGrades = {};
          let totalScore = 0;
          let validGradesCount = 0;
          let submissionsCount = 0;

          gradesSnapshot.forEach((doc) => {
            const gradeData = doc.data();
            fetchedGrades[gradeData.studentUid] = {
              totalScore: gradeData.totalScore,
              maxScore: gradeData.maxScore,
              submittedAt: gradeData.submittedAt,
              percentageScore: gradeData.percentageScore,
              viewable: gradeData.viewable || false,
              questions: gradeData.questions ? gradeData.questions.map(q => ({
                ...q,
                flagged: q.flagged || false,
              })) : [],
            };

            if (gradeData.submittedAt) {
              submissionsCount++;
            }

            if (typeof gradeData.percentageScore === 'number' && !isNaN(gradeData.percentageScore)) {
              totalScore += gradeData.percentageScore;
              validGradesCount++;
            }
          });

          setGrades(fetchedGrades);
          setSubmissionCount(submissionsCount);

          const calculatedAverage = validGradesCount > 0 ? (totalScore / validGradesCount).toFixed(0) : null;
          setAverageGrade(calculatedAverage);

          // Update assignment document with new class average
          if (calculatedAverage !== null) {
            const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
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
  const handleReset = async (studentUid) => {
    if (window.confirm("Are you sure you want to reset this student's assignment? This action cannot be undone.")) {
      try {
        // Delete the grade document
        const gradeDocRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
        await deleteDoc(gradeDocRef);
  
        // Delete any progress documents
        const progressQuery = query(
          collection(db, 'assignments(progress:saq)'),
          where('assignmentId', '==', assignmentId),
          where('studentUid', '==', studentUid)
        );
        const progressSnapshot = await getDocs(progressQuery);
        const deletePromises = progressSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
  
        // Update student's assignment status
        const studentRef = doc(db, 'students', studentUid);
        await updateDoc(studentRef, {
          assignmentsTaken: arrayRemove(assignmentId),
          assignmentsToTake: arrayUnion(assignmentId),
          assignmentsInProgress: arrayRemove(assignmentId) // Remove from assignmentsInProgress
        });
  
        // Update local state to reflect the reset
        setGrades(prevGrades => {
          const newGrades = { ...prevGrades };
          delete newGrades[studentUid];
          return newGrades;
        });
  
        // Update assignment status in local state
        setAssignmentStatuses(prevStatuses => ({
          ...prevStatuses,
          [studentUid]: 'not_started'
        }));
        
        console.log(`Assignment reset for student ${studentUid}`);
      } catch (error) {
        console.error("Error resetting assignment:", error);
      }
    }
  };
  const handleAssign = async (studentId) => {
    try {
      const batch = writeBatch(db);
      const studentRef = doc(db, 'students', studentId);
      batch.update(studentRef, {
        assignmentsToTake: arrayUnion(assignmentId)
      });
      
      await batch.commit();
      
      // Update local state
      setAssignmentStatuses(prev => ({
        ...prev,
        [studentId]: 'not_started'
      }));
  
      // Show success message
      setResetStatus(prev => ({ ...prev, [studentId]: 'success' }));
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentId]: '' })), 2000);
  
      console.log(`Assignment assigned to student ${studentId}`);
    } catch (error) {
      console.error("Error assigning assignment:", error);
      // Show error message
      setResetStatus(prev => ({ ...prev, [studentId]: 'failed' }));
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentId]: '' })), 2000);
    }
  };






 useEffect(() => {
    const fetchAssignmentData = async () => {
      try {
        const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);
        if (assignmentDoc.exists()) {
          const data = assignmentDoc.data();
          setAssignmentData(data);
          setAssignmentName(data.assignmentName);
          setAssignDate(data.assignDate ? new Date(data.assignDate) : null);
          setDueDate(data.dueDate ? new Date(data.dueDate) : null);
          setAllViewable(data.viewable || false); 
          if (data.questions) {
            const allQuestions = Object.entries(data.questions).map(([id, questionData]) => ({
              questionId: id,
              ...questionData
            }));
            setQuestions(allQuestions);
          }
        } else {
          console.error("Assignment not found");
        }
      } catch (error) {
        console.error("Error fetching assignment data:", error);
      }
    };

    fetchAssignmentData();
  }, [assignmentId]);

  const handleTimerToggle = async () => {
    const newTimerOn = !timerOn;
    setTimerOn(newTimerOn);
    if (newTimerOn) {
      await updateAssignmentSetting('timer', timer);
    } else {
      await updateAssignmentSetting('timer', '0');
    }
  };
  
  const handleTimerChange = (e) => {
    const newValue = e.target.value;
    setTimer(newValue);
    if (timerOn) {
      updateAssignmentSetting('timer', newValue);
    }
  };
<style>
  {`
    .student-item {
      transition: border-color 0.3s;
    }
    .student-item:hover {
      border-color: #020CFF !important;
    }
  `}
</style>




























































  useEffect(() => {
    const fetchReviewCount = async () => {
      const gradesCollection = collection(db, 'grades(saq)');
      let count = 0;
    
      for (let i = 0; i < students.length; i += chunkSize) {
        const studentChunk = students.slice(i, i + chunkSize).map(student => student.uid);
        const gradesQuery = await getDocs(query(gradesCollection, where('studentUid', 'in', studentChunk), where('assignmentId', '==', assignmentId)));
    
        gradesQuery.forEach((doc) => {
          const gradeData = doc.data();
          count += (gradeData.questions || []).filter(question => question.flagged).length;
        });
      }
    
      setReviewCount(prevCount => {
        console.log("New Review count:", count);
        return count;
      });
    };

   

    if (students.length > 0) {
      fetchReviewCount();
      const reviewCountInterval = setInterval(() => {
        fetchReviewCount();
      }, 10000); // Poll every 10 seconds

      return () => {
        clearInterval(reviewCountInterval);
      };
    }
  }, [students]);

  const handleBack = () => {
    navigate(-1);
  };
  useEffect(() => {
    const fetchAssignmentStatus = async () => {
      const statusPromises = students.map(async (student) => {
        const progressRef = doc(db, 'assignments(progress:saq)', `${assignmentId}_${student.uid}`);
        const progressDoc = await getDoc(progressRef);
        const gradeRef = doc(db, 'grades(saq)', `${assignmentId}_${student.uid}`);
        const gradeDoc = await getDoc(gradeRef);
        const studentRef = doc(db, 'students', student.uid);
        const studentDoc = await getDoc(studentRef);
  
        let status = 'not_assigned';
        if (gradeDoc.exists()) {
          status = 'completed';
        } else if (progressDoc.exists()) {
          status = progressDoc.data().status === 'paused' ? 'Paused' : 'In Progress';
        } else if (studentDoc.exists() && studentDoc.data().assignmentsToTake?.includes(assignmentId)) {
          status = 'not_started';
        }
  
        return { [student.uid]: status };
      });
  
      const statuses = await Promise.all(statusPromises);
      const combinedStatuses = Object.assign({}, ...statuses);
      setAssignmentStatuses(combinedStatuses);
    };
  
    fetchAssignmentStatus();
  }, [students, assignmentId]);
  const goToReview = () => {
    navigate(`/teacherReview/${classId}/${assignmentId}`);
  };

  const calculatePercentage = (grade, totalQuestions) => {
    return Math.floor((grade / totalQuestions) * 100);
  };

  const calculateLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#808080'; // Green
      case 'In Progress':
        return '#808080'; // Yellow
      case 'not_started':
        return 'lightgrey'; // Grey
      case 'paused':
        return '#FFA500'; // Orange
      default:
        return '#808080';
    }
  };
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

  
  return (
    <div style={{  display: 'flex', flexDirection: 'column', backgroundColor: '' }}>
      <Navbar userType="teacher" />
   
    
      {showQuestionBank && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100
        }}>
          <div style={{position: 'relative'}}>
            <button
              onClick={handleCloseQuestionBank}
              style={{
                position: 'absolute',
                top: '0px',
                right: '30px',
                zIndex: '990',
                height: '34px', 
                width: '34px',
                borderRadius: '6px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
              }}
            >
              <div style={{marginTop: '-10px', marginLeft: '-9px', fontSize: '60px', fontWeight: 'bold'}}>
                <SquareX size={40} color="#D800FB" strokeWidth={3} />
              </div>
            </button>
            <TeacherPreview
              questionsWithIds={generatedQuestions}
              setQuestionsWithIds={handleUpdateQuestions}
              sourceText={sourceText}
              questionCount={questionBank}
              classId={classId}
              teacherId={teacherId}
              onRegenerateQuestions={handleRegenerateQuestions}
            />
          </div>
        </div>
      )}

      {showOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(5px)',
          zIndex: 98,
        }} />
      )}
      
      


      <div style={{ width: '1000px', display: 'flex', justifyContent: 'align', marginTop: '150px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ display: 'flex', width: '800px' , marginRight: 'auto', marginLeft: '120px', height: ' auto', lineHeight:'0px', borderBottom: '2px solid #e4e4e4', paddingBottom: '15px', marginBottom:'30px' }}>
         <div style={{position: 'relative', width: '650px', }}>
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
  
        <div style={{background: 'blue', border: '10px solid #627BFF', width:' 110px', height: '110px', borderRadius: '30px '}}>
      <div style={{fontSize: '45px', fontWeight: 'bold', width: '88px', background: 'white', height: '88px', marginTop: '12px', borderRadius:  '10px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', lineHeight: '90px'}}> 
      {averageGrade !== null ? averageGrade : '-'}
      </div>
        </div>
</Tooltip>

        </div>
        
      </div>


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
       
       
      {reviewCount > 0 && (
      
        <div>
      <Tooltip text="Review questions and answers students are disputing">
  
         <button 
           
           style={{
          
          position: 'absolute',
        top: '285px',
        left: '0px',
             width: '60px',
             height: '60px',
             borderRadius: '10px',
             fontWeight: 'bold',
             cursor: 'pointer',
             marginTop: '240px',
             marginLeft: '15px',
             transition: '.3s',
             display: 'flex',
             flexDirection: 'column',
             justifyContent: 'center',
             alignItems: 'center',
             padding: '5px',
            right: '20px',
            color: 'grey',
            fontFamily: "'montserrat', sans-serif",
            backgroundColor: '#FFF0A1',
           border: '4px solid #FCBB18',
            
            fontsize: '80px',
          }} onClick={goToReview}
          
          onMouseEnter={(e) => {
            e.currentTarget.style.bordercolor = '#2F37FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.bordercolor = '#FCBB18';
          }}
          
        title={`Students have marked ${reviewCount} responses for your review.`}
          >
            
      <Flag size={40} color="#FFAA00" strokeWidth={2} />
      
     
      <h1 style={{ fontSize: '20px', marginTop: '-2px', color: '#FFAA00', marginBottom: '-0px',  lineHeight: '1', fontFamily: "'montserrat', sans-serif", }}>{reviewCount}</h1>
       </button>
       </Tooltip>

<div style={{height: '4px', width: '70px', background: '#DEDEDE', borderRadius: '10px', marginLeft: '10px', marginTop: '10px', marginBottom: '10px',
  position: 'absolute',
  top: '500px',
  left: '0px',
}}></div>
     
      </div>
      )}

     
          <h1 style={{position: 'absolute', top: '58px', color: 'blue', fontSize: '20px', width: '80px',textAlign: 'center', background: '#C7CFFF', borderRight: '4px solid blue', height: '40px', lineHeight: '40px' }}>SAQ</h1>
    
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

    <button
  onClick={() => setShowDeleteModal(true)}
  style={{
    width: '75px',
        height: '75px',
        borderRadius: '10px',
        fontWeight: 'bold',
        border: '4px solid transparent',
        background: 'transparent',
        cursor: 'pointer',
        color: 'grey',
        position: 'absolute',
        bottom: '10px',
        left: '5px',
        transition: '.3s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'left',
        padding: '5px',
        fontFamily: "'montserrat', sans-serif",

  }}
>
<Tooltip text="Delete Assignment">
  <Trash2 size={30} color="grey" />
  </Tooltip>
</button>
       
     
      </div>
      <AnimatePresence>
  {showSettings && <SettingsSection key="settings" />}
</AnimatePresence>

 {showDeleteModal && (
  <DeleteConfirmationModal
    onClose={() => setShowDeleteModal(false)}
    assignmentId={assignmentId}
    classId={classId}
    assignmentName={assignmentName}
    onDeleteSuccess={handleDeleteSuccess}
  />
)}
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
  
      {assignmentStatuses[student.uid] !== 'not_assigned' && (
        <>
          <div style={{ fontWeight: 'bold', textAlign: 'center', color: 'black', fontFamily: "'montserrat', sans-serif", marginTop: '0px', width: '100px', marginRight: '20px', marginLeft: '-40px' }}>
            {grades[student.uid] ? (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '-2px', width: '130px',  }}>
                <p style={{ fontWeight: 'bold', width: '23px', fontSize: '22px', backgroundColor: '#566DFF', height: '23px', border: '4px solid #003BD4', lineHeight: '23px', color: 'white', borderRadius: '7px', fontFamily: "'montserrat', sans-serif" }}>
                  {calculateLetterGrade(grades[student.uid].percentageScore)}
                </p>
                <p style={{ fontSize: '25px', color: 'grey', marginLeft: '20px' }}>
                  {`${Math.round(grades[student.uid].percentageScore)}%`}
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
        </>
      )}
  
      {assignmentStatuses[student.uid] === 'not_assigned' ? (
       
       <div>
        <h1 style={{fontSize: '16px', position: 'absolute', width: '340px' , color: 'lightgrey', left: '320px', top: '10px' }}>Not Assigned</h1>
       <button
          style={{ 
            backgroundColor: 'transparent', 
            color: '#2BB514', 
            marginLeft: 'auto', 
            cursor: 'pointer', 
            borderColor: 'transparent', 
            fontFamily: "'montserrat', sans-serif", 
            fontWeight: 'bold', 
            fontSize: '16px', 
            marginTop: '-0px',
            marginRight: '10px' 
          }} 
          onClick={() => handleAssign(student.uid)}
        >
          Assign
        </button>
        </div>
      ) : (
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
      )}
  
      {assignmentStatuses[student.uid] === 'completed' && (
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
            navigate(`/teacherStudentResults/${assignmentId}/${student.uid}/${classId}`);
          }}
        >
          <SquareArrowRight size={50} color="#020CFF" strokeWidth={2.5} />
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
          zIndex: 98,
        }} />
      )}
        
    </div>
  );
};

export default TeacherResults;
