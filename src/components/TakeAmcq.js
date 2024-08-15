import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayRemove, arrayUnion, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useRef } from 'react';

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
  const [choiceHeights, setChoiceHeights] = useState({});
  const choiceRefs = useRef({});

  useEffect(() => {
    Object.keys(choiceRefs.current).forEach(choice => {
      if (choiceRefs.current[choice]) {
        const height = choiceRefs.current[choice].offsetHeight;
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
      const assignmentDoc = await getDoc(doc(db, 'assignments(Amcq)', assignmentId));
      if (assignmentDoc.exists()) {
        const data = assignmentDoc.data();
        setSaveAndExit(data.saveAndExit);
        setClassId(data.classId);
        setAssignment(data);
        setTimeLimit(data.timer * 60);
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

    const progressRef = doc(db, 'assignments(progress:AMCQ)', `${assignmentId}_${auth.currentUser.uid}`);
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
    const progressRef = doc(db, 'assignments(progress:AMCQ)', `${assignmentId}_${auth.currentUser.uid}`);
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

    navigate(`/studentassignments/${classId}`);
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
          choiceContent: currentQuestion[selectedAnswer]
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
            correctContent: currentQuestion[currentQuestion.correct]
          }
        ]);
      }
      setCompletedQuestions((prev) => [...prev, currentQuestion.question]);
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
        moveToNextQuestion(isCorrect);
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
    setTypedAnswer('');
    setShowFeedback(false);
    setShowExplanation(false);
  };

  // Points system
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
      endTest();
    }
  
    setSquareScore(newScore);
  };

  // Grades
  const endTest = async () => {
    const studentRef = doc(db, 'students', auth.currentUser.uid);
    const gradeRef = doc(db, 'grades(AMCQ)', `${assignmentId}_${auth.currentUser.uid}`);
  
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
      [`assignments.${assignmentId}`]: {
        SquareScore,
        completedQuestions,
        correctQuestions,
        incorrectQuestions,
        cycledThroughAll,
      },
      assignmentsToTake: arrayRemove(assignmentId),
      assignmentsInProgress: arrayRemove(assignmentId),
      assignmentsTaken: arrayUnion(assignmentId),
    });
    
    // Remove the progress document if it exists
    const progressRef = doc(db, 'assignments(progress:AMCQ)', `${assignmentId}_${auth.currentUser.uid}`);
    await deleteDoc(progressRef);
  
    navigate(`/studentassignments/${classId}`);
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

  const isRetypedAnswerCorrect = () => {
    return retypedAnswer.toLowerCase() === currentQuestion[currentQuestion.correct].toLowerCase();
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

  if (!assignment || !currentQuestion) return <div>Loading...</div>;

  
  return (
    <div style={{ marginTop: '100px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif", textAlign: 'center' }}>
      <button
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
          fontFamily: "'Radio Canada', sans-serif",
          color: 'white',
          fontWeight: 'bold',
          zIndex: '100',
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={(e) => (e.target.style.transform = 'scale(1.01)')}
        onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
        onClick={endTest}
      >
        Submit
      </button>

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
      fontFamily: "'Radio Canada', sans-serif",
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
          marginTop: '-100px',
          marginBottom: '40px',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <link rel="preload" href="/greenCheck.png" as="image" type="image/png"></link>
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
            fontFamily: "'Radio Canada', sans-serif",
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
      <div style={{ width: '1000px', marginLeft: 'auto', marginRight: 'auto' }}>
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
            {SquareScore}
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
        </div>
        <div style={{ padding: '20px', marginBottom: '30px' }}>
          <div style={{ width: '100%', display: 'flex', marginBottom: '30px', justifyContent: 'center' }}>
            <div
              style={{
                width: '1000px',
                border: '10px solid white',
                marginLeft: 'auto',
                marginRight: 'auto',
                position: 'relative',
                background: '#F5F5F5',
                borderRadius: '30px',
                marginTop: '30px',
              }}
            >
              <h1
                style={{
                  fontSize: '25px',
                  color: 'grey',
                  padding: '5px',
                  textAlign: 'center',
                  background: 'lightgrey',
                  paddingLeft: '30px',
                  paddingRight: '30px',
                  border: '10px solid white',
                  borderRadius: '20px',
                  position: 'absolute',
                  top: '-50px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                {assignmentName}
              </h1>
              <p
                style={{
                  width: '85%',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  fontSize: '35px',
                  
                  userSelect: 'none',
                  fontWeight: 'bold',
                  marginTop: '40px',
                  marginBottom: '40px',
                }}
              >
                {currentQuestion.question}
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%',
              position: 'relative',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '100%',
                marginTop: '-50px',
                marginBottom: '-10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button onClick={toggleDisplayFormat} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '30px' }}>
                <img
                  src={displayFormat === 'grid' ? '/list.png' : '/grid.png'}
                  alt={displayFormat === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                  style={{ width: '30px', height: '30px', opacity: '20%' }}
                />
              </button>
              <p
                style={{
                  color: 'lightgrey',
                  marginRight: 'auto',
                  marginLeft: '120px',
                  fontWeight: 'bold',
                  fontSize: '30px',
                }}
              >
                {' '}
                Type in a choice to confirm your response
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: displayFormat === 'grid' ? 'row' : 'column',
                flexWrap: displayFormat === 'grid' ? 'wrap' : 'nowrap',
                justifyContent: 'center',
                width: '100%',
                position: 'relative',
                margin: '0 auto',
              }}
            >
            {Object.keys(currentQuestion)
  .filter((key) => key.match(/^[a-z]$/))
  .map((choice) => {
    const style = getChoiceStyle(choice);
    return (
      <div
        key={choice}
        onClick={() => handleAnswerSelect(choice)}
        style={{
          width: displayFormat === 'grid' ? '42%' : '90%',
          margin: displayFormat === 'grid' ? '10px 2%' : '5px auto',
          padding: '10px',
          background: style.background,
          color: style.color,
          border: selectedAnswer === choice ? `5px solid ${style.color}` : '6px solid transparent',
          borderRadius: '10px',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
          height: displayFormat === 'grid' ? '100px' : 'auto',
          maxHeight: displayFormat === 'grid' ? '100px' : '80px',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <p
          ref={el => choiceRefs.current[choice] = el}
          style={{
            fontWeight: 'bold',
            fontSize: displayFormat === 'grid' ? '20px' : '16px',
            textAlign: 'left',
            margin: 0,
            color: selectedAnswer === choice ? 'grey' : style.color,
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            bottom: '10px',
            userSelect: 'none',
            pointerEvents: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: displayFormat === 'grid' ? 4 : 3,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}
        >
          {currentQuestion[choice]}
        </p>

        {selectedAnswer === choice && (
          <textarea
            id={`textarea-${choice}`}
            value={typedAnswer}
            onChange={handleTyping}
            style={{
              fontFamily: "'Radio Canada', sans-serif",
              fontWeight: 'bold',
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              fontSize: displayFormat === 'grid' ? '20px' : '16px',
              textAlign: 'left',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: style.color,
              resize: 'none',
              overflow: 'auto',
              padding: '10px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>
    );
  })
}

            </div>
          </div>
        </div>
        <button
          style={{
            width: '300px',
            height: '50px',
            color: 'white',
            backgroundColor: '#020CFF',
            borderRadius: '10px',
            fontSize: '30px',
            fontFamily: "'Radio Canada', sans-serif",
            fontWeight: 'bold',
            cursor: 'pointer',
            margin: '0 auto',
            display: typedAnswer.length > 0 ? 'block' : 'none',
          }}
          onClick={handleCheck}
        >
          Check
        </button>
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: '1020px', position: 'fixed', top: '100px', background: 'white', height: '700px', padding: '20px' }}
            >
              {selectedAnswer === currentQuestion.correct ? (
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
                    <img
                      style={{
                        width: '130px',
                        borderRadius: '200px',
                        marginTop: '50px',
                        marginLeft: '20px',
                      }}
                      src="/greenCheck.png"
                      alt="Correct"
                    />
                  </div>
                </div>
              ) : assignment.feedback === 'at completion' ? (
                <div style={{ marginTop: '100px' }}>
                  <img style={{ width: '100px' }} src="/bigRedx.png" />
                  <button
                    style={{
                      width: '200px',
                      backgroundColor: '#000AFF',
                      height: '50px',
                      borderRadius: '10px',
                      color: 'white',
                      cursor: 'pointer',
                      border: 'none',
                      fontFamily: "'Radio Canada', sans-serif",
                      fontWeight: 'bold',
                      fontSize: '30px',
                      position: 'absolute',
                      bottom: '40px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                    onClick={() => moveToNextQuestion(false)}
                  >
                    Next
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginTop: '100px' }}>
                    <img style={{ width: '100px' }} src="/bigRedx.png" />
                    <h1 style={{ fontSize: '60px' }}>Almost there...</h1>
                    <p
                      style={{
                        width: '700px',
                        fontSize: '30px',
                        color: 'grey',
                        fontWeight: 'bold',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                      }}
                    >
                      {currentQuestion[`explanation_${selectedAnswer}`]}
                    </p>
                    <button
                      style={{
                        width: '200px',
                        backgroundColor: '#000AFF',
                        height: '50px',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                        border: 'none',
                        fontFamily: "'Radio Canada', sans-serif",
                        fontWeight: 'bold',
                        fontSize: '30px',
                        position: 'absolute',
                        bottom: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                      onClick={() => setShowExplanation(true)}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: '1010px', position: 'fixed', top: '100px', background: 'white', height: '700px', padding: '20px' }}
            >
              <h1 style={{ fontSize: '60px' }}>The Correct Answer is</h1>
              <div
                style={{
                  width: '900px',
                  fontSize: '30px',
                  color: 'black',
                  fontWeight: 'bold',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  padding: '30px',
                  border: '5px solid blue',
                  borderRadius: '20px',
                  position: 'relative',
                  minHeight: '100px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: retypedAnswer ? 'lightgrey' : 'black',
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
                    fontFamily: "'Radio Canada', sans-serif",
                    fontWeight: 'bold',
                    position: 'absolute',
                    top: '0',
                    left: '0px',
                    width: '900px',
                    height: '100%',
                    fontSize: '30px',
                    textAlign: 'left',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'black',
                    resize: 'none',
                    overflow: 'hidden',
                    padding: '30px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                />
              </div>
              <p
                style={{
                  width: '780px',
                  fontSize: '30px',
                  color: 'grey',
                  fontWeight: 'bold',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginTop: '20px',
                }}
              >
                {currentQuestion[`explanation_${currentQuestion.correct}`]}
              </p>
              <button
                style={{
                  width: '400px',
                  backgroundColor: isRetypedAnswerCorrect() ? '#000AFF' : '#CCCCCC',
                  height: '50px',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: isRetypedAnswerCorrect() ? 'pointer' : 'not-allowed',
                  border: 'none',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontWeight: 'bold',
                  fontSize: '30px',
                  position: 'absolute',
                  bottom: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const getChoiceStyle = (choice) => {
  const styles = {
    a: { background: '#A3F2ED', color: '#00645E' },
    b: { background: '#AEF2A3', color: '#006428' },
    c: { background: '#F8CFFF', color: '#E01FFF' },
    d: { background: '#FFECA8', color: '#CE7C00' },
    e: { background: '#FFD1D1', color: '#FF0000' },
  };
  return styles[choice.toLowerCase()] || { background: '#E0E0E0', color: '#000000' };
};

export default TakeAmcq;
