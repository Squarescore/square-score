import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../Universal/firebase';
import { doc, collection, updateDoc, where, query, getDocs, getDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import Navbar from '../../Universal/Navbar';
import { Brain, ClipboardList, ClipboardMinus, MessageSquareMore, Check, Slash, X } from 'lucide-react';
import { GlassContainer } from '../../../styles';

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
        fontSize: '1rem',
        fontWeight: '400',
        resize: 'none',
        outline: 'none',
        color: '#848484',
        overflow: 'hidden',
        background: 'transparent',
        padding: '0',
        margin: '0',
        lineHeight: '1.4',
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
  const [redVariant, setRedVariant] = useState('clear');
  const [yellowVariant, setYellowVariant] = useState('clear');
  const [greenVariant, setGreenVariant] = useState('clear');

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
  
    const { gradeDocId, studentUid } = currentResponse;
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
  
    const newRawTotal = updatedQuestions.reduce((sum, q) => sum + q.score, 0);
    const maxScore = reviewData.rawMaxScore || (updatedQuestions.length * 2);
    const newPercentageScore = (newRawTotal / maxScore) * 100;
    const newScaledScore = (newRawTotal / maxScore);
    const hasFlaggedQuestions = updatedQuestions.some(q => q.flagged);
  
    try {
      const batch = writeBatch(db);
      const studentRef = doc(db, 'students', studentUid);
  
      // Update grade document
      batch.update(reviewRef, {
        questions: updatedQuestions,
        rawTotalScore: newRawTotal,
        percentageScore: newPercentageScore,
        scaledScore: newScaledScore,
        hasFlaggedQuestions
      });
  
      // Update student's class grades
      batch.update(studentRef, {
        [`class_${reviewData.classId}.grades.${reviewData.assignmentId}`]: {
          score: newPercentageScore,
          submittedAt: reviewData.submittedAt,
          assignmentId: reviewData.assignmentId,
          assignmentName: reviewData.assignmentName,
        }
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
    width: '400px',
    display: 'flex',
    position: 'fixed',
    bottom: '40px',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '15px',
    height: '60px',
    padding: '10px 10px',
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
      }}
    >

<div style={{ 
  width: 'calc(100% - 200px)',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  background: 'rgb(255,255,255,.9)',
  backdropFilter: 'blur(5px)',
  marginTop: '0px',
  position: 'fixed',
  top: '70px',
  left: '200px',
  zIndex: 2
}}>
  <div style={{ 
    marginLeft: '4%', 
    width: '460px', 
    position: 'relative',
    alignItems: 'center'
  }}>
    <h1 style={{  
      fontWeight: '400',
      fontSize: '1rem',
      margin: '0',
      display: 'flex',
      alignItems: 'center',
      color: 'grey',
      height: '100%'
    }}>
      Responses Remaining: {reviewCount}
    </h1>

   <h1
           onClick={() => {
            if (currentResponse && currentResponse.studentUid) {
              navigateToStudentResults(currentResponse.studentUid);
            }  }}
            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
            style={{
              fontSize: '.8rem',
              fontWeight: '500',
              cursor: 'pointer',
              color: 'lightgrey',
            }}
          >
             Currently On: {currentResponse.studentName}
          </h1>

  </div>

  <div style={{
    marginLeft: 'auto',
    marginRight: '4%',
    
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  }}>
    {trainingCount < 50 && (
      <button
        onClick={() => setIsTrainingAI(!isTrainingAI)}
        style={{
          cursor: 'pointer',
          border: '1px solid #ddd',
          background: 'white',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          color: isTrainingAI ? '#D81BCB' : '#9ca3af',
          gap: '10px',
          padding: '5px 15px',
          fontFamily: "'montserrat', sans-serif",
          fontSize: '.9rem',
          fontWeight: "500",
        }}
       
      >
        <div
        style={{ display:"flex", gap: '10px'}}
        >
        <Brain
          size={20} 
          strokeWidth={1.5}
          color={isTrainingAI ? '#D81BCB' : '#9ca3af'}
        />
        <span>

          Train AI Grader ({trainingCount}/50)
        </span>
        </div>
      </button>
    )}

    
  </div>
  </div>
      <div
        style={{
          width: 'calc(92% - 200px)',
          
          position: 'absolute',
          left: 'calc(200px + 4%) ',
          textAlign: 'left',
          padding: '0px',
          borderRadius: '15px',
          marginTop: '0px',
        }}
      >
      
        <div
          style={{
            position: 'relative',
            width: '90%',
            marginBottom: '20px',
            marginTop: '60px',
            color: 'black',
          }}
        >
       
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px',  }}>
              <p
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuestionClick(currentQuestionGroup.questionId);
                }} 
                onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                style={{
                  margin: 0,
                  cursor: 'pointer',
                  fontSize: '1.3rem',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '400',
                  textAlign: 'left',
                }}
              >
                {currentQuestionGroup.questionText}
              </p>
              <button
                onClick={() => setShowRubric(!showRubric)}
                style={{
                  color: 'grey',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showRubric ? <ClipboardMinus strokeWidth={1.5} /> : <ClipboardList strokeWidth={1.5} />}
              </button>
            </div>

            {showRubric && (
              <div
                style={{
                  margin: '10px',
                  padding: '15px',
                  borderRadius: '10px',
                  color: 'grey',
                  fontFamily: "'montserrat', sans-serif",
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              ><div>
                <ClipboardList size={30} strokeWidth={1} style={{ marginTop: '2px', }} />
                </div>
                <span style={{borderLeft: '1px solid #ddd', paddingLeft: '10px'}}>{currentResponse.rubric}</span>
              </div>
            )}
        </div>

        <div
          style={{
            width: '90%',
            borderRadius: '15px',
            marginBottom: '10px',
          }}
        >
          {/* Student Response */}
          <GlassContainer
            variant="clear"
            size={0}
            style={{
              width: '100%',
              zIndex: '10',
              marginBottom: '30px'
            }}
            contentStyle={{
              padding: ' 15px 25px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '1rem',
                fontFamily: "'montserrat', sans-serif",
                fontWeight: '400',
                color: 'grey',
              }}
            >
              {currentResponse.studentResponse || 'Not provided'}
            </p>
          </GlassContainer>

          {/* Teacher Feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'lightgrey' }}>
              <MessageSquareMore size={20} strokeWidth={1.5} />
              <span style={{ fontSize: '.9rem', fontWeight: '500' }}>Feedback (click to edit)</span>
            </div>
            <AutoResizeTextarea
              value={currentResponse.feedback || ''}
              onChange={handleFeedbackChange}
              placeholder="Add feedback..."
            />
          </div>

       
        </div>
      </div>

      <div style={buttonContainerStyle}>
        <button
          onClick={handleBack}
          style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '40px',
            cursor: 'pointer',
            padding: '8px 16px',
            fontWeight: '500',
            fontSize: '.9rem',
            color: 'grey',
            fontFamily: "'montserrat', sans-serif",
            display: 'flex',
            alignItems: 'center'
          }}
        >
          Previous Response
        </button>

        <div style={{display: 'flex', gap: '20px'}}>
          <div
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              setRedVariant('red');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              setRedVariant('clear');
            }}
            style={{
              position: 'relative',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => handleGradeChange(0)}
          >
            <GlassContainer
              variant={redVariant}
              size={0}
            >
              <X size={30} strokeWidth={1.5} color={redVariant === 'red' ? "#ef4444" : "#9ca3af"} style={{ position: 'relative', padding: '8px' }} />
            </GlassContainer>
          </div>

          <div
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              setYellowVariant('yellow');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              setYellowVariant('clear');
            }}
            style={{
              position: 'relative',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => handleGradeChange(1)}
          >
            <GlassContainer
              variant={yellowVariant}
              size={0}
            >
              <Slash size={20} strokeWidth={2.5} color={yellowVariant === 'yellow' ? "#FFAE00" : "#9ca3af"} style={{ position: 'relative', padding: '13px' }} />
            </GlassContainer>
          </div>

          <div
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              setGreenVariant('green');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              setGreenVariant('clear');
            }}
            style={{
              position: 'relative',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => handleGradeChange(2)}
          >
            <GlassContainer
              variant={greenVariant}
              size={0}
            >
              <Check size={30} strokeWidth={1.5} color={greenVariant === 'green' ? "#2BB514" : "#9ca3af"} style={{ position: 'relative', padding: '8px' }} />
            </GlassContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReview;
