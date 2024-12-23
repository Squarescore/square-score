import React, { useState, useEffect } from 'react';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import Loader from '../../Universal/Loader';
import { SquareArrowLeft, ArrowRight } from 'lucide-react';
import TakeAssignmentNav from './TakeAssignmentNav';

function TakeMCQ() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const { assignmentId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLimit, setTimeLimit] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState('open');
  const [classId, setClassId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [timerStarted, setTimerStarted] = useState(false);
  
  const [feedback, setFeedback] = useState(false);
  const studentUid = auth.currentUser.uid;
  const navigate = useNavigate();
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
          setFeedback(assignmentData.feedback);
          setSaveAndExit(assignmentData.saveAndExit);
          setLockdown(assignmentData.lockdown || false);
        
          // Check if there's saved data for the student
          const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
          const savedDataDoc = await getDoc(progressRef);
        
          if (savedDataDoc.exists()) {
            const savedData = savedDataDoc.data();
            setQuestions(savedData.questions);
            setSelectedAnswers(savedData.selectedAnswers || {});
            setSecondsLeft(savedData.timeRemaining);
          } else {
            const allQuestions = assignmentData.questions;
            const studentQuestionCount = assignmentData.questionStudent;
            const randomQuestions = getRandomSubset(allQuestions, studentQuestionCount);
           
            setQuestions(randomQuestions);
            console.log('Questions set:', randomQuestions);
          }
        }
        else {
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
    const initializeAssignment = async () => {
      try {
        const studentRef = doc(db, 'students', studentUid);
        await updateDoc(studentRef, {
          assignmentsToTake: arrayRemove(assignmentId),
          assignmentsInProgress: arrayUnion(assignmentId)
        });
  
        // Create initial progress document
        const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
        await setDoc(progressRef, {
          assignmentId,
          studentUid,
          firstName: firstName,
          lastName: lastName,
          questions: questions,
          selectedAnswers: selectedAnswers,
          timeRemaining: timeLimit,
          savedAt: serverTimestamp(),
          status: 'in_progress'
        });
      } catch (error) {
        console.error("Error initializing assignment:", error);
      }
    };
  
    if (assignmentId && studentUid) {
      initializeAssignment();
    }
  }, [assignmentId, studentUid, questions, timeLimit]);

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

  const handleLockdownViolation = async () => {
    await saveProgress('paused');
    setAssignmentStatus('paused');
    navigate(`/studentassignments/${classId}/active`);
  };
  
  const saveProgress = async (status = 'in_progress') => {
    try {
      const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${studentUid}`);
      await setDoc(progressRef, {
        assignmentId,
        studentUid,
        questions: questions,
        selectedAnswers: selectedAnswers,
        timeRemaining: secondsLeft,
        savedAt: serverTimestamp(),
        status: status
      }, { merge: true });
  
      // Update student assignment status
      const studentRef = doc(db, 'students', studentUid);
      await updateDoc(studentRef, {
        assignmentsToTake: arrayRemove(assignmentId),
        assignmentsInProgress: arrayUnion(assignmentId)
      });
  
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
    if (!isSubmitting && window.confirm("Are you sure you want to submit your responses?")) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Grade the assignment
      const gradingResults = gradeAssignment(questions, selectedAnswers);
  
      // Calculate the total score
      const totalScore = gradingResults.reduce((sum, result) => sum + result.score, 0);
      const maxScore = questions.length;
  
     
  
      // Create the grade document
      const gradeDocRef = doc(db, `grades`, `${assignmentId}_${studentUid}`);
      await setDoc(gradeDocRef, {
        assignmentId,
        studentUid,
        assignmentName,
        firstName: firstName,
        lastName: lastName,
        classId,
        submittedAt: serverTimestamp(),
        rawTotalScore: totalScore,
        maxRawScore: maxScore,
  
        questions: gradingResults,
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
  
      navigate(`/studentassignments/${classId}/completed`);
    } catch (error) {
      console.error("Error submitting and grading assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradeAssignment = (questions, selectedAnswers) => {
    return questions.map(question => {
      const isCorrect = selectedAnswers[question.questionId] === question.correct;
      return {
        questionId: question.questionId,
        question: question.question,
        selectedAnswer: selectedAnswers[question.questionId] || null,
        correctAnswer: question.correct,
        score: isCorrect ? 1 : 0,
        choices: Object.fromEntries(
          Object.entries(question).filter(([key]) => key.match(/^[a-h]$/))
        ),
        explanation: question[`explanation_${question.correct.toLowerCase()}`] || ''
      };
    });
  };

  const handleAnswerSelection = (questionId, choice) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: choice
    }));
  };

  useEffect(() => {
    let saveInterval;
    if (saveAndExit && !loading && questions.length > 0) {
      saveInterval = setInterval(() => {
        saveProgress();
      }, 20000); // Save every 20 seconds
    }

    return () => {
      if (saveInterval) clearInterval(saveInterval);
    };
  }, [saveAndExit, loading, questions]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const buttonStyles = {
    default: {
      backgroundColor: 'transparent',
      cursor: 'default',
      border: 'none',
      width: '80px',
      height: '80px',
    },
    active: {
      backgroundColor: 'transparent',
      cursor: 'pointer',
      border: 'none',
      width: '80px',
      height: '80px',
    }
  };

  const choiceStyles = {
    a: { background: '#A3F2ED', color: '#00645E' },
    b: { background: '#AEF2A3', color: '#006428' },
    c: { background: '#F8CFFF', color: '#E01FFF' },
    d: { background: '#FFECA9', color: '#CE7C00' },
    e: { background: '#627BFF', color: '#020CFF' },
    f: { background: '#FF8E8E', color: '#CC0000' },
    g: { background: '#E3BFFF', color: '#8364FF' },
    h: { background: '#9E9E9E', color: '#000000' }
  };

  const getChoiceWidth = (choicesLength) => {
    switch (choicesLength) {
      case 2:
        return '39%'; // Slightly wider to remove gap
      case 3:
        return '39%'; // Narrower to remove gap between top two
      case 4:
        return '43%'; // Perfect as mentioned
      case 5:
        return '31%'; // Slightly wider to reduce gap at bottom
      default:
        return '100%';
    }
  };
  const onSaveAndExit = async () => {
    await saveProgress();
    navigate(`/studentassignments/${classId}/active`);
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
{loading &&
  <div style={loadingModalStyle}>
    <div style={loadingModalContentStyle}>
      <p style={{ fontSize: '30px', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)' }}>
        Loading Assignment
      </p>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="lds-ripple"><div></div><div></div></div>
      </div>
    </div>
  </div>
}

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
        <div style={{ width: '1000px', marginLeft: 'auto',   borderRadius: '20px',      boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , marginRight: 'auto', marginTop: '250px', position: 'relative' }}>
          <div style={{
            backgroundColor: '#f4f4f4',  
       width: '900px',  border: '10px solid lightgrey',
       borderRadius: ' 20px 20px 0px 0px',
            textAlign: 'center', fontWeight: 'bold', padding: '10px 40px', fontSize: '25px', position: 'relative', color: 'grey',
            marginLeft: 'auto', marginRight: 'auto', marginTop: '0px', fontFamily: "'montserrat', sans-serif", userSelect: 'none'
          }}>
            {questions[currentQuestionIndex]?.question}
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: '50px', marginBottom: '50px' }}>
            {Object.keys(questions[currentQuestionIndex] || {})
              .filter(key => key.match(/^[a-z]$/))
              .map((choice, index, array) => {
                const style = choiceStyles[choice];
                const width = getChoiceWidth(array.length);
                const isLastRow = array.length === 5 && index >= 3;
                const isSelected = selectedAnswers[questions[currentQuestionIndex].questionId] === choice;

                return (
                  <div
                    key={choice}
                    onClick={() => handleAnswerSelection(questions[currentQuestionIndex].questionId, choice)}
                    style={{
                      width: width,
                      margin: array.length === 2 ? '10px 0.5%' : array.length === 5 ? '10px 1% 30px' : '10px 1%',
     
          fontFamily: "'montserrat', sans-serif",
                      padding: '3px',
                      background: style.background,
                      color: style.color,
                      border: isSelected ? `4px solid ${style.color}` : `4px solid ${style.background}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '50px',
                      transition: 'all 0.3s ease',
                      ...(isLastRow && { marginLeft: 'auto', marginRight: 'auto' })
                    }}
                  >
                    <p style={{fontWeight: 'bold', fontSize: '20px', textAlign: 'center', margin: 0}}>
                      {questions[currentQuestionIndex][choice]}
                    </p>
                  </div>
                );
              })}
</div>
<div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'fixed', 
            bottom: '0px', 
            left: '0', 
            right: '0', 
            zIndex: 1000
          }}> <button
        style={currentQuestionIndex > 0 ? buttonStyles.active : buttonStyles.default}
        onClick={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(prev => prev - 1) : null}
      >
         {currentQuestionIndex > 0 ? <SquareArrowLeft size={60} style={{cursor: currentQuestionIndex > 0  ? 'pointer' : 'default', position: 'fixed', left: '20px', top: '400px', color: '#2BB514'}}/> : <SquareArrowLeft size={60} style={{cursor: currentQuestionIndex > 0 ? 'pointer' : 'default', position: 'fixed', left: '20px', top: '400px', color: 'grey'}}/>}
       
     
      </button>


      <h3 style={{
      width: '300px',
      textAlign: 'center',
      fontSize: '40px',
      backgroundColor: 'transparent',
      fontFamily: "'montserrat', sans-serif",
      color: 'grey',
     
      border: '2px solid transparent'
    }}>
      {currentQuestionIndex + 1} of {questions.length}
    </h3>



      <button
        style={currentQuestionIndex < questions.length - 1 ? buttonStyles.active : buttonStyles.default}
        onClick={currentQuestionIndex < questions.length - 1 ? () => setCurrentQuestionIndex(prev => prev + 1) : null}
      >
        {currentQuestionIndex < questions.length - 1 ? <ArrowRight size={60} style={{cursor: currentQuestionIndex < questions.length - 1 ? 'pointer' : 'default', position: 'fixed', right: '20px', top: '400px', color: '#2BB514'}}/> : <ArrowRight size={60} style={{cursor: currentQuestionIndex < questions.length - 1 ? 'pointer' : 'default', position: 'fixed', right: '20px', top: '400px', color: 'grey'}}/>}
         
      </button>
    </div>
   
  </div>
)}
</div>
);
}

export default TakeMCQ;