import React, { useState, useEffect } from 'react';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../Universal/firebase';
import Loader from '../../Universal/Loader';

function TakeASAQ() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [studentResponse, setStudentResponse] = useState('');
  const [timeLimit, setTimeLimit] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
const [showCorrectScreen, setShowCorrectScreen] = useState(false);
const [showIncorrectScreen, setShowIncorrectScreen] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState('open');
  const [classId, setClassId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [timerStarted, setTimerStarted] = useState(false);
  const [score, setScore] = useState(0);
  const studentUid = auth.currentUser.uid;
  const navigate = useNavigate();
  const [scaleMin, setScaleMin] = useState(0);
  const [scaleMax, setScaleMax] = useState(2);
  const [saveAndExit, setSaveAndExit] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [streak, setStreak] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState([]);
  const [correctQuestions, setCorrectQuestions] = useState([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentGradingMessage, setCurrentGradingMessage] = useState(0);
  const gradingMessages = [
    "Grading in Progress",
    "Analyzing Response",
    "Contacting Server",
    "Evaluating Answer",
    "Processing Feedback",
    "Comparing to Expected Response",
    "Calculating Score",
    "Assessing Accuracy",
    "Reviewing Content",
    "Checking for Completeness",
    "Verifying Key Points",
    "Examining Reasoning",
    "Scrutinizing Details",
    "Weighing Arguments",
    "Considering Perspective",
    "Judging Coherence",
    "Evaluating Clarity",
    "Assessing Relevance",
    "Determining Validity",
    "Finalizing Grade"
  ];

  const getRandomInterval = () => {
    return Math.random() * 800 + 200; // Random number between 200ms and 1000ms
  };

  useEffect(() => {
    let timeoutId;
    if (isSubmitting) {
      const cycleMessage = () => {
        setCurrentGradingMessage(prev => {
          let next;
          do {
            next = Math.floor(Math.random() * gradingMessages.length);
          } while (next === prev);
          return next;
        });
        timeoutId = setTimeout(cycleMessage, getRandomInterval());
      };
      cycleMessage();
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSubmitting]);

  const fetchAssignment = async () => {
    setLoading(true);
    try {
      const assignmentRef = doc(db, 'assignments(Asaq)', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
  
      if (assignmentDoc.exists()) {
        const assignmentData = assignmentDoc.data();
        setAssignment(assignmentData);
        setAssignmentName(assignmentData.assignmentName);
        setTimeLimit(assignmentData.timer * 60);
        setClassId(assignmentData.classId);
        setSaveAndExit(assignmentData.saveAndExit);
        setLockdown(assignmentData.lockdown || false);
        setScaleMin(assignmentData.scale?.min ? Number(assignmentData.scale.min) : 0);
        setScaleMax(assignmentData.scale?.max ? Number(assignmentData.scale.max) : 2);
  
        // Set questions
        const questionArray = Object.entries(assignmentData.questions || {}).map(([id, data]) => ({
          id,
          ...data
        }));
        setQuestions(questionArray);
  
        await fetchSavedProgress(assignmentData);
  
        if (questionArray.length > 0) {
          setCurrentQuestion(questionArray[0]);
          setCurrentQuestionIndex(0);
        }
      } else {
        console.error("Assignment not found:", assignmentId);
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchSavedProgress = async (assignmentData) => {
    const progressRef = doc(db, 'assignments(progress:Asaq)', `${assignmentId}_${studentUid}`);
    const progressDoc = await getDoc(progressRef);
    if (progressDoc.exists()) {
      const data = progressDoc.data();
      setScore(data.score);
      setStreak(data.streak);
      setCompletedQuestions(data.completedQuestions || []);
      setCorrectQuestions(data.correctQuestions || []);
      setIncorrectQuestions(data.incorrectQuestions || []);
      setSecondsLeft(data.timeRemaining);
      setTimerStarted(true);
    }
  };

  useEffect(() => {
    if (timeLimit !== null) {
      setSecondsLeft(timeLimit);
      setTimerStarted(true);
    }
  }, [timeLimit]);

  useEffect(() => {
    let timerId;
    if (secondsLeft > 0 && timerStarted) {
      timerId = setInterval(() => {
        setSecondsLeft(prevSeconds => prevSeconds - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerStarted) {
 
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [secondsLeft, timerStarted]);

  const handleStudentResponseChange = (e) => {
    const newResponse = e.target.value;
    setStudentResponse(newResponse);
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      const currentQuestionId = questions[currentQuestionIndex]?.id;
      const existingAnswerIndex = newAnswers.findIndex(a => a.questionId === currentQuestionId);
      
      if (existingAnswerIndex !== -1) {
        newAnswers[existingAnswerIndex] = { ...newAnswers[existingAnswerIndex], answer: newResponse };
      } else {
        newAnswers.push({ questionId: currentQuestionId, answer: newResponse });
      }
      
      return newAnswers;
    });
  };

  const handleCheck = async () => {
    setIsSubmitting(true);
    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      const response = await fetch('https://us-central1-square-score-ai.cloudfunctions.net/GradeASAQ', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: {
            questionId: currentQuestion.id,
            question: currentQuestion.question,
            rubric: currentQuestion.rubric,
            studentResponse: studentResponse
          }
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      const wasCorrect = result.score >= 1;  // Assuming score is out of 2
  
      // Process the result
      if (wasCorrect) {
        setFeedbackMessage("Correct!");
        setCorrectQuestions(prev => [...prev, currentQuestion.id]);
        setShowCorrectScreen(true);
      } else {
        setFeedbackMessage("Incorrect.");
        setIncorrectQuestions(prev => [...prev, currentQuestion.id]);
        setShowIncorrectScreen(true);
      }
  
      setFeedback(result.feedback);
      setCompletedQuestions(prev => [...prev, currentQuestion.id]);
      await saveProgress();
  
      // Update the score with the new scoring system
      updateScore(wasCorrect);
  
    } catch (error) {
      console.error("Error checking answer:", error);
      setFeedbackMessage("An error occurred while grading. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const updateScore = (isCorrect) => {
    setScore(prevScore => {
      let newScore = Number(prevScore) || 0; // Ensure prevScore is a number
      let points = 0;
      
      console.log('Current question difficulty:', currentQuestion.difficulty);
      console.log('Is answer correct?', isCorrect);
      
      if (isCorrect) {
        if (currentQuestion.difficulty === 'Easy') points = 1.5;
        if (currentQuestion.difficulty === 'Medium') points = 2.5;
        if (currentQuestion.difficulty === 'Hard') points = 4;
        
        points += 0.5 * streak;
        setStreak(prevStreak => prevStreak + 1);
      } else {
        if (currentQuestion.difficulty === 'Easy') points = -4;
        if (currentQuestion.difficulty === 'Medium') points = -2;
        if (currentQuestion.difficulty === 'Hard') points = -1;
        
        if (streak > 6) {
          setStreak(prevStreak => Math.floor(prevStreak / 2));
        } else {
          setStreak(0);
        }
      }
      
      newScore += points;
      console.log('Points awarded:', points);
      console.log('New score:', newScore);
      return newScore;
    });
  };
  const moveToNextQuestion = (wasCorrect) => {
    let nextDifficulty;
    const currentDifficulty = currentQuestion.difficulty;
  
    if (wasCorrect) {
      if (currentDifficulty === 'Easy') nextDifficulty = 'Medium';
      else if (currentDifficulty === 'Medium') nextDifficulty = 'Hard';
      else nextDifficulty = 'Hard'; // If it's already Hard, stay on Hard
    } else {
      if (currentDifficulty === 'Hard') nextDifficulty = 'Medium';
      else if (currentDifficulty === 'Medium') nextDifficulty = 'Easy';
      else nextDifficulty = 'Easy'; // If it's already Easy, stay on Easy
    }
  
    // Find the next question with the appropriate difficulty
    const nextQuestionIndex = questions.findIndex((q, index) => 
      index > currentQuestionIndex && q.difficulty === nextDifficulty
    );
  
    if (nextQuestionIndex !== -1) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setCurrentQuestion(questions[nextQuestionIndex]);
    } else {
      // If no question with the exact difficulty is found, find the closest difficulty
      const fallbackIndex = questions.findIndex((q, index) => 
        index > currentQuestionIndex
      );
      if (fallbackIndex !== -1) {
        setCurrentQuestionIndex(fallbackIndex);
        setCurrentQuestion(questions[fallbackIndex]);
      } else {
        // If we've reached the end of the questions, you might want to handle that case
        // For example, you could set a state to indicate the quiz is finished
        setAssignmentStatus('completed');
      }
    }
  
    setStudentResponse('');
    setShowFeedback(false);
  };

  const saveProgress = async () => {
    const progressRef = doc(db, 'assignments(progress:Asaq)', `${assignmentId}_${studentUid}`);
    const progressData = {
      score: score || 0,  // Use 0 if score is undefined
      streak: streak || 0,  // Use 0 if streak is undefined
      completedQuestions: completedQuestions || [],
      correctQuestions: correctQuestions || [],
      incorrectQuestions: incorrectQuestions || [],
      timeRemaining: secondsLeft || 0,
      savedAt: serverTimestamp(),
      status: assignmentStatus || 'open'
    };
  
    // Remove any fields with undefined values
    Object.keys(progressData).forEach(key => 
      progressData[key] === undefined && delete progressData[key]
    );
  
    try {
      await setDoc(progressRef, progressData, { merge: true });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleSubmit = async () => {
    
    try {
      const gradeDocRef = doc(db, 'grades(Asaq)', `${assignmentId}_${studentUid}`);
      await setDoc(gradeDocRef, {
        assignmentId,
        studentUid,
        assignmentName,
        firstName,
        lastName,
        classId,
        submittedAt: serverTimestamp(),
        score,
        scaleMin,
        scaleMax,
        completedQuestions,
        correctQuestions,
        incorrectQuestions,
        viewable: false,
      });

      const studentRef = doc(db, 'students', studentUid);
      await updateDoc(studentRef, {
        assignmentsToTake: arrayRemove(assignmentId),
        assignmentsInProgress: arrayRemove(assignmentId),
        assignmentsTaken: arrayUnion(assignmentId)
      });

      const progressRef = doc(db, 'assignments(progress:Asaq)', `${assignmentId}_${studentUid}`);
      await deleteDoc(progressRef);

      navigate(`/studentassignments/${classId}`);
    } catch (error) {
      console.error("Error submitting assignment:", error);
    } finally {
      
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const submitButton = () => {
    if (!isSubmitting && window.confirm("Are you sure you want to submit your response?")) {
      handleSubmit();
    }
  };


  if (loading) return <Loader />;

  const CorrectScreen = ({ feedback, onContinue }) => (
    <div style={{
      position: 'fixed',
      top: '100px',
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255,255,255,.8)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{border: '0px solid #00B512', padding: '30px',  marginTop: '-200px', borderRadius: '100px', height: '100px', width: '100px'}}>
      <img src="/greencheck.png" alt="Correct" style={{ width: 100, marginBottom: 0, marginTop:'15px'  }} />
      </div>
      
      <h2 style={{fontSize: '60px', fontFamily: "'montserrat',sans-serif", marginTop: '10px', marginBottom: '-20px'}}>Correct!</h2>
     <div style={{background: 'white'}}>
      <p style={{width:' 600px', fontSize: '30px', background: 'white'}}>{feedback}</p>
      <button onClick={onContinue} style={{
          backgroundColor: '#FFC700',
          
          padding: '10px',
          width: '240px',
          fontSize: '25px',
          
          right: '60px',
          top: '20px',
          borderColor: 'transparent',
          cursor: 'pointer',
          borderRadius: '15px',
          fontFamily: "'montserrat', sans-serif",
          color: 'white',
          fontWeight: 'bold',
          zIndex: '100',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.01)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        Continue
      </button></div>
    </div>
  );
  
  const IncorrectScreen = ({ feedback, onContinue }) => (
    <div style={{
      position: 'fixed',
      top: '100px',
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255,255,255,.8)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{border: '0px solid #00B512', padding: '30px',  marginTop: '-200px', borderRadius: '20px', height: '100px', width: '100px'}}>
      <img src="/redx.png" alt="Correct" style={{ width: 70, marginBottom: 0, marginTop:'15px'  }} />
      </div>
      
      <h2 style={{fontSize: '60px', fontFamily: "'montserrat',sans-serif", marginTop: '10px', marginBottom: '-20px'}}>Almost There</h2>
     <div style={{background: 'white'}}>
      <p style={{width:' 600px', fontSize: '30px', background: 'white'}}>{feedback}</p>
      <button onClick={onContinue} style={{
          backgroundColor: '#FFC700',
          
          padding: '10px',
          width: '240px',
          fontSize: '25px',
          
          right: '60px',
          top: '20px',
          borderColor: 'transparent',
          cursor: 'pointer',
          borderRadius: '15px',
          fontFamily: "'montserrat', sans-serif",
          color: 'white',
          fontWeight: 'bold',
          zIndex: '100',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.01)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        Continue
      </button></div>
    </div>
  );

  const handleSaveAndExit = async () => {
    // Implement save and exit functionality
    // This should save the current progress to Firestore
    // Then navigate back to the student assignments page
    navigate(`/studentassignments/${classId}`);
  };
  const toggleTimer = () => {
    setShowTimer((prevShowTimer) => !prevShowTimer);
  };
  return (
    <div style={{ marginTop: '100px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", textAlign: 'center' }}>
  
  {showCorrectScreen && (
  <CorrectScreen 
    feedback={feedback} 
    onContinue={() => {
      setShowCorrectScreen(false);
      moveToNextQuestion(true);
    }} 
  />
)}

{showIncorrectScreen && (
  <IncorrectScreen 
    feedback={feedback} 
    onContinue={() => {
      setShowIncorrectScreen(false);
      moveToNextQuestion(false);
    }} 
  />
)}
    {timeLimit > 0 && (
      <div
        style={{
          color: showTimer ? 'grey' : 'transparent',
          left: '100px',
          top: '10px',
          fontSize: '44px',
          fontWeight: 'bold',
          width: '120px',
          zIndex: '100',
          fontFamily: "'montserrat', sans-serif",
          position: 'fixed',
          border: secondsLeft <= 60 ? '4px solid red' : 'none',
          padding: '5px',
          borderRadius: '5px',
        }}
      >
        {formatTime(secondsLeft)}
        <button
          onClick={toggleTimer}
          style={{
            position: 'absolute',
            top: '0px',
            left: '-70px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'black',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {showTimer ? <img style={{ width: '60px', opacity: '90%' }} src="/hidecon.png" /> : <img style={{ width: '60px', opacity: '90%' }} src="/eyecon.png" />}
        </button>
      </div>
    )}

    <header
      style={{
        backgroundColor: 'white',
        position: 'fixed',
        borderRadius: '10px',
        color: 'white',
        zIndex: '99',
        height: '90px',
        display: 'flex',
        background: 'rgb(255,255,255,.9)',
        backdropFilter: 'blur(4px)',
        borderBottom: '5px solid lightgrey',
        marginTop: '-150px',
        marginBottom: '40px',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <img style={{ width: '390px', marginLeft: '20px', marginTop: '-20px' }} src="/SquareScore.png" alt="logo" />
    </header>

    {saveAndExit && (
      <button
        style={{
          backgroundColor: 'transparent',
          color: 'grey',
          padding: '10px',
          width: '200px',
          background: 'lightgrey',
          textAlign: 'center',
          fontSize: '20px',
          position: 'fixed',
          left: '0px',
          top: '90px',
          borderColor: 'transparent',
          cursor: 'pointer',
          borderBottomRightRadius: '15px',
          fontFamily: "'montserrat', sans-serif",
          fontWeight: 'bold',
          zIndex: '100',
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={(e) => (e.target.style.transform = 'scale(1.01)')}
        onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
        onClick={handleSaveAndExit}
      >
        Save & Exit
      </button>
    )}

    <div
      style={{
        position: 'fixed',
        right: '40px',
        width: '100px',
        height: '100px',
        border: '10px solid #020CFF',
        background: '#627BFF',
        borderRadius: '25px',
        top: '200px',
      }}
    >
      <h1
        style={{
          width: '80px',
          fontSize: '35px',
          background: 'white',
          height: '80px',
          borderRadius: '10px',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '10px',
          textAlign: 'center',
          lineHeight: '80px',
        }}
      >
        {score}
      </h1>
    </div>
    <div
      style={{
        position: 'fixed',
        left: '40px',
        width: '100px',
        height: '100px',
        border: '10px solid orange',
        background: 'white',
        borderRadius: '25px',
        top: '200px',
      }}
    >
      <h1
        style={{
          width: '80px',
          marginLeft: '10px',
          fontSize: '20px',
          marginTop: '-20px',
          backgroundColor: 'white',
          marginBottom: '-5px',
        }}
      >
        Streak
      </h1>
      <h1
        style={{
          width: '80px',
          fontSize: '55px',
          background: 'white',
          height: '80px',
          borderRadius: '10px',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: '10px',
          textAlign: 'center',
          lineHeight: '80px',
        }}
      >
        {streak}
      </h1>
    </div> <button
        onClick={handleSubmit}
        style={{
          backgroundColor: '#0E19FF',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
          padding: '10px',
          width: '140px',
          fontSize: '25px',
          position: 'fixed',
          right: '60px',
          top: '20px',
          borderColor: 'transparent',
          cursor: 'pointer',
          borderRadius: '15px',
          fontFamily: "'montserrat', sans-serif",
          color: 'white',
          fontWeight: 'bold',
          zIndex: '100',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.01)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        Submit
      </button>

      {loading &&
        <div style={{}}>
         
            <p style={{ fontSize: '30px', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)' }}>
              Loading Assignment
            </p>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="lds-ripple"><div></div><div></div></div>
            </div>
    
        </div>
      }

{isSubmitting && (
  <div style={{ position: 'fixed',
    top: '100px',
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,.8)',
    backdropFilter: 'blur(15px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20}}>
    
      <p style={{ fontSize: '30px', fontFamily: "'montserrat', sans-serif", fontWeight: 'bold', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)' }}>
      {gradingMessages[currentGradingMessage]}
      </p>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="lds-ripple"><div></div><div></div></div>
      </div>
 
  </div>
)}

{questions.length > 0 && (
  <div style={{ width: '1000px', marginLeft: 'auto', marginRight: 'auto', marginTop: '150px', position: 'relative' }}>
    <div style={{
      backgroundColor: 'white', width: '700px', color: 'black', border: '10px solid #EAB3FD',
      textAlign: 'center', fontWeight: 'bold', padding: '40px', borderRadius: '30px', fontSize: '30px', position: 'relative',
      marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', fontFamily: "'montserrat', sans-serif", userSelect: 'none'
    }}>
      {questions[currentQuestionIndex]?.question}
      <h3 style={{
        width: 'auto',
        top: '0px',
        marginTop: '-43px',
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'absolute',
        backgroundColor: '#FCD3FF',
        borderRadius: '20px',
        color: '#E01FFF',
        border: '10px solid white',
        fontSize: '34px',
        padding: '10px 20px',
        whiteSpace: 'nowrap'
      }}>
        {assignmentName}
            </h3>
          </div>
          <textarea
            style={{
              width: '700px',
              height: '100px',
              borderRadius: '15px',
              border: '5px solid lightgrey',
              marginLeft: 'auto',
              outline: 'none',
              marginTop: '100px',
              marginRight: 'auto',
              textAlign: 'left',
              fontSize: '20px',
              fontFamily: "'montserrat', sans-serif",
              padding: '30px'
            }}
            type="text"
            placeholder='Type your response here'
            value={studentResponse || answers.find(a => a.questionId === questions[currentQuestionIndex]?.id)?.answer || ''}
            onChange={handleStudentResponseChange}
          />
          <button
            onClick={handleCheck}
            style={{
              width: '200px',
              border: 'none',
              height: '50px',
              color: 'white',
              backgroundColor: '#020CFF',
              borderRadius: '10px',
              fontSize: '30px',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: 'bold',
              cursor: 'pointer',
              margin: '30px auto',
              display: 'block'
            }}
          >
            Check
          </button>
       
        </div>
      )}
    </div>
  );
}

export default TakeASAQ;
