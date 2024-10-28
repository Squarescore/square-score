import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareArrowLeft, Pencil, Check, Square, CheckSquare, X, SquareX } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../Universal/firebase';

const PreviewAMCQ = ({ questions, onBack, onNext, assignmentId }) => {
  const [hoveredChoice, setHoveredChoice] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editedQuestions, setEditedQuestions] = useState(questions);

  const choiceStyles = {
    a: { background: '#C7CFFF', color: '#020CFF' },
    c: { background: '#AEF2A3', color: '#2BB514' },
    b: { background: '#F5B6FF', color: '#E441FF' },
    d: { background: '#FFEAAF', color: '#FFAE00' },
    e: { background: '#CAFFF4', color: '#00F1C2' },
    f: { background: '#C2FBFF', color: '#CC0000' },
    g: { background: '#E3BFFF', color: '#8364FF' },
    h: { background: '#9E9E9E', color: '#000000' }
  };

  const difficultyStyles = {
    Easy: { background: '#AEF2A3', color: '#2BB514' },
    Medium: { background: '#FFEAAF', color: '#FFAE00' },
    Difficult: { background: '#F5B6FF', color: '#E441FF' }
  };

  const getChoiceStyle = (choice) => {
    return choiceStyles[choice.toLowerCase()] || { background: '#E0E0E0', color: '#000000' };
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

  const handleDifficultyChange = (questionIndex, newDifficulty) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].difficulty = newDifficulty;
    setEditedQuestions(updatedQuestions);
  };

  const handleDeleteChoice = (questionIndex, choiceToDelete) => {
    if (window.confirm(`Are you sure you want to delete this choice?`)) {
      const updatedQuestions = [...editedQuestions];
      const question = updatedQuestions[questionIndex];
      
      // Remove the choice and its explanation
      delete question[choiceToDelete];
      delete question[`explanation_${choiceToDelete}`];

      // If the deleted choice was the correct answer, assign a new correct answer
      if (question.correct.toLowerCase() === choiceToDelete) {
        const remainingChoices = Object.keys(question).filter(key => key.match(/^[a-z]$/));
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
      const assignmentRef = doc(db, 'assignments(Amcq)', assignmentId);
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
    <div style={{ marginTop: '100px', width: '1000px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", zIndex: 100 }}>
      <div style={{display: 'flex', marginTop: '-60px'}}>
        <button onClick={onBack} style={{ backgroundColor: 'transparent', cursor: 'pointer', border: 'none', fontSize: '30px', color: '#45B434', borderRadius: '10px', fontWeight: 'bold', fontFamily: "'montserrat', sans-serif", transition: '.5s', transform: 'scale(1)', opacity: '100%' }}>
          <SquareArrowLeft style={{marginTop: '-70px'}} size={60} color="grey" />
        </button>
        <h1 style={{ marginLeft: '40px', fontFamily: "'montserrat', sans-serif", color: 'black', fontSize: '60px', display: 'flex', marginTop: '50px' }}>
          Preview  <h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '30px', color: '#2BB514', display: 'flex' }}> MCQ<h1 style={{ fontSize: '50px', marginTop: '-10px', marginLeft: '0px', color: '#FCCA18', display: 'flex' }}>*</h1> </h1>
        </h1>
      </div>
      {editedQuestions.map((question, questionIndex) => (
        <div key={questionIndex} style={{ borderBottom: '4px solid #f4f4f4', padding: '20px', marginBottom: '30px' }}>
          <div style={{ width: '100%', display: 'flex', marginBottom: '30px', position: 'relative' }}>
            <div style={{ width: '1000px', border: '4px solid white', boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' , marginLeft: 'auto', position: 'relative', borderRadius: '15px' }}>
              <h1 style={{ fontSize: '25px', color: 'grey', width: '918px', textAlign: 'left', background: '#f4f4f4', padding: '5px', paddingLeft: '30px', borderRadius: '15px 15px 0px 0px ', position: 'absolute', top: '-55px', left: '-4px', border: '4px solid lightgrey', display: 'flex', alignItems: 'center',  }}>
                <span>Question </span>
                {editingQuestionIndex === questionIndex ? (
                  <div style={{ display: 'flex', marginLeft: '10px' }}>
                    {['Easy', 'Medium', 'Difficult'].map((difficulty) => (
                      <button
                        key={difficulty}
                        onClick={() => handleDifficultyChange(questionIndex, difficulty)}
                        style={{
                          padding: '5px 10px',
                          margin: '0 5px',
                          background: '#f4f4f4',
                          color: 'grey',
                          border: question.difficulty === difficulty ? `4px solid grey` : 'none',fontFamily: "'montserrat', sans-serif",
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {difficulty}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span style={{marginLeft: '10px'}}> - {question.difficulty}</span>
                )}
              </h1>
              {editingQuestionIndex === questionIndex ? (
                <textarea
                  value={question.question}
                  onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                  style={{ width: '90%', marginLeft: '30px', fontSize: '25px', fontWeight: 'bold', border: 'none', outline: 'none', resize: 'vertical', minHeight: '1em', overflow: 'hidden', marginTop: '30px', marginBottom: '20px' }}
                  rows="1"
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
              ) : (
                <p style={{ width: '90%', marginLeft: '30px', fontSize: '25px', fontWeight: 'bold' }}>{question.question}</p>
              )}
            </div>
            <button
              onClick={() => handleEdit(questionIndex)}
              style={{ position: 'absolute', right: '10px', top: '-22px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {editingQuestionIndex === questionIndex ? <Check size={24} color="#4CAF50" strokeWidth={2.5} /> : <Pencil strokeWidth={2} size={24} color="#757575" />}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: editingQuestionIndex === questionIndex ? '20px' : '0px',
            marginTop: editingQuestionIndex === questionIndex ? '-40px' : '0px'
           }}>
            {Object.keys(question).filter(key => key.match(/^[a-z]$/)).map((choice, index, array) => {
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
                    margin: editingQuestionIndex === questionIndex ? '40px 1% 40px 1%' : '10px 1%',
                    padding: '10px',
                    background: style.background,
                    color: style.color,
                    borderRadius: editingQuestionIndex === questionIndex ? '10px 10px 0px 0px' : '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    transition: 'all 0.2s',
                    border: `4px solid ${style.color}`,
                    boxShadow: isCorrect && editingQuestionIndex !== questionIndex ? `0 0 0 4px white, 0 0 0 8px #AEF2A3` : 'none',
                    ...(isLastRow && { marginLeft: 'auto', marginRight: 'auto' })
                  }}
                  onMouseEnter={() => setHoveredChoice(`${questionIndex}-${choice}`)}
                  onMouseLeave={() => setHoveredChoice(null)}
                >
                  {editingQuestionIndex === questionIndex && (
                    <>
                      <div
                        style={{
                          position: 'absolute',
                          top: '5px',
                          left: '5px',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCorrectAnswerChange(questionIndex, choice);
                        }}
                      >
                        {isCorrect ? <CheckSquare size={20} color={style.color} /> : <Square size={20} color={style.color} />}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChoice(questionIndex, choice);
                        }}
                      >
                        <SquareX size={20} color={'red'} style={{background: 'white', padding: '2px', borderRadius: '5px'}} />
                      </div>
                    </>
                  )}
                  {editingQuestionIndex === questionIndex ? (
                    <textarea
                      value={question[choice]}
                      onChange={(e) => handleChoiceChange(questionIndex, choice, e.target.value)}
                      style={{ 
                        fontWeight: 'bold', 
                        fontSize: '20px', 
                        textAlign: 'center', 
                        margin: 0, 
                        width: '100%', 
                        background: 'transparent', 
                        border: 'none', 
                        resize: 'vertical',
                        minHeight: '1em',
                        overflow: 'hidden'
                      }}
                      rows="1"
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  ) : (
                    <p style={{fontWeight: 'bold', fontSize: '20px', textAlign: 'center', margin: 0}}>{question[choice]}</p>
                  )}
                  <AnimatePresence>
                    {(isHovered || editingQuestionIndex === questionIndex) && question[explanationKey] && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          top: '110%',
                          left: '-4px',
                          width: 'calc(100% - 20px)',
                          padding: '10px',
                          background: 'rgb(255,255,255)',
                          border: `4px solid #f4f4f4`,
                          borderTop: 'none',
                          borderRadius: '0 0 10px 10px',
                          zIndex: 1000,
                        }}
                      >
                        {editingQuestionIndex === questionIndex ? (
                        <textarea
                        value={question[explanationKey]}
                        onChange={(e) => handleExplanationChange(questionIndex, choice, e.target.value)}
                        style={{
                          color: 'black', 
                          fontWeight: 'bold', 
                          margin: 0, 
                          width: '100%', 
                          border: 'none', 
                          resize: 'vertical',
                          minHeight: '1em',
                          overflow: 'hidden'
                        }}
                        rows="1"
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                      />
                    ) : (
                      <p style={{color: 'black', fontWeight: 'bold', margin: 0}}>{question[explanationKey]}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  ))}
</div>
);
};

export default PreviewAMCQ;