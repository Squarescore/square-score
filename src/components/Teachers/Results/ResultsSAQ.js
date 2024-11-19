import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { debounce } from 'lodash';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { Settings, ArrowRight, SquareArrowOutUpRight,  SquareDashedMousePointer, SquareX, SquareMinus, SquareCheck, Landmark, Eye, EyeOff, Flag, YoutubeIcon, Trash2 } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import TeacherPreview from '../Create/PreviewSAQ';
import QuestionBankSAQ from './QuesntionBankSAQ';
import StudentResultsList from './StudentResultList';
import TeacherReview from './TeacherReview';
import SettingsSection from './SettingsSection';// At the top of your component

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
  const location = useLocation();
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
  const [activeTab, setActiveTab] = useState('submissions');
  const studentDataCache = useRef({});

  
  const [autoOpenQuestionId, setAutoOpenQuestionId] = useState(null);

  // In the useEffect that handles initial load, add:

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'questionBank') {
      setShowQuestionBank(true);
      setShowOverlay(true);
    } else if (tab === 'settings') {
      setShowSettings(true);
    }
  };

  const updateClassAssignmentAverage = useCallback(
    debounce(async (newAverage) => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classRef);
        
        if (classDoc.exists()) {
          const classData = classDoc.data();
          const assignments = classData.assignments || [];
          
          // Update the assignment entry with the new average
          const updatedAssignments = assignments.map(assignment => {
            if (assignment.id === assignmentId) {
              return {
                ...assignment,
                average: newAverage
              };
            }
            return assignment;
          });
          
          await updateDoc(classRef, {
            assignments: updatedAssignments
          });
        }
      } catch (error) {
        console.error("Error updating class assignment average:", error);
      }
    }, 1000),
    [classId, assignmentId] // Include dependencies here
  );
  
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
    if (location.state?.targetTab === 'questionBank') {
      setActiveTab('questionBank');
      setShowQuestionBank(true);
      setShowOverlay(true);
      if (location.state?.targetQuestionId && location.state?.openQuestionResults) {
        setAutoOpenQuestionId(location.state.targetQuestionId);
      }
    }
  }, [location.state]);
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
    const [fontSize, setFontSize] = useState(30);
    const headingRef = useRef(null);
  
    useEffect(() => {
      const fitText = () => {
        if (headingRef.current) {
          let size = 30;
          headingRef.current.style.fontSize = `${size}px`;
  
          while (headingRef.current.scrollWidth > headingRef.current.offsetWidth && size > 20) {
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
  

  const navigateToStudentGrades = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };
 
  const toggleAllViewable = async () => {
    const newViewableStatus = !allViewable;
    setAllViewable(newViewableStatus);
  
    const batch = writeBatch(db);
  
    try {
      // 1. Update the assignment document
      const assignmentRef = doc(db, 'assignments', assignmentId);
      batch.update(assignmentRef, { viewable: newViewableStatus });
  
      // 2. Update the class document
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      
      if (classDoc.exists()) {
        const classData = classDoc.data();
        const viewableAssignments = classData.viewableAssignments || [];
        
        if (newViewableStatus) {
          // Add to viewable assignments if not already present
          if (!viewableAssignments.includes(assignmentId)) {
            batch.update(classRef, {
              viewableAssignments: arrayUnion(assignmentId)
            });
          }
          
          // Also update the assignment entry in the assignments array
          const assignments = classData.assignments || [];
          const updatedAssignments = assignments.map(assignment => {
            if (assignment.id === assignmentId) {
              return {
                ...assignment,
                viewable: true
              };
            }
            return assignment;
          });
          
          batch.update(classRef, {
            assignments: updatedAssignments
          });
        } else {
          // Remove from viewable assignments
          batch.update(classRef, {
            viewableAssignments: arrayRemove(assignmentId)
          });
          
          // Update the assignment entry in the assignments array
          const assignments = classData.assignments || [];
          const updatedAssignments = assignments.map(assignment => {
            if (assignment.id === assignmentId) {
              return {
                ...assignment,
                viewable: false
              };
            }
            return assignment;
          });
          
          batch.update(classRef, {
            assignments: updatedAssignments
          });
        }
      }
  
      // 3. Update all relevant grade documents
      for (const student of students) {
        const gradeRef = doc(db, 'grades', `${assignmentId}_${student.uid}`);
        const gradeDoc = await getDoc(gradeRef);
        
        if (gradeDoc.exists()) {
          const gradeData = gradeDoc.data();
          const updatedData = {
            viewable: newViewableStatus,
          };
  
          if (gradeData.questions && Array.isArray(gradeData.questions)) {
            updatedData.questions = gradeData.questions.map(question => ({
              ...question,
              flagged: question.flagged || false,
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
      }
  
      await batch.commit();
      console.log("Successfully updated viewable status across all documents");
    } catch (error) {
      console.error("Error updating viewable status:", error);
      // Revert local state on error
      setAllViewable(!newViewableStatus);
    }
  };
  const togglePauseAssignment = async (studentUid) => {
    const student = students.find(s => s.uid === studentUid);
    if (!student) return;
  
    setResetStatus(prev => ({ ...prev, [studentUid]: 'updating' }));
  
    try {
      const studentRef = doc(db, 'students', studentUid);
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      const studentDoc = await getDoc(studentRef);
  
      if (!studentDoc.exists()) {
        throw new Error("Student document not found");
      }
  
      const studentData = studentDoc.data();
      const isPaused = studentData.assignmentsPaused?.includes(assignmentId);
  
      if (isPaused) {
        // Unpause
        await updateDoc(studentRef, {
          assignmentsPaused: arrayRemove(assignmentId),
          assignmentsInProgress: arrayUnion(assignmentId)
        });
  
        await updateDoc(progressRef, { 
          status: 'in_progress',
          updatedAt: serverTimestamp()
        });
  
      } else {
        // Pause
        await updateDoc(studentRef, {
          assignmentsInProgress: arrayRemove(assignmentId),
          assignmentsPaused: arrayUnion(assignmentId)
        });
  
        await updateDoc(progressRef, { 
          status: 'paused',
          updatedAt: serverTimestamp()
        });
      }
  
      // Fetch updated student data
      const updatedStudentDoc = await getDoc(studentRef);
      if (updatedStudentDoc.exists()) {
        const updatedStudentData = updatedStudentDoc.data();
        studentDataCache.current[studentUid] = {
          data: updatedStudentData,
          lastUpdate: Date.now()
        };
        setStudents(prevStudents => {
          return prevStudents.map(student => {
            if (student.uid === studentUid) {
              return {
                ...student,
                firstName: updatedStudentData.firstName.trim(),
                lastName: updatedStudentData.lastName.trim(),
                name: `${updatedStudentData.firstName.trim()} ${updatedStudentData.lastName.trim()}`,
                isAssigned: updatedStudentData.assignmentsToTake?.includes(assignmentId) ||
                  updatedStudentData.assignmentsInProgress?.includes(assignmentId) ||
                  updatedStudentData.assignmentsTaken?.includes(assignmentId) ||
                  updatedStudentData.assignmentsPaused?.includes(assignmentId),
                isPaused: updatedStudentData.assignmentsPaused?.includes(assignmentId)
              };
            }
            return student;
          });
        });
  
        // **Update assignmentStatuses**
        let status = 'not_started';
  
        if (updatedStudentData.assignmentsPaused?.includes(assignmentId)) {
          status = 'paused';
        } else if (updatedStudentData.assignmentsInProgress?.includes(assignmentId)) {
          status = 'In Progress';
        } else if (updatedStudentData.assignmentsTaken?.includes(assignmentId)) {
          status = 'completed';
        } else if (updatedStudentData.assignmentsToTake?.includes(assignmentId)) {
          status = 'not_started';
        }
  
        setAssignmentStatuses(prevStatuses => ({
          ...prevStatuses,
          [studentUid]: status
        }));
      }
  
      setResetStatus(prev => ({ ...prev, [studentUid]: 'success' }));
    } catch (error) {
      console.error("Error toggling pause status:", error);
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
          assignmentsInProgress: arrayRemove(assignmentId)
        });
  
        // Fetch updated student data
        const studentDoc = await getDoc(studentRef);
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          // Update the studentDataCache
          studentDataCache.current[studentUid] = {
            data: studentData,
            lastUpdate: Date.now()
          };
          // Update the students array
          setStudents(prevStudents => {
            return prevStudents.map(student => {
              if (student.uid === studentUid) {
                return {
                  ...student,
                  firstName: studentData.firstName.trim(),
                  lastName: studentData.lastName.trim(),
                  name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`,
                  isAssigned: studentData.assignmentsToTake?.includes(assignmentId) ||
                  studentData.assignmentsInProgress?.includes(assignmentId) ||
                  studentData.assignmentsTaken?.includes(assignmentId) ||
                  studentData.assignmentsPaused?.includes(assignmentId),
                  isPaused: studentData.assignmentsPaused?.includes(assignmentId)
                };
              }
              return student;
            });
            
          });
        }
  
        // Update local grades state
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
      
      // Fetch updated student data
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        // Update the studentDataCache
        studentDataCache.current[studentId] = {
          data: studentData,
          lastUpdate: Date.now()
        };
        // Update the students array
        setStudents(prevStudents => {
          return prevStudents.map(student => {
            if (student.uid === studentId) {
              return {
                ...student,
                firstName: studentData.firstName.trim(),
                lastName: studentData.lastName.trim(),
                name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`,
                isAssigned: studentData.assignmentsToTake?.includes(assignmentId) ||
                studentData.assignmentsInProgress?.includes(assignmentId) ||
                studentData.assignmentsTaken?.includes(assignmentId) ||
                studentData.assignmentsPaused?.includes(assignmentId),
                isPaused: studentData.assignmentsPaused?.includes(assignmentId)
              };
            }
            return student;
          });
        });
      }
      setAssignmentStatuses(prevStatuses => ({
        ...prevStatuses,
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
      // If the timer is '0', set it to a default value like '10'
      const newTimerValue = timer === '0' ? '10' : timer;
      setTimer(newTimerValue);
      await updateAssignmentSetting('timer', newTimerValue);
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
                studentData.assignmentsTaken?.includes(assignmentId) ||
                studentData.assignmentsPaused?.includes(assignmentId), // Add this line
      isPaused: studentData.assignmentsPaused?.includes(assignmentId) // Add this line
    };
            }
            return participant;
          })
          .sort((a, b) => a.lastName.localeCompare(b.lastName));

        setStudents(updatedParticipants);
        const statuses = {};
        updatedParticipants.forEach(student => {
          const studentData = studentDataCache[student.uid]?.data;
          if (studentData) {
            let status = 'not_started';
    
            if (studentData.assignmentsPaused?.includes(assignmentId)) {
              status = 'Paused';
            } else if (studentData.assignmentsInProgress?.includes(assignmentId)) {
              status = 'In Progress';
            } else if (studentData.assignmentsTaken?.includes(assignmentId)) {
              status = 'completed';
            } else if (studentData.assignmentsToTake?.includes(assignmentId)) {
              status = 'not_started';
            }
            statuses[student.uid] = status;
          }
        });
    
        setAssignmentStatuses(statuses);
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
            updateClassAssignmentAverage(parseFloat(calculatedAverage));
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
    updateClassAssignmentAverage.cancel(); // Cancel any pending updates
    studentDataCache.current = {};
  };
}, [classId, assignmentId, updateClassAssignmentAverage]);















const renderTabContent = () => {
  switch (activeTab) {
    case 'submissions':
      return (
        <>
          <div style={{width: 'calc(100% - 200px)', marginLeft: '200px', marginTop: '-100px',
                height: '40px', marginBottom: '0px'}}>

                



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
            gradeField="percentageScore"
            navigateToResultsPath="/teacherStudentResults/"
          />
        </>
      );
    
    case 'questionBank':
      return (
        <div style={{width: 'calc(100% - 200px)', marginLeft: '200px',marginTop: '20px' }}>
          <QuestionBankSAQ
            questionsWithIds={generatedQuestions}
            setQuestionsWithIds={handleUpdateQuestions}
            sourceText={sourceText}
            questionCount={questionBank}
            classId={classId}
            teacherId={teacherId}
            assignmentId={assignmentId}
            onRegenerateQuestions={handleRegenerateQuestions}
            
  autoOpenQuestionId={location.state?.targetQuestionId} 
          />
        </div>
      );

      case 'settings':
        return (
          <div style={{width: 'calc(100% - 200px)', marginLeft: '200px', marginTop: '20px' }}>
            <SettingsSection
              assignmentId={assignmentId}
              classId={classId}
              assignmentName={assignmentName}
              setAssignmentName={setAssignmentName}
              assignmentSettings={assignmentSettings}
              updateAssignmentSetting={updateAssignmentSetting}
              timer={timer}
              setTimer={setTimer}
              timerOn={timerOn}
              handleTimerToggle={handleTimerToggle}
              handleTimerChange={handleTimerChange}
            />
          </div>
        );

    case 'flagged':
      return (
        <div style={{ width: '850px', marginLeft: 'auto', marginRight: 'auto', marginTop: '20px' }}>
          <TeacherReview
            classId={classId}
            assignmentId={assignmentId}
            reviewCount={reviewCount}
          />
        </div>
      );

    default:
      return null;
  }
};













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
        return <SquareCheck color="#00DE09" size={20} strokeWidth={2}/>;
      case 'In Progress':
        return <SquareMinus color="#FFAA00" size={20} strokeWidth={2}/>;
      case 'not_started':
        return <SquareX color="lightgrey" size={20} strokeWidth={2}/>;
      case 'Paused':
        return <SquareMinus color="#FFA500" size={20} strokeWidth={2}/>;
      default:
        return null;
    }
  };
  const navigateToStudentResults = (studentUid) => {
    navigate(`/teacherStudentResults/${assignmentId}/${studentUid}/${classId}`);
  };
  const getGradeColors = (grade) => {
    if (grade === undefined || grade === null || grade === 0) return { color: '#858585', background: 'white' };
    if (grade < 50) return { color: '#FF0000', background: '#FFCBCB' };
    if (grade < 70) return { color: '#FF4400', background: '#FFC6A8' };
    if (grade < 80) return { color: '#EFAA14', background: '#FFF4DC' };
    if (grade < 90) return { color: '#9ED604', background: '#EDFFC1' };
    if (grade > 99) return { color: '#E01FFF', background: '#F7C7FF' };
    return { color: '#2BB514', background: '#D3FFCC' };
  };
  return (
    <div style={{  display: 'flex', flexDirection: 'column',  backgroundColor: 'white', position: 'absolute', left: 0, right: 0, bottom: 0, top: 0}}>
      <Navbar userType="teacher" />
   
    

      


      <div style={{             width: 'calc(100% - 200px)', justifyContent: 'align', marginTop: '0px', marginLeft: 'auto', borderBottom:"1px solid lightgrey", height: '160px', position:'fixed',zIndex:'50', top: '0px', left: '200px',
        background: 'rgb(255,255,255,.9)', backdropFilter: 'blur(5px)'
       }}>
        <div style={{ display: 'flex', marginRight: 'auto', marginLeft: '4%', height: ' auto', lineHeight:'0px', paddingBottom: '15px', marginBottom:'0px', marginTop: '20px' }}>


         <div style={{position: 'relative', width: '800px', backgroundColor: 'white',   
               borderRadius: '20px', }}>
        <AdaptiveHeading text={assignmentName} />

<div style={{display: 'flex', marginBottom: '-25px', color: 'lightgrey', marginTop: '5px'}}>
        <h1 style={{  
              fontWeight: '600', fontSize: '16px', 
            }}>
              {submissionCount} Submissions 
            </h1>
            <button
       
       onClick={toggleAllViewable}
       style={{
         width: '30px',
         height: '20px',
        marginTop: '-5px',
         borderRadius: '5px',
         cursor: 'pointer',
         marginLeft: '10px', fontFamily: "'montserrat', sans-serif",
         transition: '.3s',
         display: 'flex',
         padding: '0px',
         border: `1px solid white`,
         background: 'transparent',
         color: allViewable ? '#020CFF' : 'lightgrey',
       
       }}
     >

{allViewable ? (
         <Eye size={20} style={{marginTop:'4px', marginLeft: '5px', marginRight: '5px'}}/>
       ) : (
         <EyeOff size={20}  style={{marginTop:'4px', marginLeft: '5px', marginRight: '5px'}} />
       )}
      
     </button>
     </div>





      </div>
      
  <div style={{height: '80px', backgroundColor: 'white',  width: '90px', 
              borderRadius: '20px', position: 'absolute', right: '4%' }}>
      <Tooltip text="Class Average">
      
    <div style={{fontSize: '30px', fontWeight: '500', width: '90px', position: 'absolute',  height: '50px', 
    borderRadius:  '10px', top: '3px', left: '5px', textAlign: 'center', lineHeight: '50px',

background: averageGrade ? getGradeColors(averageGrade).background : 'white',

  color: averageGrade ? getGradeColors(averageGrade).color : '#858585',

    }}> 
      {averageGrade !== null ? averageGrade : '-'}%
     
        </div>
</Tooltip>
</div>
        </div>
        





        <div style={{ 
        width: '92%', 
          height: '40px',
        marginLeft: '4%' , 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '0px'

      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '-58px',
          gap: '20px'
        }}>
          <button
            onClick={() => handleTabClick('submissions')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: "600",
              padding: '12px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom: activeTab === 'submissions' ? '2px solid #020CFF' : '2px solid transparent',
              color: activeTab === 'submissions' ? '#020CFF' : 'grey',
            }}
          >
            Submissions
          </button>
          <button
            onClick={() => handleTabClick('questionBank')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: "600",
              padding: '10px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom: activeTab === 'questionBank' ? '2px solid #020CFF' : '2px solid transparent',
              color: activeTab === 'questionBank' ? '#020CFF' : 'grey',
            }}
          >
            Question Bank
          </button>
          <button
            onClick={() => handleTabClick('settings')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: "600",
              padding: '10px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom: activeTab === 'settings' ? '2px solid #020CFF' : '2px solid transparent',
              color: activeTab === 'settings' ? '#020CFF' : 'grey',
            }}
          >
            Settings
          </button>
          <button
            onClick={() => handleTabClick('flagged')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: "600",
              padding: '10px 10px',
              fontFamily: "'Montserrat', sans-serif",
              borderBottom: activeTab === 'flagged' ? '2px solid #020CFF' : '2px solid transparent',
              color: activeTab === 'flagged' ? '#020CFF' : 'grey',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            Flagged Responses
            {reviewCount > 0 && (
              <span style={{
                background: 'red',
                color: 'white',
                padding: '0px 4px',
                borderRadius: '2px',
                marginBottom: '-2px',
                fontSize: '12px'
              }}>
                {reviewCount}
              </span>
            )}
          </button>
        </div>
    
      
        <Exports assignmentId={assignmentId} style={{ marginLeft: 'auto', }} />
      </div>

















      </div>



 
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

 {showDeleteModal && (
  <DeleteConfirmationModal
    onClose={() => setShowDeleteModal(false)}
    assignmentId={assignmentId}
    classId={classId}
    assignmentName={assignmentName}
    onDeleteSuccess={handleDeleteSuccess}
  />
)}

<div style={{marginTop:'200px'}}>
{renderTabContent()}
</div>

        
    </div>
  );
};

export default TeacherResults;
