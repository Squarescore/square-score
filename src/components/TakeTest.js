import React, { useState, useEffect } from 'react';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import Loader from './Loader';

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
  const studentUid = auth.currentUser.uid;
  const navigate = useNavigate();
  const [saveAndExit, setSaveAndExit] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  useEffect(() => {
    const fetchAssignmentAndProgress = async () => {
      setLoading(true);
      try {
        console.log('Fetching assignment:', assignmentId);
        const assignmentRef = doc(db, 'assignments(saq)', assignmentId);
        const assignmentDoc = await getDoc(assignmentRef);

        if (assignmentDoc.exists()) {
          const assignmentData = assignmentDoc.data();
          console.log('Assignment data:', assignmentData);
          setAssignmentName(assignmentData.assignmentName);
          setTimeLimit(assignmentData.timer * 60);
          setClassId(assignmentData.classId);
          setSaveAndExit(assignmentData.saveAndExit);
          setLockdown(assignmentData.lockdown || false);

          // Check if there's saved data for the student
          const progressRef = doc(db, 'assignments(progress:saq)', `${assignmentId}_${studentUid}`);
          const savedDataDoc = await getDoc(progressRef);

          if (savedDataDoc.exists()) {
            const savedData = savedDataDoc.data();
            setQuestions(savedData.questions.map(q => ({
              questionId: q.questionId,
              text: q.text,
              expectedResponse: q.expectedResponse
            })));
            setAnswers(savedData.questions.map(q => ({
              questionId: q.questionId,
              answer: q.studentResponse || ''
            })));
            setSecondsLeft(savedData.timeRemaining);
          } else {
            const allQuestions = Object.entries(assignmentData.questions).map(([id, data]) => ({
              questionId: id,
              text: data.question,
              expectedResponse: data.expectedResponse
            }));

            const studentQuestionCount = assignmentData.questionCount.student;
            const randomQuestions = getRandomSubset(allQuestions, studentQuestionCount);

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
    const handleVisibilityChange = () => {
      if (lockdown) {
        if (document.hidden) {
          handleLockdownViolation();
        }
      }
    };
  
    const handleResize = () => {
      if (lockdown) {
        handleLockdownViolation();
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [lockdown]);
  useEffect(() => {
    if (timeLimit !== null) {
      setSecondsLeft(timeLimit);
      if (timeLimit > 0) {
        setTimerStarted(true);
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

  const handleLockdownViolation = async () => {
    if (saveAndExit) {
      await saveProgress();
      setAssignmentStatus('open');
      navigate(`/studentAssignments/${classId}`);
    } else {
      await saveProgress();
      setAssignmentStatus('paused');
    }
  };






  const submitButton = () => {
    if (!isSubmitting && window.confirm("Are you sure you want to submit your response?")) {
      handleSubmit();
    }
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Grade the assignment
      const gradingResults = await gradeAssignment(questions, answers);
  
      // Combine grading results with question and student response
      const combinedResults = gradingResults.map((result, index) => ({
        ...result,
        question: questions[index].text,
        studentResponse: answers[index].answer,
        flagged: false // Initialize flagged state to false for each question
      }));
  
      // Calculate the total score
      const totalScore = combinedResults.reduce((sum, result) => sum + result.score, 0);
      const maxScore = questions.length * 2; // Assuming each question is worth 2 points
      const percentageScore = (totalScore / maxScore) * 100;
  
      // Create the grade document
      const gradeDocRef = doc(db, `grades(saq)`, `${assignmentId}_${studentUid}`);
      await setDoc(gradeDocRef, {
        assignmentId,
        studentUid,
        assignmentName,
        classId,
        submittedAt: serverTimestamp(),
        totalScore,
        maxScore,
        percentageScore,
        questions: combinedResults,
        viewable: false, // Initialize viewable status to false
      });
  
      // Update student's assignment status
      const studentRef = doc(db, 'students', studentUid);
      await updateDoc(studentRef, {
        assignmentsToTake: arrayRemove(assignmentId),
        assignmentsInProgress: arrayRemove(assignmentId),
        assignmentsTaken: arrayUnion(assignmentId)
      });
  
      // Remove the progress document if it exists
      const progressRef = doc(db, 'assignments(progress:saq)', `${assignmentId}_${studentUid}`);
      await deleteDoc(progressRef);
  
      navigate(`/studentassignments/${classId}`);
    } catch (error) {
      console.error("Error submitting and grading assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const gradeAssignment = async (questions, answers) => {
    try {
      const questionsToGrade = questions.map((question, index) => ({
        questionId: question.questionId,
        question: question.text,
        expectedResponse: question.expectedResponse,
        studentResponse: answers[index].answer,
      }));
  
      const response = await fetch('https://us-central1-square-score-ai.cloudfunctions.net/GradeSAQ', {
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
  












  const saveProgress = async () => {
    try {
      const progressRef = doc(db, 'assignments(progress:saq)', `${assignmentId}_${studentUid}`);
      await setDoc(progressRef, {
        assignmentId,
        studentUid,
        questions: questions.map(question => ({
          questionId: question.questionId,
          text: question.text,
          expectedResponse: question.expectedResponse,
          studentResponse: answers.find(answer => answer.questionId === question.questionId)?.answer || ''
        })),
        timeRemaining: secondsLeft,
        savedAt: serverTimestamp(),
        status: assignmentStatus // Add this line
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
    let saveInterval;
    if (saveAndExit && !loading && questions.length > 0) {
      saveInterval = setInterval(() => {
        saveProgress();
      }, 20000); // Save every 5 minutes
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
          {showTimer ? <img style={{ width: '60px', opacity: '90%' }} src='/hidecon.png' /> : <img style={{ width: '60px', opacity: '90%' }} src='/eyecon.png' />}
        </button>
      </div>
      {loading &&
        <div style={loadingModalStyle}>
          <div style={loadingModalContentStyle}>
            <p style={{ fontSize: '30px', fontFamily: "'Radio Canada', sans-serif", fontWeight: 'bold', position: 'absolute', color: 'black', top: '25%', left: '50%', transform: 'translate(-50%, -30%)' }}>
              Grading in Progress </p>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div class="lds-ripple"><div></div><div></div></div>
            </div>
          </div>
        </div>
      }
      <header
        style={{
          backgroundColor: 'white', position: 'fixed',
          borderRadius: '10px',
          color: 'white',
          height: '90px',
          display: 'flex',
          borderBottom: '5px solid lightgrey',
          marginTop: '0px',
          marginBottom: '40px',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <img style={{ width: '390px', marginLeft: '20px', marginTop: '-20px' }} src="/SquareScore.png" alt="logo" />
      </header>
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
      {saveAndExit && (
        <button
          onClick={async () => {
            await saveProgress();
            navigate(`/studentclasshome/${classId}`);
          }}
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
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.01)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Save & Exit
        </button>
      )}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '50px' }}>
            <button
              style={currentQuestionIndex > 0 ? buttonStyles.active : buttonStyles.default}
              onClick={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(prev => prev - 1) : null}
            >
              <img
                src={currentQuestionIndex > 0 ? '/rightgreenarrow.png' : '/rightgreyarrow.png'}
                alt="Previous"
                style={{ width: '100%', transform: 'scaleX(-1)', cursor: currentQuestionIndex > 0 ? 'pointer' : 'default' }}
              />
            </button>
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
              style={currentQuestionIndex < questions.length - 1 ? buttonStyles.active : buttonStyles.default}
              onClick={currentQuestionIndex < questions.length - 1 ? () => setCurrentQuestionIndex(prev => prev + 1) : null}
            >
              <img
                src={currentQuestionIndex < questions.length - 1 ? '/rightgreenarrow.png' : '/rightgreyarrow.png'}
                alt="Next"
                style={{ width: '100%', cursor: currentQuestionIndex < questions.length - 1 ? 'pointer' : 'default' }}
              />
            </button>
          </div>
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

export default TakeTests;
