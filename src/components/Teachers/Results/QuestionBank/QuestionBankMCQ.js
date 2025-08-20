// QuestionBankMCQ.js

import React, { useState, useEffect } from 'react';
import {
  Pencil,
  PencilOff,
  SquareX,
  SquareCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Check,
  Search,
  MessageSquareMore,
  Square,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionBankHeader from './QuestionBankHeader'; // Reuse the header component from AMCQ if possible

const QuestionBankMCQ = ({ editedQuestions, setEditedQuestions, onClose }) => {
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [showChoices, setShowChoices] = useState({});
  const [hoveredChoice, setHoveredChoice] = useState(null);
  const [selectedExplanations, setSelectedExplanations] = useState({}); // Tracks selected choice per question for explanations
  const [searchTerm, setSearchTerm] = useState('');

  // Define choice styles
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

  // Handle editing mode toggle
  const handleEditQuestion = (index) => {
    setEditingQuestionIndex(index === editingQuestionIndex ? null : index);
  };

  // Handle question text change
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[index][field] = value;
    setEditedQuestions(updatedQuestions);
  };

  // Handle choice text change
  const handleChoiceChange = (questionIndex, choice, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex][choice] = value;
    setEditedQuestions(updatedQuestions);
  };

  // Handle explanation text change
  const handleExplanationChange = (questionIndex, choice, value) => {
    const updatedQuestions = [...editedQuestions];
    const explanationKey = `explanation_${choice.toLowerCase()}`;
    updatedQuestions[questionIndex][explanationKey] = value;
    setEditedQuestions(updatedQuestions);
  };

  // Handle correct answer change
  const handleCorrectAnswerChange = (questionIndex, newCorrectChoice) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].correct = newCorrectChoice;
    setEditedQuestions(updatedQuestions);
  };

  // Handle choice deletion
  const handleDeleteChoice = (questionIndex, choiceToDelete) => {
    if (window.confirm('Are you sure you want to delete this choice?')) {
      const updatedQuestions = [...editedQuestions];
      const question = updatedQuestions[questionIndex];

      // Remove the choice and its explanation
      delete question[choiceToDelete];
      delete question[`explanation_${choiceToDelete.toLowerCase()}`];

      // If the deleted choice was the correct answer, assign a new correct answer
      if (question.correct.toLowerCase() === choiceToDelete.toLowerCase()) {
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

  // Toggle choices visibility
  const handleToggleChoices = (index) => {
    setShowChoices((prev) => ({ ...prev, [index]: !prev[index] }));
    // Reset selected explanation when toggling choices
    setSelectedExplanations((prev) => ({ ...prev, [index]: null }));
  };

  // Toggle explanation visibility in non-edit mode
  const handleSelectExplanation = (questionIndex, choiceKey) => {
    setSelectedExplanations((prev) => ({
      ...prev,
      [questionIndex]: prev[questionIndex] === choiceKey ? null : choiceKey,
    }));
  };

  // Handle search input changes
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // Filter questions based on search term
  const filteredQuestions = editedQuestions.filter((question) =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Save changes to Firebase (if applicable)
  const saveChanges = async () => {
    // Implement saving changes to backend if needed
    console.log('Questions updated:', editedQuestions);
    // Example:
    // const assignmentRef = doc(db, 'assignments', assignmentId);
    // await updateDoc(assignmentRef, { questions: editedQuestions });
  };

  useEffect(() => {
    if (editingQuestionIndex === null) {
      saveChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingQuestionIndex]);

  // Get choice style
  const getChoiceStyle = (choice) => {
    return (
      choiceStyles[choice.toLowerCase()] || { background: '#E0E0E0', color: '#000000' }
    );
  };

  // Render individual choice
  const renderChoice = (question, questionIndex, choiceKey) => {
    const isSelected = selectedExplanations[questionIndex] === choiceKey;
    const isCorrect = question.correct.toLowerCase() === choiceKey.toLowerCase();
    const style = getChoiceStyle(choiceKey);
    const explanationKey = `explanation_${choiceKey.toLowerCase()}`;
    const explanation = question[explanationKey];

    return (
      <div
        key={choiceKey}
        style={{
          width: '100%',
          marginLeft: '-40px',
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          marginBottom: '10px',
        }}
      >
        {/* Icon indicating correct or incorrect */}
        <div
          style={{
            marginRight: '10px',
            marginTop: '5px',
            color: isCorrect ? '#20BF00' : 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {isCorrect ? <Check size={20} /> : <SquareX size={20} />}
          {editingQuestionIndex === questionIndex && (
            <div
              style={{
                cursor: 'pointer',
                marginBottom: '5px',
                marginTop: '-20px',
              }}
              onClick={() => handleCorrectAnswerChange(questionIndex, choiceKey)}
            >
              {isCorrect ? (
                <SquareCheck size={24} color={'transparent'} />
              ) : (
                <Square size={24} color={'lightgrey'} />
              )}
            </div>
          )}
        </div>

        {/* Choice content */}
        <div style={{ flex: '1' }}>
          {/* Choice text area */}
          {editingQuestionIndex === questionIndex ? (
            <textarea
              value={question[choiceKey]}
              onChange={(e) =>
                handleChoiceChange(questionIndex, choiceKey, e.target.value)
              }
              style={{
                width: '100%',
                fontWeight: '500',
                fontSize: '16px',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                background: style.background,
                color: style.color,
                borderLeft: `4px solid ${style.color}`,
                padding: '10px',
                borderRadius: '3px',
              }}
              rows="1"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          ) : (
            <div style={{ display: 'flex', height: '30px' }}>
              <p
                style={{
                  fontWeight: '500',
                  fontSize: '16px',
                  padding: '5px 20px',
                  width: '91%',
                  background: style.background,
                  color: style.color,
                  borderLeft: `4px solid ${style.color}`,
                  margin: '0',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (editingQuestionIndex === null) {
                    handleSelectExplanation(questionIndex, choiceKey);
                  }
                }}
              >
                {question[choiceKey]}
              </p>
              <h1
                style={{
                  marginLeft: 'auto',
                  fontSize: '16px',
                  border: '1px solid blue',
                  height: '20px',
                  marginTop: '5px',
                  marginRight: '-10px',
                  color: style.color,
                  fontWeight: '',
                }}
              >
                10
              </h1>
            </div>
          )}

          {/* Explanation in edit mode */}
          {editingQuestionIndex === questionIndex ? (
            <textarea
              value={question[explanationKey]}
              onChange={(e) =>
                handleExplanationChange(questionIndex, choiceKey, e.target.value)
              }
              style={{
                width: '96%',
                marginTop: '5px',
                fontSize: '14px',
                borderRadius: '5px',
                padding: '5px',
                outline: 'none',
                resize: 'vertical',
                color: '#333',
                marginLeft: '20px', // Indent the explanation
              }}
              placeholder="Explanation..."
              rows="1"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          ) : null}
        </div>

        {/* Correct answer checkbox and delete icon (only in editing mode) */}
        {editingQuestionIndex === questionIndex && (
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
            {/* Delete icon */}
            <div
              style={{
                cursor: 'pointer',
              }}
              onClick={() => handleDeleteChoice(questionIndex, choiceKey)}
            >
              <SquareX size={24} color={'red'} />
            </div>
          </div>
        )}
      </div>
    );
  }
    return (
      <div
        style={{
          zIndex: '10',
          marginTop: '80px',
          width: 'calc(100% - 200px)',
          position: 'relative',
          marginLeft: '200px', 
        }}
      >
        <QuestionBankHeader
          questionsCount={editedQuestions.length}
          onSearchChange={handleSearchChange}
          searchTerm={searchTerm}
          getGradeColors={() => {}} // Remove if not needed
        />
        {filteredQuestions.map((question, questionIndex) => (
          <div
            key={questionIndex}
            style={{
              padding: '20px 0px',
              marginBottom: '10px',
              marginTop: '10px',
              borderBottom: '1px solid #ededed',
            }}
          >
            {/* Question Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                marginLeft: '4%',
                marginBottom: '10px',
              }}
            >
              {/* Question Number */}
            

              {/* Question Text or Editable Textarea */}
              {editingQuestionIndex === questionIndex ? (
                <textarea
                  value={question.question}
                  onChange={(e) =>
                    handleQuestionChange(questionIndex, 'question', e.target.value)
                  }
                  style={{
                    flex: '1',
                    fontSize: '20px',
                    fontWeight: '600',
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
                    fontWeight: '600',
                    margin: '0 10px 0 0',
                  }}
                >
                  {question.question}
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', marginRight: '4%' }}>
                {/* Toggle Choices Button */}
                <button
                  onClick={() => handleToggleChoices(questionIndex)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    marginRight: '10px',
                  }}
                >
                  {showChoices[questionIndex] ? (
                    <ChevronUp size={24} color="#757575" strokeWidth={2} />
                  ) : (
                    <ChevronDown size={24} color="#757575" strokeWidth={2} />
                  )}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => handleEditQuestion(questionIndex)}
                  style={{
                    cursor: 'pointer',
                    background: 'white',
                    marginRight: '20px',
                    borderRadius: '10px',
                    border: 'none',
                    padding: '5px 8px',
                  }}
                >
                  {editingQuestionIndex === questionIndex ? (
                    <PencilOff size={24} color="#757575" strokeWidth={2} />
                  ) : (
                    <Pencil strokeWidth={2} size={24} color="#757575" />
                  )}
                </button>

                {/* Progress Indicator (Placeholder) */}
                <span style={{ marginRight: '10px', fontSize: '16px' }}>00%</span>
                <ArrowRight size={24} color="blue" strokeWidth={2} />
              </div>
            </div>

            {/* Choices Section */}
            {(showChoices[questionIndex] || editingQuestionIndex === questionIndex) && (
              <div
                style={{
                  width: '92%',
                  marginLeft: '4%',
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '5px',
                }}
              >
                {/* Render Choices */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {Object.keys(question)
                    .filter((key) => key.match(/^[a-z]$/))
                    .map((choice) => renderChoice(question, questionIndex, choice))}
                </div>

                {/* Common Explanation Area for Non-Edit Mode */}
                {editingQuestionIndex !== questionIndex && selectedExplanations[questionIndex] && (
                  <div
                    style={{
                      marginTop: '30px',
                      width: '92%',
                      marginLeft: '-10px',
                      marginBottom: '30px',
                    }}
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        marginBottom: '10px',
                        fontWeight: '500',
                        display: 'flex',
                      }}
                    >
                      <MessageSquareMore size={24} style={{ marginRight: '10px' }} />
                      <div
                        style={{
                          margin: 0,
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        Explanation
                      </div>
                    </div>
                    <p style={{ margin: 0 }}>
                      {question[`explanation_${selectedExplanations[questionIndex].toLowerCase()}`] ||
                        'No explanation provided.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
};

export default QuestionBankMCQ;
