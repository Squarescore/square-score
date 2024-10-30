import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquareArrowLeft,
  Pencil,
  Check,
  Square,
  CheckSquare,
  X,
  SquareX,
  PencilOff,
  SquareCheck,
} from 'lucide-react';

const PreviewMCQ = ({ questions, onBack, onNext }) => {
  const [hoveredChoice, setHoveredChoice] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editedQuestions, setEditedQuestions] = useState(questions);

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

  const handleEdit = (index) => {
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
    updatedQuestions[questionIndex][`explanation_${choice}`] = value;
    setEditedQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex, newCorrectChoice) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].correct = newCorrectChoice;
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
    }
  };

  useEffect(() => {
    // You can implement saving changes to a backend here if needed
    console.log('Changes saved:', editedQuestions);
  }, [editedQuestions]);

  return (
    <div
      style={{
        marginTop: '100px',
        width: '1000px',
        boxShadow: '1px 1px 10px 1px rgb(0,0,155,.1)',
        borderRadius: '30px',
        marginLeft: 'auto',
        marginRight: 'auto',
        fontFamily: "'montserrat', sans-serif",
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          marginTop: '-60px',
          width: '980px',
          height: '70px',
          background: '#FBE0FF',
          marginBottom: '10px',
          border: '10px solid #E01FFF',
          borderRadius: '30px 30px 0px 0px ',
          position: 'relative',
        }}
      >
        <button
          onClick={onBack}
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
            top: '15px',
          }}
        >
          <SquareX style={{ marginTop: '0px' }} size={40} color="#E01FFF" />
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
          MCQ Preview{' '}
        </h1>
      </div>
      <div style={{ display: 'flex', marginBottom: '0px' }}>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'lightgrey',
            marginLeft: '40px',
            marginTop: '17px',
          }}
        >
          {' '}
          Click on Pencil to edit, hover over choice for explanation{' '}
        </h1>
      </div>

      {editedQuestions.map((question, questionIndex) => (
        <div
          key={questionIndex}
          style={{
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              width: '95%',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '30px',
            }}
          >
            {/* Question Number */}
            <div
              style={{
                width: '30px',
                height: '30px',
                background: 'white',
                border: `4px solid white`,
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '25px',
                marginRight: '10px',
              }}
            >
              {questionIndex + 1}.
            </div>
            {editingQuestionIndex === questionIndex ? (
              <textarea
                value={question.question}
                onChange={(e) =>
                  handleQuestionChange(questionIndex, 'question', e.target.value)
                }
                style={{
                  flex: '1',
                  fontSize: '25px',
                  fontWeight: '600',
                  marginLeft: '20px',
                  overflow: 'hidden',
                  border: '1px solid white',
                  outline: '1px solid white',
                  resize: 'vertical',
                  minHeight: '1em',
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
                  fontSize: '25px',
                  marginLeft: '30px',
                  fontWeight: '600',
                  margin: '0 10px 0 0',
                }}
              >
                {question.question}
              </p>
            )}
            <button
              onClick={() => handleEdit(questionIndex)}
              style={{
                cursor: 'pointer',
                background: '#F4F4F4',
                borderRadius: '10px',
                border: '0px solid white',
                padding: '5px 8px',
              }}
            >
              {editingQuestionIndex === questionIndex ? (
                <PencilOff size={24} color="#757575" strokeWidth={2} />
              ) : (
                <Pencil strokeWidth={2} size={24} color="#757575" />
              )}
            </button>
          </div>
          {editingQuestionIndex === questionIndex ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '95%',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
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
                            fontWeight: 'bold',
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
                          width: '',
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCorrectAnswerChange(questionIndex, choice);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChoice(questionIndex, choice);
                          }}
                        >
                          <SquareX size={30} color={'red'} />
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
                        {(isHovered || editingQuestionIndex === questionIndex) &&
                          question[explanationKey] && (
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
              <div
                style={{
                  height: '4px',
                  background: '#f4f4f4',
                  width: '920px',
                  marginBottom: '-20px',
                  marginTop: '50px',
                }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PreviewMCQ;
