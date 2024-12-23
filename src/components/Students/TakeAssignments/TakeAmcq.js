import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayRemove, arrayUnion, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../Universal/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useRef } from 'react';
import { ChevronDown, Eye, EyeOff, LayoutGrid, Menu, SquareCheck, SquareX, Youtube, YoutubeIcon, Zap } from 'lucide-react';
import TakeAssignmentNav from './TakeAssignmentNav';
const TakeAmcq = () => {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [SquareScore, setSquareScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLimit, setTimeLimit] = useState(null);
  const [showTimer, setShowTimer] = useState(true);
  const [assignmentName, setAssignmentName] = useState('');
  const [saveAndExit, setSaveAndExit] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [completedQuestions, setCompletedQuestions] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [displayFormat, setDisplayFormat] = useState('grid'); // 'grid' or 'list'
  const [retypedAnswer, setRetypedAnswer] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [streak, setStreak] = useState(0);
  const [correctQuestions, setCorrectQuestions] = useState([]);
  const [cycledThroughAll, setCycledThroughAll] = useState(false);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [maxScore, setMaxScore] = useState(100);
  const [classId, setClassId] = useState(null);
  const navigate = useNavigate();
  const choiceRefs = useRef({});
  const [questionOrder, setQuestionOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [showMyResponse, setShowMyResponse] = useState(false);

  const [choiceHeights, setChoiceHeights] = useState({});

  useEffect(() => {
    Object.keys(choiceRefs.current).forEach(choice => {
      if (choiceRefs.current[choice]) {
        const height = choiceRefs.current[choice].scrollHeight;
        setChoiceHeights(prev => ({ ...prev, [choice]: height }));
      }
    });
  }, [currentQuestion, displayFormat]);

  
  useEffect(() => {
    Object.keys(choiceRefs.current).forEach(choice => {
      if (choiceRefs.current[choice]) {
        const height = choiceRefs.current[choice].scrollHeight;
        choiceRefs.current[choice].parentElement.style.height = `${height + 20}px`;
      }
    });
  }, [currentQuestion, displayFormat]);


  // Cheating detection
  useEffect(() => {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
    }
  };

  // Visuals
  const toggleDisplayFormat = () => {
    setDisplayFormat((prevFormat) => (prevFormat === 'grid' ? 'list' : 'grid'));
  };

  // Fetch user data
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
    const fetchAssignment = async () => {
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      if (assignmentDoc.exists()) {
        const data = assignmentDoc.data();
        setSaveAndExit(data.saveAndExit);
        setClassId(data.classId);
        setAssignment(data);
        setTimeLimit(data.timer * 60);
        
        setLockdown(data.lockdown || false); 
        setAssignmentName(data.assignmentName);
        setShowTimer(data.timer > 0);
        await fetchSavedProgress(data);

        if (!currentQuestion) {
          const mediumQuestions = data.questions.filter((q) => q.difficulty === 'Medium');
          setCurrentQuestion(mediumQuestions[Math.floor(Math.random() * mediumQuestions.length)]);
        }
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  const fetchSavedProgress = async (assignmentData) => {
    if (!assignmentData) return;

    const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${auth.currentUser.uid}`);
    const progressDoc = await getDoc(progressRef);
    if (progressDoc.exists()) {
      const data = progressDoc.data();
      setSquareScore(data.SquareScore);
      setStreak(data.streak);
      setCorrectQuestions(data.correctQuestions || []);
      setCompletedQuestions(data.completedQuestions || []);
      setSecondsLeft(data.timeRemaining);
      setTimerStarted(true);

      const availableQuestions = assignmentData.questions.filter(
        (q) => !data.completedQuestions.includes(q.question) && !data.correctQuestions.includes(q.question)
      );
      if (availableQuestions.length > 0) {
        setCurrentQuestion(availableQuestions[Math.floor(Math.random() * availableQuestions.length)]);
      } else {
        endTest();
      }
    }
  };

  const handleSaveAndExit = async () => {
    const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${auth.currentUser.uid}`);
    await setDoc(progressRef, {
      studentUid: auth.currentUser.uid,
      assignmentId: assignmentId,
      timeRemaining: secondsLeft,
      status: 'in progress',
      SquareScore: SquareScore,
      streak: streak,
      correctQuestions: correctQuestions,
      completedQuestions: completedQuestions,
      incorrectQuestions: incorrectQuestions,
      cycledThroughAll: cycledThroughAll,
      savedAt: new Date(),
    });

    navigate(`/studentassignments/${classId}/active`);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setTypedAnswer('');
    setTimeout(() => {
      const textarea = document.getElementById(`textarea-${answer}`);
      if (textarea) {
        textarea.focus();
      }
    }, 0);
  };

  // Timer
  useEffect(() => {
    if (timeLimit !== null && timeLimit > 0) {
      setSecondsLeft(timeLimit);
      setTimerStarted(true);
      setShowTimer(true);
    } else {
      setShowTimer(false);
      setTimerStarted(false);
    }
  }, [timeLimit]);

  const toggleTimer = () => {
    setShowTimer((prevShowTimer) => !prevShowTimer);
  };

  useEffect(() => {
    let timerId;
  
    if (secondsLeft > 0 && timerStarted) {
      timerId = setInterval(() => {
        setSecondsLeft((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerStarted) {
      endTest();
    }
  
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [secondsLeft, timerStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Move to next question
  const handleCheck = () => {
    const selectedText = currentQuestion[selectedAnswer];
    if (selectedText.toLowerCase() === typedAnswer.toLowerCase()) {
      const isCorrect = selectedAnswer === currentQuestion.correct;
      updateScore(isCorrect);
      if (isCorrect) {
        setStreak((prevStreak) => prevStreak + 1);
        setCorrectQuestions((prev) => [...prev, {
          question: currentQuestion.question,
          correctChoice: selectedAnswer,
          correctExplanation: currentQuestion[`explanation_${selectedAnswer}`],
          choiceContent: currentQuestion[selectedAnswer],
          order: questionOrder
        }]);
      } else {
        setIncorrectQuestions((prev) => [
          ...prev,
          {
            question: currentQuestion.question,
            chosenAnswer: selectedAnswer,
            correctAnswer: currentQuestion.correct,
            correctExplanation: currentQuestion[`explanation_${currentQuestion.correct}`],
            incorrectExplanation: currentQuestion[`explanation_${selectedAnswer}`],
            choiceContent: currentQuestion[selectedAnswer],
            correctContent: currentQuestion[currentQuestion.correct],
            order: questionOrder
          }
        ]);
      }
      setCompletedQuestions((prev) => [...prev, currentQuestion.question]);
      setQuestionOrder((prevOrder) => prevOrder + 1);
      if (assignment.feedback === 'instant') {
        setShowFeedback(true);
        if (isCorrect) {
          setShowConfetti(true);
          setTimeout(() => {
            setShowConfetti(false);
            setShowFeedback(false);
            moveToNextQuestion(true);
          }, 2000);
        }
      } else {
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          moveToNextQuestion(isCorrect);
        }, 1500);
      }
    } else {
      alert("Your typed answer doesn't match the selected answer. Please try again.");
    }
  };
  const moveToNextQuestion = (wasCorrect) => {
    let nextDifficulty;
    if (wasCorrect) {
      if (currentQuestion.difficulty === 'Easy') nextDifficulty = 'Medium';
      else if (currentQuestion.difficulty === 'Medium') nextDifficulty = 'Hard';
      else nextDifficulty = 'Hard';
    } else {
      if (currentQuestion.difficulty === 'Hard') nextDifficulty = 'Medium';
      else if (currentQuestion.difficulty === 'Medium') nextDifficulty = 'Easy';
      else nextDifficulty = 'Easy';
    }

    let availableQuestions = assignment.questions.filter(
      (q) =>
        q.difficulty === nextDifficulty &&
        !completedQuestions.includes(q.question) &&
        !correctQuestions.find(cq => cq.question === q.question)
    );

    if (availableQuestions.length === 0) {
      availableQuestions = assignment.questions.filter(
        (q) => q.difficulty === nextDifficulty && incorrectQuestions.find(iq => iq.question === q.question)
      );
    }

    if (availableQuestions.length > 0) {
      setCurrentQuestion(availableQuestions[Math.floor(Math.random() * availableQuestions.length)]);
    } else {
      if (!cycledThroughAll) {
        setCycledThroughAll(true);
        setMaxScore(70);
      }
      endTest();
    }

    setSelectedAnswer('');
    setShowMyResponse(false);
    setTypedAnswer('');
    setShowFeedback(false);
    setShowExplanation(false);
  };

 
    const updateScore = (isCorrect) => {
      let points = 0;
      if (isCorrect) {
        if (currentQuestion.difficulty === 'Easy') points = 1.5;
        if (currentQuestion.difficulty === 'Medium') points = 2.5;
        if (currentQuestion.difficulty === 'Hard') points = 4;
    
        points += 0.5 * streak;
      } else {
        if (currentQuestion.difficulty === 'Easy') points = -4;
        if (currentQuestion.difficulty === 'Medium') points = -2;
        if (currentQuestion.difficulty === 'Hard') points = -1;
    
        if (streak > 6) {
          setStreak(Math.floor(streak / 2));
        } else {
          setStreak(0);
        }
      }
    
      points = Math.round(points);
      let newScore = SquareScore + points;
    
      // Check if newScore is NaN and set it to 0 if it is
      if (isNaN(newScore)) {
        newScore = 0;
      } else if (newScore >= maxScore) {
        newScore = maxScore;
      }
    
      setSquareScore(newScore);
      
      // Use a setTimeout to ensure the score update is reflected before ending the test
      if (newScore >= maxScore) {
        setTimeout(() => {
          endTest();
        }, 100); // Short delay to allow for state update
      }
    };

  // Grades
  const endTest = async () => {
    const studentRef = doc(db, 'students', auth.currentUser.uid);
    const gradeRef = doc(db, 'grades', `${assignmentId}_${auth.currentUser.uid}`);
  
    await setDoc(gradeRef, {
      studentUid: auth.currentUser.uid,
      firstName: firstName,
      lastName: lastName,
      classId: assignment.classId,
      assignmentId: assignmentId,
      assignmentName: assignmentName,
      SquareScore: SquareScore,
      completedQuestions: completedQuestions,
      correctQuestions: correctQuestions,
      incorrectQuestions: incorrectQuestions,
      submittedAt: new Date(),
      viewable: false,
      cycledThroughAll: cycledThroughAll,
    });
  
    await updateDoc(studentRef, {
     
      assignmentsToTake: arrayRemove(assignmentId),
      assignmentsInProgress: arrayRemove(assignmentId),
      assignmentsTaken: arrayUnion(assignmentId),
    });
    
    // Remove the progress document if it exists
    const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${auth.currentUser.uid}`);
    await deleteDoc(progressRef);
  
    navigate(`/studentassignments/${classId}/active`);
  };
  
  // Retype
  const handleRetypeAnswer = (e) => {
    const input = e.target.value;
    const correctAnswer = currentQuestion[currentQuestion.correct];

    let convertedInput = input
      .split('')
      .map((char, index) => {
        if (index < correctAnswer.length) {
          return correctAnswer[index] === correctAnswer[index].toUpperCase()
            ? char.toUpperCase()
            : char.toLowerCase();
        }
        return char;
      })
      .join('');

    if (correctAnswer.toLowerCase().startsWith(convertedInput.toLowerCase())) {
      setRetypedAnswer(convertedInput);
    }
  };

  const handleEndTest = () => {
    if (window.confirm('Are you sure you want to submit this assignment?')) {
      endTest();
    }
  };
  const isRetypedAnswerCorrect = () => {
    const correctAnswer = currentQuestion[currentQuestion.correct].toLowerCase();
    const userAnswer = retypedAnswer.toLowerCase();
    return correctAnswer === userAnswer || (Math.abs(correctAnswer.length - userAnswer.length) <= 1 && 
           (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer)));
  };

  const handleTyping = (e) => {
    const selectedText = currentQuestion[selectedAnswer];
    const input = e.target.value;

    let convertedInput = input
      .split('')
      .map((char, index) => {
        if (index < selectedText.length) {
          return selectedText[index] === selectedText[index].toUpperCase()
            ? char.toUpperCase()
            : char.toLowerCase();
        }
        return char;
      })
      .join('');

    if (selectedText.toLowerCase().startsWith(convertedInput.toLowerCase())) {
      setTypedAnswer(convertedInput);
    }
  };
  const isTypedAnswerCorrect = () => {
    if (!selectedAnswer || !typedAnswer) return false;
    const selectedText = currentQuestion[selectedAnswer];
    return selectedText.toLowerCase() === typedAnswer.toLowerCase();
  };
  if (!assignment || !currentQuestion) return <div>Loading...</div>;

  const renderChoice = (choice) => {
    const style = getChoiceStyle(choice);
    const content = currentQuestion[choice];
    const needsSecondLine = choiceHeights[choice] > 30;
    return (
      <div
      key={choice}
      onClick={() => handleAnswerSelect(choice)}
      style={{
        width:  '100%',
        margin:  '5px 0px',
        padding: '0px',
        background:  selectedAnswer === choice ? style.background : 'white',
        color: selectedAnswer === choice ? style.color : 'grey',
        border: selectedAnswer === choice ? `1px solid ${style.color}` : '1px solid lightgrey',
        borderRadius: '5px',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: 'auto',
        minHeight: 'fit-content',
      }}
    >
      <p
        ref={el => choiceRefs.current[choice] = el}
        style={{
          fontWeight: '600',
          fontSize:  '16px',
          textAlign: 'left',
          margin: 0,
          padding: '0px 10px ',
          color: 'grey' ,
          userSelect: 'none',
          pointerEvents: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {content} 
      </p>
    
      {selectedAnswer === choice && (
        <textarea
          id={`textarea-${choice}`}
          value={typedAnswer}
          onChange={handleTyping}
          style={{
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '600',
            position: 'absolute',
            top: '10px',
            left: '0',
            width: '100%',
            height: '100%',
            fontSize:  '16px',
            textAlign: 'left',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: style.color,
            resize: 'none',
            overflow: 'auto',
            padding: '0px 10px ',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
    );
  };

  const submitButton = () => {
    if (!isSubmitting && window.confirm("Are you sure you want to submit your response?")) {
      endTest();
    }
  }; 
  const onSaveAndExit = async () => {
    await handleSaveAndExit();
    navigate(`/studentassignments/${classId}/active`);
  };
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
    <div style={{ marginTop: '100px', marginLeft: 'calc(200px + 4%)'}}>
  
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
    
    <div style={{position: 'fixed', top: '0px', left: '200px', right: '0px', height: '70px', borderBottom: '1px solid lightgrey', display: 'flex'}}>
    <h1 style={{marginLeft: '4%', fontSize: '25px', marginTop: '20px', color: '#999999', }}>{assignmentName}</h1>
    <div style={{marginRight: '4%', fontSize: '20px', marginTop: '20px',  marginLeft: 'auto', 
    fontWeight: "500", lineHeight: '30px',
       background: '#FFF6DA', color: '#FFAE00', borderLeft: '4px solid #FFAE00', display: 'flex', height: '30px'}}> 
    <Zap size={20} color="#FCAE18" strokeWidth={2.5} style={{marginLeft: '5px', marginTop: '5px', }}/> <h1 style={{ fontSize: '16px', marginTop: '0px', marginLeft: '5px' }}>Streak</h1>
    <span style={{marginLeft: '25px', marginRight: '10px', fontWeight: 'bold'}}>{streak}</span> 
    </div>
      </div>

     
        <div
          style={{
            position: 'fixed',
            right: '4%',
            zIndex:'11',
            width: '100px',
            height: '100px',
            border: '10px solid white',
            background: 'white',
            borderRadius: '15px',
            top: '140px',
          }}
        >
               <img style={{ width: '100px', marginLeft: '0px' , marginTop: '8px' }} src="/Score.svg" alt="logo" />
   
          <h1
            style={{
              width: '80px',
              fontSize: '28px',
              background: 'transparent',
              height: '80px',
              position: 'absolute',
              borderRadius: '10px',
              top: '-5px',
              left: '10px',
              border: '2px solid transparent',
              textAlign: 'center',
              lineHeight: '80px',
            }}
          >
           {SquareScore}
          </h1>
        </div>




    
       



         
          <div
           style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: '80%',
            maxWidth: '900px',

            borderRadius: '30px',
            marginTop: '50px',
            borderTop: 'none',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              borderLeft: '5px solid #2BB514',
              color: 'black',
              marginBottom: '80px',
              position: 'relative',
              textAlign: 'left',

              fontWeight: '600',
              fontSize: '25px',
              padding: '10px 5px 5px 20px',
            }}
            >
             
                {currentQuestion.question}
           
            </div>

            <p
  style={{
    color: 'lightgrey',
    MarginBottom: '10px',

    fontWeight: '600',
    fontSize: '14px',
  }}
>
  {selectedAnswer 
    ? isTypedAnswerCorrect()
      ? 'Ready to check your answer'
      : 'Type the complete answer to continue'
    : 'Click a choice to begin'}
</p>
            <div
        style={{
          display: 'flex',
          flexDirection:  'column',
          flexWrap:  'nowrap',
          justifyContent: 'center',
          width: '100%',
          position: 'relative',
        }}
      >
        {Object.keys(currentQuestion)
          .filter((key) => key.match(/^[a-z]$/))
          .map(renderChoice)}
      </div>
 
            
            <div style={{display: 'flex', width: '100%', 
                marginTop: 'auto', }}>
            <button
  style={{
    width: '140px',
    height: '30px',
    color: selectedAnswer && isTypedAnswerCorrect() ? '#FFAE00' : 'transparent',
    borderRadius: '5px',
    fontSize: '16px',
    fontFamily: "'montserrat', sans-serif",
    fontWeight: '600',
    cursor: isTypedAnswerCorrect() ? 'pointer' : 'default',
    marginTop: '20px',
    marginRight: 'auto',
    marginBottom: '20px',
    background: selectedAnswer && isTypedAnswerCorrect() ? '#FFF5DE' : 'transparent',
    border: selectedAnswer && isTypedAnswerCorrect() 
      ? `1px solid #FFAE00` 
      : 'none',
    transition: '.2s'
  }}
  onMouseEnter={(e) => {
    if (isTypedAnswerCorrect()) {
      const darkenColor = getChoiceStyle(selectedAnswer).color;
      e.target.style.borderColor = darkenColor;
    }
  }}
  onMouseLeave={(e) => {
    if (isTypedAnswerCorrect()) {
      e.target.style.borderColor = getChoiceStyle(selectedAnswer).color;
    }
  }}
  onClick={() => {
    if (isTypedAnswerCorrect()) {
      handleCheck();
    }
  }}
>
  Check
</button>
       
          </div>
          
       
        <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ width: 'calc(92% - 300px )', left: '200px', position: 'fixed', top: '100px', background: 'white', height: '700px', padding: '20px' }}
          >
            {assignment.feedback === 'instant' ? (
              // Existing instant feedback logic
              selectedAnswer === currentQuestion.correct ? (
                <div>
                  <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={100}
                    confettiSource={{
                      x: window.innerWidth * 0.37,
                      y: window.innerHeight * 0.28,
                      w: 30,
                      h: 0,
                    }}
                    colors={['#A3F2ED', '#AEF2A3', '#F8CFFF', '#FFECA8', '#FFD1D1']}
                    initialVelocityY={20}
                    initialVelocityX={5}
                    gravity={0.18}
                    tweenDuration={400}
                    spread={1080}
                    run={showConfetti}
                  />
                  <div
                    style={{
              
                      marginTop: '20%',
                     position: "absolute",
                     left: '50%',
                     transform: 'translatex(-50%)'
                    }}
                  >
                    <SquareCheck size={200} color="#00c721" strokeWidth={2} />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginTop: '150px', marginLeft: '4%' }}>
                    <div style={{ display: 'flex', height: '60px', }}>
                  <SquareX size={80} color="red" strokeWidth={2} />
                  <h1 style={{ fontSize: '80px' , marginTop: '-5px', marginLeft: '30px', fontWeight: '600'}}>Almost there...</h1>
                  </div>
                    <p
                      style={{
                        width: '750px',
                        fontSize: '25px',
                        marginTop: '80px',
                        color: 'grey',
                        fontWeight: '600',
                      }}
                    >
                      {currentQuestion[`explanation_${selectedAnswer}`]}
                    </p>
                    <button
                      style={{
                        width: '170px',
                        backgroundColor: '#FFF4D0',
                        height: '40px',
                        borderRadius: '5px',
                        color: '#FFC400',
                        border: '1px solid #FFAE00',
                        cursor: 'pointer',
                        fontFamily: "'montserrat', sans-serif",
                        fontWeight: '600',
                        fontSize: '20px',
                        position: 'absolute',
                        bottom: '60px',
                      }}
                      onClick={() => setShowExplanation(true)}
                    >
                      Next
                    </button>
                  </div>
                </>
              )
            ) : (
              // New non-instant feedback logic
              selectedAnswer === currentQuestion.correct ? (
                <div>
                  <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={100}
                    confettiSource={{
                      x: window.innerWidth * 0.37,
                      y: window.innerHeight * 0.28,
                      w: 30,
                      h: 0,
                    }}
                    colors={['#A3F2ED', '#AEF2A3', '#F8CFFF', '#FFECA8', '#FFD1D1']}
                    initialVelocityY={20}
                    initialVelocityX={5}
                    gravity={0.18}
                    tweenDuration={400}
                    spread={1080}
                    run={showConfetti}
                  />
                  <div
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '200px',
                      marginTop: '20%',
                      border: '20px solid #00B512',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}
                  >
                  
                 <SquareCheck style={{color:'green'}} width={100} />
                  </div>
                  <h1 style={{ fontSize: '60px', color: '#00B512' }}>Correct!</h1>
                </div>
              ) : (
                <div style={{ marginTop: '100px' }}>
                 <SquareX style={{color:'red'}} width={100} />
                  <h1 style={{ fontSize: '60px', color: '#FF0000' }}>Incorrect</h1>
                </div>
              )
            )}
          </motion.div>
        )}
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: '840px', position: 'fixed', top: '140px', background: 'white', height: '700px', padding: '0px', left: 'calc(200px + 4%)',  }}
            >

              
<div style={{     display: 'flex',
              flexWrap: 'wrap',
              width: '840px',
              background: 'white',
              marginLeft: 'auto', marginRight: 'auto',
              borderRadius: '30px',
              
              borderTop: 'none',
              position: 'relative', }}>



 
<div
              style={{
                width: '830px',
                borderLeft: '8px solid #FF2727',
                color: 'black',
                
                position: 'relative',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '25px', 
                padding:'10px 20px ',
              }}
            >
             
                {currentQuestion.question}
           
            </div>
                <div style={{justifyContent:'left', alignItems: 'left', justifyItems: 'left', }}>
              <h1 style={{ fontSize: '16px',fontWeight: '600', marginTop: '40px', color: 'lightgrey', marginBottom: '5px' }}>The Correct Answer is</h1>
              <div
                style={{
                  width: '720px',
                  fontSize: '20px',
                  color: 'black',
                  fontWeight: '600',
                  padding: '15px',
                  border: '1px solid lightgrey',
                  borderRadius: '10px',
                  position: 'relative',
                  minHeight: '60px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: retypedAnswer ? 'lightgrey' : 'lightgrey',
                    pointerEvents: 'none',
                    textAlign: 'left',
                  }}
                >
                  {currentQuestion[currentQuestion.correct]}
                </p>
                <textarea
                  value={retypedAnswer}
                  onChange={handleRetypeAnswer}
                  style={{
                    fontFamily: "'montserrat', sans-serif",
                    fontWeight: '600',
                    position: 'absolute',
                    top: '0',
                    left: '0px',
                    width: '700px',
                    height: '100%',
                    fontSize: '20px',
                    textAlign: 'left',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'black',
                    resize: 'none',
                    overflow: 'hidden',
                    padding: '15px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                />
              </div>
             
              <p
                style={{
                  width: '780px',
                  fontSize: '20px',
                  color: 'grey',
                  textAlign: 'left',
                  
                  fontWeight: '500',
                  marginTop: '15px',
                  
                }}
              >
                {currentQuestion[`explanation_${currentQuestion.correct}`]}
              </p>

              <div style={{ marginTop: '40px' }}>
        <button
          onClick={() => setShowMyResponse(true)}
          style={{
            display: !showMyResponse ? 'flex' : 'none',
            alignItems: 'center',
            gap: '8px',
            background: '#f4f4f4',
            padding: '5px 10px',
            borderRadius: '5px',
            marginBottom: '30px',
            marginLeft: '-5px',
            border: 'none',
            cursor: 'pointer',
            color: 'grey',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '600',
            fontSize: '20px',
          }}
        >
          My Response <ChevronDown size={24} />
        </button>

        <AnimatePresence>
          {showMyResponse && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ width: '109%', borderTop: '1px solid lightgrey' }}
            >
              <div style={{  textAlign: 'left', marginBottom: '30px', marginTop: '30px'  }}>
               
                  <h1 style={{ fontSize: '16px', fontWeight: '600', color: 'lightgrey' }}>My Response</h1>
                  <p style={{
                   
                    fontSize: '20px',
                    border: '1px solid red',
                    borderRadius: '5px',
                    padding: '10px',
                    color: '#FF0000',
                    
                    textAlign: 'left',
                    background: '#FFB6B6',
                    fontWeight: '600',
                    marginTop: '-5px',
                  }}>
                    {currentQuestion[`${selectedAnswer}`]}
                  </p>
              
                  <p style={{
                    width: '100%',
                    fontSize: '20px',
                    color: 'grey',
                    textAlign: 'left',
                    fontWeight: '500',
                    marginTop: '20px',
                  }}>
                    {currentQuestion[`explanation_${selectedAnswer}`]}
                  </p>
               
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <button
          style={{
            width: '200px',
            backgroundColor: isRetypedAnswerCorrect() ? '#FFF4D0' : '#CCCCCC',
            height: '40px',
            borderRadius: '5px',
            border: isRetypedAnswerCorrect() ? '1px solid #FFCF32' : '1px solid grey',
            color: isRetypedAnswerCorrect() ? '#FFC400' : 'grey',
        
            cursor: isRetypedAnswerCorrect() ? 'pointer' : 'not-allowed',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '600',
            fontSize: '20px',
            marginTop: '20px',
            marginBottom: '30px'
          }}
          onClick={() => {
            if (isRetypedAnswerCorrect()) {
              setRetypedAnswer('');
              moveToNextQuestion(false);
            }
          }}
          disabled={!isRetypedAnswerCorrect()}
        >
          Next Question
        </button>
        </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
};

const getChoiceStyle = (choice) => {
  const styles = {
    a: { background: '#B6C2FF', color: '#020CFF' },
    b: { background: '#B4F9BC', color: '#2BB514' },
    c: { background: '#FFECAF', color: '#F4A700' },
    d: { background: '#F6C0FF', color: '#E01FFF' },
    e: { background: '#ADFFFB', color: '#00AAB7' },
  };
  return styles[choice.toLowerCase()] || { background: '#E0E0E0', color: '#000000' };
};

export default TakeAmcq;