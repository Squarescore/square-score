// src/components/Teachers/Results/ResultsAMCQ.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, collection, updateDoc, where, query, getDocs,
  writeBatch, deleteDoc, getDoc, arrayUnion, arrayRemove, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import { db, auth } from '../../Universal/firebase';
import { AnimatePresence } from 'framer-motion';
import CustomDateTimePicker from './Settings/CustomDateTimePickerResults';
import 'react-datepicker/dist/react-datepicker.css';
import Exports from './Exports';
import QuestionBankAMCQ from './QuestionBank/QuestionBankAMCQ';
import Tooltip from './ToolTip';
import StudentResultsList from './StudentList/StudentResultList';
import TabButton from './TabButton';
import SettingsSectionAMCQ from './Settings/SettingsSectionAMCQ';
import { Trash2, SquareCheck, SquareMinus, SquareX } from 'lucide-react';
import DeleteConfirmationModal from './Settings/DeleteConfirmationModal';
import ResultsHeader from './TabButton';

const TeacherResultsAMCQ = () => {
  // State declarations
  const [allViewable, setAllViewable] = useState(false);
  const [assignmentData, setAssignmentData] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [assignmentStatuses, setAssignmentStatuses] = useState({});
  const [assignDate, setAssignDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [grades, setGrades] = useState({});
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [hoveredStudent, setHoveredStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({});
  const [resetStudent, setResetStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [students, setStudents] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [averageGrade, setAverageGrade] = useState(null);
  const [questionStatistics, setQuestionStatistics] = useState({});
  const [timerOn, setTimerOn] = useState(false);
  const [timer, setTimer] = useState('0');
  const [activeTab, setActiveTab] = useState('submissions');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editedQuestions, setEditedQuestions] = useState([]);
  const [showChoices, setShowChoices] = useState({});

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
    onViolation: 'pause'
  });

  // Refs
  const assignmentDataRef = useRef(null);
  const studentDataCache = useRef({});

  // Router hooks
  const { classId, assignmentId, teacherId } = useParams();
  const navigate = useNavigate();

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
  const handleDelete = () => {
    setShowDeleteModal(true);
  };
  
  const handleTimerChange = (e) => {
    const newValue = e.target.value;
    setTimer(newValue);
    if (timerOn) {
      updateAssignmentSetting('timer', newValue);
    }
  };
  // Define the tabs
  const tabs = [
    { id: 'submissions', label: 'Submissions' },
    { id: 'questionBank', label: 'Question Bank' },
    { id: 'settings', label: 'Settings' },
    // No 'flagged' tab for AMCQ
  ];

  // Handle tab click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'questionBank') {
      setShowQuestionBank(true);
      setShowOverlay(true);
    } else {
      setShowQuestionBank(false);
      setShowOverlay(false);
    }

    if (tab === 'settings') {
      setShowSettings(true);
    } else {
      setShowSettings(false);
    }
  };

  // Define updateAssignmentSetting function
  const updateAssignmentSetting = async (setting, value) => {
    const assignmentRef = doc(db, 'assignments', assignmentId);
    let updateData = {};

    if (setting === 'lockdown') {
      // When lockdown is toggled, update related settings if necessary
      updateData = { 
        lockdown: value,
        onViolation: value ? assignmentSettings.onViolation : 'pause' // Example related setting
      };
      setAssignmentSettings(prev => ({
        ...prev,
        lockdown: value,
        onViolation: value ? prev.onViolation : 'pause'
      }));
    } else {
      updateData = { [setting]: value };
      
      // Handle specific settings that require additional state updates
      if (setting === 'timer') {
        updateData.timerOn = value !== '0';
        setAssignmentSettings(prev => ({
          ...prev,
          timer: value,
          timerOn: value !== '0'
        }));
      }

      // Add more conditional updates as needed
      // ...

      setAssignmentSettings(prev => ({ ...prev, [setting]: value }));
    }

    try {
      await updateDoc(assignmentRef, updateData);
    } catch (error) {
      console.error(`Error updating assignment setting (${setting}):`, error);
      // Optionally revert state changes if needed
    }
  };

  // Define togglePauseAssignment function
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
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentUid]: '' })), 1000000);
    }
  };

  // Example: Fetch assignment data
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
            setEditedQuestions(allQuestions);
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

  // Fetch student and grade data


  // In TeacherResultsAMCQ, add this function to process grades and calculate statistics

// Update the renderTabContent in TeacherResultsAMCQ to include the stats


useEffect(() => {
  const fetchClassAndGrades = async () => {
    setLoading(true);
    console.log('Starting fetchClassAndGrades...');
    
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      const fetchedClassData = classDoc.data();
      setClassData(fetchedClassData);
      
      console.log('Class data fetched:', fetchedClassData?.className);
      
      if (fetchedClassData && fetchedClassData.participants) {
        // Fetch full names for all participants
        const updatedParticipants = await Promise.all(fetchedClassData.participants.map(async (participant) => {
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

        console.log(`Processed ${updatedParticipants.length} participants`);
        
        // Sort students by last name
        const sortedStudents = updatedParticipants.sort((a, b) => 
          a.lastName.localeCompare(b.lastName)
        );
        
        setStudents(sortedStudents);
        const assignedStudents = sortedStudents.filter(student => student.isAssigned);
        setAssignedCount(assignedStudents.length);

        // Fetch grades and calculate statistics
        const gradesCollection = collection(db, 'grades');
        const gradesQuery = query(gradesCollection, where('assignmentId', '==', assignmentId));
        const gradesSnapshot = await getDocs(gradesQuery);
        const fetchedGrades = {};
        let totalScore = 0;
        let validGradesCount = 0;
        let submissionsCount = 0;
        
        // Initialize question statistics
        const questionStats = {};
        
        console.log(`Processing ${gradesSnapshot.docs.length} grade documents...`);
        
        gradesSnapshot.forEach((doc) => {
          const gradeData = doc.data();
          console.log('Processing grade document for:', gradeData.studentUid);
          
          // Store basic grade info
          fetchedGrades[gradeData.studentUid] = {
            submittedAt: gradeData.submittedAt,
            SquareScore: gradeData.SquareScore,
            viewable: gradeData.viewable || false,
            correctQuestions: gradeData.correctQuestions || [],
            incorrectQuestions: gradeData.incorrectQuestions || []
          };

          // Process all questions for statistics
          const allQuestions = [
            ...(gradeData.correctQuestions || []),
            ...(gradeData.incorrectQuestions || [])
          ];

          allQuestions.forEach(question => {
            if (!questionStats[question.questionId]) {
              questionStats[question.questionId] = {
                totalAttempts: 0,
                correctCount: 0,
                choiceDistribution: {}
              };
            }

            const stats = questionStats[question.questionId];
            stats.totalAttempts++;

            // Track choice distribution
            if (!stats.choiceDistribution[question.selectedChoice]) {
              stats.choiceDistribution[question.selectedChoice] = 0;
            }
            stats.choiceDistribution[question.selectedChoice]++;

            // Track correct answers
            if (question.selectedChoice === question.correctChoice) {
              stats.correctCount++;
            }
          });

          // Count submissions and calculate scores
          if (gradeData.submittedAt) {
            submissionsCount++;
          }
          if (typeof gradeData.SquareScore === 'number' && !isNaN(gradeData.SquareScore)) {
            totalScore += gradeData.SquareScore;
            validGradesCount++;
          }
        });

        // Calculate percentages for question stats
        Object.keys(questionStats).forEach(questionId => {
          const stats = questionStats[questionId];
          stats.percentageCorrect = Math.round((stats.correctCount / stats.totalAttempts) * 100);

          // Calculate percentages for choice distribution
          const choiceStats = {};
          Object.entries(stats.choiceDistribution).forEach(([choice, count]) => {
            choiceStats[choice] = {
              count,
              percentage: Math.round((count / stats.totalAttempts) * 100)
            };
          });
          stats.choiceDistribution = choiceStats;
        });

        console.log('Question Statistics:', questionStats);
        
        setGrades(fetchedGrades);
        setSubmissionCount(submissionsCount);
        
        const calculatedAverage = validGradesCount > 0 ? 
          (totalScore / validGradesCount).toFixed(0) : null;
        setAverageGrade(calculatedAverage);
        
        // Store question stats in state
        setQuestionStatistics(questionStats);

        // Update assignment with new average and statistics
        if (calculatedAverage !== null) {
          const assignmentRef = doc(db, 'assignments', assignmentId);
          await updateDoc(assignmentRef, { 
            classAverage: parseFloat(calculatedAverage),
            questionStatistics: questionStats
          });
        }

        console.log('Fetch and statistics processing completed successfully');
      }
    } catch (error) {
      console.error("Error in fetchClassAndGrades:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchClassAndGrades();
  const classAndGradesInterval = setInterval(fetchClassAndGrades, 100000000);

  return () => clearInterval(classAndGradesInterval);
}, [classId, assignmentId]);
 
useEffect(() => {
  const fetchAssignmentSettings = async () => {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      
      if (assignmentDoc.exists()) {
        const data = assignmentDoc.data();
        
        // Set timer states
        setTimer(data.timer || '0');
        setTimerOn(data.timer > 0);
        
        // Set assignment settings
        setAssignmentSettings({
          assignDate: data.assignDate ? new Date(data.assignDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          halfCredit: data.halfCredit || false,
          lockdown: data.lockdown || false,
          saveAndExit: data.saveAndExit !== undefined ? data.saveAndExit : true,
          onViolation: data.onViolation || 'pause',
          timer: data.timer || '0',
          timerOn: data.timer > 0
        });
      }
    } catch (error) {
      console.error('Error fetching assignment settings:', error);
    }
  };

  fetchAssignmentSettings();
}, [assignmentId]);
  // Fetch assignment status for each student
  useEffect(() => {
    const fetchAssignmentStatus = async () => {
      const statusPromises = students.map(async (student) => {
        const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${student.uid}`);
        const progressDoc = await getDoc(progressRef);
        const gradeRef = doc(db, 'grades', `${assignmentId}_${student.uid}`);
        const gradeDoc = await getDoc(gradeRef);
  
        let status = 'not_started';
        if (gradeDoc.exists()) {
          status = 'completed';
        } else if (progressDoc.exists()) {
          status = progressDoc.data().status === 'paused' ? 'paused' : 'In Progress';
        }
  
        return { [student.uid]: status };
      });
  
      const statuses = await Promise.all(statusPromises);
      const combinedStatuses = Object.assign({}, ...statuses);
      setAssignmentStatuses(combinedStatuses);
    };
  
    fetchAssignmentStatus();
  }, [students, assignmentId]);

  // Define the content for each tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'submissions':
        return (
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
            gradeField="SquareScore" // Specify the grade field for AMCQ
            navigateToResultsPath="/teacherStudentResultsAMCQ/" // Specify the navigation path
            submissionCount={submissionCount}
            averageGrade={averageGrade}
            allViewable={allViewable}
            toggleAllViewable={toggleAllViewable}
            onTabChange={handleTabClick} 
            getGradeColors={getGradeColors}
            assignmentType="AMCQ"
            periodStyle={getCurrentPeriodStyle()}
          />
        );

      case 'questionBank':
        return (
          <div style={{ width: 'calc(100% - 200px)', marginLeft: '200px', marginTop: '20px' }}>
            <QuestionBankAMCQ
               editedQuestions={editedQuestions}
            setEditedQuestions={setEditedQuestions}
            assignmentId={assignmentId}
            questionStats={questionStatistics}
            totalSubmissions={submissionCount}
              
            />
          </div>
        );

      case 'settings':
        return (
          <div style={{ width: 'calc(100% - 200px)', marginLeft: '200px', marginTop: '20px' }}>
            <SettingsSectionAMCQ
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
              // Add any additional props specific to AMCQ
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#009006';
      case 'In Progress':
        return '#FFD700';
      case 'not_started':
        return '#808080';
      case 'paused':
        return '#FFA500';
      default:
        return 'lightgrey';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <SquareCheck color="#00DE09" size={30} strokeWidth={2.5} />;
      case 'In Progress':
        return <SquareMinus color="#FFAA00" size={30} strokeWidth={2.5} />;
      case 'not_started':
        return <SquareX color="lightgrey" size={30} strokeWidth={2.5} />;
      case 'paused':
        return <SquareMinus color="#FFA500" size={30} strokeWidth={2.5} />;
      default:
        return null;
    }
  };

  const calculateLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const navigateToStudentGrades = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };

  const navigateToStudentResults = (studentUid) => {
    navigate(`/teacherStudentResultsAMCQ/${assignmentId}/${studentUid}/${classId}`);
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

  // Handlers
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
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentId]: '' })), 200000000);

      console.log(`Assignment assigned to student ${studentId}`);
    } catch (error) {
      console.error("Error assigning assignment:", error);
      // Show error message
      setResetStatus(prev => ({ ...prev, [studentId]: 'failed' }));
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentId]: '' })), 20000000);
    }
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

      // 3. Update individual grade documents
    
      await batch.commit();
      console.log('Successfully updated viewable status for all documents');
    } catch (error) {
      console.error('Error updating viewable status:', error);
      // Revert the local state if the batch update fails
      setAllViewable(!newViewableStatus);
    }
  };

  // Delete confirmation success handler
  const handleDeleteSuccess = () => {
    // You can add any additional actions here if needed
    console.log("Assignment deleted successfully");
    // For example, navigate back to the class page
    navigate(`/class/${classId}`);
  };

  // Add periodStyles object
  const periodStyles = {
    1: { variant: 'teal', color: "#1EC8bc", borderColor: "#83E2F5" },
    2: { variant: 'purple', color: "#8324e1", borderColor: "#cf9eff" },
    3: { variant: 'orange', color: "#ff8800", borderColor: "#f1ab5a" },
    4: { variant: 'yellow', color: "#ffc300", borderColor: "#Ecca5a" },
    5: { variant: 'green', color: "#29c60f", borderColor: "#aef2a3" },
    6: { variant: 'blue', color: "#1651d4", borderColor: "#b5ccff" },
    7: { variant: 'pink', color: "#d138e9", borderColor: "#f198ff" },
    8: { variant: 'red', color: "#c63e3e", borderColor: "#ffa3a3" }
  };

  // Add getCurrentPeriodStyle function
  const [classData, setClassData] = useState(null);

const getCurrentPeriodStyle = useCallback(() => {
  const period = classData?.period || parseInt(classData?.className?.split(' ')[1]) || 1;
  return periodStyles[period] || periodStyles[1];
}, [classData]);

  // Add scroll handler effect
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Render tab content based on activeTab
 

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
        format={{ label: 'MCQ*', color: '#7D00EA' }}
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

export default TeacherResultsAMCQ;
