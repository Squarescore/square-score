import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc,
  collection,
  updateDoc,
  where,
  query,
  getDocs,
  writeBatch,
  deleteDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import CustomDateTimePicker from './Settings/CustomDateTimePickerResults';
import 'react-datepicker/dist/react-datepicker.css';
import Exports from './Exports';
import {
  Settings,
  SquareArrowLeft,
  ArrowRight,
  SquareCheck,
  SquareMinus,
  SquareX,
  Eye,
  EyeOff,
  CheckSquare,
} from 'lucide-react';
import Tooltip from './ToolTip';
import QuestionBankMCQ from './QuestionBank/QuestionBankMCQ';
import { db } from '../../Universal/firebase';
import TabButton from './TabButton'; // Ensure you have this component
import SettingsSection from './Settings/SettingsSection'; // Ensure you have this component
import StudentResultsList from './StudentList/StudentResultList'; // You might need to create this component
import ResultsHeader from './TabButton';

const TeacherResultsMCQ = () => {
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
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({});
  const [resetStudent, setResetStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [students, setStudents] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [averageGrade, setAverageGrade] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');
  const [editedQuestions, setEditedQuestions] = useState([]);

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
  const studentDataCache = useRef({});
  const assignmentDataRef = useRef(null);

  // Router hooks
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();

  // Tabs state
  const [tabs] = useState([
    { id: 'submissions', label: 'Submissions' },
    { id: 'questionBank', label: 'Question Bank' },
    { id: 'settings', label: 'Settings' },
  ]);

  // Define the tabs
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'questionBank') {
      setShowQuestionBank(true);
     
    } else {
      setShowQuestionBank(false);
   
    }

    if (tab === 'settings') {
      setShowSettings(true);
    } else {
      setShowSettings(false);
    }
  };

  // Fetch assignment details
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        const assignmentRef = doc(db, 'assignments', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);
        if (assignmentDoc.exists()) {
          const data = assignmentDoc.data();
          setAssignmentData(data);
          setAllViewable(data.viewable || false);
          assignmentDataRef.current = data;
          setEditedQuestions(data.questions || []);
          setAssignmentName(data.assignmentName);
          setAssignDate(data.assignDate ? new Date(data.assignDate) : null);
          setDueDate(data.dueDate ? new Date(data.dueDate) : null);
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
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
      }
    };

    fetchAssignmentDetails();
  }, [assignmentId]);

  // Update assignment setting
  const updateAssignmentSetting = async (setting, value) => {
    const assignmentRef = doc(db, 'assignments', assignmentId);
    const updateData = { [setting]: value };

    await updateDoc(assignmentRef, updateData);
    setAssignmentSettings((prev) => ({ ...prev, [setting]: value }));
  };

  // Fetch class and grades
  const fetchClassAndGrades = async () => {
    setLoading(true);
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      const classData = classDoc.data();

      if (classData && classData.participants) {
        const participants = classData.participants;
        const studentUids = participants.map((p) => p.uid);

        // Batch fetch student documents
        const studentChunks = [];
        for (let i = 0; i < studentUids.length; i += 10) {
          studentChunks.push(studentUids.slice(i, i + 10));
        }

        const studentsPromises = studentChunks.map(async (chunk) => {
          const studentsQuery = query(
            collection(db, 'students'),
            where('__name__', 'in', chunk)
          );
          const studentsSnapshot = await getDocs(studentsQuery);
          return studentsSnapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          }));
        });

        const studentsArrays = await Promise.all(studentsPromises);
        const allStudents = studentsArrays.flat();

        const updatedParticipants = allStudents.map((studentData) => {
          const firstName = studentData.firstName.trim();
          const lastName = studentData.lastName.trim();
          return {
            uid: studentData.uid,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            isAssigned:
              studentData.assignmentsToTake?.includes(assignmentId) ||
              studentData.assignmentsInProgress?.includes(assignmentId) ||
              studentData.assignmentsTaken?.includes(assignmentId),
          };
        });

        // Sort students by last name
        const sortedStudents = updatedParticipants.sort((a, b) =>
          a.lastName.localeCompare(b.lastName)
        );

        setStudents(sortedStudents);
        const assignedStudents = sortedStudents.filter(
          (student) => student.isAssigned
        );
        setAssignedCount(assignedStudents.length);

        // Fetch grades
        const gradesCollection = collection(db, 'grades(mcq)');
        const gradesQuery = query(
          gradesCollection,
          where('assignmentId', '==', assignmentId)
        );
        const gradesSnapshot = await getDocs(gradesQuery);
        const fetchedGrades = {};
        let totalScorePercentage = 0;
        let validGradesCount = 0;
        let submissionsCount = 0;

        gradesSnapshot.forEach((doc) => {
          const gradeData = doc.data();
          // Calculate percentage score from raw scores
          const scorePercentage =
            gradeData.maxRawScore > 0
              ? Math.round(
                  (gradeData.rawTotalScore / gradeData.maxRawScore) * 100
                )
              : 0;

          fetchedGrades[gradeData.studentUid] = {
            submittedAt: gradeData.submittedAt,
            SquareScore: scorePercentage, // Store percentage as SquareScore
            rawTotalScore: gradeData.rawTotalScore,
            maxRawScore: gradeData.maxRawScore,
            viewable: gradeData.viewable || false,
          };

          if (gradeData.submittedAt) {
            submissionsCount++;
          }
          if (gradeData.maxRawScore > 0) {
            totalScorePercentage += scorePercentage;
            validGradesCount++;
          }
        });

        setGrades(fetchedGrades);
        setSubmissionCount(submissionsCount);

        const calculatedAverage =
          validGradesCount > 0
            ? Math.round(totalScorePercentage / validGradesCount)
            : null;
        setAverageGrade(calculatedAverage);

        // Update assignment document with new class average
        if (calculatedAverage !== null) {
          const assignmentRef = doc(db, 'assignments', assignmentId);
          await updateDoc(assignmentRef, {
            classAverage: calculatedAverage,
          });
        }

        // Fetch progress documents
        const progressCollection = collection(db, 'assignments(progress)');
        const progressQuery = query(
          progressCollection,
          where('assignmentId', '==', assignmentId)
        );
        const progressSnapshot = await getDocs(progressQuery);

        // Create assignmentStatuses
        const assignmentStatuses = {};
        progressSnapshot.forEach((doc) => {
          const progressData = doc.data();
          const studentUid = progressData.studentUid;
          const status =
            progressData.status === 'paused' ? 'Paused' : 'In Progress';
          assignmentStatuses[studentUid] = status;
        });

        // For students with grades, set status to 'completed'
        for (const studentUid of Object.keys(fetchedGrades)) {
          assignmentStatuses[studentUid] = 'completed';
        }

        // For students without progress or grades, status is 'not_started'
        for (const student of sortedStudents) {
          if (!assignmentStatuses[student.uid]) {
            assignmentStatuses[student.uid] = 'not_started';
          }
        }

        setAssignmentStatuses(assignmentStatuses);
      }
    } catch (error) {
      console.error('Error fetching class and grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAndGrades();
    const classAndGradesInterval = setInterval(fetchClassAndGrades, 10000);

    return () => clearInterval(classAndGradesInterval);
  }, [classId, assignmentId]);

  // Fetch assignment status for each student
  useEffect(() => {
    const fetchAssignmentStatus = async () => {
      const statusPromises = students.map(async (student) => {
        const progressRef = doc(
          db,
          'assignments(progress)',
          `${assignmentId}_${student.uid}`
        );
        const progressDoc = await getDoc(progressRef);
        const gradeRef = doc(db, 'grades', `${assignmentId}_${student.uid}`);
        const gradeDoc = await getDoc(gradeRef);

        let status = 'not_started';
        if (gradeDoc.exists()) {
          status = 'completed';
        } else if (progressDoc.exists()) {
          status =
            progressDoc.data().status === 'paused' ? 'Paused' : 'In Progress';
        }

        return { [student.uid]: status };
      });

      const statuses = await Promise.all(statusPromises);
      const combinedStatuses = Object.assign({}, ...statuses);
      setAssignmentStatuses(combinedStatuses);
    };

    fetchAssignmentStatus();
  }, [students, assignmentId]);

  // Helper functions
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <SquareCheck color="#00DE09" size={30} strokeWidth={2.5} />;
      case 'In Progress':
        return <SquareMinus color="#FFAA00" size={30} strokeWidth={2.5} />;
      case 'not_started':
        return <SquareX color="lightgrey" size={30} strokeWidth={2.5} />;
      case 'Paused':
        return <SquareMinus color="#FFA500" size={30} strokeWidth={2.5} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#009006';
      case 'In Progress':
        return '#FFD700';
      case 'not_started':
        return '#808080';
      case 'Paused':
        return '#FFA500';
      default:
        return 'lightgrey';
    }
  };

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
        hour12: true,
      };
      return date.toLocaleString('en-US', options);
    } catch (error) {
      console.error(
        'Error formatting date:',
        error,
        'Date string:',
        dateString
      );
      return dateString;
    }
  };

  const navigateToStudentGrades = (studentUid) => {
    navigate(`/class/${classId}/student/${studentUid}/grades`);
  };

  const handleAssign = async (studentId) => {
    const batch = writeBatch(db);
    const studentRef = doc(db, 'students', studentId);
    batch.update(studentRef, {
      assignmentsToTake: arrayUnion(assignmentId),
    });

    await batch.commit();

    setSelectedStudents((prev) => [...prev, studentId]);
    setTimeout(() => {
      setSelectedStudents((prev) =>
        prev.map((id) => (id === studentId ? `${id}-checked` : id))
      );
    }, 1000);
  };

  const handleReset = async (studentUid) => {
    setResetStatus((prev) => ({ ...prev, [studentUid]: 'resetting' }));

    try {
      const batch = writeBatch(db);

      // Remove assignment from testsTaken array in student document
      const studentRef = doc(db, 'students', studentUid);
      batch.update(studentRef, {
        testsTaken: arrayRemove(assignmentId),
        assignmentsToTake: arrayUnion(assignmentId),
      });

      // Delete the grade document
      const gradeRef = doc(db, 'grades', `${assignmentId}_${studentUid}`);
      batch.delete(gradeRef);

      // Delete the progress document if it exists
      const progressRef = doc(
        db,
        'assignments(progress)',
        `${assignmentId}_${studentUid}`
      );
      const progressDoc = await getDoc(progressRef);
      if (progressDoc.exists()) {
        batch.delete(progressRef);
      }

      // Commit the batch
      await batch.commit();

      // Update local state
      setGrades((prevGrades) => {
        const newGrades = { ...prevGrades };
        delete newGrades[studentUid];
        return newGrades;
      });

      setAssignmentStatuses((prev) => ({
        ...prev,
        [studentUid]: 'not_started',
      }));

      // Simulate a delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setResetStatus((prev) => ({ ...prev, [studentUid]: 'success' }));
      setTimeout(
        () => setResetStatus((prev) => ({ ...prev, [studentUid]: '' })),
        1000
      );
    } catch (error) {
      console.error('Failed to reset:', error);
      setResetStatus((prev) => ({ ...prev, [studentUid]: 'failed' }));
    }
  };

  const toggleAllViewable = async () => {
    const newViewableStatus = !allViewable;
    setAllViewable(newViewableStatus);

    const batch = writeBatch(db);

    // Update assignment document
    const assignmentRef = doc(db, 'assignments', assignmentId);
    batch.update(assignmentRef, { viewable: newViewableStatus });

    // Update class document's viewableAssignments array
    const classRef = doc(db, 'classes', classId);
    if (newViewableStatus) {
      // Add assignmentId to viewableAssignments if making viewable
      batch.update(classRef, {
        viewableAssignments: arrayUnion(assignmentId),
      });
    } else {
      // Remove assignmentId from viewableAssignments if making non-viewable
      batch.update(classRef, {
        viewableAssignments: arrayRemove(assignmentId),
      });
    }

    // Update individual grade documents
    for (const student of students) {
      const gradeRef = doc(db, 'grades', `${assignmentId}_${student.uid}`);
      const gradeDoc = await getDoc(gradeRef);

      if (gradeDoc.exists()) {
        batch.update(gradeRef, {
          viewable: newViewableStatus,
        });

        setGrades((prevGrades) => ({
          ...prevGrades,
          [student.uid]: {
            ...prevGrades[student.uid],
            viewable: newViewableStatus,
          },
        }));
      }
    }

    try {
      await batch.commit();
      console.log('Successfully updated viewable status for all documents');
    } catch (error) {
      console.error('Error updating viewable status:', error);
      // Revert the local state if the batch update fails
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
      setTimeout(() => setResetStatus(prev => ({ ...prev, [studentUid]: '' })), 1000000);
    }
  };
  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'submissions':
        return (
          <StudentResultsList
            students={students}
            grades={grades}
            assignmentStatuses={assignmentStatuses}
            navigateToStudentGrades={navigateToStudentGrades}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
            calculateLetterGrade={calculateLetterGrade}
            hoveredStatus={hoveredStatus}
            setHoveredStatus={setHoveredStatus}
            togglePauseAssignment={togglePauseAssignment}
            handleReset={handleReset}
            resetStatus={resetStatus}
            handleAssign={handleAssign}
            submissionCount={submissionCount}
            averageGrade={averageGrade}
            onTabChange={handleTabClick} 
            allViewable={allViewable}
            toggleAllViewable={toggleAllViewable}
          />
        );

      case 'questionBank':
        return (
          <div style={{ width: '100%', marginTop: '20px' }}>
            <QuestionBankMCQ
              editedQuestions={editedQuestions}
              setEditedQuestions={setEditedQuestions}
              assignmentId={assignmentId}
            />
          </div>
        );

      case 'settings':
        return (
          <div style={{ width: '100%', marginTop: '20px' }}>
            <SettingsSection
              assignmentId={assignmentId}
              classId={classId}
              assignmentName={assignmentName}
              setAssignmentName={setAssignmentName}
              assignmentSettings={assignmentSettings}
              updateAssignmentSetting={updateAssignmentSetting}
            />
          </div>
        );

      default:
        return null;
    }
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
  const getCurrentPeriodStyle = useCallback(() => {
    const period = classId.split('+')[1] || '1';
    return periodStyles[period] || periodStyles[1];
  }, [classId]);

  // Add scroll handler effect
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        format={{ label: 'MCQ', color: '#7D00EA' }}
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

export default TeacherResultsMCQ;
