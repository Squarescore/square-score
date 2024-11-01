import React, { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import axios from 'axios';
import { SquareX, CornerDownRight, Repeat, SquarePlus, ClipboardMinus, ClipboardList, SquareArrowLeft, Pencil, PencilOff, Trash, Trash2 } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../Universal/firebase';

const QuestionBankSAQ = ({ questionsWithIds, setQuestionsWithIds, sourceText, questionCount, classId, teacherId, assignmentId }) => {
  const containerRef = useRef(null);
  const [showRegenerateDropdown, setShowRegenerateDropdown] = useState(false);
  const [regenerateInput, setRegenerateInput] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [questionStats, setQuestionStats] = useState({});
  const [editingQuestions, setEditingQuestions] = useState({});
  const [showRubrics, setShowRubrics] = useState({});

  const handleDeleteQuestion = (indexToDelete) => {
    const questionToDelete = questionsWithIds[indexToDelete];
    const questionIdToDelete = questionToDelete.questionId;

    const newQuestions = questionsWithIds.filter((_, index) => index !== indexToDelete);
    setQuestionsWithIds(newQuestions);

    // Remove from editing state
    setEditingQuestions(prev => {
      const newEditing = { ...prev };
      delete newEditing[questionIdToDelete];
      return newEditing;
    });

    setShowRubrics(prev => {
      const newShowRubrics = { ...prev };
      delete newShowRubrics[questionIdToDelete];
      return newShowRubrics;
    });
  };

  const handleEditQuestionToggle = (questionId) => {
    setEditingQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
    
    // Automatically show rubric when editing is enabled
    if (!editingQuestions[questionId]) {
      setShowRubrics(prev => ({
        ...prev,
        [questionId]: true
      }));
    }
  };

  const toggleRubric = (questionId) => {
    setShowRubrics(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };
  const handleEditQuestion = (index, field, value) => {
    const newQuestions = [...questionsWithIds];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestionsWithIds(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      questionId: `newQuestion${questionsWithIds.length}`,
      question: "New question",
      rubric: "New Rubric"
    };

    let insertIndex = questionsWithIds.length;
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const scrollPosition = containerRef.current.scrollTop;
      const approximateQuestionHeight = 150;

      insertIndex = Math.floor((scrollPosition + containerHeight / 2) / approximateQuestionHeight);
      insertIndex = Math.min(insertIndex, questionsWithIds.length);
    }

    const newQuestions = [
      ...questionsWithIds.slice(0, insertIndex),
      newQuestion,
      ...questionsWithIds.slice(insertIndex)
    ];
    setQuestionsWithIds(newQuestions);

    // Set the new question to be in editing mode
    setEditingQuestions(prev => ({
      ...prev,
      [newQuestion.questionId]: true
    }));

    // Optionally, show the rubric by default
    setShowRubrics(prev => ({
      ...prev,
      [newQuestion.questionId]: true
    }));

    setTimeout(() => {
      if (containerRef.current) {
        const newQuestionElement = containerRef.current.children[insertIndex];
        if (newQuestionElement) {
          newQuestionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 0);
  };

  useEffect(() => {
    const calculateQuestionStats = async () => {
      try {
        console.log('Starting stats calculation with:', {
          assignmentId,
          classId,
          questionsCount: questionsWithIds.length
        });

        // Log questions we're looking for
        console.log('Questions to track:', questionsWithIds.map(q => ({
          id: q.questionId,
          question: q.question.substring(0, 30) + '...'
        })));

        // Query all grades for this specific assignment
        const gradesRef = collection(db, 'grades(saq)');
        const gradesQuery = query(gradesRef,
          where('assignmentId', '==', assignmentId),
          where('classId', '==', classId)
        );

        console.log('Querying grades with:', {
          assignmentId,
          classId,
          collectionPath: 'grades(saq)'
        });

        const gradesSnapshot = await getDocs(gradesQuery);
        console.log(`Found ${gradesSnapshot.size} grade documents`);

        // Initialize stats tracking
        const stats = {};
        questionsWithIds.forEach(question => {
          stats[question.questionId] = {
            totalAttempts: 0,
            totalScore: 0
          };
        });

        console.log('Initialized stats object:', stats);

        // Process each grade document
        gradesSnapshot.forEach(doc => {
          const gradeData = doc.data();
          console.log('Processing grade document:', {
            id: doc.id,
            studentUid: gradeData.studentUid,
            questionCount: gradeData.questions?.length || 0
          });

          if (gradeData.questions && Array.isArray(gradeData.questions)) {
            gradeData.questions.forEach(question => {
              console.log('Processing question from grade:', {
                questionId: question.questionId,
                score: question.score,
                hasStats: !!stats[question.questionId]
              });

              if (stats[question.questionId]) {
                stats[question.questionId].totalAttempts++;
                const score = typeof question.score === 'number' ? question.score : 0;
                stats[question.questionId].totalScore += score;

                console.log('Updated stats for question:', {
                  questionId: question.questionId,
                  newTotalAttempts: stats[question.questionId].totalAttempts,
                  newTotalScore: stats[question.questionId].totalScore,
                  lastScore: score
                });
              }
            });
          }
        });

        console.log('Final stats before percentage calculation:', stats);

        // Calculate percentages and store results
        const percentages = {};
        Object.entries(stats).forEach(([questionId, data]) => {
          if (data.totalAttempts > 0) {
            const averageScore = data.totalScore / data.totalAttempts;
            const percentage = Math.round((averageScore / 2) * 100);
            percentages[questionId] = percentage;

            console.log('Calculated percentage for question:', {
              questionId,
              totalAttempts: data.totalAttempts,
              totalScore: data.totalScore,
              averageScore,
              percentage
            });
          } else {
            percentages[questionId] = null;
            console.log('No attempts for question:', questionId);
          }
        });

        console.log('Final percentages:', percentages);
        setQuestionStats(percentages);
      } catch (error) {
        console.error("Error calculating question stats:", error);
      }
    };

    if (questionsWithIds.length > 0 && classId && assignmentId) {
      calculateQuestionStats();
    }
  }, [questionsWithIds, classId, assignmentId]);

  // Render the statistics badge
  const renderStatsBadge = (questionId) => {
    const percentage = questionStats[questionId];
    if (percentage === null) return null;

    // Determine color based on percentage
    let backgroundColor = '#f4f4f4';
    let textColor = 'grey';
    let borderColor = 'lightgrey';

    if (percentage >= 80) {
      backgroundColor = '#E8FFE9';
      textColor = '#2BB514';
      borderColor = '#2BB514';
    } else if (percentage >= 60) {
      backgroundColor = '#FFF8E8';
      textColor = '#FFA500';
      borderColor = '#FFA500';
    } else if (percentage < 60) {
      backgroundColor = '#FFE8E8';
      textColor = '#FF0000';
      borderColor = '#FF0000';
    }
    return (
      <div style={{
        position: 'absolute',
        right: '120px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: backgroundColor,
        padding: '5px 10px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: textColor,
        border: `2px solid ${borderColor}`,
        minWidth: '40px',
        textAlign: 'center'
      }}>
        {percentage}%
      </div>
    );
  };

  const regenerateQuestionsFirebase = async (questions, additionalInstructions) => {
    setIsRegenerating(true);
    try {
      const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/RegenerateSAQ', {
        sourceText,
        questionCount,
        QuestionsPreviouslyGenerated: JSON.stringify(questions),
        instructions: additionalInstructions,
        classId,
        teacherId
      });

      // Preserve original questionIds
      const regeneratedQuestions = response.data.questions.map((newQuestion, index) => ({
        ...newQuestion,
        questionId: questions[index] ? questions[index].questionId : `newQuestion${index}`
      }));

      return regeneratedQuestions;
    } catch (error) {
      console.error('Error regenerating questions:', error);
      throw error;
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateSubmit = async () => {
    try {
      const regeneratedQuestions = await regenerateQuestionsFirebase(questionsWithIds, regenerateInput);
      setQuestionsWithIds(regeneratedQuestions);
      setRegenerateInput('');
      setShowRegenerateDropdown(false);
    } catch (error) {
      console.error('Error regenerating questions:', error);
      // Optionally, show an error message to the user
    }
  };

  const handleNevermind = () => {
    setShowRegenerateDropdown(false);
    setRegenerateInput('');
  };

  return (
    <div style={{
      width: '900px',
      height: '550px',
      marginTop: '80px',
      border: '10px solid white',
      boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
      background: 'RGB(255,255,255,)',
      backdropFilter: 'blur(5px)',
      borderRadius: '20px',
      padding: '20px',
      marginLeft: 'auto',
      marginRight: 'auto',
      position: 'relative',
    }}>
      <div style={{
        width: '940px',
        backgroundColor: '#FCD3FF',
        marginLeft: '-30px',
        display: 'flex',
        height: '60px',
        border: '10px solid #D800FB',
        borderTopRightRadius: '20px',
        borderTopLeftRadius: '20px',
        marginTop: '-30px'
      }}>
        <h1 style={{ fontSize: '40px', fontFamily: "'montserrat', sans-serif", color: '#D800FB', marginLeft: '40px', marginTop: '5px', }}>Question Preview</h1>
      </div>
    
      <div ref={containerRef} style={{ height: '500px', overflowY: 'auto', width: '960px', marginLeft: '-30px', }}>
        {questionsWithIds.map((question, index) => {
          const isEditing = editingQuestions[question.questionId];
          const showRubric = showRubrics[question.questionId];

          const textareaStyle = {
            border: '4px solid white',
            padding: '15px',
            paddingRight: '8%',
            fontFamily:  isEditing ? "default": "'montserrat', sans-serif",
            fontWeight: '600',
            fontSize: '20px',
            borderRadius: '0px 10px 10px 0px',
            width: '620px',
            resize: 'none',
            lineHeight: '1.2',
            background: isEditing ? 'white' : 'white', // Light background when editing
          };

          const rubricTextareaStyle = {
            width: '585px',
            border: '4px solid #F4F4F4',
            padding: '15px',
            fontWeight: '600',
            color: 'grey',
            outline: 'none',
            fontSize: '14px',
            marginLeft: '-4px',
            borderRadius: '0px 10px 10px 0px',
            resize: 'none',
            fontFamily:  isEditing ? "default": "'montserrat', sans-serif",
          };

          return (
            <div key={index} style={{
              padding: '0px',
              marginTop: '15px',
              marginBottom: '15px',
              borderBottom: '2px solid #f4f4f4',
              width: '870px',
              marginLeft: '50px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Question section */}
              <div style={{
                width: '820px',
                borderRadius: '10px',
                display: 'flex',
                fontSize: '12px',
                position: 'relative',
                marginBottom: '10px',
              }}>
                {/* Number section */}
                <div style={{
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
                }}>
                  <h1 style={{ margin: 'auto' }}>{index + 1}. </h1>
                
                </div>
                
                {/* Question text area */}
                {isEditing ? (
                  <TextareaAutosize
                    style={textareaStyle}
                    value={question.question}
                    onChange={(e) => handleEditQuestion(index, 'question', e.target.value)}
                    minRows={1}
                  />
                ) : (
                  <div style={textareaStyle}>
                    {question.question}
                  </div>
                )}

                {/* Rubric toggle button */}
                <button
                  onClick={() => toggleRubric(question.questionId)}
                  style={{
                    position: 'absolute',
                    right: '60px',
                    top: '0px',
                    fontSize: '20px',
                    background: 'white',
                    border: '0px solid lightgrey',
                    borderRadius: '8px',
                    height: '40px',
                    width: '40px',
                    color: 'grey'
                  }}
                >
                  {showRubric ? (
                    <ClipboardMinus style={{ marginLeft: '-2px', marginTop: '2px' }} />
                  ) : (
                    <ClipboardList style={{ marginLeft: '-2px', marginTop: '2px' }} />
                  )}
                </button>

                <button
                  onClick={() => handleEditQuestionToggle(question.questionId)}
                  style={{
                    position: 'absolute',
                    right: '40px',
                    top: '0px',
                    fontSize: '20px',
                    zIndex: '10',
                    height: '25px',
                    width: '25px',
                    borderRadius: '6px',
                    background: 'white',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ marginTop: '0px', marginLeft: '-4px', }}>
                  {isEditing ?  <PencilOff size={20} color={ 'grey'} strokeWidth={2} /> :  <Pencil size={20} color={ 'grey'} strokeWidth={2} />}   
                  </div>
                </button>
               
                {renderStatsBadge(question.questionId)}

                {/* Edit button */}
              
              </div>

              {/* Rubric section */}
              {showRubric && (
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '-80px', position: 'relative', marginBottom: '20px' }}>
                   {isEditing && (
                    <button
                      onClick={() => handleDeleteQuestion(index)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        bottom: '-10px',
                        fontSize: '20px',
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
                      <Trash2 size={30} color="grey" strokeWidth={2} />
                    </button>
                  )}

                  <div style={{ marginLeft: '100px' }}>
                    <CornerDownRight size={40} color="#c9c9c9" strokeWidth={3} />
                  </div>
                  <div style={{
                    width: '30px',
                    padding: '8px',
                    background: '#f4f4f4',
                    border: '4px solid lightgrey',
                    color: 'grey',
                    zIndex: '10',
                    marginLeft: '20px',
                    borderRadius: '10px 0px 0px 10px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignSelf: 'stretch',
                  }}>
                    <ClipboardList style={{ margin: 'auto' }} size={30} />
                  </div>
                  {isEditing ? (
                    <TextareaAutosize
                      style={rubricTextareaStyle}
                      value={`${question.rubric}`}
                      onChange={(e) => handleEditQuestion(index, 'rubric', e.target.value.replace('Probable answer: ', ''))}
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
