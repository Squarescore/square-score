import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, updateDoc, where, query, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { arrayUnion, arrayRemove, deleteDoc, getDoc, onSnapshot, documentId  } from 'firebase/firestore';
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
import { Settings, ArrowRight, SquareArrowOutUpRight,  SquareDashedMousePointer, SquareX, SquareMinus, SquareCheck, Landmark, Eye, EyeOff, Flag, YoutubeIcon, Trash2 } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import TeacherPreview from '../Create/PreviewSAQ';
import QuestionBankSAQ from './QuesntionBankSAQ';
import StudentResultsList from './StudentResultList';
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
    const assignmentRef = doc(db, 'assignments', assignmentId);
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
      const assignmentRef = doc(db, 'assignments', assignmentId);
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
      const assignmentRef = doc(db, 'assignments', assignmentId);
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
    const assignmentRef = doc(db, 'assignments', assignmentId);
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

      assignmentName: data.assignmentName || '',
        questionCount: {
          student: data.questionCount?.student || '5',
          bank: data.questionCount?.bank || '10'
        }
      });
      setAssignmentName(data.assignmentName || '');
      setTimer(data.timer ? data.timer.toString() : '0');
      setTimerOn(data.timer > 0);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignmentSettings();
  }, [fetchAssignmentSettings]);

  const updateAssignmentSetting = async (setting, value) => {
    const assignmentRef = doc(db, 'assignments', assignmentId);
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
    if (setting === 'assignmentName') {
      setAssignmentName(value);
    }
    if (setting === 'questionCount') {
      updateData.questionCount = value;
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
      width: '460px',
      height: '500px',
      marginRight: 'auto',
      boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
      marginLeft: 'auto', position: 'relative',
      border: '10px solid white',
  color:'grey',
      borderRadius: '30px',
      marginTop: '-10px'
    }}>
      <div style={{display: 'flex', margin: '-10px', border: '10px solid lightgrey', borderRadius: '30px 30px 0px 0px', height: '60px',
      backgroundColor: '#f4f4f4',}}>
       <Settings size={40} style={{marginTop: '10px', marginLeft: '20px'}} />
  
<h1 style={{marginTop: '10px', marginLeft: '20px',}}>Settings</h1>

<button onClick={() => setShowSettings(!showSettings)} 
 style={{height: '40px', background: 'transparent', border: 'none', cursor: 'pointer',marginLeft: 'auto', marginRight: '10px',color:'grey', marginTop: '10px'}}>  
  <SquareX size={40} strokeWidth={3} style={{}} />

</button>  </div>
       <div style={{
        marginLeft: '0px',
        background: 'white',
        borderRadius: '0px 0px 10px 10px',
       height: '350px',
      overflowY: 'auto',
        padding: '20px',
        width: '430px',
        marginTop: '20px',
      
      }}>





<div style={{  alignItems: 'center', marginBottom: '10px', borderRadius: '10px', marginLeft: '-5px', }}>      
          
          <h3 style={{
           fontSize: '16px',
           fontWeight: '600',
           color: 'black', 
           marginLeft: '0px', 
           marginBottom: '4px',
           fontFamily: "'montserrat', sans-serif",
         }}>Assignment Name:</h3>
        <input 
    value={assignmentName}
    onChange={(e) => updateAssignmentSetting('assignmentName', e.target.value)}
    style={{
      height: '30px', 
      width: '415px',
      border: '2px solid #f4f4f4',
      borderRadius: '10px',
      padding: '5px',
      fontSize: '16px',
      fontFamily: "'montserrat', sans-serif",
    }}
  />
   </div>

<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0px' }}>
       
<div style={{  alignItems: 'center', marginBottom: '10px', borderRadius: '10px', marginLeft: '-5px', }}>      
          
          <h3 style={{
           fontSize: '16px',
           fontWeight: '600',
           color: 'black', 
           marginLeft: '0px', 
           marginBottom: '4px',
           fontFamily: "'montserrat', sans-serif",
         }}>Assigned:</h3>
         <div style={{marginLeft: '-10px' }}>
         <CustomDateTimePicker
       selected={assignmentSettings.assignDate}
       onChange={(date) => updateAssignmentSetting('assignDate', date)}
       updateAssignmentSetting={updateAssignmentSetting}
       settingName="assignDate"
     />
   </div>
   </div>
 
   </div>


   <div style={{  alignItems: 'center', marginBottom: '10px', borderRadius: '10px', marginLeft: '-5px', }}>      
          
          <h3 style={{
           fontSize: '16px',
           fontWeight: '600',
           color: 'black', 
           marginLeft: '0px', 
           marginBottom: '4px',
           fontFamily: "'montserrat', sans-serif",
         }}> Due:</h3>
             <div style={{marginLeft: '-10px' }}>
         <CustomDateTimePicker
           selected={assignmentSettings.dueDate}
           onChange={(date) => updateAssignmentSetting('dueDate', date)}
           updateAssignmentSetting={updateAssignmentSetting}
           settingName="dueDate"
         />
   </div>
   </div>


   <div style={{display: 'flex', alignItems: 'center', borderRadius: '10px', width: '410px', height: '30px', marginLeft: '-5px', position: 'relative', marginTop: '10px'}}>
            <h3 style={{fontSize: '16px', color: 'black',
           fontWeight: '600',   fontFamily: "'montserrat', sans-serif",}}>Timer</h3>
            <div style={{ display: 'flex', alignItems: 'center' , marginLeft: 'auto'}}>
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
          style={{ width: '50px', position:'absolute',left: '100px', }}
        />
                  <span style={{ marginLeft: '5px' ,    fontFamily: "'montserrat', sans-serif",}}>minutes</span>
                </>
              ) : (
                <span style={{ marginLeft: '10px', color: 'grey',   position:'absolute',left: '100px',   fontFamily: "'montserrat', sans-serif", }}>Off</span>
              )}
            </div>
          </div>



               <div style={{display: 'flex', alignItems: 'center',  borderRadius: '10px', width: '410px', height: '30px', marginLeft: '-5px', position: 'relative', marginTop: '20px'}}>
            <h3 style={{fontSize: '16px', color: 'black',
           fontWeight: '600',   fontFamily: "'montserrat', sans-serif",}}>Questions Per Student</h3>
            <div style={{ display: 'flex', alignItems: 'center' , marginLeft: 'auto'}}>
            <input
      type="number"
      value={assignmentSettings.questionCount?.student || '5'}
      onChange={(e) => updateAssignmentSetting('questionCount', {
        ...assignmentSettings.questionCount,
        student: e.target.value
      })}
      style={{
        width: '50px',
        height: '30px',
        border: '2px solid #f4f4f4',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '16px',
        fontFamily: "'montserrat', sans-serif",
      }}
    />
            </div>
          </div> 
  
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        
  
          <div style={{ borderRadius: '10px', width: '410px', height: '30px', marginLeft: '-5px',  display: 'flex', marginTop: '20px' }}>
            <h3 style={{fontSize: '16px', color: 'black', marginTop :'5px',
           fontWeight: '600',   fontFamily: "'montserrat', sans-serif",}}>Scale</h3>
            <div style={{display: 'flex', alignItems: 'center', marginLeft: 'auto'}}>
              <input
                type="number"
                value={assignmentSettings.scaleMin}
                onChange={(e) => updateAssignmentSetting('scaleMin', e.target.value)}
                style={{ height: '20px', width: '30px', border: '4px solid transparent', background: '#F2A3A3', color: '#B51414', textAlign: 'center', lineHeight: '50px', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold', paddingLeft: '15px'}}
              />
              <h1 style={{marginLeft: '20px', marginRight: '20px'}}>-</h1>
              <input
                type="number"
                value={assignmentSettings.scaleMax}
                onChange={(e) => updateAssignmentSetting('scaleMax', e.target.value)}
                style={{ height: '20px', width: '30px', border: '4px solid lightgreen', background: '#AEF2A3', color: '#2BB514', textAlign: 'center', lineHeight: '50px', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold', paddingLeft: '15px'}}
              />
            </div>
          </div>
        </div>
  




        <div style={{display: 'flex', alignItems: 'center', borderRadius: '10px', width: '410px', height: '30px', marginLeft: '-5px', position: 'relative', marginTop: '20px'}}>
            <h3 style={{fontSize: '16px', color: 'black',
           fontWeight: '600',   fontFamily: "'montserrat', sans-serif",}}>Half Credit</h3>
            <div style={{ display: 'flex', alignItems: 'center' , marginLeft: 'auto'}}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.halfCredit}
              onChange={(e) => updateAssignmentSetting('halfCredit', e.target.checked)}
            />
            </div>
          </div> 


          <div style={{display: 'flex', alignItems: 'center',  borderRadius: '10px', width: '410px', height: '30px', marginLeft: '-5px', position: 'relative', marginTop: '20px'}}>
            <h3 style={{fontSize: '16px', color: 'black',
           fontWeight: '600',   fontFamily: "'montserrat', sans-serif",}}>Save And Exit</h3>
            <div style={{ display: 'flex', alignItems: 'center' , marginLeft: 'auto'}}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.saveAndExit}
              onChange={(e) => updateAssignmentSetting('saveAndExit', e.target.checked)}
            />
            </div>
          </div> 


          <div style={{display: 'flex', alignItems: 'center',  borderRadius: '10px', width: '410px', height: '30px', marginLeft: '-5px', position: 'relative', marginTop: '20px'}}>
            <h3 style={{fontSize: '16px', color: 'black',
           fontWeight: '600',   fontFamily: "'montserrat', sans-serif",}}>Lockdown</h3>
            <div style={{ display: 'flex', alignItems: 'center' , marginLeft: 'auto'}}>
            <input
              type="checkbox"
              className="greenSwitch"
              checked={assignmentSettings.lockdown}
              onChange={(e) => updateAssignmentSetting('lockdown', e.target.checked)}
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
    const assignmentRef = doc(db, 'assignments', assignmentId);
    batch.update(assignmentRef, { viewable: newViewableStatus });
  
    for (const student of students) {
      const gradeRef = doc(db, 'grades', `${assignmentId}_${student.uid}`);
      
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
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
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
        const assignmentRef = doc(db, 'assignments', assignmentId);
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

 
  const handleReset = async (studentUid) => {
    if (window.confirm("Are you sure you want to reset this student's assignment? This action cannot be undone.")) {
      try {
        // Delete the grade document
        const gradeDocRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
        await deleteDoc(gradeDocRef);
  
        // Delete any progress documents
        const progressQuery = query(
          collection(db, 'assignments(progress)'),
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
        const assignmentRef = doc(db, 'assignments', assignmentId);
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
  let unsubscribeClass;
  let unsubscribeGrades;
  let unsubscribeAssignment;
  let studentDataCache = {}; // Cache student data
  let lastFetch = 0;
  const FETCH_COOLDOWN = 5000; // 5 seconds cooldown between fetches

  const setupRealtimeListeners = async () => {
    setLoading(true);
    try {
      // 1. Single listener for assignment data
      unsubscribeAssignment = onSnapshot(doc(db, 'assignments', assignmentId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setAssignmentData(data);
          setAssignmentName(data.assignmentName);
          setAssignDate(data.assignDate ? new Date(data.assignDate) : null);
          setDueDate(data.dueDate ? new Date(data.dueDate) : null);
          setAllViewable(data.viewable || false);
          if (data.questions) {
            setQuestions(Object.entries(data.questions).map(([id, questionData]) => ({
              questionId: id,
              ...questionData
            })));
          }
        }
      });

      // 2. Combined listener for class and student data with throttling
      unsubscribeClass = onSnapshot(doc(db, 'classes', classId), async (classDoc) => {
        if (!classDoc.exists()) return;

        const classData = classDoc.data();
        if (!classData.participants?.length) return;

        const now = Date.now();
        if (now - lastFetch < FETCH_COOLDOWN) return; // Throttle fetches
        lastFetch = now;

        // Only fetch data for new or updated students
        const studentsToFetch = classData.participants.filter(
          p => !studentDataCache[p.uid] || studentDataCache[p.uid].lastUpdate < now - 60000
        );

        if (studentsToFetch.length > 0) {
          // Batch student docs into chunks of 10 (Firestore limit)
          const chunkSize = 10;
          for (let i = 0; i < studentsToFetch.length; i += chunkSize) {
            const chunk = studentsToFetch.slice(i, i + chunkSize);
            const studentDocs = await getDocs(query(
              collection(db, 'students'),
              where(documentId(), 'in', chunk.map(s => s.uid))
            ));

            studentDocs.forEach(doc => {
              const data = doc.data();
              studentDataCache[doc.id] = {
                data,
                lastUpdate: now
              };
            });
          }
        }

        // Process all students using cache
        const updatedParticipants = classData.participants
          .map(participant => {
            const studentData = studentDataCache[participant.uid]?.data;
            if (studentData) {
              return {
                ...participant,
                firstName: studentData.firstName.trim(),
                lastName: studentData.lastName.trim(),
                name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`,
                isAssigned: studentData.assignmentsToTake?.includes(assignmentId) ||
                          studentData.assignmentsInProgress?.includes(assignmentId) ||
                          studentData.assignmentsTaken?.includes(assignmentId)
              };
            }
            return participant;
          })
          .sort((a, b) => a.lastName.localeCompare(b.lastName));

        setStudents(updatedParticipants);
        setAssignedCount(updatedParticipants.filter(s => s.isAssigned).length);
      });

      // 3. Single listener for all grades
      unsubscribeGrades = onSnapshot(
        query(collection(db, 'grades'), where('assignmentId', '==', assignmentId)),
        (snapshot) => {
          const gradesData = snapshot.docs.reduce((acc, doc) => {
            const gradeData = doc.data();
            acc.grades[gradeData.studentUid] = {
              totalScore: gradeData.totalScore,
              maxScore: gradeData.maxScore,
              submittedAt: gradeData.submittedAt,
              percentageScore: gradeData.percentageScore,
              viewable: gradeData.viewable || false,
              questions: gradeData.questions?.map(q => ({
                ...q,
                flagged: q.flagged || false,
              })) || [],
            };
            
            if (gradeData.submittedAt) acc.submissionsCount++;
            if (typeof gradeData.percentageScore === 'number' && !isNaN(gradeData.percentageScore)) {
              acc.totalScore += gradeData.percentageScore;
              acc.validGradesCount++;
            }
            acc.reviewCount += (gradeData.questions || []).filter(q => q.flagged).length;
            
            return acc;
          }, { grades: {}, totalScore: 0, validGradesCount: 0, submissionsCount: 0, reviewCount: 0 });

          setGrades(gradesData.grades);
          setSubmissionCount(gradesData.submissionsCount);
          setReviewCount(gradesData.reviewCount);

          if (gradesData.validGradesCount > 0) {
            const calculatedAverage = (gradesData.totalScore / gradesData.validGradesCount).toFixed(0);
            setAverageGrade(calculatedAverage);
            updateDoc(doc(db, 'assignments', assignmentId), {
              classAverage: parseFloat(calculatedAverage)
            });
          }
        }
      );

    } catch (error) {
      console.error("Error setting up listeners:", error);
    } finally {
      setLoading(false);
    }
  };

  setupRealtimeListeners();

  return () => {
    if (unsubscribeClass) unsubscribeClass();
    if (unsubscribeGrades) unsubscribeGrades();
    if (unsubscribeAssignment) unsubscribeAssignment();
    studentDataCache = {};
  };
}, [classId, assignmentId]);






























  const handleBack = () => {
    navigate(-1);
  };
  
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
  const navigateToStudentResults = (studentUid) => {
    navigate(`/teacherStudentResults/${assignmentId}/${studentUid}/${classId}`);
  };
  
  return (
    <div style={{  display: 'flex', flexDirection: 'column',  backgroundColor: '#fcfcfc', position: 'absolute', left: 0, right: 0, bottom: 0, top: 0}}>
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
              <div style={{marginTop: '85px', marginLeft: '-9px', fontSize: '60px', fontWeight: 'bold'}}>
                <SquareX size={40} color="#D800FB" strokeWidth={3} />
              </div>
            </button>
            <QuestionBankSAQ
              questionsWithIds={generatedQuestions}
              setQuestionsWithIds={handleUpdateQuestions}
              sourceText={sourceText}
              questionCount={questionBank}
              classId={classId}
              teacherId={teacherId}
              
              assignmentId={assignmentId}
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
        <div style={{ display: 'flex', width: '900px' , marginRight: 'auto', marginLeft: '50px', height: ' auto', lineHeight:'0px', paddingBottom: '15px', marginBottom:'0px' }}>
         <div style={{position: 'relative', width: '620px', backgroundColor: 'white',  height: '150px', padding: '20px 10px  20px 40px',  
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',  borderRadius: '20px', }}>
        <AdaptiveHeading text={assignmentName} />




        
    <h1 style={{  fontSize: '25px', 
      color: 'white', 
      width: '260px', // Use full width of parent
      fontFamily: "'montserrat', sans-serif",
      wordWrap: 'break-word', // Allow long words to break and wrap
      overflowWrap: 'break-word', // Ensure long words don't overflow
      hyphens: 'auto', // Enable automatic hyphenation
      lineHeight: '1.2', // Adjust line height for better readability
      margin: 0,
      position: 'absolute', bottom: '20px', left: '40px', // Remove default margins
      padding: '10px 0' }}> classname  here </h1>
<h1 style={{position: 'absolute', fontSize: '25px', right: '50px',  bottom: '25px',color: 'blue', }}>SAQ</h1>
      </div>
      
  <div style={{height: '190px', backgroundColor: 'white',  width: '190px', 
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)', borderRadius: '20px',marginLeft: 'auto', }}>
      <Tooltip text="Class Average">
      
      <img style={{ width: '150px', marginLeft: '20px' , marginTop: '23px' }} src="/Score.svg" alt="logo" />
      <div style={{fontSize: '45px', fontWeight: 'bold', width: '88px', position: 'absolute', background: 'transparent', height: '88px', borderRadius:  '10px', top: '50px', left: '50px', textAlign: 'center', lineHeight: '90px'}}> 
      {averageGrade !== null ? averageGrade : '-'}
     
        </div>
</Tooltip>
</div>
        </div>
        
      </div>


<div style={{
        width: '80px',
        position: 'fixed',
        left: '-30px',
        top: '0px',
        height: '100%',
        
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
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
             marginTop: '280px',
             marginLeft: '10px',
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
            
      <Flag size={40} color="#FFAA00" strokeWidth={2.5} />
      
     
      <h1 style={{ fontSize: '20px', marginTop: '-2px', color: '#FFAA00', marginBottom: '-0px',  lineHeight: '1', fontFamily: "'montserrat', sans-serif", }}>{reviewCount}</h1>
       </button>
       </Tooltip>


     
      </div>
      )}

     
      
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



<div style={{width: '850px', marginLeft: 'auto', marginRight: 'auto', marginTop: '20px',
      height: '40px', marginBottom: '0px'
      
      }}>
       
<h1 style={{  fontSize: '25px', 
      color: 'black',

      fontWeight: '600', 
      width: '260px', // Use full width of parent
      fontFamily: "'montserrat', sans-serif",
      wordWrap: 'break-word', // Allow long words to break and wrap
      overflowWrap: 'break-word', // Ensure long words don't overflow
      hyphens: 'auto', // Adjust line height for better readability
     
   }}>{submissionCount}/{assignedCount} Submissions </h1>

</div>
<StudentResultsList
        students={students}
        grades={grades}
        assignmentStatuses={assignmentStatuses}
        navigateToStudentGrades={navigateToStudentGrades}
        navigateToStudentResults={navigateToStudentResults}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        calculateLetterGrade={calculateLetterGrade}
        hoveredStatus={hoveredStatus}
        setHoveredStatus={setHoveredStatus}
        togglePauseAssignment={togglePauseAssignment}
        handleReset={handleReset}
        resetStatus={resetStatus}
        handleAssign={handleAssign}
        gradeField="percentageScore" // Specify the grade field for TeacherResults
        navigateToResultsPath="/teacherStudentResults/" // Specify the navigation path
      />
      
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
