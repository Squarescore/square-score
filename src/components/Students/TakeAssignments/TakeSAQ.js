import React, { useState, useEffect, useRef } from 'react';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import Loader from '../../Universal/Loader';
import { SquareArrowLeft, SquareArrowRight, Eye, EyeOff, LayoutGrid, List, Hourglass, Lock, LockOpen } from 'lucide-react';
import TakeAssignmentNav from './TakeAssignmentNav';
import { GlassContainer } from '../../../styles';
function TakeTests() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const { assignmentId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLimit, setTimeLimit] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState('open');
  const [classId, setClassId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [timerStarted, setTimerStarted] = useState(false);
  const [progressExists, setProgressExists] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLockdownSaving, setIsLockdownSaving] = useState(false);
  const [onViolation, setOnViolation] = useState('pause');
  const saveIntervalRef = useRef(null);
  const [halfCredit, setHalfCredit] = useState(false);
  const [timeMultiplier, setTimeMultiplier] = useState(1); // Add this state
  const [isListView, setIsListView] = useState(false);
  const [showLockTooltip, setShowLockTooltip] = useState(false);

  // Add state for scroll
  const [isScrolled, setIsScrolled] = useState(false);

  // Add state for modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Add states for hold submit
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef(null);

  // Handle hold start
  const handleHoldStart = () => {
    setIsHolding(true);
    let startTime = Date.now();
    
    holdTimerRef.current = setInterval(() => {
      const progress = Math.min(((Date.now() - startTime) / 1500) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(holdTimerRef.current);
        setShowConfirmModal(false);
        handleSubmit();
      }
    }, 10);
  };

  // Handle hold end
  const handleHoldEnd = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  // Separate submit button click handler from actual submit
  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const studentUid = auth.currentUser.uid;
  const navigate = useNavigate();
  const [scaleMin, setScaleMin] = useState(0);
const [scaleMax, setScaleMax] = useState(2);
  const [saveAndExit, setSaveAndExit] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initialWindowSize, setInitialWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showTimerComponents, setShowTimerComponents] = useState(false);
  const fetchUserName = async () => {
    const userRef = doc(db, 'students', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      setFirstName(userDoc.data().firstName);
      setLastName(userDoc.data().lastName);
    }
  };
  useEffect(() => {
    fetchUserName();
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLockdownViolation = async () => {
  if (isSubmitted) {
    console.log('Assignment already submitted; ignoring lockdown violation.');
    return;
  }

  setIsLockdownSaving(true);

  try {
    // Ensure we have the latest state of answers
    const currentAnswers = [...answers];
    
    if (onViolation === 'submit') {
      await handleSubmit(currentAnswers);
    } else {
      // Update status to paused and save current progress
      await saveProgress('paused', currentAnswers);
      setAssignmentStatus('paused');
      navigate(`/studentassignments/${classId}/active`);
    }
  } catch (error) {
    console.error("Error handling lockdown violation:", error);
    alert("Error while saving your progress. Please try again.");
  } finally {
    setIsLockdownSaving(false);
  }
};

  
  const saveProgress = async (status = 'in_progress', currentAnswers = answers) => {
    const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
    const currentProgress = await getDoc(progressRef);

    // If the document exists and is already submitted or paused, prevent overwriting with in_progress
    if (currentProgress.exists() && 
      (currentProgress.data().status === 'submitted' || currentProgress.data().status === 'paused') && 
      status === 'in_progress') {
      console.log('Assignment already submitted or paused, skipping in_progress update');
      return;
    }

    // Data loss prevention checks
    if (currentProgress.exists()) {
      const existingData = currentProgress.data();
      const existingAnswers = existingData.questions || [];
      
      // Count non-empty responses in existing and new data
      const existingResponseCount = existingAnswers.filter(q => q.studentResponse?.trim()).length;
      const newResponseCount = currentAnswers.filter(a => a.answer?.trim()).length;
      
      // Calculate how many responses would be lost
      const responseLoss = existingResponseCount - newResponseCount;

      // If we would lose 2 or more responses, prevent the update
      if (responseLoss >= 2 && status !== 'submitted') {
        console.error('Prevented potential data loss - attempted to clear multiple existing responses');
        throw new Error('Update prevented to protect your previous answers. Please refresh the page and try again.');
      }

      // Create backup of existing data
      const backupRef = doc(db, 'assignments(progress)_backup', `${assignmentId}_${studentUid}_${Date.now()}`);
      await setDoc(backupRef, {
        ...existingData,
        backupCreatedAt: serverTimestamp()
      });
    }
  
    try {
      // Create a local copy of the current answers to ensure we're working with the latest data
      const answersToSave = [...currentAnswers].map(answer => ({
        ...answer,
        answer: answer.answer?.trim() || '' // Ensure empty string for null/undefined answers
      }));
  
      // Count completed questions - consider a question completed if it has a non-empty response
      const completedCount = answersToSave.filter(a => a.answer).length;
  
   
      // Create complete progress data with all required fields
      const progressData = {
        assignmentId,
        studentUid,
        firstName,
        lastName,
        classId,
        assignmentName,
        questions: questions.map((question, index) => {
          // Find the corresponding answer in answersToSave
          const answer = answersToSave.find(a => a.questionId === question.questionId);
          return {
            questionId: question.questionId,
            text: question.text,
            rubric: question.rubric,
            studentResponse: answer?.answer || '' // Use current answer if available
          };
        }),
        timeRemaining: secondsLeft,
        savedAt: serverTimestamp(),
        status: status, // Explicitly set status
        halfCredit,
        lockdown,
        saveAndExit,
        scaleMin,
        scaleMax,
        timeLimit,
        completedQuestions: completedCount,
        totalQuestions: questions.length
      };
  
      // Add submittedAt only if status is "submitted"
      if (status === 'submitted') {
        progressData.submittedAt = serverTimestamp();
        progressData.isSubmitted = true;
      }
  
      // Use setDoc with merge: true to ensure we don't overwrite fields
      await setDoc(progressRef, progressData, { merge: true });
  
      // Update student assignment status
      const studentRef = doc(db, 'students', studentUid);
      const updates = {
        assignmentsToTake: arrayRemove(assignmentId),
        assignmentsInProgress: arrayRemove(assignmentId),
        assignmentsPaused: arrayRemove(assignmentId)
      };
  
      // Add to appropriate array based on status
      if (status === 'paused') {
        updates.assignmentsPaused = arrayUnion(assignmentId);
      } else if (status === 'in_progress') {
        updates.assignmentsInProgress = arrayUnion(assignmentId);
      }
  
      await updateDoc(studentRef, updates);
      console.log('Progress saved successfully with status:', status);
    } catch (error) {
      console.error("Error saving progress:", error);

      // If this was a data protection error, show specific message
      if (error.message.includes('Update prevented to protect your previous answers')) {
        // Try to recover the latest valid state
        const backupQuery = query(
          collection(db, 'assignments(progress)_backup'),
          where('assignmentId', '==', assignmentId),
          where('studentUid', '==', studentUid),
          orderBy('backupCreatedAt', 'desc'),
          limit(1)
        );

        try {
          const backupSnapshot = await getDocs(backupQuery);
          if (!backupSnapshot.empty) {
            const latestBackup = backupSnapshot.docs[0].data();
            // Update answers state with backup data
            const recoveredAnswers = latestBackup.questions.map(q => ({
              questionId: q.questionId,
              answer: q.studentResponse || ''
            }));
            setAnswers(recoveredAnswers);
          }
        } catch (recoveryError) {
          console.error("Error recovering backup:", recoveryError);
        }
      }
      
      throw error; // Propagate error to caller
    }
  };
  
  const handleSubmit = async (currentAnswers = answers) => {
    const timeSpent = timeLimit ? (timeLimit - secondsLeft) : 0;
    setIsSubmitting(true);
    try {
      const gradeDocRef = doc(db, `grades`, `${assignmentId}_${studentUid}`);
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      const studentRef = doc(db, 'students', studentUid);
     
      // First save progress with submitted status
      await saveProgress('submitted', currentAnswers);
    
      const maxRawScore = questions.length * (scaleMax - scaleMin);
  
      // Save the initial grade document
      const initialGradeData = {
        assignmentId,
        studentUid,
        assignmentName,
        firstName,
        lastName,
        classId,
        halfCreditEnabled: halfCredit,
        submittedAt: serverTimestamp(),
        questions: currentAnswers.map((answer, index) => ({
          questionId: questions[index].questionId,
          question: questions[index].text,
          studentResponse: answer.answer || '',
          rubric: questions[index].rubric,
          feedback: 'Responses haven\'t been graded yet',
          score: 0,
        })),
        viewable: false,
        rawTotalScore: 0,
        maxRawScore,
        scaledScore: 0,
        scaleMin,
        scaleMax,
        percentageScore: 0,
        timeSpent
      };
  
      await setDoc(gradeDocRef, initialGradeData);
  
      // Grade the assignment
      const gradingResults = await gradeAssignmentWithRetries(questions, currentAnswers, halfCredit);
      const wasGradingUnsuccessful = gradingResults.some(result => 
        result.feedback === "Question not graded successfully due to technical issues."
      );
  
      // Update with grading results
      const combinedResults = gradingResults.map((result, index) => ({
        ...result,
        score: ((result.score / 2) * (scaleMax - scaleMin) + scaleMin),
        question: questions[index].text,
        studentResponse: currentAnswers[index].answer || '',
        rubric: questions[index].rubric,
        questionId: questions[index].questionId,
        flagged: false,
      }));
  
      const rawTotalScore = combinedResults.reduce((sum, result) => sum + result.score, 0);
      const percentageScore = ((rawTotalScore / maxRawScore) * 100);
      const submittedAt = serverTimestamp();
  
      // Prepare student document updates
      const studentUpdates = {
        assignmentsToTake: arrayRemove(assignmentId),
        assignmentsInProgress: arrayRemove(assignmentId),
        assignmentsPaused: arrayRemove(assignmentId),
        assignmentsTaken: arrayUnion(assignmentId),
        timeSpent,
      };
  
      // Add the class-specific grade data with grading status
      studentUpdates[`class_${classId}.grades.${assignmentId}`] = {
        score: percentageScore,
        submittedAt,
        assignmentId,
        assignmentName,
        gradedUnsuccessfully: wasGradingUnsuccessful // Store grading status here
      };
  
      // Update both documents atomically
      await Promise.all([
        updateDoc(gradeDocRef, {
          rawTotalScore,
          maxRawScore,
          scaledScore: rawTotalScore / maxRawScore,
          scaleMin,
          scaleMax,
          percentageScore,
          questions: combinedResults,
          viewable: true
        }),
        updateDoc(studentRef, studentUpdates)
      ]);
  
      // Clear the save interval
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
  
      setIsSubmitted(true);
      navigate(`/studentassignments/${classId}/completed`);
    } catch (error) {
      console.error("Error submitting and grading assignment:", error);
      // Update the student document to indicate unsuccessful grading
      try {
        const studentRef = doc(db, 'students', studentUid);
        await updateDoc(studentRef, {
          [`class_${classId}.grades.${assignmentId}.gradedUnsuccessfully`]: true
        });
      } catch (updateError) {
        console.error("Error updating gradedUnsuccessfully field:", updateError);
      }
      alert("Your submission was saved, but we encountered an issue during grading. Your instructor has been notified.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const gradeAssignmentWithRetries = async (questions, answers, halfCredit, maxRetries = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const gradingResults = await gradeAssignment(questions, answers, halfCredit);
        return gradingResults;
      } catch (error) {
        console.error(`Grading attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries) {
          return questions.map(() => ({
            feedback: "Question not graded successfully due to technical issues.",
            score: 0
          }));
        }
      }
    }
  };




  useEffect(() => {
    const fetchAssignmentAndProgress = async () => {
      setLoading(true);
      try {
        // First fetch the student's time multiplier
        const studentRef = doc(db, 'students', studentUid);
        const studentDoc = await getDoc(studentRef);
        let multiplier = 1; // Default value
        
        if (studentDoc.exists()) {
          // Use the timeMultiplier if it exists, otherwise use default
          multiplier = studentDoc.data().timeMultiplier || 1;
          setTimeMultiplier(multiplier);
        }

        console.log('Fetching assignment:', assignmentId);
        const assignmentRef = doc(db, 'assignments', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);

        if (assignmentDoc.exists()) {
          const assignmentData = assignmentDoc.data();
          console.log('Assignment data:', assignmentData);
          setAssignmentName(assignmentData.assignmentName);
          // Apply the time multiplier to the timer
          const adjustedTime = Math.round(assignmentData.timer * multiplier * 60);
          setTimeLimit(adjustedTime);
          setClassId(assignmentData.classId);
          setHalfCredit(assignmentData.halfCredit);
          setSaveAndExit(assignmentData.saveAndExit);
          const scaleMin = assignmentData.scale?.min ? Number(assignmentData.scale.min) : 0;
          const scaleMax = assignmentData.scale?.max ? Number(assignmentData.scale.max) : 2;
  
          // Check if there's saved data for the student
          const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
          const savedDataDoc = await getDoc(progressRef);
          const hasLockdown = assignmentData.lockdown || false;
          setLockdown(hasLockdown);
          
          // Only set onViolation if lockdown is enabled
          if (hasLockdown) {
            setOnViolation(assignmentData.onViolation || 'pause');
          } else {
            setOnViolation(null);
          }
          
          if (savedDataDoc.exists()) {
            setProgressExists(true);
            const savedData = savedDataDoc.data();
            setQuestions(savedData.questions.map(q => ({
              questionId: q.questionId,
              text: q.text,
              rubric: q.rubric
            })));
            setAnswers(savedData.questions.map(q => ({
              questionId: q.questionId,
              answer: q.studentResponse || ''
            })));
            setSecondsLeft(savedData.timeRemaining);
          } else {
            setProgressExists(false);
            const allQuestions = Object.entries(assignmentData.questions).map(([id, data]) => ({
              questionId: id,
              text: data.question,
              rubric: data.rubric
            }));
        
            const studentQuestionCount = assignmentData.questionCount.student;
            const randomQuestions = getRandomSubset(allQuestions, studentQuestionCount);
            setScaleMin(scaleMin);
            setScaleMax(scaleMax);
            setQuestions(randomQuestions);
            setAnswers(randomQuestions.map(q => ({ questionId: q.questionId, answer: '' })));
          }
        } else {
          console.error("Assignment not found");
        }
      } catch (error) {
        console.error("Error fetching assignment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentAndProgress();
  }, [assignmentId, studentUid]);



  useEffect(() => {
    if (!progressExists && assignmentId && studentUid && questions.length > 0 && timeLimit !== null && firstName && lastName) {
      initializeAssignment();
    }
  }, [progressExists, assignmentId, studentUid, questions, timeLimit, firstName, lastName]);
  
  const initializeAssignment = async () => {
    try {
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      const progressDoc = await getDoc(progressRef);
  
      if (!progressDoc.exists()) {
        const studentRef = doc(db, 'students', studentUid);
        await updateDoc(studentRef, {
          assignmentsToTake: arrayRemove(assignmentId),
          assignmentsInProgress: arrayUnion(assignmentId)
        });
  
        await setDoc(progressRef, {
          assignmentId,
          studentUid,
          firstName: firstName,
          lastName: lastName,
          questions: questions.map(q => ({
            questionId: q.questionId,
            text: q.text,
            rubric: q.rubric,
            studentResponse: ''
          })),
          timeRemaining: timeLimit,
          savedAt: serverTimestamp(),
          status: 'in_progress'
        });
      }
    } catch (error) {
      console.error("Error initializing assignment:", error);
    }
  };
  

  useEffect(() => {
    if (loading || !lockdown || isSubmitted) return;
  
    // Set initial window size if not already set
    if (!initialWindowSize.width && !initialWindowSize.height) {
      setInitialWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleLockdownViolation();
      }
    };
  
    const handleResize = () => {
      const currentSize = { width: window.innerWidth, height: window.innerHeight };
      if (
        currentSize.width !== initialWindowSize.width ||
        currentSize.height !== initialWindowSize.height
      ) {
        handleLockdownViolation();
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [lockdown, initialWindowSize, isSubmitted, loading]);
  
  
  useEffect(() => {
    if (lockdown) {
      setInitialWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, [lockdown]);

  useEffect(() => {
    if (timeLimit !== null) {
      setSecondsLeft(timeLimit);
      if (timeLimit > 0) {
        setTimerStarted(true);
        setShowTimerComponents(true);
      } else {
        setShowTimerComponents(false);
      }
    }
  }, [timeLimit]);

  useEffect(() => {
    let timerId;

    if (secondsLeft > 0 && !loading) {
      timerId = setInterval(() => {
        setSecondsLeft(prevSeconds => prevSeconds - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerStarted) {
      handleSubmit();
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [secondsLeft, loading, timerStarted]);



  const getRandomSubset = (questions, count) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };


  const toggleTimer = () => {
    setShowTimer(prevShowTimer => !prevShowTimer);
  };



  const submitButton = () => {
    if (!isSubmitting && window.confirm("Are you sure you want to submit your response?")) {
      handleSubmit();
    }
  };
 
  const gradeAssignment = async (questions, answers, halfCredit) => {
    const questionsToGrade = questions.map((question, index) => ({
      questionId: question.questionId,
      question: question.text,
      rubric: question.rubric,
      studentResponse: answers[index].answer,
    }));
  
    const response = await fetch('https://us-central1-square-score-ai.cloudfunctions.net/GradeSAQ', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions: questionsToGrade,
        halfCreditEnabled: halfCredit,
        classId: classId  // Add this line
      })
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const gradingResults = await response.json();
    return gradingResults;
  };
  








  useEffect(() => {
   if (!loading && questions.length > 0 && !isSubmitted) {
        saveIntervalRef.current = setInterval(() => {
          // Always call saveProgress('in_progress', answers)
          saveProgress('in_progress', answers);
        }, 10000);
      }
  
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [saveAndExit, loading, questions, isSubmitted, answers]);
  

  


  const loadingModalStyle = {
    position: 'fixed',
    top: 0, 
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000'
  };

  const loadingModalContentStyle = {
    width: 300,
    height: 180,
    backgroundColor: 'white',
    borderRadius: 10,
    textAlign: 'center',
    padding: 20,
    color: 'white',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const buttonStylesLeft = {
    default: {
      backgroundColor: 'transparent',
      marginTop: '-40px',
      cursor: 'default',
      border: 'none',
      width: '80px',
      height: '80px',
      position: 'fixed',
      left: '100px'
    },
    active: {
      backgroundColor: 'transparent',
      cursor: 'pointer',
      marginTop: '-40px',
      border: 'none',
      width: '80px',
      height: '80px',
        position: 'fixed',
      left: '100px'
    }
  };
  const arrowStyles = {
    default: {
      backgroundColor: '#f4f4f4',
      color: 'grey',
      cursor: 'not-allowed',
      width: '80px',
      borderRadius: '10px',
      border: '4px solid lightgrey',
      fontSize: '40px',
      height: '50px',
    },
    active: {
      backgroundColor: '#A6FFAF',
      color: 'darkgreen',
      cursor: 'pointer',
      width: '80px',
      borderRadius: '10px',
      border: '4px solid #2BB514',
      fontSize: '40px',
      height: '50px',
    }
  };
  const buttonStylesRight = {
    default: {
      backgroundColor: 'transparent',
      marginTop: '-40px',
      cursor: 'default',
      border: 'none',
      width: '80px',
      height: '80px',
      position: 'fixed',
      right: '100px'
    },
    active: {
      backgroundColor: 'transparent',
      cursor: 'pointer',
      marginTop: '-40px',
      border: 'none',
      width: '80px',
      height: '80px',
        position: 'fixed',
      right: '100px'
    }
  };
  const onSaveAndExit = async () => {
    await saveProgress();
    navigate(`/studentassignments/${classId}/active`);
  };
  return (
    <div style={{ fontFamily: "'montserrat', sans-serif" }}>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <GlassContainer
            variant="clear"
            size={2}
            style={{
              width: '400px',
              backgroundColor: 'white'
            }}
            contentStyle={{
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <h2 style={{
              margin: 0,
              fontSize: '1.2rem',
              fontWeight: '500',
              color: 'black',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Submit Assignment
            </h2>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              color: 'grey',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Are you sure you want to submit? You won't be able to make any changes after submission.
            </p>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '50px',
                  padding: '5px 15px',
                  color: 'grey',
                  cursor: 'pointer',
                  fontSize: '.9rem',
                  fontWeight: '400',
                  width: '100px',
                  fontFamily: "'Montserrat', sans-serif"
                }}
              >
                Cancel
              </button>
              <div style={{ position: 'relative', width: '150px' }}>
                <GlassContainer
                  onMouseDown={handleHoldStart}
                  onMouseUp={handleHoldEnd}
                  onMouseLeave={handleHoldEnd}
                  onTouchStart={handleHoldStart}
                  onTouchEnd={handleHoldEnd}
                  variant="green"
                  size={0}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  contentStyle={{
                    padding: '5px 15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  <span style={{
                    color: '#2BB514',
                    fontSize: '.9rem',
                    fontWeight: '400',
                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                    Submit (Hold)
                  </span>
                  {isHolding && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${holdProgress}%`,
                      backgroundColor: 'rgba(43, 181, 20, 0.1)',
                      transition: 'width 0.01s linear',
                      zIndex: 1
                    }} />
                  )}
                </GlassContainer>
              </div>
            </div>
          </GlassContainer>
        </div>
      )}

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        zIndex: 100,
        borderBottom: isScrolled ? '1px solid #ddd' : '1px solid transparent',
        transition: 'border-color 0.2s ease',
        padding: '15px 0',
        display: 'flex',
      }}>
        <h1 style={{
          marginLeft: '4%',
          fontSize: '1.3rem',
          color: 'black',
          fontWeight: '400'
        }}>
          {assignmentName}
        </h1>

        {/* Timer and View Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginLeft: 'auto',
          gap: '20px',
          marginRight: '4%'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            {showTimerComponents && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'grey',
                cursor: 'pointer',
              }} onClick={toggleTimer}>
                {showTimer ? 
                  <Eye size={16} style={{ color: secondsLeft <= 180 ? '#ff4444' : 'grey', transition: 'color 0.3s ease' }} /> : 
                  <Hourglass size={16} style={{ color: secondsLeft <= 180 ? '#ff4444' : 'grey', transition: 'color 0.3s ease' }} />
                }
                <span style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '500',
                  color: secondsLeft <= 180 ? '#ff4444' : 'grey',
                  transition: 'color 0.3s ease'
                }}>
                  {showTimer ? formatTime(secondsLeft) : ''}
                </span>
              </div>
            )}
            
            <div style={{ width: '1px', height: '20px', background: '#ddd' }} />
       
          
            <div 
              style={{
                color: 'grey',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}
              onMouseEnter={() => setShowLockTooltip(true)}
              onMouseLeave={() => setShowLockTooltip(false)}
            >
              {lockdown ? <Lock size={16} /> : <LockOpen size={16} />}
              {showLockTooltip && (
                <div style={{
                  position: 'absolute',
                  top: '25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'white',
                  padding: '8px 12px',
                  borderRadius: '5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #ddd',
                  whiteSpace: 'nowrap',
                  zIndex: 1000,
                  fontSize: '12px',
                  color: 'grey'
                }}>
                  {lockdown ? "Cannot leave tab or change window" : "Can leave tab or change window"}
                </div>
              )}
            </div>
            <div style={{ width: '1px', height: '20px', background: '#ddd' }} />

<div 
  onClick={() => setIsListView(!isListView)}
  style={{
    cursor: 'pointer',
    color: 'grey',
    display: 'flex',
    alignItems: 'center'
  }}
>
  {isListView ? <LayoutGrid size={16} /> : <List size={16} />}
</div>


          </div>

          {saveAndExit && (
            <button
              onClick={onSaveAndExit}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '50px',
                padding: '5px 15px',
                color: 'grey',
                cursor: 'pointer',
                fontSize: '.9rem',
                fontWeight: '400',
                width: '130px',
                fontFamily: "'Montserrat', sans-serif"
              }}
            >
              Save & Exit
            </button>
          )}

          <GlassContainer
            onClick={handleSubmitClick}  // Changed to new handler
            variant="green"
            size={0}
            style={{
              width: '130px',
              cursor: 'pointer'
            }}
            contentStyle={{
              padding: '5px 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{
              color: '#2BB514',
              fontSize: '.9rem',
              fontWeight: '400',
              fontFamily: "'Montserrat', sans-serif"
            }}>
              Submit
            </span>
          </GlassContainer>
        </div>
      </div>
      
      {/* Add spacer for fixed header */}
      <div style={{ height: '80px' }} />

      {/* Loading Modal */}
      {(loading || isSubmitting || isLockdownSaving) && (
        <div style={loadingModalStyle}>
          <div style={loadingModalContentStyle}>
            <p style={{ fontSize: '16px', fontFamily: "'montserrat', sans-serif", fontWeight: '500', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)', marginBottom: '0px' }}>
              {isSubmitting ? 'Grading in Progress' : 
               isLockdownSaving ? 'Saving Progress' : 
               'Loading Assignment'}
            </p>
            <div style={{
              position: 'absolute',

              left: '50%',
              top: '35%',
              transform: 'translate(-50%, -50%)'
            }}>
            <Loader/>
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="lds-ripple"><div></div><div></div></div>
            </div>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ 
          width: '100%',
          marginTop: '90px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2
        }}>
          {isListView ? (
            <div style={{ width: '800px', maxWidth: '90%', margin: '0 auto', position: 'relative' }}>
              {questions.map((question, index) => (
                <div key={index} style={{ position: 'relative', marginBottom: '40px' }}>
                  {/* Watermark container for question */}
                  <div style={{
                   position: 'absolute',
                    top: -10,
                    left: 0,
                    right: 0,
                    height: 'fit-content',
                    minHeight: '50px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridAutoRows: '14px',
                    alignContent: 'start',
                    pointerEvents: 'none',
                    zIndex: 0,
                    padding: '10px 0' ,
                    gap: '0px',
                  }}>
                    {Array(15).fill("AI ASSISTANCE PROHIBITED - ACADEMIC INTEGRITY  - NO BYPASS -").map((text, i) => (
                      <div
                        key={i}
                        style={{
                                                 color: '#ddd',
                       fontSize: '9px',
                       padding: '0',
                       margin: '0',
                       lineHeight: '10px',
                       height: '10px',
                       whiteSpace: 'nowrap',
                       fontFamily: 'monospace',
                       userSelect: 'none',
                       fontWeight: '600',
                       WebkitUserSelect: 'none',
                       msUserSelect: 'none',
                       textAlign: 'center',
                       overflow: 'hidden',
                       textOverflow: 'ellipsis',
                       letterSpacing: '0.5px'
                        }}
                      >
                        {text}
                      </div>
                    ))}
                  </div>

                  <div style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: 'black',
                    fontWeight: '600',
                    borderLeft: '3px solid grey',
                    fontSize: '1.5rem',
                    padding: '5px 15px',
                    textAlign: 'left',
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: '20px',
                    userSelect: 'none',
                    WebkitTextStroke: '0.5px white',
                    textShadow: '0 0 1px white'
                  }}>
                    Question {index + 1}: {question.text}
                  </div>
                  
                  <textarea
                    style={{
                      width: '100%',
                      marginTop: '70px',
                      minHeight: '100px',
                      borderRadius: '20px',
                      border: '1px solid lightgrey',
                      padding: '20px',
                      outline: 'none',
                      textAlign: 'left',
                      fontSize: '1rem',
                      fontFamily: "'montserrat', sans-serif",
                      marginBottom: '40px',
                      position: 'relative',
                      zIndex: 1
                    }}
                    type="text"
                    placeholder='Type your response here'
                    value={answers.find(a => a.questionId === question.questionId)?.answer || ''}
                    onChange={(e) => {
                      const updatedAnswers = answers.map(answer => 
                        answer.questionId === question.questionId
                          ? { ...answer, answer: e.target.value }
                          : answer
                      );
                      setAnswers(updatedAnswers);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Paginated View
            <div style={{ width: '800px', maxWidth: '90%', marginTop: '50px', position: 'relative' }}>
              {/* Watermark container for question */}
                             <div style={{
                 position: 'absolute',
                  width: '800px',
                 top: '-10px',
                 
                 bottom: '-20px',
                 left: '-10px',  // Start at 15% from left
                 right: '-10px', // End at 15% from right
                 height: 'fit-content', // Adapt to content
                 minHeight: '60px',
                 display: 'grid',
                 gridTemplateColumns: 'repeat(3, 1fr)', // Fixed 3 columns
                 gridAutoRows: 'min-content',
                 gap: '0',
                 rowGap: '0',
                 alignContent: 'start',
                 pointerEvents: 'none',
                 zIndex: 0,
                 padding: '10px 0'
              }}>
                {Array(15).fill("AI ASSISTANCE PROHIBITED - ACADEMIC INTEGRITY  - NO BYPASS -").map((text, i) => (
                  <div
                    key={i}
                    style={{
                                             color: '#ddd',
                       fontSize: '9px',
                       padding: '0',
                       margin: '0',
                       lineHeight: '10px',
                       height: '10px',
                       whiteSpace: 'nowrap',
                       fontFamily: 'monospace',
                       userSelect: 'none',
                       fontWeight: '600',
                       WebkitUserSelect: 'none',
                       msUserSelect: 'none',
                       textAlign: 'center',
                       overflow: 'hidden',
                       textOverflow: 'ellipsis',
                       letterSpacing: '0.5px'
                    }}
                  >
                    {text}
                  </div>
                ))}
              </div>

              <div style={{
                 width: '100%',
                 backgroundColor: 'transparent',
                 color: 'black',
                 fontWeight: '600',
                 borderLeft: '3px solid grey',
                 fontSize: '1.5rem',
                 padding: '5px 15px',
                 userSelect: 'none',
                 textAlign: 'left',
                 position: 'relative',
                 zIndex: 1,
                 marginBottom: '20px',
                 WebkitTextStroke: '0.5px white',
                 textShadow: '0 0 1px white'
              }}>
                {questions[currentQuestionIndex]?.text}
              </div>

              <textarea
                style={{
                  width: '100%',
                  marginTop: '170px',
                  minHeight: '100px',
                  borderRadius: '20px',
                  border: '1px solid lightgrey',
                  padding: '20px',
                  outline: 'none',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontFamily: "'montserrat', sans-serif",
                  marginBottom: '40px',
                  position: 'relative',
                  zIndex: 1
                }}
                type="text"
                placeholder='Type your response here'
                value={answers.find(a => a.questionId === questions[currentQuestionIndex]?.questionId)?.answer || ''}
                onChange={(e) => {
                  const updatedAnswers = answers.map(answer => 
                    answer.questionId === questions[currentQuestionIndex].questionId
                      ? { ...answer, answer: e.target.value }
                      : answer
                  );
                  setAnswers(updatedAnswers);
                }}
              />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1)}
                  style={{
                    backgroundColor: currentQuestionIndex > 0 ? 'white' : '#f4f4f4',
                    cursor: currentQuestionIndex > 0 ? 'pointer' : 'default',
                    fontSize: '16px',
                    padding: '5px 15px',
                    fontWeight: '400',
                    width: '100px',
                    fontFamily: "'montserrat', sans-serif",
                    borderRadius: '50px',
                    color: currentQuestionIndex > 0 ? 'grey' : 'lightgrey',
                    border: '1px solid lightgrey'
                  }}
                >
                  Previous
                </button>

                <span style={{
                  color: 'grey',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>

                <button
                  onClick={() => currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex(prev => prev + 1)}
                  style={{
                    backgroundColor: currentQuestionIndex < questions.length - 1 ? 'white' : '#f4f4f4',
                    cursor: currentQuestionIndex < questions.length - 1 ? 'pointer' : 'default',
                    fontSize: '16px',
                    padding: '5px 15px',
                    fontWeight: '400',
                    
                    width: '100px',
                    fontFamily: "'montserrat', sans-serif",
                    borderRadius: '50px',
                    color: currentQuestionIndex < questions.length - 1 ? 'grey' : 'lightgrey',
                    border: '1px solid lightgrey'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TakeTests;
