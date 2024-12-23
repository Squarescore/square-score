import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import axios from 'axios';
import {
  SquareX,
  CornerDownRight,
  Repeat,
  SquarePlus,
  ClipboardMinus,
  ClipboardList,
  SquareArrowLeft,
  Pencil,
  PencilOff,
  Trash,
  Trash2,
  ArrowRight,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import { debounce } from 'lodash'; // Ensure lodash is installed

import { useNavigate, useParams } from 'react-router-dom';
import QuestionResults from './QuestionResultsSAQ';

const QuestionBankSAQ = ({
  questionsWithIds,
  setQuestionsWithIds,
  sourceText,
  questionCount,
  classId,
  teacherId,
  assignmentId,
  autoOpenQuestionId, // Add this prop
}) => {
  const containerRef = useRef(null);
  const [questionStats, setQuestionStats] = useState({});
  const [editingQuestions, setEditingQuestions] = useState({});
  const [showRubrics, setShowRubrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { questionId } = useParams();
  const [students, setStudents] = useState([]);
  const [assignmentName, setAssignmentName] = useState('');
  const [questionData, setQuestionData] = useState(null);
  const [showResponseMap, setShowResponseMap] = useState({});
  const [showRubric, setShowRubric] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingEdits, setPendingEdits] = useState({}); // Buffer for unsaved edits
  const debouncedSaveToFirestore = debounce(async (updatedQuestions, assignmentId) => {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const questionsObject = {};
      updatedQuestions.forEach((q) => {
        questionsObject[q.questionId] = {
          question: q.question,
          rubric: q.rubric,
          questionId: q.questionId,
        };
      });

      await updateDoc(assignmentRef, {
        questions: questionsObject,
      });
      console.log('Successfully saved questions to Firestore');
    } catch (error) {
      console.error('Error saving to Firestore:', error);
    }
  }, 2000);

  // Remove the useCallback wrapper and create a debounced function instance
  const debouncedSaveEdits = debounce(async (questionId, updatedQuestion, updatedRubric, currentQuestions, assignmentId) => {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      
      const questionsObject = currentQuestions.reduce((acc, q) => {
        if (q.questionId === questionId) {
          acc[q.questionId] = {
            question: updatedQuestion,
            rubric: updatedRubric,
            questionId: q.questionId
          };
        } else {
          acc[q.questionId] = {
            question: q.question,
            rubric: q.rubric,
            questionId: q.questionId
          };
        }
        return acc;
      }, {});

      await updateDoc(assignmentRef, {
        questions: questionsObject
      });
      
      console.log('Successfully updated question:', questionId);
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  }, 1000);

  // Use useEffect for cleanup
  useEffect(() => {
    return () => {
      debouncedSaveToFirestore.cancel();
      debouncedSaveEdits.cancel();
    };
  }, []);

  const handleEditQuestion = (index, field, value) => {
    const updatedQuestions = [...questionsWithIds];
    const questionToUpdate = { ...updatedQuestions[index] };
    questionToUpdate[field] = value;
    updatedQuestions[index] = questionToUpdate;
  
    // Update local state
    setQuestionsWithIds(updatedQuestions);
  
    // Save to Firestore with debounce
    debouncedSaveEdits(
      questionToUpdate.questionId,
      field === 'question' ? value : questionToUpdate.question,
      field === 'rubric' ? value : questionToUpdate.rubric,
      updatedQuestions,
      assignmentId
    );
  };

  const handleBlur = () => {
    // Immediately save any pending changes on blur
    if (questionsWithIds.length > 0) {
      debouncedSaveToFirestore.flush();
      debouncedSaveEdits.flush();
    }
  };

  const handleDeleteQuestion = async (questionIdToDelete) => {
    console.log(`Deleting Question ID: ${questionIdToDelete}`);
    const updatedQuestions = questionsWithIds.filter(
      (q) => q.questionId !== questionIdToDelete
    );

    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const questionsObject = updatedQuestions.reduce((acc, question) => {
        acc[question.questionId] = {
          question: question.question,
          rubric: question.rubric,
          questionId: question.questionId,
        };
        return acc;
      }, {});

      await updateDoc(assignmentRef, {
        questions: questionsObject,
      });

      setQuestionsWithIds(updatedQuestions);
      setEditingQuestions((prev) => {
        const newState = { ...prev };
        delete newState[questionIdToDelete];
        return newState;
      });
      setShowRubrics((prev) => {
        const newState = { ...prev };
        delete newState[questionIdToDelete];
        return newState;
      });
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };


  const handleEditQuestionToggle = (qId) => {
    setEditingQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const toggleRubric = (questionId) => {
    setShowRubrics((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Sort questions alphabetically
  const sortedQuestions = useMemo(() => {
    return [...questionsWithIds].sort((a, b) =>
      a.question.toLowerCase().localeCompare(b.question.toLowerCase())
    );
  }, [questionsWithIds]);

  useEffect(() => {
    if (autoOpenQuestionId) {
      setSelectedQuestionId(autoOpenQuestionId);
      setIsModalOpen(true);
    }
  }, [autoOpenQuestionId]);

  const updateQuestionContent = async (newQuestion, newRubric) => {
    try {
      // Get all grade documents for this assignment
      const gradesRef = collection(db, 'grades');
      const gradesQuery = query(
        gradesRef,
        where('assignmentId', '==', assignmentId)
      );
      const gradesSnapshot = await getDocs(gradesQuery);

      // Update each grade document
      const updatePromises = gradesSnapshot.docs.map(async (gradeDoc) => {
        const gradeData = gradeDoc.data();
        const updatedQuestions = gradeData.questions.map((q) => {
          if (q.questionId === questionId) {
            return {
              ...q,
              question: newQuestion,
              rubric: newRubric,
            };
          }
          return q;
        });

        // Update the document
        return updateDoc(doc(db, 'grades', gradeDoc.id), {
          questions: updatedQuestions,
        });
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Update local state
      setQuestionData((prev) => ({
        ...prev,
        question: newQuestion,
        rubric: newRubric,
      }));

      // Exit editing mode
      setEditingQuestions((prev) => ({
        ...prev,
        [questionId]: false,
      }));
    } catch (error) {
      console.error('Error updating question content:', error);
    }
  };

  // Add event handlers for saving edits
  const handleQuestionBlur = async () => {
    if (editingQuestions[questionId]) {
      await updateQuestionContent(questionData.question, questionData.rubric);
    }
  };

  const handleRubricBlur = async () => {
    if (editingQuestions[questionId]) {
      await updateQuestionContent(questionData.question, questionData.rubric);
    }
  };

  // ... (Other functions remain unchanged)

  // Calculate question stats (unchanged)
  const calculateQuestionStats = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Calculating stats for:', {
        assignmentId,
        classId,
        questionsCount: questionsWithIds.length,
      });

      const gradesRef = collection(db, 'grades');
      const gradesQuery = query(
        gradesRef,
        where('assignmentId', '==', assignmentId),
        where('classId', '==', classId)
      );

      const gradesSnapshot = await getDocs(gradesQuery);

      // Create a map of questions by their question text to handle different ID formats
      const questionMap = {};
      questionsWithIds.forEach((question) => {
        // Use the question text as the key since it's consistent
        const questionKey = question.question.toLowerCase().trim();
        questionMap[questionKey] = {
          questionId: question.questionId,
          stats: {
            totalAttempts: 0,
            totalScore: 0,
            scores: [],
          },
        };
      });

      // Process grades
      gradesSnapshot.forEach((doc) => {
        const gradeData = doc.data();
        if (!gradeData.questions || !Array.isArray(gradeData.questions)) {
          console.warn('Invalid grade document structure:', doc.id);
          return;
        }

        gradeData.questions.forEach((gradeQuestion) => {
          // Find matching question by text instead of ID
          const questionKey = gradeQuestion.question.toLowerCase().trim();
          const questionData = questionMap[questionKey];

          if (!questionData) {
            console.warn('No matching question found for:', questionKey);
            return;
          }

          const score = Number(gradeQuestion.score);
          if (isNaN(score)) {
            console.warn('Invalid score for question:', questionKey);
            return;
          }

          questionData.stats.totalAttempts++;
          questionData.stats.totalScore += score;
          questionData.stats.scores.push(score);
        });
      });

      // Calculate percentages
      const percentages = {};
      Object.values(questionMap).forEach(({ questionId, stats }) => {
        if (stats.totalAttempts > 0) {
          const averageScore = stats.totalScore / stats.totalAttempts;
          const percentage = Math.round((averageScore / 2) * 100);
          percentages[questionId] = percentage;
        } else {
          percentages[questionId] = null;
        }
      });

      console.log('Calculated percentages:', percentages);
      setQuestionStats(percentages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error calculating question stats:', error);
      setIsLoading(false);
    }
  }, [assignmentId, classId, questionsWithIds]);

  useEffect(() => {
    if (questionsWithIds.length > 0 && classId && assignmentId) {
      calculateQuestionStats();
    }

    return () => {
      setIsLoading(true);
    };
  }, [calculateQuestionStats, questionsWithIds, classId, assignmentId]);

  // Render stats badge (unchanged)
  const renderStatsBadge = (questionId) => {
    const percentage = questionStats[questionId];
    if (percentage === null) return null;

    let textColor = '#2BB514';
    if (percentage < 80) textColor = '#FFA500';
    if (percentage < 60) textColor = '#FF0000';

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Opening modal for question:', questionId); // Debug log
          setSelectedQuestionId(questionId);
          setIsModalOpen(true);
        }}
        style={{
          position: 'absolute',
          right: '4%',
          top: '50%',
          height: '30px',
          transform: 'translateY(-50%)',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          background: 'white',
          border: 'none',
          display: 'flex',
          lineHeight: '10px',
          color: textColor,
          cursor: 'pointer',
          minWidth: '40px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            marginTop: '8px',
            fontFamily: "'montserrat', sans-serif",
            width: '40px',
            textAlign: 'left',
          }}
        >
          {percentage}%
        </p>
        <ArrowRight size={20} style={{ marginTop: '3px', marginLeft: '0px' }} />
      </button>
    );
  };

  const handleQuestionSelect = (qId) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedQuestionId(qId);
      setIsTransitioning(false);
    }, 300);
  };

  const handleCloseResults = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedQuestionId(null);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', marginTop: '-40px' }}>
      {selectedQuestionId && (
        <div
          style={{
            position: 'absolute',
            top: '160px',
            left: '200px',
            right: '0',
            bottom: '0',
            backgroundColor: 'white',
            zIndex: 10,
            transition: 'opacity 0.3s ease-in-out',
            opacity: isTransitioning ? 0 : 1,
          }}
        >
          <button
            onClick={handleCloseResults}
            style={{
              top: '180px',
              left: '210px',
              position: 'fixed',
              zIndex: '10',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} color="gray" />
          </button>
          <QuestionResults
            assignmentId={assignmentId}
            questionId={selectedQuestionId}
            inModal={false}
          />
        </div>
      )}

      <div
        style={{
          opacity: selectedQuestionId ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: selectedQuestionId ? 'none' : 'auto',
          position: 'relative',
        }}
      >
        {sortedQuestions.map((question) => {
          const isEditing = editingQuestions[question.questionId];
          const showRubric = showRubrics[question.questionId];

          const textareaStyle = {
            padding: '15px',
            paddingRight: '8%',
            fontFamily: isEditing
              ? 'default'
              : "'montserrat', sans-serif",
            fontWeight: '500',
            fontSize: '16px',
            borderRadius: '0px 10px 10px 0px',
            width: 'calc(70% - 40px)',
            resize: 'none',
            lineHeight: '1.2',
            background: 'white', // Light background when editing
          };

          const rubricTextareaStyle = {
            width: '70%',
            border: '0px solid #F4F4F4',
            padding: '15px',
            fontWeight: '500',
            color: 'grey',
            outline: 'none',
            fontSize: '14px',
            marginLeft: '-4px',
            borderRadius: '0px 10px 10px 0px',
            resize: 'none',
            fontFamily: isEditing
              ? 'default'
              : "'montserrat', sans-serif",
          };

          return (
            <div
              key={question.questionId}
              style={{
                padding: '0px',
                marginTop: '10px',
                marginBottom: '20px',
                paddingBottom: '5px',
                paddingLeft: '4%',
                borderBottom: '1px solid lightgrey',
                width: '96%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Question section */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  display: 'flex',
                  fontSize: '12px',
                  position: 'relative',
                  marginBottom: '10px',
                }}
              >
                {/* Number section */}
                <div
                  style={{
                    marginRight: '-4px',
                    zIndex: '1',
                    background: 'white',
                    color: 'black',
                    padding: '6px 8px',
                    border: '4px solid white',
                    borderRadius: '10px 0px 0px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    alignSelf: 'stretch',
                    position: 'relative',
                  }}
                >
                  <h1
                    style={{
                      margin: 'auto',
                      fontWeight: '600',
                      fontSize: '16px',
                    }}
                  >
                    {sortedQuestions.indexOf(question) + 1}.
                  </h1>
                </div>

                {/* Question text area */}
                {isEditing ? (
                  <TextareaAutosize
                    style={textareaStyle}
                    value={question.question}
                    onChange={(e) =>
                      handleEditQuestion(
                        question.questionId,
                        'question',
                        e.target.value
                      )
                    }
                    onBlur={handleBlur}
                    minRows={1}
                  />
                ) : (
                  <div style={textareaStyle}>{question.question}</div>
                )}

                <button
                  onClick={() => toggleRubric(question.questionId)}
                  style={{
                    position: 'absolute',
                    transform: 'translateY(-50%)',
                    top: '50%',
                    right: '17%',
                    cursor: 'pointer',
                    fontSize: '16px',
                    background: 'white',
                    border: '0px solid lightgrey',
                    borderRadius: '8px',
                    height: '40px',
                    width: '40px',
                    color: 'grey',
                  }}
                >
                  {showRubric ? (
                    <ClipboardMinus
                      style={{ marginLeft: '-2px', marginTop: '2px' }}
                    />
                  ) : (
                    <ClipboardList
                      style={{ marginLeft: '-2px', marginTop: '2px' }}
                    />
                  )}
                </button>

                <button
                  onClick={() => handleEditQuestionToggle(question.questionId)}
                  style={{
                    position: 'absolute',
                    right: '14%',
                    transform: 'translateY(-50%)',
                    top: '50%',
                    fontSize: '16px',
                    zIndex: '1',
                    height: '25px',
                    width: '25px',
                    borderRadius: '6px',
                    background: 'white',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ marginTop: '0px', marginLeft: '-4px' }}>
                    {isEditing ? (
                      <PencilOff
                        size={20}
                        color={'grey'}
                        strokeWidth={2}
                      />
                    ) : (
                      <Pencil size={20} color={'grey'} strokeWidth={2} />
                    )}
                  </div>
                </button>

                {renderStatsBadge(question.questionId)}
              </div>

              {/* Rubric section */}
              {showRubric && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '-80px',
                    position: 'relative',
                    marginBottom: '20px',
                  }}
                >
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteQuestion(question.questionId)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        bottom: '-10px',
                        fontSize: '16px',
                        zIndex: '10',
                        height: '30px',
                        width: '30px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2
                        size={30}
                        color="grey"
                        strokeWidth={2}
                      />
                    </button>
                  )}

                  <div style={{ marginLeft: '100px' }}>
                    <CornerDownRight
                      size={40}
                      color="#c9c9c9"
                      strokeWidth={2}
                    />
                  </div>
                  <div
                    style={{
                      width: '30px',
                      padding: '8px',
                      background: 'white',
                      border: '4px solid white',
                      color: 'grey',
                      zIndex: '10',
                      marginLeft: '0px',
                      borderRadius: '10px 0px 0px 10px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'stretch',
                    }}
                  >
                    <ClipboardList style={{ margin: 'auto' }} size={30} />
                  </div>
                  {isEditing ? (
                    <TextareaAutosize
                      style={rubricTextareaStyle}
                      value={`${question.rubric}`}
                      onChange={(e) =>
                        handleEditQuestion(
                          question.questionId,
                          'rubric',
                          e.target.value
                        )
                      }
                      onBlur={handleBlur}
                      minRows={1}
                    />
                  ) : (
                    <div style={rubricTextareaStyle}>
                      {`${question.rubric}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionBankSAQ;
