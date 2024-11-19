import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../Universal/firebase';
import { doc, collection, updateDoc, where, query, getDocs, getDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import { Brain, ClipboardList, MessageSquareMore, SquareCheck, SquareSlash, SquareX } from 'lucide-react';

const AutoResizeTextarea = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      style={{
        width: '100%',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        resize: 'none',
        outline: 'none',
        color: '#848484',
        overflow: 'hidden',
        background: 'transparent',
        padding: '0',
        margin: '0',
        lineHeight: '1.5',
      }}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
    />
  );
};

const TeacherReview = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [groupedFlaggedQuestions, setGroupedFlaggedQuestions] = useState([]);
  const [currentQuestionGroupIndex, setCurrentQuestionGroupIndex] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [assignmentName, setAssignmentName] = useState('');
  const [showRubric, setShowRubric] = useState(false);

  const handleQuestionClick = (questionId) => {
    navigate(`/class/${classId}/assignment/${assignmentId}/TeacherResults/`, {
      state: {
        targetTab: 'questionBank',
        targetQuestionId: questionId,
        openQuestionResults: true
      }
    });
  };

  useEffect(() => {
    const fetchAssignmentName = async () => {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (assignmentDoc.exists()) {
        setAssignmentName(assignmentDoc.data().assignmentName);
      }
    };

    const fetchClassAndReviews = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      if (classDoc.exists()) {
        const classData = classDoc.data();
        if (classData && classData.participants) {
          const sortedStudents = classData.participants.sort((a, b) =>
            a.name.split(' ').pop().localeCompare(b.name.split(' ').pop())
          );
          setStudents(sortedStudents);
        }
      }
    };

    fetchAssignmentName();
    fetchClassAndReviews();
  }, [classId, assignmentId]);

  // New useEffect to call fetchReviewsNeedingAttention after students are loaded
  useEffect(() => {
    if (students.length > 0) {
      fetchReviewsNeedingAttention();
    }
  }, [students]);

  const fetchReviewsNeedingAttention = async () => {
    const gradesCollection = collection(db, 'grades');
    const gradesQuery = query(gradesCollection, where('assignmentId', '==', assignmentId));
    const querySnapshot = await getDocs(gradesQuery);

    let questionGroups = {};

    querySnapshot.forEach((doc) => {
      const gradeData = doc.data();
      gradeData.questions.forEach((question) => {
        if (question.flagged) {
          const questionText = question.question;
          const questionId = question.questionId || question.id || question.Id; // Try different possible ID fields
          
          const key = `${questionText}_${questionId}`; // Create unique key combining text and ID
          
          if (!questionGroups[key]) {
            questionGroups[key] = {
              questionText,
              questionId,
              responses: []
            };
          }
          
          questionGroups[key].responses.push({
            ...question,
            studentUid: gradeData.studentUid,
            studentName:
              students.find((student) => student.uid === gradeData.studentUid)?.name || 'Unknown Student',
            gradeDocId: doc.id,
          });
        }
      });
    });

    // Convert to array and sort
    const sortedQuestionGroups = Object.values(questionGroups)
      .sort((a, b) => a.questionText.localeCompare(b.questionText));

    setGroupedFlaggedQuestions(sortedQuestionGroups);
    setCurrentQuestionGroupIndex(0);
    setCurrentResponseIndex(0);

    const totalFlaggedResponses = sortedQuestionGroups.reduce(
      (acc, group) => acc + group.responses.length,
      0
    );
    setReviewCount(totalFlaggedResponses);
  };

  useEffect(() => {
    let timeoutId;
    const currentResponse =
      groupedFlaggedQuestions[currentQuestionGroupIndex]?.responses[currentResponseIndex];

    if (currentResponse?.feedback) {
      timeoutId = setTimeout(async () => {
        const reviewRef = doc(db, 'grades', currentResponse.gradeDocId);
        const reviewDoc = await getDoc(reviewRef);
        const reviewData = reviewDoc.data();

        const updatedQuestions = reviewData.questions.map((q) => {
          if (q.question === currentResponse.question && q.flagged) {
            return {
              ...q,
              feedback: currentResponse.feedback,
            };
          }
          return q;
        });

        await updateDoc(reviewRef, {
          questions: updatedQuestions,
          // Update hasFlaggedQuestions based on the new flagged statuses
          hasFlaggedQuestions: updatedQuestions.some(q => q.flagged),
        });
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [groupedFlaggedQuestions, currentQuestionGroupIndex, currentResponseIndex]);

  const [isTrainingAI, setIsTrainingAI] = useState(false);
  const [trainingCount, setTrainingCount] = useState(0);
  
  // Add after initial useEffect
  useEffect(() => {
    const fetchTrainingCount = async () => {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);
      if (classDoc.exists()) {
        const data = classDoc.data();
        setTrainingCount(data.aiTrainingData?.length || 0);
      }
    };
    
    fetchTrainingCount();
  }, [classId]);
  useEffect(() => {
    if (isTrainingAI) {
      // Clear feedback when entering training mode
      setGroupedFlaggedQuestions(prev => {
        const newGroups = [...prev];
        if (newGroups[currentQuestionGroupIndex]?.responses[currentResponseIndex]) {
          newGroups[currentQuestionGroupIndex].responses[currentResponseIndex].feedback = '';
        }
        return newGroups;
      });
    }
  }, [isTrainingAI, currentQuestionGroupIndex, currentResponseIndex]);
  
  // Update handleGradeChange to include feedback in training data
  const handleGradeChange = async (newGrade) => {
    const currentQuestionGroup = groupedFlaggedQuestions[currentQuestionGroupIndex];
    const currentResponse = currentQuestionGroup.responses[currentResponseIndex];
  
    const { gradeDocId } = currentResponse;
    const reviewRef = doc(db, 'grades', gradeDocId);
    const reviewDoc = await getDoc(reviewRef);
    const reviewData = reviewDoc.data();
  
    const updatedQuestions = reviewData.questions.map((q) => {
      if (q.question === currentResponse.question && q.flagged) {
        return {
          ...q,
          score: newGrade,
          flagged: false,
          feedback: currentResponse.feedback || '',
        };
      }
      return q;
    });
  
    const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
    const totalScore = updatedQuestions.reduce((accum, current) => accum + current.score, 0);
    const maxScore = updatedQuestions.length * 2;
  
    try {
      const batch = writeBatch(db);
  
      batch.update(reviewRef, {
        questions: updatedQuestions,
        hasFlaggedQuestions: hasFlaggedQuestions,
        totalScore,
        maxScore,
        percentageScore: (totalScore / maxScore) * 100,
      });
  
      if (isTrainingAI && trainingCount < 50) {
        const classRef = doc(db, 'classes', classId);
        const trainingData = {
          question: currentQuestionGroup.questionText,
          rubric: currentResponse.rubric,
          studentResponse: currentResponse.studentResponse,
          score: newGrade,
          feedback: currentResponse.feedback || '', // Include feedback in training data
          timestamp: new Date().getTime()
        };
  
        batch.update(classRef, {
          aiTrainingData: arrayUnion(trainingData)
        });
  
        setTrainingCount(prev => prev + 1);
      }
  
      await batch.commit();
  
      // Decrement review count
      setReviewCount(prevCount => prevCount - 1);
  
      // Navigation logic with feedback clearing for training mode
      if (currentResponseIndex < currentQuestionGroup.responses.length - 1) {
        setCurrentResponseIndex(currentResponseIndex + 1);
        // Clear feedback for next question if in training mode
        if (isTrainingAI) {
          setGroupedFlaggedQuestions(prev => {
            const newGroups = [...prev];
            if (newGroups[currentQuestionGroupIndex]?.responses[currentResponseIndex + 1]) {
              newGroups[currentQuestionGroupIndex].responses[currentResponseIndex + 1].feedback = '';
            }
            return newGroups;
          });
        }
      } else if (currentQuestionGroupIndex < groupedFlaggedQuestions.length - 1) {
        setCurrentQuestionGroupIndex(currentQuestionGroupIndex + 1);
        setCurrentResponseIndex(0);
        // Clear feedback for next question if in training mode
        if (isTrainingAI) {
          setGroupedFlaggedQuestions(prev => {
            const newGroups = [...prev];
            if (newGroups[currentQuestionGroupIndex + 1]?.responses[0]) {
              newGroups[currentQuestionGroupIndex + 1].responses[0].feedback = '';
            }
            return newGroups;
          });
        }
      } else {
        fetchReviewsNeedingAttention();
      }
    } catch (error) {
      console.error("Error updating grade:", error);
    }
  };
  
  // Update handleBack to increment review count
  const handleBack = () => {
    if (currentResponseIndex > 0) {
      setCurrentResponseIndex(currentResponseIndex - 1);
    } else if (currentQuestionGroupIndex > 0) {
      const previousGroupIndex = currentQuestionGroupIndex - 1;
      setCurrentQuestionGroupIndex(previousGroupIndex);
      const previousGroup = groupedFlaggedQuestions[previousGroupIndex];
      setCurrentResponseIndex(previousGroup.responses.length - 1);
    } else {
      navigate(-1);
      return;
    }
    // Increment review count when going back
    setReviewCount(prevCount => prevCount + 1);
  };
  const handleFeedbackChange = (e) => {
    const feedback = e.target.value;
    setGroupedFlaggedQuestions((prevGroups) => {
      const newGroups = [...prevGroups];
      newGroups[currentQuestionGroupIndex].responses[currentResponseIndex].feedback = feedback;
      return newGroups;
    });
  };



  if (groupedFlaggedQuestions.length === 0) {
    return <div>No responses are currently for review</div>;
  }

  const currentQuestionGroup = groupedFlaggedQuestions[currentQuestionGroupIndex];
  const currentResponse = currentQuestionGroup.responses[currentResponseIndex];

  const buttonContainerStyle = {
    width: '250px',
    display: 'flex',
    position: 'fixed',
    bottom: '40px',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '15px',
    height: '60px',
    padding: '10px 10px',
    background: 'white',
    left: 'calc(200px + 4%)',
    marginTop: '20px',
  };
  const navigateToStudentResults = (studentUid) => {
    navigate(`/teacherStudentResults/${assignmentId}/${studentUid}/${classId}`);
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          width: 'calc(92% - 200px)',
          position: 'absolute',
          left: 'calc(200px + 4%) ',
          textAlign: 'left',
          backgroundColor: 'white',
          padding: '0px',
          borderRadius: '15px',
          marginTop: '0px',
        }}
      >
        <div style={{ display: 'flex' }}>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: '600',
            }}
          >
            {reviewCount} Flagged Responses
          </h2>

          {trainingCount < 50 && (
      <div style={{ 
        position: 'fixed',
        bottom: '150px',
        left: 'calc(200px + 4%)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: isTrainingAI ? '#f0fdf4' : 'white',
        padding: '8px 16px',
        borderRadius: '10px',
        border: `1px solid ${isTrainingAI ? '#86efac' : '#e5e7eb'}`,
        cursor: 'pointer'
      }}
      onClick={() => setIsTrainingAI(!isTrainingAI)}
      >
        <Brain
          size={20} 
          color={isTrainingAI ? '#22c55e' : '#9ca3af'}
        />
        <span style={{
          fontSize: '14px',
          fontWeight: '500',
          color: isTrainingAI ? '#22c55e' : '#9ca3af'
        }}>
          Train AI Grader ({trainingCount}/50)
        </span>
      </div>
    )}
          <button
            style={{
              background: 'white',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px',
              marginLeft: 'auto',
              padding: '10px 20px',
              fontWeight: '600',
              fontSize: '16px',
              color: 'grey',
              lineHeight: '10px',
              height: '35px',
              border: '1px solid lightgrey',
              fontFamily: "'montserrat', sans-serif",
            }}
            onClick={handleBack}
          >
            Previous Response
          </button>
        </div>
        <div
          style={{
            position: 'relative',
            width: '750px',
            marginBottom: '20px',
            backgroundColor: 'white',
            borderRadius: '15px',
            color: 'black',
          }}
        >
          <h1
           onClick={() => {
            if (currentResponse && currentResponse.studentUid) {
              navigateToStudentResults(currentResponse.studentUid);
            }  }}
            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
            style={{
              fontSize: '14px',
              marginTop: '50px',
              cursor: 'pointer',
              color: 'lightgray',
            }}
          >
            {currentResponse.studentName}
          </h1>
          <button
            onClick={() => setShowRubric(!showRubric)}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              color: 'grey',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ClipboardList />
          </button>

          <p
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuestionClick(currentQuestionGroup.questionId);
          }} onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
            style={{
              width: '630px',
              marginTop: '15px',
              cursor: 'pointer',
              fontSize: '18px',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: '600',
              textAlign: 'left',
            }}
          >
            {currentQuestionGroup.questionText}
          </p>

          {showRubric && (
            <div
              style={{
                margin: '20px',
                padding: '15px',
                background: '#f4f4f4',
                borderRadius: '10px',
                color: 'grey',
                fontFamily: "'montserrat', sans-serif",
                fontSize: '14px',
              }}
            >
              {currentResponse.rubric}
            </div>
          )}
        </div>

        <div
          style={{
            width: '700px',
            borderRadius: '15px',
            marginBottom: '10px',
          }}
        >
          {/* Student Response */}
          <div
            style={{
              background: '#f4f4f4',
              padding: '10px',
              borderLeft: '4px solid #7B7B7B',
              color: '#7B7B7B',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontFamily: "'montserrat', sans-serif",
                fontWeight: '500',
              }}
            >
              {currentResponse.studentResponse || 'Not provided'}
            </p>
          </div>

          {/* Teacher Feedback */}
          <div style={{ display: 'flex', width: '100%', marginTop: '30px' }}>
            <div
              style={{
                border: '0px solid lightgrey',
                color: '#848484',
                width: '40px',
                borderRadius: '10px 0px 0px 10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '-4px',
                zIndex: '1',
              }}
            >
              <MessageSquareMore size={25} />
            </div>
            <div
              style={{
                flex: 1,
                marginLeft: '-4px',
                background: 'white',
                borderRadius: '0px 10px 10px 0px',
                padding: '10px 15px',
              }}
            >
              <AutoResizeTextarea
                value={currentResponse.feedback || ''}
                onChange={handleFeedbackChange}
                placeholder="Add feedback..."
              />
            </div>
          </div>
        </div>
      </div>

      <div style={buttonContainerStyle}>
        <button
          onClick={() => handleGradeChange(0)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#ffebeb')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <SquareX size={40} color="#ef4444" />
        </button>

        <button
          onClick={() => handleGradeChange(1)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#fff7ed')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <SquareSlash size={40} color="#FFAE00" />
        </button>

        <button
          onClick={() => handleGradeChange(2)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f0fdf4')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <SquareCheck size={40} color="#2BB514" />
        </button>
      </div>
    </div>
  );
};

export default TeacherReview;
