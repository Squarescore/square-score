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
  Eye,
  YoutubeIcon,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';

const PreviewAMCQ = ({ questions, onBack, onSave, assignmentId, showCloseButton = false }) => {

  const [hoveredChoice, setHoveredChoice] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editedQuestions, setEditedQuestions] = useState(questions);

  const choiceStyles = {
    a: { background: '#C7CFFF', color: '#020CFF' },
    c: { background: '#D6FFCF', color: '#2BB514' },
    b: { background: '#F6C1FF', color: '#E441FF' },
    d: { background: '#FFEFCC', color: '#FFAE00' },
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

  const difficultyOrder = ['Easy', 'Medium', 'Difficult'];

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
  }, [editingQuestionIndex]);

  return (

    <div
      style={{
        width: '800px',
        position: 'absolute', 
        top:'-140px',  left:' 50%', transform: 'translatex(-50%) ',
      height: '530px',
      background:" white",
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
          marginTop: '10px',
          width: '780px',
          height: '70px',
          marginBottom: '10px',
          position: 'relative',
        }}
      >

        <h1
          style={{
            marginLeft: '40px',
            fontFamily: "'montserrat', sans-serif",
            color: 'black',
            fontSize: '35px',
            fontWeight: '600',
            display: 'flex',
            marginTop: '10px',
          }}
        >
         <Eye size={40} style={{marginLeft: '-10px', marginRight: "20px", marginTop: '5px'}}/> Question Preview{' '}
        </h1>
      </div>
      <div style={{ display: 'flex', marginBottom: '0px', marginTop: '-20px'}}>
        <h1
          style={{
            fontSize: '14px',
            fontWeight: '600',
            marginLeft: '30px',
            color:'lightgrey',
            marginTop: '17px',
          }}
        >
          {' '}
          Click on Pencil to edit , hover over choice for explanation{' '}
        </h1>
        <h1
          style={{
            fontSize: '14px',
            fontWeight: '600',
            background: '#FDFFC1',
            color: '#FFD13B',
            padding: '5px 10px',
            borderRadius: '5px',
            marginLeft: '110px',
          }}
        >
          {' '}
          Easy
        </h1>
        <h1
          style={{
            fontSize: '14px',
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
            fontSize: '14px',
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
<div style={{height: '400px', overflowY: 'auto',}}>
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
              width: '95%',marginLeft: 'auto', marginRight: 'auto',
              marginBottom: '30px',
            }}
          >
            <div
              onClick={() => handleDifficultyClick(questionIndex)}
              style={{
                width: '20px',
                height: '20px',
                background: difficultyStyles[question.difficulty]?.background,
                border: `5px ${
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
                  fontSize: '25px',
                  fontWeight: 'bold',
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
                  fontSize: '20px',
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
              style={{   cursor: 'pointer', background: 'white ', border: '1px solid #ddd', borderRadius: '5px',  padding: '5px 6px'}}
            >
              {editingQuestionIndex === questionIndex ? (
                <PencilOff size={20} color="#757575" strokeWidth={2} />
              ) : (
                <Pencil strokeWidth={2} size={20} color="#757575" />
              )}
            </button>
          </div>
          {editingQuestionIndex === questionIndex ? (
            <div style={{ display: 'flex', flexDirection: 'column', width: '95%',marginLeft: 'auto', marginRight: 'auto', }}>
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
                        display: 'flex',width: '100%',
                        alignItems: 'stretch',
                        marginBottom: '10px',
                      }}
                    >
                      {/* Choice area */}
                      <div style={{ width: '85%', marginBottom: '10px'}}>
                      <div
                        style={{
                          background: style.background,
                          color: style.color,
                          width: 'calc(100% - 10px)',
                          padding: '5px',
                          borderRadius: '5px',
                          borderLeft: `4px solid ${style.color}`,
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
                            fontSize: '16px',
                            textAlign: 'left',
                            width: '95%',
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
                          border: '1px solid lightgrey',
                          padding: '5px',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          marginTop: '10px',
                          marginLeft: '20px',
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
                            fontWeight: '500',
                            margin: 0,
                            width: '100%',
                            fontSize: '14px',
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
                      </div>
                         {/* Correct answer checkbox and delete icon */}
                         <div
                          style={{
                            display: 'flex',
                            marginLeft: '20px',
                            marginTop: '-50px',
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
                              
                            marginLeft: '20px',
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
                  const isLastRow = array.length === 5 && index >= 3;
                  const explanationKey = `explanation_${choice.toLowerCase()}`;
                  const isHovered = hoveredChoice === `${questionIndex}-${choice}`;
                  const isCorrect = question.correct.toLowerCase() === choice;

                  return (
                    <div
                      key={choice}
                      style={{
                        width: '100%',
                        margin: '10px 1%',
                        padding: '5px',
                        background: style.background,
                        color: style.color,
                        borderRadius:  '3px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'left',
                        alignItems: 'left',
                        position: 'relative',
                        transition: 'all 0.2s',
                        borderLeft: `4px solid ${style.color}`,
                        boxShadow:
                          isCorrect && editingQuestionIndex !== questionIndex
                            ? '0 0 0 4px white, 0 0 0 6px #AEF2A3'
                            : 'none',
                        ...(isLastRow && { marginLeft: 'auto', marginRight: 'auto' }),
                      }}
                      onMouseEnter={() => setHoveredChoice(`${questionIndex}-${choice}`)}
                      onMouseLeave={() => setHoveredChoice(null)}
                    >
                      <p
                        style={{
                          fontWeight: '600',
                          fontSize: '16px',
                          textAlign: 'left',

                          margin: 0,  width: '95%', paddingLeft: '2%'
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
                                  fontWeight: '500',
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
                   <div style={{height: '4px', background: '#f4f4f4', width: '920px', marginBottom: '-20px', marginTop: '50px'}}></div>
            </div>
          )}
      
        </div>
      ))}
    </div>
    </div>
    
  );
};

export default PreviewAMCQ;
