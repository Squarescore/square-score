import React, { useState, useEffect } from 'react';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import Loader from './Loader';

function TakeASAQ() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [timeLimit, setTimeLimit] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState('open');
  const [classId, setClassId] = useState(null);
  const [assignmentName, setAssignmentName] = useState('');
  const [timerStarted, setTimerStarted] = useState(false);
  const studentUid = auth.currentUser.uid;
  const navigate = useNavigate();
  const [scaleMin, setScaleMin] = useState(0);
  const [scaleMax, setScaleMax] = useState(2);
  const [saveAndExit, setSaveAndExit] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [squareScore, setSquareScore] = useState(0);
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

  useEffect(() => {
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

          await fetchSavedProgress(assignmentData);

          if (!currentQuestion) {
            selectNextQuestion('Medium');
          }
        }
      } catch (error) {
        console.error("Error fetching assignment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const fetchSavedProgress = async (assignmentData) => {
    const progressRef = doc(db, 'assignments(progress:Asaq)', `${assignmentId}_${studentUid}`);
    const progressDoc = await getDoc(progressRef);
    if (progressDoc.exists()) {
      const data = progressDoc.data();
      setSquareScore(data.squareScore);
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
      handleSubmit();
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [secondsLeft, timerStarted]);

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
  };

  const handleCheck = async () => {
    setIsSubmitting(true);
    try {
      const result = await gradeASAQ(currentQuestion.question, currentQuestion.expectedResponse, answer);
      const newScore = calculateScore(result.score, currentQuestion.difficulty);
      setSquareScore(prevScore => prevScore + newScore);

      if (result.score >= 0.5) {
        setFeedbackMessage("Correct! Moving to the next question.");
        setStreak(prevStreak => prevStreak + 1);
        setCorrectQuestions(prev => [...prev, currentQuestion.id]);
        moveToNextQuestion(true);
      } else {
        setFeedbackMessage("Incorrect. Please try again.");
        setStreak(0);
        setIncorrectQuestions(prev => [...prev, currentQuestion.id]);
      }
      setCompletedQuestions(prev => [...prev, currentQuestion.id]);
      setShowFeedback(true);
      await saveProgress();
    } catch (error) {
      console.error("Error grading answer:", error);
      setFeedbackMessage("An error occurred while grading. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradeASAQ = async (question, expectedResponse, studentResponse) => {
    // Implement the call to your ASAQ grading function here
    // This is a placeholder implementation

      try {
        const questionsToGrade = questions.map((question, index) => ({
          questionId: question.questionId,
          question: question.text,
          expectedResponse: question.expectedResponse,
          studentResponse: answers[index].answer,
        }));
    
        const response = await fetch('https://us-central1-square-score-ai.cloudfunctions.net/GradeASAQ', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questions: questionsToGrade }),
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const gradingResults = await response.json();
        return gradingResults;
      } catch (error) {
        console.error("Error grading assignment:", error);
        throw error;
      }
    };



  const calculateScore = (score, difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return score * 1;
      case 'Medium':
        return score * 2;
      case 'Hard':
        return score * 3;
      default:
        return score;
    }
  };

  const selectNextQuestion = (difficulty) => {
    const availableQuestions = Object.entries(assignment.questions)
      .filter(([id, q]) => q.difficulty === difficulty && !completedQuestions.includes(id));

    if (availableQuestions.length > 0) {
      const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      setCurrentQuestion({ id: randomQuestion[0], ...randomQuestion[1] });
    } else {
      handleSubmit();
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

    selectNextQuestion(nextDifficulty);
    setAnswer('');
    setShowFeedback(false);
  };

  const saveProgress = async () => {
    const progressRef = doc(db, 'assignments(progress:Asaq)', `${assignmentId}_${studentUid}`);
    await setDoc(progressRef, {
      squareScore,
      streak,
      completedQuestions,
      correctQuestions,
      incorrectQuestions,
      timeRemaining: secondsLeft,
      savedAt: serverTimestamp(),
      status: assignmentStatus
    }, { merge: true });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const gradeDocRef = doc(db, 'grades(saq)', `${assignmentId}_${studentUid}`);
      await setDoc(gradeDocRef, {
        assignmentId,
        studentUid,
        assignmentName,
        firstName,
        lastName,
        classId,
        submittedAt: serverTimestamp(),
        squareScore,
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
      setIsSubmitting(false);
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

  const checkAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex];

    if (currentAnswer.answer.trim().toLowerCase() === currentQuestion.expectedResponse.trim().toLowerCase()) {
      updateScore(true);
      alert('Correct!'); // Replace this with correct response handling if necessary
      moveToNextQuestion(true);
    } else {
      updateScore(false);
      alert('Incorrect!'); // Replace this with incorrect response handling if necessary
      moveToNextQuestion(false);
    }
  };

  const updateScore = (isCorrect) => {
    let points = 0;
    if (isCorrect) {
      points = 1 + 0.5 * streak;
      setStreak(streak + 1);
    } else {
      points = -1;
      setStreak(0);
    }
    setSquareScore(squareScore + points);
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

  if (loading) return <Loader />;












  return (
    <div style={{ paddingBottom: '80px', marginLeft: '-3px', marginRight: '-3px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
      <button
        onClick={submitButton}
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
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.01)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        Submit
      </button>

      {loading &&
        <div style={loadingModalStyle}>
          <div style={loadingModalContentStyle}>
            <p style={{ fontSize: '30px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)' }}>
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
            <p style={{ fontSize: '30px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)' }}>
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
            backgroundColor: 'white', width: '700px', color: 'black', border: '10px solid #EAB3FD',
            textAlign: 'center', fontWeight: 'bold', padding: '40px', borderRadius: '30px', fontSize: '30px', position: 'relative',
            marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', fontFamily: "'Radio Canada', sans-serif", userSelect: 'none'
          }}>
            {questions[currentQuestionIndex]?.text}
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
              marginRight: 'auto',
              textAlign: 'left',
              fontSize: '20px',
              fontFamily: "'Radio Canada', sans-serif",
              padding: '30px'
            }}
            type="text"
            placeholder='Type your response here'
            value={answers.find(a => a.questionId === questions[currentQuestionIndex]?.questionId)?.answer || ''}
            onChange={handleAnswerChange}
          />
          <button
            onClick={checkAnswer}
            style={{
              width: '200px',
              height: '50px',
              color: 'white',
              backgroundColor: '#020CFF',
              borderRadius: '10px',
              fontSize: '30px',
              fontFamily: "'Radio Canada', sans-serif",
              fontWeight: 'bold',
              cursor: 'pointer',
              margin: '30px auto',
              display: 'block'
            }}
          >
            Check
          </button>
          <h3 style={{
            width: '300px',
            textAlign: 'center',
            fontSize: '40px',
            backgroundColor: 'transparent',
            fontFamily: "'Radio Canada', sans-serif",
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

export default TakeASAQ;
