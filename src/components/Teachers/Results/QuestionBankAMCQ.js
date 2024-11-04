// QuestionBankAMCQ.js

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';
import React, { useState, useEffect } from 'react';
import {
  Pencil,
  PencilOff,
  Dot,
  ArrowRight,
  SquareX,
  SquareCheck,
  Square,
  SquareX as DeleteIcon,
  SquareDot,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuestionBankAMCQ = ({ editedQuestions, setEditedQuestions, assignmentId, onClose }) => {
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
    const [showChoices, setShowChoices] = useState({});
    const [hoveredChoice, setHoveredChoice] = useState(null);
  const choiceStyles = {
    a: { background: '#C7CFFF', color: '#020CFF' },
    b: { background: '#F5B6FF', color: '#E441FF' },
    c: { background: '#AEF2A3', color: '#2BB514' },
    d: { background: '#FFEAAF', color: '#FFAE00' },
    e: { background: '#CAFFF4', color: '#00F1C2' },
    f: { background: '#C2FBFF', color: '#CC0000' },
    g: { background: '#E3BFFF', color: '#8364FF' },
    h: { background: '#9E9E9E', color: '#000000' },
  };

  const difficultyStyles = {
    Easy: { background: '#FDFFC1', color: '#FFD13B' },
    Medium: { background: '#FFE2AC', color: '#FFAE00' },
    Hard: { background: '#FFB764', color: '#E07800' },
  };

  const difficultyOrder = ['Easy', 'Medium', 'Hard'];

  const handleDifficultyClick = (questionIndex) => {
    if (editingQuestionIndex === questionIndex) {
      const currentIndex = difficultyOrder.indexOf(
        editedQuestions[questionIndex].difficulty
      );
      const nextIndex = (currentIndex + 1) % difficultyOrder.length;
      const nextDifficulty = difficultyOrder[nextIndex];
      handleDifficultyChange(questionIndex, nextDifficulty);
    }
  };

  const getChoiceStyle = (choice) => {
    return (
      choiceStyles[choice.toLowerCase()] || { background: '#E0E0E0', color: '#000000' }
    );
  };

  const getChoiceWidth = (choicesLength) => {
    switch (choicesLength) {
      case 2:
      case 3:
      case 4:
        return '45%';
      case 5:
        return '30%';
      default:
        return '100%';
    }
  };

  const handleEditQuestion = (index) => {
    setEditingQuestionIndex(index === editingQuestionIndex ? null : index);
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[index][field] = value;
    setEditedQuestions(updatedQuestions);
  };

  const handleChoiceChange = (questionIndex, choice, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex][choice] = value;
    setEditedQuestions(updatedQuestions);
  };

  const handleExplanationChange = (questionIndex, choice, value) => {
    const updatedQuestions = [...editedQuestions];
    const explanationKey = `explanation_${choice.toLowerCase()}`;
    updatedQuestions[questionIndex][explanationKey] = value;
    setEditedQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex, newCorrectChoice) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].correct = newCorrectChoice;
    setEditedQuestions(updatedQuestions);
  };

  const handleDifficultyChange = (questionIndex, newDifficulty) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].difficulty = newDifficulty;
    setEditedQuestions(updatedQuestions);
  };

  const handleDeleteChoice = (questionIndex, choiceToDelete) => {
    if (window.confirm('Are you sure you want to delete this choice?')) {
      const updatedQuestions = [...editedQuestions];
      const question = updatedQuestions[questionIndex];

      // Remove the choice and its explanation
      delete question[choiceToDelete];
      delete question[`explanation_${choiceToDelete}`];

      // If the deleted choice was the correct answer, assign a new correct answer
      if (question.correct.toLowerCase() === choiceToDelete) {
        const remainingChoices = Object.keys(question).filter((key) =>
          key.match(/^[a-z]$/)
        );
        if (remainingChoices.length > 0) {
          question.correct = remainingChoices[0];
        } else {
          question.correct = '';
        }
      }

      setEditedQuestions(updatedQuestions);
      saveChanges();
    }
  };

  const handleToggleChoices = (index) => {
    setShowChoices((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Save changes to questions
  const saveChanges = async () => {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      await updateDoc(assignmentRef, { questions: editedQuestions });
      console.log('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  useEffect(() => {
    if (editingQuestionIndex === null) {
      saveChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingQuestionIndex]);

  return (
    <div
      style={{
        zIndex: '100',
        marginTop: '150px',
        width: '860px',
        marginLeft: 'auto',
        marginRight: 'auto',
        backgroundColor: 'white',
        boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)',
        borderRadius: '30px',
        paddingTop: '20px',
        padding: '20px',
        marginBottom: '0px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          marginTop: '-20px',
          width: '880px',
          marginLeft: '-20px',
          height: '70px',
          background: '#FBE0FF',
          marginBottom: '10px',
          border: '10px solid #E01FFF',
          borderRadius: '30px 30px 0px 0px ',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: 'none',
            fontSize: '30px',
            color: '#45B434',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontFamily: "'montserrat', sans-serif",
            transition: '.5s',
            transform: 'scale(1)',
            opacity: '100%',
            position: 'absolute',
            right: '10px',
            top: '10px',
          }}
        >
          <SquareX style={{ marginTop: '0px' }} size={50} color="#E01FFF" />
        </button>
        <h1
          style={{
            marginLeft: '40px',
            fontFamily: "'montserrat', sans-serif",
            color: '#E01FFF',
            fontSize: '40px',
            display: 'flex',
            marginTop: '10px',
          }}
        >
          Question Bank
        </h1>
      </div>
      <div style={{ display: 'flex', marginBottom: '0px' }}>
        <h1
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: "grey",
            marginLeft: '30px',
            marginTop: '17px',
          }}
        >
          {' '}
          Click on Pencil to edit , hover over choice for explanation{' '}
        </h1>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: '600',
            background: '#FDFFC1',
            color: '#FFD13B',
            padding: '5px 10px',
            borderRadius: '5px',
            marginLeft: '80px',
          }}
        >
          {' '}
          Easy
        </h1>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: '600',
            background: '#FFE2AC',
            color: '#FFAE00',
            padding: '5px 10px',
            borderRadius: '5px',
            marginLeft: '10px',
          }}
        >
          {' '}
          Medium
        </h1>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: '600',
            background: '#FFB764',
            color: '#E07800',
            padding: '5px 10px',
            borderRadius: '5px',
            marginLeft: '10px',
          }}
        >
          {' '}
          Hard
        </h1>
      </div>
      {editedQuestions.map((question, questionIndex) => (
        <div
          key={questionIndex}
          style={{
            padding: '20px 0px',
            marginLeft: '20px',
            marginRight: '20px',
            marginBottom: '10px',
            
            marginTop: '10px',
            borderBottom: '2px solid #f4f4f4',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              marginBottom: '10px',
            }}
          >
            <div
              onClick={() => handleDifficultyClick(questionIndex)}
              style={{
                width: '20px',
                height: '20px',
                background: difficultyStyles[question.difficulty]?.background,
                border: `6px ${
                  editingQuestionIndex === questionIndex ? 'dashed' : 'solid'
                } ${difficultyStyles[question.difficulty]?.color}`,
                borderRadius: '5px',
                cursor: editingQuestionIndex === questionIndex ? 'pointer' : 'default',
                transition: 'all 0.2s',
                marginRight: '10px',
              }}
            />
            {editingQuestionIndex === questionIndex ? (
              <textarea
                value={question.question}
                onChange={(e) =>
                  handleQuestionChange(questionIndex, 'question', e.target.value)
                }
                style={{
                  flex: '1',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '1em',
                  overflow: 'hidden',
                  marginRight: '10px',
                }}
                rows="1"
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
            ) : (
              <p
                style={{
                  flex: '1',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: '0 10px 0 0',
                }}
              >
                {question.question}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
                onClick={() => handleToggleChoices(questionIndex)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                <ChevronDown size={24} color="#757575" strokeWidth={2} />
              </button> 
              <button
                onClick={() => handleEditQuestion(questionIndex)}
                style={{   cursor: 'pointer', background: '#F4F4F4 ',  marginRight: '20px', borderRadius: '10px', border: '0px solid white', padding: '5px 8px'}}
          
              >
                {editingQuestionIndex === questionIndex ? (
                  <PencilOff size={24} color="#757575" strokeWidth={2} />
                ) : (
                  <Pencil strokeWidth={2} size={24} color="#757575" />
                )}
              </button>
            
              <span style={{ marginRight: '10px', fontSize: '16px' }}>00%</span>
              <ArrowRight size={24} color="blue" strokeWidth={2} />
            </div>
          </div>
          {(showChoices[questionIndex] || editingQuestionIndex === questionIndex) && (
            <div style={{ width: '100%', marginTop: '10px' }}>
              {editingQuestionIndex === questionIndex ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {Object.keys(question)
                    .filter((key) => key.match(/^[a-z]$/))
                    .map((choice) => {
                      const style = getChoiceStyle(choice);
                      const explanationKey = `explanation_${choice.toLowerCase()}`;
                      const isCorrect = question.correct.toLowerCase() === choice;
                      return (
                        <div
                          key={choice}
                          style={{
                            display: 'flex',
                            alignItems: 'stretch',
                            marginBottom: '10px',
                          }}
                        >
                          {/* Choice area */}
                          <div
                            style={{
                              background: style.background,
                              color: style.color,
                              flex: 1,
                              padding: '10px',
                              borderRadius: '10px 0 0 10px',
                              border: `4px solid ${style.color}`,
                              display: 'flex',
                              alignItems: 'center',
                              position: 'relative',
                            }}
                          >
                            {/* Choice text area */}
                            <textarea
                              value={question[choice]}
                              onChange={(e) =>
                                handleChoiceChange(questionIndex, choice, e.target.value)
                              }
                              style={{
                                flex: 1,
                                fontWeight: '600',
                                fontSize: '20px',
                                textAlign: 'left',
                                margin: 0,
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                resize: 'vertical',
                                minHeight: '1em',
                                overflow: 'hidden',
                                color: style.color,
                              }}
                              rows="1"
                              onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                            />
                          </div>
                          {/* Explanation area */}
                          <div
                            style={{
                              flex: 1,
                              border: '4px solid #f4f4f4',
                              padding: '5px',
                              borderRadius: '0 10px 10px 0',
                              display: 'flex',
                              alignItems: 'center',
                              position: 'relative',
                            }}
                          >
                            {/* Explanation text area */}
                            <textarea
                              value={question[explanationKey]}
                              onChange={(e) =>
                                handleExplanationChange(
                                  questionIndex,
                                  choice,
                                  e.target.value
                                )
                              }
                              style={{
                                flex: 1,
                                color: 'black',
                                fontWeight: 'bold',
                                margin: 0,
                                width: '100%',
                                border: 'none',
                                resize: 'vertical',
                                minHeight: '1em',
                                overflow: 'hidden',
                              }}
                              rows="1"
                              onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                            />
                          </div>
                          {/* Correct answer checkbox and delete icon */}
                          <div
                            style={{
                              display: 'flex',
                              marginLeft: '10px',
                              alignItems: 'center',
                            }}
                          >
                            {/* Correct answer checkbox */}
                            <div
                              style={{
                                cursor: 'pointer',
                                marginBottom: '0px',
                                marginRight: '10px',
                              }}
                              onClick={() => handleCorrectAnswerChange(questionIndex, choice)}
                            >
                              {isCorrect ? (
                                <SquareCheck size={30} color={'#2BB514'} />
                              ) : (
                                <Square size={30} color={'lightgrey'} />
                              )}
                            </div>
                            {/* Delete icon */}
                            <div
                              style={{
                                cursor: 'pointer',
                                marginTop: '',
                              }}
                              onClick={() => handleDeleteChoice(questionIndex, choice)}
                            >
                              <DeleteIcon size={30} color={'red'} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginBottom: '0px',
                    marginTop: '0px',
                  }}
                >
                  {Object.keys(question)
                    .filter((key) => key.match(/^[a-z]$/))
                    .map((choice, index, array) => {
                      const style = getChoiceStyle(choice);
                      const width = getChoiceWidth(array.length);
                      const isLastRow = array.length === 5 && index >= 3;
                      const explanationKey = `explanation_${choice.toLowerCase()}`;
                      const isHovered = hoveredChoice === `${questionIndex}-${choice}`;
                      const isCorrect = question.correct.toLowerCase() === choice;

                      return (
                        <div
                          key={choice}
                          style={{
                            width: width,
                            margin: '10px 1%',
                            padding: '5px',
                            background: style.background,
                            color: style.color,
                            borderRadius: isHovered ? '10px 10px 0 0' : '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative',
                            transition: 'all 0.2s',
                            border: `4px solid ${style.color}`,
                            boxShadow:
                              isCorrect && editingQuestionIndex !== questionIndex
                                ? '0 0 0 4px white, 0 0 0 8px #AEF2A3'
                                : 'none',
                            ...(isLastRow && { marginLeft: 'auto', marginRight: 'auto' }),
                          }}
                          onMouseEnter={() => setHoveredChoice(`${questionIndex}-${choice}`)}
                          onMouseLeave={() => setHoveredChoice(null)}
                        >
                          <p
                            style={{
                              fontWeight: 'bold',
                              fontSize: '20px',
                              textAlign: 'center',
                              margin: 0,
                            }}
                          >
                            {question[choice]}
                          </p>
                          <AnimatePresence>
                            {isHovered && question[explanationKey] && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                  position: 'absolute',
                                  top: '114%',
                                  left: '-4px',
                                  width: '95.5%',
                                  padding: '10px',
                                  background: 'rgb(255,255,255)',
                                  border: `4px solid white`,
                                  borderTop: 'none',
                                  borderRadius: '0 0 10px 10px',
                                  zIndex: 1000,
                                  boxShadow: `0 4px 8px rgba(0, 0, 0, 0.1)`,
                                }}
                              >
                                <p
                                  style={{
                                    color: 'black',
                                    fontWeight: 'bold',
                                    margin: 0,
                                  }}
                                >
                                  {question[explanationKey]}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuestionBankAMCQ;
