import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, collection, updateDoc, where, query, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { arrayUnion, arrayRemove, deleteDoc, getDoc, onSnapshot, documentId  } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import { useRef } from 'react';
import { auth } from '../../Universal/firebase';
import { useCallback } from 'react';
import Tooltip from './ToolTip';
import axios from 'axios';
import { serverTimestamp } from 'firebase/firestore';
import Exports from './Exports';
import { debounce } from 'lodash';
import { Settings, ArrowRight, SquareArrowOutUpRight,  SquareDashedMousePointer, SquareX, SquareMinus, SquareCheck, Landmark, Eye, EyeOff, Flag, YoutubeIcon, Trash2 } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import QuestionBankSAQ from './QuestionBank/QuesntionBankSAQ';
import StudentResultsList from './StudentList/StudentResultList';
import TeacherReview from './TeacherReview';
import SettingsSection from './Settings/SettingsSection';// At the top of your component
import ResultsHeader from './TabButton';


const TeacherResults = () => {
  const [classData, setClassData] = useState(null);
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
  const [hasScrolled, setHasScrolled] = useState(false);
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
// In TeacherResults component
const [gradingStudentUid, setGradingStudentUid] = useState(null);

  // Period styles definition
  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" },
  };

  // Get current period style function
  const getCurrentPeriodStyle = useCallback(() => {
    try {
      // First try to get period from classData
      if (classData?.period) {
        return periodStyles[classData.period] || periodStyles[1];
      }
      
      // Then try to extract from className (e.g. "Period 3")
      if (classData?.className) {
        const periodFromName = parseInt(classData.className.split(' ')[1]);
        if (!isNaN(periodFromName)) {
          return periodStyles[periodFromName] || periodStyles[1];
        }
      }
      
      // Finally try to get from classId
      const periodFromId = parseInt(classId.split('+')[1]);
      if (!isNaN(periodFromId)) {
        return periodStyles[periodFromId] || periodStyles[1];
      }

      // Default fallback
      return periodStyles[1];
    } catch (error) {
      console.error('Error getting period style:', error);
      return periodStyles[1]; // Safely default to period 1 style
    }
  }, [classId, classData]);

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
  const [teacherId, setTeacherId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [studentsWithoutAssignment, setStudentsWithoutAssignment] = useState([]);
  const [activeTab, setActiveTab] = useState('submissions');
  const studentDataCache = useRef({});

  const [isRegrading, setIsRegrading] = useState(false);
  const [results, setResults] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [partialCount, setPartialCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  // If halfCredit state is needed for other logic, declare it
  const [halfCredit, setHalfCredit] = useState(false);
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
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    onViolation: 'pause' // Add this default value
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

        
          width: '800px',
          fontFamily: "'montserrat', sans-serif",
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          lineHeight: '1.2',
          margin: 0,marginLeft: '4%',marginBottom:'23px', marginTop: '10px' ,
       
          padding: '10px 0',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }}
      >
        {text} <span style={{fontSize: '16px', fontWeight: '600', color: '#00CCB4'}}>OE</span>
      </h1>
    );
  };

  const fetchAssignmentQuestions = useCallback(async () => {
    const assignmentRef = doc(db, 'assignments', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    if (assignmentDoc.exists()) {
      const data = assignmentDoc.data();
      if (data.questions) {
        // Convert questions object to array with questionId included
        const questionsArray = Object.entries(data.questions).map(([questionId, questionData]) => ({
          questionId,
          question: questionData.question,
          rubric: questionData.rubric
        }));
        setGeneratedQuestions(questionsArray);
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
      
      // Create a properly structured questions object
      const questionsObject = updatedQuestions.reduce((acc, question, index) => {
        acc[question.questionId] = {
          question: question.question,
          rubric: question.rubric,
          questionId: question.questionId
        };
        return acc;
      }, {});
  
      // Update Firestore
      await updateDoc(assignmentRef, {
        questions: questionsObject
      });
  
      // Update local state
      setGeneratedQuestions(updatedQuestions);
      
      console.log('Successfully updated questions');
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
        onViolation: data.onViolation || 'pause', // Add this line
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
    let updateData = {};
  
    if (setting === 'lockdown') {
      // When lockdown is turned off, reset onViolation to pause
      updateData = { 
        lockdown: value,
        onViolation: value ? assignmentSettings.onViolation : 'pause'
      };
      setAssignmentSettings(prev => ({
        ...prev,
        lockdown: value,
        onViolation: value ? prev.onViolation : 'pause'
      }));
    } else if (setting === 'onViolation') {
      updateData = { onViolation: value };
      setAssignmentSettings(prev => ({
        ...prev,
        onViolation: value
      }));
    } else {
      updateData = { [setting]: value };
      
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
      setAssignmentSettings(prev => ({ ...prev, [setting]: value }));
    }
  
    try {
      await updateDoc(assignmentRef, updateData);
    } catch (error) {
      console.error('Error updating assignment setting:', error);
      // Revert the state on error
      if (setting === 'lockdown' || setting === 'onViolation') {
        setAssignmentSettings(prev => ({
          ...prev,
          [setting]: prev[setting]
        }));
      }
    }
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
  const handleSubmitAssignment = async (studentUid) => {
    if (window.confirm("Are you sure you want to submit this assignment for the student?")) {
      setGradingStudentUid(studentUid); 
      try {
        // Get references to needed documents
        const gradeRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
        const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
        const studentRef = doc(db, 'students', studentUid);
  
        // First get the student doc to check if it's a failed grading case
        const studentDoc = await getDoc(studentRef);
        const studentData = studentDoc.data();
        const isFailedGrading = studentData[`class_${classId}`]?.grades?.[assignmentId]?.gradedUnsuccessfully;
  
        // Get the progress document to access student's work
        const progressDoc = await getDoc(progressRef);
        if (!progressDoc.exists()) {
          throw new Error("No progress document found");
        }
        const progressData = progressDoc.data();
  
        // Get the assignment settings
        const assignmentRef = doc(db, 'assignments', assignmentId);
        const assignmentSnap = await getDoc(assignmentRef);
        const assignmentData = assignmentSnap.data();
        const halfCreditValue = assignmentData?.halfCredit || false;
  
        // Calculate scores based on progress data
        const totalQuestions = progressData.questions.length;
        const maxRawScore = totalQuestions * (progressData.scaleMax - progressData.scaleMin);
  
        // Create initial grade document structure
        const initialGradeData = {
          assignmentId,
          studentUid,
          assignmentName,
          firstName: progressData.firstName,
          lastName: progressData.lastName,
          classId,
          halfCreditEnabled: halfCreditValue,
          submittedAt: serverTimestamp(),
          questions: progressData.questions.map(q => ({
            questionId: q.questionId,
            question: q.text,
            studentResponse: q.studentResponse || '',
            rubric: q.rubric,
            feedback: 'Response not yet graded',
            score: 0,
            flagged: false
          })),
          viewable: false,
          rawTotalScore: 0,
          maxRawScore,
          scaledScore: 0,
          scaleMin: progressData.scaleMin || 0,
          scaleMax: progressData.scaleMax || 2,
          percentageScore: 0
        };
  
        // Start batch write for atomic operations
        const batch = writeBatch(db);
  
        if (isFailedGrading) {
          // For failed grading cases, update the student document first
          batch.update(studentRef, {
            [`class_${classId}.grades.${assignmentId}.gradedUnsuccessfully`]: deleteField()
          });
        }
        
        // Check if grade document already exists
        const existingGradeDoc = await getDoc(gradeRef);
        if (existingGradeDoc.exists()) {
          // If it exists, delete it first
          batch.delete(gradeRef);
        }
        
        // Set new grade document
        batch.set(gradeRef, initialGradeData);
  
        // Update progress status
        batch.update(progressRef, {
          status: 'submitted',
          submittedAt: serverTimestamp(),
          replacedAt: existingGradeDoc.exists() ? serverTimestamp() : null
        });
  
        // Update student's assignment status
        const studentUpdates = {
          assignmentsTaken: arrayUnion(assignmentId),
          assignmentsInProgress: arrayRemove(assignmentId),
          assignmentsPaused: arrayRemove(assignmentId)
        };
  
        // Only update the grade info if not a failed grading case (since we handled that separately above)
        if (!isFailedGrading) {
          studentUpdates[`class_${classId}.grades.${assignmentId}`] = {
            score: 0,
            submittedAt: serverTimestamp(),
            assignmentId,
            assignmentName
          };
        }
  
        batch.update(studentRef, studentUpdates);
  
        await batch.commit();
  
        // Format questions for grading API
        const questionsToGrade = progressData.questions.map(q => ({
          questionId: q.questionId,
          question: q.text,
          rubric: q.rubric,
          studentResponse: q.studentResponse || ''
        }));
  
        // Make grading request
        const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/GradeSAQ', {
          questions: questionsToGrade,
          halfCreditEnabled: halfCreditValue,
          classId: classId
        });
  
        if (response.status === 200) {
          const gradingResults = response.data;
          
          // Calculate scores
          const newTotalScore = gradingResults.reduce((sum, grade) => sum + grade.score, 0);
          const newPercentageScore = (newTotalScore / maxRawScore) * 100;
  
          // Create graded questions array
          const gradedQuestions = progressData.questions.map((q, index) => ({
            questionId: q.questionId,
            question: q.text,
            studentResponse: q.studentResponse || '',
            rubric: q.rubric,
            feedback: gradingResults[index].feedback,
            score: gradingResults[index].score,
            flagged: false
          }));
  
          // Update grade document with final results
          await updateDoc(gradeRef, {
            questions: gradedQuestions,
            rawTotalScore: newTotalScore,
            scaledScore: newTotalScore / maxRawScore,
            percentageScore: newPercentageScore,
            viewable: true,
            gradedAt: serverTimestamp()
          });
  
          // Update student's final grade
          await updateDoc(studentRef, {
            [`class_${classId}.grades.${assignmentId}`]: {
              score: newPercentageScore,
              submittedAt: serverTimestamp(),
              assignmentId,
              assignmentName
            }
          });
  
          // Refresh the UI
          window.location.reload();
        }
      } catch (error) {
        console.error("Error in handleSubmitAssignment:", error);
        alert("An error occurred while submitting the assignment. Please try again.");
      } finally {
        setGradingStudentUid(null); 
      }
    }
  };
  const handleRenewAccess = async (studentUid) => {
    try {
      if (!classId) {
        console.error('No classId available');
        return;
      }
  
      // References to all documents we need to modify for this studentUid
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      const gradeRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
      const studentRef = doc(db, 'students', studentUid);
  
      const batch = writeBatch(db);
  
      // Update progress doc status back to in_progress
      batch.update(progressRef, {
        status: 'in_progress',
        lastUpdated: serverTimestamp(),
        submittedAt: null,
        replacedAt: null
      });
  
      // Delete the grade document completely
      batch.delete(gradeRef);
  
      // Update student's assignment statuses and remove grade information
      batch.update(studentRef, {
        assignmentsTaken: arrayRemove(assignmentId),
        assignmentsInProgress: arrayUnion(assignmentId),
        assignmentsPaused: arrayRemove(assignmentId),
        [`class_${classId}.grades.${assignmentId}`]: deleteField(),
        [`grades.${assignmentId}`]: deleteField()
      });
  
      await batch.commit();
      // Further operations or navigation can be handled here if needed.
      console.log(`Renew access completed for student ${studentUid}`);
    } catch (error) {
      console.error('Error renewing access:', error);
      alert('Error renewing access. Please try again.');
    }
  };
  


  const handleDelete = () => {
    setShowDeleteModal(true);
  };
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
        
        // Create batch for atomic updates
        const batch = writeBatch(db);
        
        // Remove from all possible status arrays and add back to toTake
        batch.update(studentRef, {
          assignmentsTaken: arrayRemove(assignmentId),
          assignmentsToTake: arrayRemove(assignmentId),
          assignmentsInProgress: arrayRemove(assignmentId),
          assignmentsPaused: arrayRemove(assignmentId),
          assignmentsToTake: arrayUnion(assignmentId)
        });
  
        // Remove the grade from the student's class grades
        const studentDoc = await getDoc(studentRef);
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          
          // Get the class ID from the assignmentId (assuming format: classId+timestamp+type)
          const classId = assignmentId.split('+')[0];
          
          // Path to the grade in the class grades
          const classGradesPath = `class_${classId}.grades.${assignmentId}`;
          
          // Remove the grade entry
          batch.update(studentRef, {
            [classGradesPath]: deleteField()
          });
  
          // Also remove any special dates if they exist
          if (studentData.specialDates && studentData.specialDates[assignmentId]) {
            const updatedSpecialDates = { ...studentData.specialDates };
            delete updatedSpecialDates[assignmentId];
            batch.update(studentRef, {
              specialDates: updatedSpecialDates
            });
          }
        }
  
        // Commit all the batch operations
        await batch.commit();
  
        // Update local states
        setGrades(prevGrades => {
          const newGrades = { ...prevGrades };
          delete newGrades[studentUid];
          return newGrades;
        });
  
        setAssignmentStatuses(prevStatuses => ({
          ...prevStatuses,
          [studentUid]: 'not_started'
        }));
  
        // Update the students array
        setStudents(prevStudents => {
          return prevStudents.map(student => {
            if (student.uid === studentUid) {
              return {
                ...student,
                isAssigned: true,
                isPaused: false
              };
            }
            return student;
          });
        });
  
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
  

  const tabs = [
    { id: 'submissions', label: 'Submissions' },
    { id: 'questionBank', label: 'Question Bank' },
    { id: 'settings', label: 'Settings' },
    { id: 'flagged', label: 'Flagged Responses', count: reviewCount }
  ];




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
  
  
  const handleTimerChange = (value) => {
    setTimer(value);
    if (timerOn) {
      updateAssignmentSetting('timer', value);
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
  let unsubscribeAssignment;
  let unsubscribeFlags;
  let lastFetch = 0;
  const FETCH_COOLDOWN = 5000; // 5 seconds cooldown

  const setupRealtimeListeners = async () => {
    setLoading(true);
    try {
      // Initialize empty states to prevent null access
      setStudents([]);
      setGrades({});
      setAssignmentStatuses({});
      // 1) Listen for assignment data (assignment name, viewable, dueDate, etc.)
      unsubscribeAssignment = onSnapshot(doc(db, 'assignments', assignmentId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAssignmentData(data);
          setAssignmentName(data.assignmentName);
          setAssignDate(data.assignDate ? new Date(data.assignDate) : null);
          setDueDate(data.dueDate ? new Date(data.dueDate) : null);
          setAllViewable(data.viewable || false);

          if (data.questions) {
            const qArray = Object.entries(data.questions).map(([id, questionData]) => ({
              questionId: id,
              ...questionData
            }));
            setQuestions(qArray);
          }
        }
      });

      // 2) Listen for changes in the class doc, then fetch/update participants in batches
      unsubscribeClass = onSnapshot(doc(db, 'classes', classId), async (classDoc) => {
        if (!classDoc.exists()) {
        console.error("Class document does not exist");
        return;
      }

      const fetchedClassData = classDoc.data();
      if (!fetchedClassData) {
        console.error("No data in class document");
        return;
      }

      setClassData(fetchedClassData);
      
      if (!fetchedClassData.participants) {
        console.error("No participants array in class data");
        return;
      }

      if (!fetchedClassData.participants.length) {
        console.log("Class has no participants");
        return;
      }

        const now = Date.now();
        if (now - lastFetch < FETCH_COOLDOWN) return; // throttle
        lastFetch = now;

        // Determine which students to fetch from Firestore
        const studentsToFetch = (fetchedClassData.participants || []).filter(
          (p) =>
            p && p.uid && // Ensure participant is valid
            (!studentDataCache[p.uid] ||
            studentDataCache[p.uid].lastUpdate < now - 60000)
        );

        // Fetch student documents in chunks of 10
        if (studentsToFetch.length > 0) {
          const chunkSize = 10;
          for (let i = 0; i < studentsToFetch.length; i += chunkSize) {
            const chunk = studentsToFetch.slice(i, i + chunkSize);
            const studentQuery = query(
              collection(db, 'students'),
              where(documentId(), 'in', chunk.map((s) => s.uid))
            );
            const studentDocs = await getDocs(studentQuery);

            studentDocs.forEach((docSnap) => {
              const studentData = docSnap.data();
              const classGrades = studentData[`class_${classId}`]?.grades || {};
              const assignmentGrade = classGrades[assignmentId];

              studentDataCache[docSnap.id] = {
                data: studentData,
                grade: assignmentGrade,
                lastUpdate: now
              };
            });
          }
        }

        // We'll accumulate submission stats here
        let totalScore = 0;
        let validGradesCount = 0;
        let submissionsCount = 0;

        // Build an updated list of participants
        const updatedParticipants = (fetchedClassData.participants || [])
          .filter(participant => participant && participant.uid) // Ensure valid participant objects
          .map((participant) => {
            const cachedData = studentDataCache[participant.uid];
            const studentData = cachedData?.data;
            const gradeData =
              studentData?.[`class_${classId}`]?.grades?.[assignmentId];

            if (!studentData) {
              // If we don’t have student data yet, just return the raw participant
              return participant;
            }

            // Count submissions + valid scores
            if (gradeData?.score) {
              submissionsCount++;
              if (typeof gradeData.score === 'number' && !isNaN(gradeData.score)) {
                totalScore += gradeData.score;
                validGradesCount++;
              }
            }

            // Convert Firestore timestamp -> JS Date
            let submittedAtDate = null;
            if (gradeData?.submittedAt) {
              submittedAtDate = new Date(gradeData.submittedAt.seconds * 1000);
            }

            // If there's a special date for this assignment, store it
            let specialDueDate = null;
            if (studentData.specialDates && studentData.specialDates[assignmentId]) {
              specialDueDate = new Date(studentData.specialDates[assignmentId]);
            }

            // Construct the studentInfo object
            const studentInfo = {
              ...participant,
              uid: participant.uid,
              ref: doc(db, 'students', participant.uid),
              firstName: studentData.firstName.trim(),
              lastName: studentData.lastName.trim(),
              name: `${studentData.firstName.trim()} ${studentData.lastName.trim()}`,
              isAssigned:
                studentData.assignmentsToTake?.includes(assignmentId) ||
                studentData.assignmentsInProgress?.includes(assignmentId) ||
                studentData.assignmentsTaken?.includes(assignmentId) ||
                studentData.assignmentsPaused?.includes(assignmentId),
              isPaused: studentData.assignmentsPaused?.includes(assignmentId),
              specialDueDate, // <-- already tracked
            
              // NEW: Include gradedUnsuccessfully flag
              gradedUnsuccessfully: gradeData?.gradedUnsuccessfully === true
            };
            // Update the local "grades" object for this student
            if (gradeData) {
              grades[participant.uid] = {
                percentageScore: gradeData.score || 0,
                submittedAt:
                  submittedAtDate && !isNaN(submittedAtDate.getTime())
                    ? {
                        toDate: () => submittedAtDate,
                        seconds: submittedAtDate.getTime() / 1000
                      }
                    : null,
                viewable: false
              };
            }

            return studentInfo;
          })
          .sort((a, b) => a.lastName.localeCompare(b.lastName));

        // Update React states
        setStudents(updatedParticipants);
        setGrades(grades);
        setSubmissionCount(submissionsCount);

        // Determine assignment status for each student
        const statuses = {};
        updatedParticipants.forEach((student) => {
          const sData = studentDataCache[student.uid]?.data;
          if (!sData) return;

          let status = 'not_started';
          if (sData.assignmentsPaused?.includes(assignmentId)) {
            status = 'Paused';
          } else if (sData.assignmentsInProgress?.includes(assignmentId)) {
            status = 'In Progress';
          } else if (sData.assignmentsTaken?.includes(assignmentId)) {
            status = 'completed';
          } else if (sData.assignmentsToTake?.includes(assignmentId)) {
            status = 'not_started';
          }
          statuses[student.uid] = status;
        });
        setAssignmentStatuses(statuses);

        // Compute average if we have valid scores
        if (validGradesCount > 0) {
          const calculatedAverage = (totalScore / validGradesCount).toFixed(0);
          setAverageGrade(calculatedAverage);
          updateClassAssignmentAverage(parseFloat(calculatedAverage));
        } else {
          setAverageGrade(null);
        }

        // Count how many are assigned
        setAssignedCount(updatedParticipants.filter((s) => s.isAssigned).length);
      });

      // 3) Listen for changes in flagged questions
      unsubscribeFlags = onSnapshot(
        query(collection(db, 'grades'), where('assignmentId', '==', assignmentId)),
        (snapshot) => {
          const flaggedCount = snapshot.docs.reduce((count, docSnap) => {
            const gradeData = docSnap.data();
            return count + (gradeData.questions || []).filter((q) => q.flagged).length;
          }, 0);
          setReviewCount(flaggedCount);
        }
      );
    } catch (error) {
      console.error('Error setting up listeners:', error);
    } finally {
      setLoading(false);
    }
  };

  setupRealtimeListeners();

  // Cleanup
  return () => {
    if (unsubscribeClass) unsubscribeClass();
    if (unsubscribeAssignment) unsubscribeAssignment();
    if (unsubscribeFlags) unsubscribeFlags();
    updateClassAssignmentAverage.cancel?.();
    studentDataCache.current = {};
  };
}, [classId, assignmentId, updateClassAssignmentAverage]);







// Right before you render <StudentResultsList />, compute these:
const pausedCount = students.filter((s) => assignmentStatuses[s.uid] === 'Paused').length;
const inProgressCount = students.filter((s) => assignmentStatuses[s.uid] === 'In Progress').length;
const notStartedCount = students.filter((s) => assignmentStatuses[s.uid] === 'not_started').length;
const unassignedCount = students.filter((s) => !s.isAssigned).length;






const renderTabContent = () => {
  switch (activeTab) {
    case 'submissions':
      return (
        <>
    
     <StudentResultsList
          students={students}
          grades={grades}
          assignmentStatuses={assignmentStatuses}
          navigateToStudentGrades={navigateToStudentGrades}
          navigateToStudentResults={navigateToStudentResults}
          getStatusColor={getStatusColor}
          calculateLetterGrade={calculateLetterGrade}
          hoveredStatus={hoveredStatus}
          setHoveredStatus={setHoveredStatus}
          togglePauseAssignment={togglePauseAssignment}
          handleReset={handleReset}
          resetStatus={resetStatus}
          handleAssign={handleAssign}
          gradeField="percentageScore"
          assignmentId={assignmentId}
          onTabChange={handleTabClick} 
          submissionCount={submissionCount}
          averageGrade={averageGrade}
          allViewable={allViewable}
          toggleAllViewable={toggleAllViewable}
          getGradeColors={getGradeColors}
          assignmentType="OE"
          handleSubmitAssignment={handleSubmitAssignment}
          handleRenewAccess={handleRenewAccess}
          pausedCount={pausedCount}
          unassignedCount={unassignedCount}
          inProgressCount={inProgressCount}
          notStartedCount={notStartedCount}
          assignDate={assignDate}
          isRegrading={isRegrading}
          gradingStudentUid={gradingStudentUid}
          dueDate={dueDate}
          periodStyle={getCurrentPeriodStyle()}
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
              onDelete={handleDelete} 
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
     <Navbar 
  userType="teacher"
  navItems={[{
    type: 'assignmentName',
    id: assignmentId,
    label: assignmentName
  }]}
/>

    <ResultsHeader 
      assignmentName={assignmentName}
      format={{ label: 'OE', color: '#00CCB4' }}
      tabs={tabs}
      activeTab={activeTab}
      onTabClick={handleTabClick}
      periodStyle={getCurrentPeriodStyle()}
      hasScrolled={hasScrolled}
    />

      <div style={{marginTop:'150px', width: '100%',}}>
        {renderTabContent()}
      </div>

        
    </div>
  );
};

export default TeacherResults;
