import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';

const TakeAmcq = () => {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState([]);

  useEffect(() => {
    const fetchAssignment = async () => {
      const assignmentDoc = await getDoc(doc(db, 'assignments(Amcq)', assignmentId));
      if (assignmentDoc.exists()) {
        setAssignment(assignmentDoc.data());
        // Start with a medium difficulty question
        const mediumQuestions = assignmentDoc.data().questions.filter(q => q.difficulty === 'Medium');
        setCurrentQuestion(mediumQuestions[Math.floor(Math.random() * mediumQuestions.length)]);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setTypedAnswer('');
  };

  const handleCheck = () => {
    const selectedText = currentQuestion[selectedAnswer];
    if (selectedText.toLowerCase() === typedAnswer.toLowerCase()) {
      const isCorrect = selectedAnswer === currentQuestion.correct;
      updateScore(isCorrect);
      if (assignment.feedback === 'instant') {
        if (isCorrect) {
          setShowFeedback(true);
        } else {
          setShowFeedback(true);
        }
      } else {
        moveToNextQuestion(isCorrect);
      }
    } else {
      alert("Your typed answer doesn't match the selected answer. Please try again.");
    }
  };

  const moveToNextQuestion = (wasCorrect) => {
    setCompletedQuestions([...completedQuestions, currentQuestion.question]);
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
    const nextQuestions = assignment.questions.filter(q => 
      q.difficulty === nextDifficulty && !completedQuestions.includes(q.question)
    );
    if (nextQuestions.length > 0) {
      setCurrentQuestion(nextQuestions[Math.floor(Math.random() * nextQuestions.length)]);
    } else {
      // End the test if no more questions are available
      endTest();
    }
    setSelectedAnswer('');
    setTypedAnswer('');
    setShowFeedback(false);
  };
  const updateScore = (isCorrect) => {
    let points = 0;
    if (isCorrect) {
      if (currentQuestion.difficulty === 'Easy') points = 1.5;
      if (currentQuestion.difficulty === 'Medium') points = 2.5;
      if (currentQuestion.difficulty === 'Hard') points = 4;
    } else {
      if (currentQuestion.difficulty === 'Easy') points = -4;
      if (currentQuestion.difficulty === 'Medium') points = -2;
      if (currentQuestion.difficulty === 'Hard') points = -1;
    }
    setScore(prevScore => prevScore + points);
  };

  
  const endTest = async () => {
    // Save the score and completed questions to Firestore
    const studentRef = doc(db, 'students', auth.currentUser.uid);
    await updateDoc(studentRef, {
      [`assignments.${assignmentId}`]: {
        score,
        completedQuestions
      }
    });
    // Navigate to results page or back to assignments list
    // navigation logic here
  };

  const handleTyping = (e) => {
    const selectedText = currentQuestion[selectedAnswer];
    const nextChar = selectedText[typedAnswer.length];
    if (e.target.value.slice(-1).toLowerCase() === nextChar.toLowerCase()) {
      setTypedAnswer(e.target.value);
    }
  };

  if (!assignment || !currentQuestion) return <div>Loading...</div>;

  return (
    <div style={{ marginTop: '100px', width: '1000px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
      <h1>Take Test</h1>
      <div>Score: {score}</div>
      <div style={{ borderBottom: '10px solid lightgrey', padding: '20px', marginBottom: '30px' }}>
        <div style={{ width: '100%', display: 'flex', marginBottom: '30px' }}>
          <div style={{ 
            width: '20%', 
            border: `7px solid ${getDifficultyColor(currentQuestion.difficulty)}`, 
            borderTopLeftRadius: '10px', 
            borderBottomLeftRadius: '10px', 
            position: "relative", 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h1 style={{ 
              fontSize: '22px', 
              color: 'white', 
              width: '120px', 
              textAlign: 'center', 
              background: getDifficultyColor(currentQuestion.difficulty), 
              padding: '5px', 
              borderRadius: '10px', 
              position: 'absolute', 
              top: '-40px', 
              left: '30px' 
            }}>Difficulty</h1>
            <p style={{ 
              fontSize: '35px', 
              fontWeight: 'bold', 
              textAlign: 'center', 
              margin: 0 
            }}>{currentQuestion.difficulty}</p>
          </div>
          <div style={{ width: '710px', border: '7px solid #E01FFF', marginLeft: 'auto', position: 'relative', borderTopRightRadius: '10px', borderBottomRightRadius: '10px' }}>
            <h1 style={{ fontSize: '25px', color: 'white', width: '160px', textAlign: 'center', background: '#E01FFF', padding: '5px', borderRadius: '10px', position: 'absolute', top: '-40px', left: '100px' }}>Question</h1>
            <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto', fontSize: '25px', fontWeight: 'bold' }}>{currentQuestion.question}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      {Object.keys(currentQuestion).filter(key => key.match(/^[a-z]$/)).map((choice) => {
        const style = getChoiceStyle(choice);
        return (
          <div key={choice} 
            onClick={() => handleAnswerSelect(choice)}
            style={{
              width: '45%',
              margin: '10px 1%',
              padding: '10px',
              background: style.background,
              color: style.color,
              border: selectedAnswer === choice ? `3px solid ${style.color}` : '3px solid transparent',
              borderRadius: '10px',
              cursor: 'pointer',
              position: 'relative',
              minHeight: '100px', // Add a minimum height to ensure space for typing
            }}
          >
            <p style={{
              fontWeight: 'bold', 
              fontSize: '20px', 
              textAlign: 'left', // Change to left alignment
              margin: 0,
              color: selectedAnswer === choice ? 'grey' : style.color,
              position: 'absolute', // Position absolutely
              top: '10px', // Add some top padding
              left: '10px', // Add some left padding
              right: '10px', // Ensure text wraps within the div
              pointerEvents: 'none', // Prevent interfering with input field
            }}>
              {currentQuestion[choice]}
            </p>
            {selectedAnswer === choice && (
              <textarea // Change to textarea for better multiline support
                value={typedAnswer}
                onChange={handleTyping}
                style={{
                  fontFamily: "'Radio Canada', sans-serif" , fontWeight: 'bold',
                  position: 'absolute',
                  top: '7px', // Match the padding of the placeholder text
                  left: '10px',
                  width: 'calc(100% - 20px)', // Account for left and right padding
                  height: 'calc(100% - 20px)', // Account for top and bottom padding
                  fontSize: '20px',
                  WebkitTextStroke: '2px solid blue',
                  fontWeight: 'bold',
                  textAlign: 'left', // Align text to the left
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: style.color,
                  resize: 'none', // Prevent textarea resizing
                  overflow: 'hidden', // Hide scrollbars
                }}
              />
            )}
          </div>
        );
      })}
    </div>
      </div>
      <button onClick={handleCheck}>Check</button>
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {selectedAnswer === currentQuestion.correct ? (
              <h2>Correct!</h2>
            ) : (
              <>
                <h2>Feedback</h2>
                <p>Your answer: {currentQuestion[selectedAnswer]}</p>
                <p>Explanation: {currentQuestion[`explanation_${selectedAnswer}`]}</p>
                <p>Correct answer: {currentQuestion[currentQuestion.correct]}</p>
                <p>Correct explanation: {currentQuestion[`explanation_${currentQuestion.correct}`]}</p>
              </>
            )}
            <button onClick={() => moveToNextQuestion(selectedAnswer === currentQuestion.correct)}>Next Question</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'lightblue';
    case 'medium': return 'blue';
    case 'hard': return 'darkblue';
    default: return 'blue';
  }
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
