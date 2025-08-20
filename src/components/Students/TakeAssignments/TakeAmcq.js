import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, arrayRemove, arrayUnion, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../Universal/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useRef } from 'react';
import { ChevronDown, Eye, EyeOff, LayoutGrid, Menu, SquareCheck, SquareX, Youtube, YoutubeIcon, Hourglass, Lock, LockOpen } from 'lucide-react';
import TakeAssignmentNav from './TakeAssignmentNav';
import { GlassContainer } from '../../../styles';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [choiceHeights, setChoiceHeights] = useState({});
  const holdTimerRef = useRef(null);

  // Add all useEffect hooks at the top
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
    }
  };

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

  useEffect(() => {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  // Add cleanup effect for hold timer
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  const handleHoldStart = () => {
    setIsHolding(true);
    let startTime = Date.now();
    
    holdTimerRef.current = setInterval(() => {
      const progress = Math.min(((Date.now() - startTime) / 1500) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(holdTimerRef.current);
        setShowConfirmModal(false);
        endTest();
      }
    }, 10);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
  };

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const submitButton = () => {
    handleSubmitClick();
  };

  const handleAnswerSelect = (choice) => {
    setSelectedAnswer(choice);
    setTypedAnswer('');
    setTimeout(() => {
      const textarea = document.getElementById(`textarea-${choice}`);
      if (textarea) {
        textarea.focus();
      }
    }, 0);
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

  // Timer
  const toggleTimer = () => {
    setShowTimer((prevShowTimer) => !prevShowTimer);
  };

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
  
      setStreak((prevStreak) => (streak > 6 ? Math.floor(prevStreak / 2) : 0));
    }
  
    points = Math.round(points);
    let newScore = SquareScore + points;
    if (isNaN(newScore)) newScore = 0;
    if (newScore >= maxScore) newScore = maxScore;
  
    setSquareScore(newScore);
  
    if (newScore >= maxScore) {
      // Pass the newScore to ensure it's saved correctly
      setTimeout(() => {
        endTest(newScore);
      }, 100);
    }
  };
  

  // Grades
 // Update the formatQuestionData helper function to include all choices and explanations
const formatQuestionData = (question, selectedChoice = null) => {
  const choiceKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const formattedQuestion = {
    questionId: question.id || question.question,
    question: question.question,
    difficulty: question.difficulty,
    selectedChoice,
    correctChoice: question.correct,
    // Store all choices
    ...choiceKeys.reduce((acc, key) => {
      if (question[key]) {
        acc[key] = question[key];
        acc[`explanation_${key}`] = question[`explanation_${key}`] || '';
      }
      return acc;
    }, {})
  };
  return formattedQuestion;
};

// Update handleSaveAndExit to store all choices and explanations
const handleSaveAndExit = async () => {
  const progressRef = doc(db, 'assignments(progress)', `${assignmentId}_${auth.currentUser.uid}`);
  
  try {
    await setDoc(progressRef, {
      studentUid: auth.currentUser.uid,
      assignmentId: assignmentId,
      timeRemaining: secondsLeft,
      status: 'in progress',
      SquareScore: SquareScore, // Keep as squareScore in progress doc
      streak: streak,
      completedQuestions: completedQuestions,
      correctQuestions: correctQuestions.map(questionData => {
        const originalQuestion = assignment.questions.find(q => q.question === questionData.question);
        return formatQuestionData(originalQuestion, questionData.correctChoice);
      }),
      incorrectQuestions: incorrectQuestions.map(questionData => {
        const originalQuestion = assignment.questions.find(q => q.question === questionData.question);
        return formatQuestionData(originalQuestion, questionData.chosenAnswer);
      }),
      cycledThroughAll: cycledThroughAll,
      savedAt: new Date(),
    });

    // Update student document
    const studentRef = doc(db, 'students', auth.currentUser.uid);
    await updateDoc(studentRef, {
      assignmentsToTake: arrayRemove(assignmentId),
      assignmentsInProgress: arrayUnion(assignmentId)
    });

    navigate(`/studentassignments/${classId}/active`);
  } catch (error) {
    console.error("Error saving progress:", error);
    alert("There was an error saving your progress. Please try again.");
  }
};

// Update endTest to store complete question data and use consistent score naming
const endTest = async (finalScore = SquareScore) => {
  const studentRef = doc(db, 'students', auth.currentUser.uid);
  const gradeRef = doc(db, 'grades', `${assignmentId}_${auth.currentUser.uid}`);

  try {
    await setDoc(gradeRef, {
      studentUid: auth.currentUser.uid,
      firstName: firstName,
      lastName: lastName,
      classId: assignment.classId,
      assignmentId: assignmentId,
      assignmentName: assignmentName,
      SquareScore: finalScore, // Use the final score passed as a parameter
      maxScore: maxScore,
      completedQuestions: completedQuestions,
      correctQuestions: correctQuestions.map((questionData) => {
        const originalQuestion = assignment.questions.find(
          (q) => q.question === questionData.question
        );
        return formatQuestionData(originalQuestion, questionData.correctChoice);
      }),
      incorrectQuestions: incorrectQuestions.map((questionData) => {
        const originalQuestion = assignment.questions.find(
          (q) => q.question === questionData.question
        );
        return formatQuestionData(originalQuestion, questionData.chosenAnswer);
      }),
      submittedAt: new Date(),
      viewable: false,
      cycledThroughAll: cycledThroughAll,
    });

    await updateDoc(studentRef, {
      assignmentsToTake: arrayRemove(assignmentId),
      assignmentsInProgress: arrayRemove(assignmentId),
      assignmentsTaken: arrayUnion(assignmentId),
      [`class_${assignment.classId}.grades.${assignmentId}`]: {
        score: finalScore, // Ensure the score saved in the student document is accurate
        submittedAt: new Date(),
        assignmentId,
        assignmentName,
      },
    });

    const progressRef = doc(
      db,
      'assignments(progress)',
      `${assignmentId}_${auth.currentUser.uid}`
    );
    await deleteDoc(progressRef);

    navigate(`/studentassignments/${classId}/active`);
  } catch (error) {
    console.error('Error submitting assignment:', error);
    alert('There was an error submitting your assignment. Please try again.');
  }
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

    const commonContentStyle = {
      fontWeight: '500',
      fontSize: '16px',
      textAlign: 'left',
      margin: 0,
      color: selectedAnswer === choice ? style.color : 'grey',
      userSelect: 'none',
      pointerEvents: 'none',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      wordBreak: 'break-word',
      width: '100%',
      lineHeight: '30px',
    };

    if (selectedAnswer === choice) {
      return (
        <div style={{ margin: '5px 0', width: '100%' }}>
          <GlassContainer
            key={choice}
            onClick={() => handleAnswerSelect(choice)}
            variant={style.variant}
            size={0}
            style={{
              width: '100%',
            }}
            contentStyle={{
              height: '30px',
              width: '100%',
              padding: '5px 15px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              zIndex: '2',
            }}
          >
            <div style={{ 
              width: '100%',
              height: '30px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: '0 15px 0 35px',
            }}>
              <p ref={el => choiceRefs.current[choice] = el} style={commonContentStyle}>
                {content}
              </p>
              <textarea
                id={`textarea-${choice}`}
                value={typedAnswer}
                onChange={handleTyping}
                style={{
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '500',
                  position: 'absolute',
                  top: '0',
                  left: '35px',
                  right: '15px',
                  height: '30px',
                  fontSize: '16px',
                  textAlign: 'left',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: style.color,
                  resize: 'none',
                  overflow: 'hidden',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxSizing: 'border-box',
                  lineHeight: '30px',
                  padding: '0',
                }}
              />
            </div>
          </GlassContainer>
        </div>
      );
    }

    return (
      <div style={{ margin: '5px 0', width: '100%' }}>
        <div
          key={choice}
          onClick={() => handleAnswerSelect(choice)}
          style={{
            width: '100%',
            height: '30px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '100px',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            padding: '5px 25px',
            alignItems: 'center',
          }}
        >
          <div style={{
            width: '100%',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 15px 0 0px',
          }}>
            <p ref={el => choiceRefs.current[choice] = el} style={commonContentStyle}>
              {content}
            </p>
          </div>
        </div>
      </div>
    );
};

  // Handle hold start
  // Handle hold end
  // Clean up timer on unmount
  // Separate submit button click handler from actual submit
  // Update the existing submit button click handler to use the new confirmation flow
  const onSaveAndExit = async () => {
    await handleSaveAndExit();
    navigate(`/studentassignments/${classId}/active`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      fontFamily: "'montserrat', sans-serif"
    }}>
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
            {showTimer && timeLimit > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'grey',
                cursor: 'pointer',
              }} onClick={toggleTimer}>
                {showTimer ? <Eye size={16} /> : <Hourglass size={16} />}
                <span style={{ fontSize: '.9rem', fontWeight: '500' }}>
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
            onClick={handleSubmitClick}
            variant="clear"
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
              color: 'grey',
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

      <div style={{
        width: '800px',
        maxWidth: '90%',
        margin: '50px auto',
        position: 'relative'
      }}>
        {/* Watermark container for question */}
        <div style={{
          position: 'absolute',
          top: -15,
          left: '0',
          right: '0',
          height: 'fit-content',
          minHeight: '50px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoRows: '14px',
          alignContent: 'start',
          pointerEvents: 'none',
          zIndex: 0,
          padding: '0px 0'
        }}>
          {Array(15).fill("AI ASSISTANCE PROHIBITED - ACADEMIC INTEGRITY  - NO BYPASS -").map((text, i) => (
            <div
              key={i}
              style={{
                color: '#ddd',
                fontSize: '9px',
                padding: '2px',
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
          {currentQuestion.question}
        </div>

        <p style={{
          color: 'grey',
          marginBottom: '10px',
          fontWeight: '400',
          fontSize: '14px',
          marginTop: '170px'
        }}>
          {selectedAnswer 
            ? isTypedAnswerCorrect()
              ? 'Ready to check your answer'
              : 'Type the complete answer to continue'
            : 'Click a choice to begin'}
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          {Object.keys(currentQuestion)
            .filter((key) => key.match(/^[a-z]$/))
            .map(renderChoice)}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '40px',
          padding: '0 20px',
        }}>
          <button
            style={{
              width: '120px',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
fontFamily: "'montserrat', sans-serif",

              justifyContent: 'center',
              border: '1px solid #ddd',
              borderRadius: '100px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            <span style={{
              color: 'grey',
              fontSize: '.8rem',
              fontWeight: '500',
            }}>
              Previous
            </span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <span style={{
              color: 'grey',
              fontSize: '.8rem',
              fontWeight: '400',
            }}>
              Question 3 of 5
            </span>
            <span style={{
              color: '#ddd',
              margin: '0 10px',
            }}>
              •
            </span>
            <span style={{
              color: 'grey',
              fontSize: '.8rem',
              fontWeight: '400',
            }}>
              Module 2: Show Details
            </span>
          </div>

          <button
            style={{
              width: '120px',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              
                        fontFamily: "'montserrat', sans-serif",
              justifyContent: 'center',
              border: '1px solid #ddd',
              borderRadius: '100px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            <span style={{
              color: 'grey',
              fontSize: '.8rem',
              fontWeight: '500',
            }}>
              Next
            </span>
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
                    <div style={{ marginTop: '20%', position: "absolute", left: '50%', transform: 'translatex(-50%)' }}>
                      <SquareCheck size={200} color="#00c721" strokeWidth={2} />
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '150px', marginLeft: '4%' }}>
                    <div style={{ display: 'flex', height: '60px' }}>
                      <SquareX size={60} color="red" strokeWidth={2} />
                      <h1 style={{ fontSize: '60px', marginTop: '-5px', marginLeft: '30px', fontWeight: '600' }}>Almost there...</h1>
                    </div>
                    <p style={{
                      width: '750px',
                      fontSize: '25px',
                      marginTop: '80px',
                      color: 'grey',
                      fontWeight: '500',
                    }}>
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
                        bottom: '200px',
                      }}
                      onClick={() => setShowExplanation(true)}
                    >
                      Next
                    </button>
                  </div>
                )
              ) : (
                // Non-instant feedback logic
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
                    <div style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '200px',
                      marginTop: '20%',
                      border: '20px solid #00B512',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}>
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
              style={{ width: '840px', position: 'fixed', top: '140px', background: 'white', height: '700px', padding: '0px', left: 'calc(200px + 4%)' }}
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
                  fontWeight: '500',
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
                    fontWeight: '500',
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
            fontWeight: '500',
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
               
                  <h1 style={{ fontSize: '16px', fontWeight: '500', color: 'lightgrey' }}>My Response</h1>
                  <p style={{
                   
                    fontSize: '20px',
                    border: '1px solid red',
                    borderRadius: '5px',
                    padding: '10px',
                    color: '#FF0000',
                    
                    textAlign: 'left',
                    background: '#FFB6B6',
                    fontWeight: '500',
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
            backgroundColor: isRetypedAnswerCorrect() ? '#FFF4D0' : '#dddCCC',
            height: '40px',
            borderRadius: '5px',
            border: isRetypedAnswerCorrect() ? '1px solid #FFCF32' : '1px solid grey',
            color: isRetypedAnswerCorrect() ? '#FFC400' : 'grey',
        
            cursor: isRetypedAnswerCorrect() ? 'pointer' : 'not-allowed',
            fontFamily: "'montserrat', sans-serif",
            fontWeight: '500',
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
    
  );
};

const getChoiceStyle = (choice) => {
  const styles = {
    a: { background: '#B6C2FF', color: '#020CFF', variant: 'blue' },
    b: { background: '#B4F9BC', color: '#2BB514', variant: 'green' },
    c: { background: '#FFECAF', color: '#F4A700', variant: 'yellow' },
    d: { background: '#F6C0FF', color: '#E01FFF', variant: 'pink' },
    e: { background: '#ADFFFB', color: '#00AAB7', variant: 'teal' },
  };
  return styles[choice.toLowerCase()] || { background: '#E0E0E0', color: '#000000', variant: 'clear' };
};

export default TakeAmcq;