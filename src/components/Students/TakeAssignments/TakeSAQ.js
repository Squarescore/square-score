import React, { useState, useEffect } from 'react';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import Loader from '../../Universal/Loader';
import { SquareArrowLeft, SquareArrowRight, Eye, EyeOff } from 'lucide-react';
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


  const [HalfCredit, setHalfCredit] = useState(false);
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

  useEffect(() => {
    const fetchAssignmentAndProgress = async () => {
      setLoading(true);
      try {
        console.log('Fetching assignment:', assignmentId);
        const assignmentRef = doc(db, 'assignments', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);

        if (assignmentDoc.exists()) {
          const assignmentData = assignmentDoc.data();
          console.log('Assignment data:', assignmentData);
          setAssignmentName(assignmentData.assignmentName);
          setTimeLimit(assignmentData.timer * 60);
          setClassId(assignmentData.classId);
          setHalfCredit(assignmentData.halfCredit);
          setSaveAndExit(assignmentData.saveAndExit);
          setLockdown(assignmentData.lockdown || false);
          const scaleMin = assignmentData.scale?.min ? Number(assignmentData.scale.min) : 0;
          const scaleMax = assignmentData.scale?.max ? Number(assignmentData.scale.max) : 2;
  
          // Check if there's saved data for the student
          const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
          const savedDataDoc = await getDoc(progressRef);

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
  

  const handleLockdownViolation = async () => {
    await saveProgress('paused');
    setAssignmentStatus('paused');
    navigate(`/studentassignments/${classId}?tab=completed`);
  };




  useEffect(() => {
    const handleVisibilityChange = () => {
      if (lockdown && document.hidden) {
        handleLockdownViolation();
      }
    };
  
    const handleResize = () => {
      if (lockdown) {
        const currentSize = { width: window.innerWidth, height: window.innerHeight };
        if (currentSize.width !== initialWindowSize.width || currentSize.height !== initialWindowSize.height) {
          handleLockdownViolation();
        }
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [lockdown, initialWindowSize]);

  useEffect(() => {
    if (lockdown) {
      setInitialWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, [lockdown]);


  const saveProgress = async (status = 'in_progress') => {
    try {
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      await setDoc(progressRef, {
        assignmentId,
        studentUid,
        questions: questions.map(question => ({
          questionId: question.questionId,
          text: question.text,
          rubric: question.rubric,
          studentResponse: answers.find(answer => answer.questionId === question.questionId)?.answer || ''
        })),
        timeRemaining: secondsLeft,
        savedAt: serverTimestamp(),
        status: status
      }, { merge: true });
  
      // Update student assignment status
      const studentRef = doc(db, 'students', studentUid);
      if (status === 'paused') {
        await updateDoc(studentRef, {
          assignmentsToTake: arrayRemove(assignmentId),
          assignmentsInProgress: arrayRemove(assignmentId),
          assignmentsPaused: arrayUnion(assignmentId)
        });
      } else if (status === 'in_progress') {
        await updateDoc(studentRef, {
          assignmentsToTake: arrayRemove(assignmentId),
          assignmentsInProgress: arrayUnion(assignmentId)
        });
      } else if (status === 'submitted') {
        await updateDoc(studentRef, {
          assignmentsToTake: arrayRemove(assignmentId),
          assignmentsInProgress: arrayRemove(assignmentId),
          assignmentsTaken: arrayUnion(assignmentId)
        });
      }
  
      console.log('Progress saved and status updated');
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };
  
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
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Attempt to grade the assignment with retries
      const gradingResults = await gradeAssignmentWithRetries(questions, answers);
  
      // Combine grading results with question and student response
      const combinedResults = gradingResults.map((result, index) => ({
        ...result,
        score: ((result.score / 2) * (scaleMax - scaleMin) + scaleMin),
        question: questions[index].text,
        studentResponse: answers[index].answer,
        rubric: questions[index].rubric,
        questionId: questions[index].questionId, // Add questionId to the results
        flagged: false
      }));
  
      // Calculate the total score
      const rawTotalScore = combinedResults.reduce((sum, result) => sum + result.score, 0);
      const maxRawScore = questions.length;
  
      // Apply scaling
      const scaledScore = (rawTotalScore / maxRawScore);
      const percentageScore = ((rawTotalScore / (maxRawScore*(scaleMax - scaleMin)))  * 100) ;
  
      // Create the grade document
      const gradeDocRef = doc(db, `grades`, `${assignmentId}_${studentUid}`);
      await setDoc(gradeDocRef, {
        assignmentId,
        studentUid,
        assignmentName,
        firstName: firstName,
        lastName: lastName,
        classId,
        halfCreditEnabled: HalfCredit,
        submittedAt: serverTimestamp(),
        rawTotalScore,
        maxRawScore,
        scaledScore,
        scaleMin,
        scaleMax,
        percentageScore,
        questions: combinedResults.map(result => ({
          ...result,
          questionId: result.questionId // Ensure questionId is included in the final document
        })),
        viewable: false,
      });
  
      // Update student's assignment status
      const studentRef = doc(db, 'students', studentUid);
      await updateDoc(studentRef, {
        assignmentsToTake: arrayRemove(assignmentId),
        assignmentsInProgress: arrayRemove(assignmentId),
        assignmentsTaken: arrayUnion(assignmentId)
      });
  
      // Remove the progress document if it exists
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      await deleteDoc(progressRef);
  
      navigate(`/studentassignments/${classId}`);
    } catch (error) {
      console.error("Error submitting and grading assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradeAssignmentWithRetries = async (questions, answers, maxRetries = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const gradingResults = await gradeAssignment(questions, answers);
        return gradingResults; // If successful, return the results
      } catch (error) {
        console.error(`Grading attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries) {
          // If all retries failed, return fallback grading
          return questions.map(() => ({
            feedback: "Question not graded successfully due to technical issues.",
            score: 0
          }));
        }
      }
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
      body: JSON.stringify({   questions: questionsToGrade,
        halfCreditEnabled: halfCredit }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const gradingResults = await response.json();
    return gradingResults;
  };










  useEffect(() => {
    let saveInterval;
    if (saveAndExit && !loading && questions.length > 0) {
      saveInterval = setInterval(() => {
        saveProgress();
      }, 20000); 
    }

    return () => {
      if (saveInterval) clearInterval(saveInterval);
    };
  }, [saveAndExit, loading, questions]);

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
    navigate(`/studentassignments/${classId}`);
  };
  return (
    <div style={{ paddingBottom: '80px', marginLeft: '-3px', marginRight: '-3px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
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
      
    
     
      {loading || isSubmitting ? (
  <div style={loadingModalStyle}>
    <div style={loadingModalContentStyle}>
      <p style={{ fontSize: '30px', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)' }}>
        {isSubmitting ? 'Grading in Progress' : 'Loading Assignment'}
      </p>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="lds-ripple"><div></div><div></div></div>
      </div>
    </div>
  </div>
) : null}
     
     {questions.length > 0 && (
        <div style={{ width: '1000px', marginLeft: 'auto', marginRight: 'auto', marginTop: '150px', position: 'relative' }}>
          <div style={{
            backgroundColor: 'white',    left: '50%',
            top: '45%',
            
            position: 'fixed',
            transform: 'translate(-50%, -50%)',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , width: '700px', color: 'black', border: '10px solid white', 
            textAlign: 'left', fontWeight: 'bold', padding: '40px', borderRadius: ' 20px', fontSize: '30px', 
           fontFamily: "'montserrat', sans-serif", userSelect: 'none'
          }}>
             <div style={{
              width: '720px',
              marginLeft :'-50px',
              marginTop: '-50px',
              backgroundColor: '#C1CBFF',
              borderRadius: '20px 20px 0px 0px',
              color: '#020CFF',
              border: '10px solid #020CFF',
              fontSize: '30px',
              padding: '10px 30px',
              textAlign: 'left',
            }}>
         {questions[currentQuestionIndex]?.text} 
         
         </div>
          
         <textarea
              style={{
                width: '710px',
                minHeight: '100px',
                borderRadius: '15px',
                border: '0px solid #f4f4f4',
                marginLeft: '-10px',
                outline: 'none',
                textAlign: 'left',
                fontSize: '20px',
                fontFamily: "'montserrat', sans-serif",
                marginTop: '40px'
              }}
              type="text"
              placeholder='Type your response here'
              value={answers.find(a => a.questionId === questions[currentQuestionIndex]?.questionId)?.answer || ''}
              onChange={handleAnswerChange}
            />

          
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '50px' }}>
            <button
              onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1)}
              style={{
                backgroundColor: 'transparent',
                cursor: currentQuestionIndex > 0 ? 'pointer' : 'default',
                border: 'none',
                width: '80px',
                height: '80px',
                position: 'fixed',
                left: '50px',
                top: '50%',
                transform: 'translate(0%, -50%)'
              }}
            >
              <div><SquareArrowLeft size={60} color={currentQuestionIndex > 0 ? "#009919" : "#ababab"} /></div>
            </button>
            
          
            
            <button
              onClick={() => currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex(prev => prev + 1)}
              style={{
                backgroundColor: 'transparent',
                cursor: currentQuestionIndex < questions.length - 1 ? 'pointer' : 'default',
                border: 'none',
                width: '80px',
                height: '80px',
                position: 'fixed',
                right: '50px',
                top: '50%',
                transform: 'translate(0%, -50%)'
              }}
            >
              <div>       <SquareArrowRight size={60} color={currentQuestionIndex < questions.length - 1 ? "#009919" : "#ababab"} />
              </div>
            </button>
          </div>

          <h3 style={{
            width: '300px',
            textAlign: 'center',
            fontSize: '40px',
            backgroundColor: 'transparent',
            fontFamily: "'montserrat', sans-serif",
            color: 'grey',
            position: 'fixed',
            bottom: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            border: '2px solid transparent'
          }}>
            {currentQuestionIndex + 1} of {questions.length}
          </h3>
        </div>
      )}
    </div>
  );
}

export default TakeTests;
