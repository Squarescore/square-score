import React, { useState, useEffect, useRef } from 'react';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import Loader from '../../Universal/Loader';
import { SquareArrowLeft, SquareArrowRight, Eye, EyeOff, LayoutGrid, List } from 'lucide-react';
import TakeAssignmentNav from './TakeAssignmentNav';
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
  const saveProgress = async (status = 'in_progress') => {
    if (isSubmitted) {
      console.log('Assignment already submitted, not saving progress.');
      return;
    }
  
    try {
      // First, check if the assignment is already submitted
      const gradeDocRef = doc(db, `grades`, `${assignmentId}_${studentUid}`);
      const gradeDoc = await getDoc(gradeDocRef);
      
      if (gradeDoc.exists()) {
        console.log('Assignment already has grades, canceling save.');
        return;
      }
  
      // Count completed questions
      const completedCount = answers.filter(a => a.answer?.trim()).length;
  
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      
      // Create complete progress data with all required fields
      const progressData = {
        assignmentId,
        studentUid,
        firstName,
        lastName,
        classId,
        assignmentName,
        questions: questions.map(question => ({
          questionId: question.questionId,
          text: question.text,
          rubric: question.rubric,
          studentResponse: answers.find(answer => answer.questionId === question.questionId)?.answer || ''
        })),
        timeRemaining: secondsLeft,
        savedAt: serverTimestamp(),
        status: status,
        halfCredit,
        lockdown,
        saveAndExit,
        scaleMin,
        scaleMax,
        timeLimit,
        completedQuestions: completedCount,
        totalQuestions: questions.length
      };
  
      await setDoc(progressRef, progressData, { merge: false }); // Use merge: false to ensure complete replacement
  
      // Update student assignment status
      const studentRef = doc(db, 'students', studentUid);
      const updates = {
        assignmentsToTake: arrayRemove(assignmentId),
        assignmentsInProgress: arrayRemove(assignmentId),
        assignmentsPaused: arrayRemove(assignmentId)
      };
  
      if (status === 'paused') {
        updates.assignmentsPaused = arrayUnion(assignmentId);
      } else if (status === 'in_progress') {
        updates.assignmentsInProgress = arrayUnion(assignmentId);
      }
  
      await updateDoc(studentRef, updates);
  
      console.log('Progress saved with status:', status);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };
  const handleLockdownViolation = async () => {
    if (isSubmitted) {
      console.log('Assignment already submitted, ignoring lockdown violation.');
      return;
    }

    setIsLockdownSaving(true);

    try {
      if (onViolation === 'submit') {
        await handleSubmit();
      } else {
        // Default behavior is pause
        await saveProgress('paused');
        setAssignmentStatus('paused');
        navigate(`/studentassignments/${classId}/active`);
      }
    } catch (error) {
      console.error("Error handling lockdown violation:", error);
      alert("An error occurred while saving your progress. Please try again.");
    } finally {
      setIsLockdownSaving(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const gradeDocRef = doc(db, `grades`, `${assignmentId}_${studentUid}`);
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      const studentRef = doc(db, 'students', studentUid);

      // Clean up all assignment states first
      await updateDoc(studentRef, {
        assignmentsToTake: arrayRemove(assignmentId),
        assignmentsInProgress: arrayRemove(assignmentId),
        assignmentsPaused: arrayRemove(assignmentId),
        assignmentsTaken: arrayUnion(assignmentId)
      });

      const maxRawScore = questions.length * (scaleMax - scaleMin);

      // Save the student's answers without grading results
      await setDoc(gradeDocRef, {
        assignmentId,
        studentUid,
        assignmentName,
        firstName,
        lastName,
        classId,
        halfCreditEnabled: halfCredit,
        submittedAt: serverTimestamp(),
        questions: answers.map((answer, index) => ({
          questionId: questions[index].questionId,
          question: questions[index].text,
          studentResponse: answer.answer,
          rubric: questions[index].rubric,
          feedback: 'responses havent been graded',
          score: 0,
        })),
        viewable: false,
        rawTotalScore: 0,
        maxRawScore,
        scaledScore: 0,
        scaleMin,
        scaleMax,
        percentageScore: 0,
      });

      // Delete the progress document
      await deleteDoc(progressRef);

      // Clear the save interval
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }

      setIsSubmitted(true);

      // Grade the assignment
      const gradingResults = await gradeAssignmentWithRetries(questions, answers, halfCredit);

      // Update with grading results
      const combinedResults = gradingResults.map((result, index) => ({
        ...result,
        score: ((result.score / 2) * (scaleMax - scaleMin) + scaleMin),
        question: questions[index].text,
        studentResponse: answers[index].answer,
        rubric: questions[index].rubric,
        questionId: questions[index].questionId,
        flagged: false,
      }));

      const rawTotalScore = combinedResults.reduce((sum, result) => sum + result.score, 0);
      const percentageScore = ((rawTotalScore / maxRawScore) * 100);

      await updateDoc(gradeDocRef, {
        rawTotalScore,
        maxRawScore,
        scaledScore: rawTotalScore / maxRawScore,
        scaleMin,
        scaleMax,
        percentageScore,
        questions: combinedResults,
      });

      navigate(`/studentassignments/${classId}/completed`);
    } catch (error) {
      console.error("Error submitting and grading assignment:", error);
      alert("Your submission was saved, but we encountered an issue during grading. Your instructor has been notified.");
    } finally {
      setIsSubmitting(false);
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
    if (saveAndExit && !loading && questions.length > 0 && !isSubmitted) {
      saveIntervalRef.current = setInterval(() => {
        saveProgress();
      }, 20000); 
    }
  
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [saveAndExit, loading, questions, isSubmitted]);
  

  const handleAnswerChange = (e) => {
    const updatedAnswers = answers.map(answer => 
      answer.questionId === questions[currentQuestionIndex].questionId
        ? { ...answer, answer: e.target.value }
        : answer
    );
    setAnswers(updatedAnswers);
  };


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
    <div style={{ paddingBottom: '80px', marginLeft: '-3px', marginRight: '-3px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
      <div style={{position: 'fixed', top: '0px', left: '200px', right: '0px', height: '70px', borderBottom: '1px solid lightgrey', display: 'flex', zIndex: '6', backdropFilter: 'blur(5px)', 
        background: 'rgb(255,255,255,.8)'
      }}>
    <h1 style={{marginLeft: '4%', fontSize: '25px', marginTop: '20px', color: '#999999', }}>{assignmentName}</h1>
    <h1 style={{marginRight: '4%', fontSize: '20px', marginTop: '25px', color: 'grey', marginLeft: 'auto', fontWeight: "500"}}>

    {isListView ? 
            `${questions.length} Questions` : 
            `Question ${currentQuestionIndex + 1} of ${questions.length}`
          }

    </h1>
      </div>

      <button
        onClick={() => setIsListView(prev => !prev)}
        style={{
          position: 'fixed',
          top: '90px',
          right: '4%',
          zIndex: 10,
          backgroundColor: 'white',
          border: '1px solid lightgrey',
          borderRadius: '5px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          color: 'grey',
          fontFamily: "'montserrat', sans-serif",
          fontWeight: '600'
        }}
      >
        {isListView ? <LayoutGrid size={20} /> : <List size={20} />}
        {isListView ? 'Page View' : 'List View'}
      </button>


  <TakeAssignmentNav
        saveAndExitEnabled={saveAndExit}
        onSaveAndExit={onSaveAndExit}
        timer={timeLimit}
        secondsLeft={secondsLeft}
        showTimer={showTimer}
        toggleTimer={toggleTimer}
        assignmentName={assignmentName}
        onSubmit={submitButton}
        lockdownEnabled={lockdown}
      />
      
    
     
      {(loading || isSubmitting || isLockdownSaving) && (
        <div style={loadingModalStyle}>
          <div style={loadingModalContentStyle}>
            <p style={{ fontSize: '30px', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)', marginBottom: '0px' }}>
              {isSubmitting ? 'Grading in Progress' : 
               isLockdownSaving ? 'Saving Progress' : 
               'Loading Assignment'} </p>
              <Loader/>
           
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="lds-ripple"><div></div><div></div></div>
            </div>
          </div>
        </div>
      )}
     
    {questions.length > 0 && (
        <div style={{ 
          width: 'calc(100% - 200px)', 

          marginLeft: 'calc(200px)', 
          overflow: 'hidden',
          marginRight: 'auto', zIndex: '1',
          marginTop: '150px', 
          position: 'relative' 
        }}>
          {isListView ? (
            // List View
            <div>
              {questions.map((question, index) => (
                <div key={question.questionId} style={{ marginBottom: '40px', width: '100%', 
                  borderBottom: '1px solid lightgrey', paddingBottom: '40px'
                 }}>
                  <div style={{
                    width: '60%',
                    backgroundColor: 'white',
                    color: 'black',
                    fontWeight: '600',
                    borderLeft: '5px solid #2BB514',
                    fontSize: '25px',
                    padding: '10px 30px',
                    textAlign: 'left',
                    marginLeft: '5%'
                  }}>
                    {question.text}
                  </div>
                  
                  <textarea
                    style={{
                      width: '60%',
                      minHeight: '100px',
                      borderRadius: '10px',
                      border: '1px solid lightgrey',
                      padding: '20px',
                      outline: 'none',

                    marginLeft: '5%',
                      textAlign: 'left',
                      fontSize: '20px',
                      fontFamily: "'montserrat', sans-serif",
                      marginTop: '40px'
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
            // Paginated View (existing view)
            <>
              
             <div style={{
              width: '60%',
              marginTop: '0px',
              backgroundColor: 'white',
              color: 'black',
              fontWeight: '600',
              marginLeft: '5%',
              borderLeft: '5px solid #2BB514',
              fontSize: '25px',
              padding: '10px 30px',
              textAlign: 'left',
            }}>
         {questions[currentQuestionIndex]?.text} 
         
         </div>
          
         <textarea
              style={{
                width: '60%',
                minHeight: '100px',
                borderRadius: '10px',
                border: '1px solid lightgrey',
                padding: '20px',
                outline: 'none',
                marginLeft: '5%',
                textAlign: 'left',
                fontSize: '20px',
                fontFamily: "'montserrat', sans-serif",
                marginTop: '160px'
              }}
              type="text"
              placeholder='Type your response here'
              value={answers.find(a => a.questionId === questions[currentQuestionIndex]?.questionId)?.answer || ''}
              onChange={handleAnswerChange}
            />

      
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '80px' }}>
            <button
              onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1)}
              style={{
                backgroundColor: currentQuestionIndex > 0 ? 'white' : '#f4f4f4',
                cursor: currentQuestionIndex > 0 ? 'pointer' : 'default',
                fontSize: '16px',
                width: '300px',
                fontWeight: '600',
                marginLeft: '5%',
                fontFamily: "'montserrat', sans-serif",
                borderRadius: '5px' ,
                color: currentQuestionIndex > 0 ? 'grey' : 'lightgrey',
                border: '1px solid lightgrey',
                height: '40px',
              }}
            >
              Previous Question
            </button>
            
          
            
            <button
              onClick={() => currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex(prev => prev + 1)}
              style={{
               marginLeft: '40px',

                backgroundColor: currentQuestionIndex < questions.length - 1 ? 'white' : '#f4f4f4',
                cursor: currentQuestionIndex < questions.length - 1 ? 'pointer' : 'default',
                fontSize: '16px',
                width: '300px',
                fontWeight: '600',
                fontFamily: "'montserrat', sans-serif",
                borderRadius: '5px' ,
                color: currentQuestionIndex < questions.length - 1 ? 'grey' : 'lightgrey',
                border: '1px solid lightgrey',
                height: '40px',
                marginRight: 'auto'

              }}
            >
            Next Question
            </button>
          </div>

        
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TakeTests;
