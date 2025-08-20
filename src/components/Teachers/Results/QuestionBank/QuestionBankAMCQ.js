// QuestionBankAMCQ.js

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../Universal/firebase';
import React, { useState, useEffect } from 'react';
import {
  Pencil,
  PencilOff,
  Check,
  Square,
  SquareCheck,
  SquareX,
  DeleteIcon,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquareMore,
  Search,
  BarChart,
  Target,
  Users,
  XCircle,
  CircleCheckBig,
  Circle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '../../../../styles';
const QuestionBankHeader = ({ questionsCount, averageScore, onSearchChange, searchTerm, getGradeColors, showChoices, setShowChoices, editedQuestions, hasScrolled }) => (
  <div style={{ 
    width: 'calc(100% - 200px)',
    height: '60px',
    display: 'flex',
    top: '60px',
    marginTop: '-2px',
    alignItems: 'center',
    background: 'rgb(255,255,255,.9)',
    backdropFilter: 'blur(5px)',
    zIndex: '10',
         borderBottom: hasScrolled ? "1px solid #ddd" : "1px solid transparent",
     transition: 'border-bottom 0.3s ease',
  position: 'fixed',
  
  }}>
    <div style={{ 
      marginLeft: '4%', 
      width: '460px', 
      display: 'flex', 
      marginTop: '5px',
      position: 'relative',
      zIndex: 1,
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
       Questions {questionsCount} 
      </h1>

      
    </div>

    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginLeft: 'auto',
      marginRight: '4%',
      position: 'relative',
    }}>
      <button
        onClick={() => {
          const allCollapsed = Object.values(showChoices).every(value => !value);
          if (allCollapsed) {
            const newState = {};
            editedQuestions.forEach((_, index) => {
              newState[index] = true;
            });
            setShowChoices(newState);
          } else {
            setShowChoices({});
          }
        }}
        style={{
          padding: '5px 15px',
          borderRadius: '40px',
          border: '1px solid #ddd',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontFamily: "'montserrat', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          color: '#666'
        }}
      >
        {!Object.values(showChoices).every(value => !value) ? (
          <>
            <ChevronUp size={18} strokeWidth={1.5} />
            Collapse All
          </>
        ) : (
          <>
            <ChevronDown size={18} strokeWidth={1.5} />
            Expand All
          </>
        )}
      </button>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search questions..."
          style={{
            width: '200px',
            
            padding: '5px 15px',
            paddingLeft: '35px',
          borderRadius: '40px',
          border: '1px solid #ddd',
            fontSize: '.9rem',
            fontFamily: "'montserrat', sans-serif",
            outline: 'none'
          }}
        />
        <Search
          size={18} 
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'grey'
          }}
        />
      </div>
    </div>
    <div style={{
        fontSize: '16px',
        padding: '5px',
        marginRight: '4%',
        textAlign: 'center',
        width: "40px",
        borderRadius: '5px',
        background: averageScore ? getGradeColors(averageScore).background : 'white',
        color: averageScore ? getGradeColors(averageScore).color : '#858585',
      }}> 
        {averageScore !== null ? averageScore : '-'}%
      </div>
  </div>
);

const ChoiceStats = ({ question, choice, questionStats, isCorrect, style }) => {
  const stats = questionStats[question.question];
  if (!stats || !stats.choiceDistribution) return null;

  const distribution = stats.choiceDistribution[choice];
  const usersSelected = distribution ? 1 : 0; // Since each user choice is recorded as a single entry

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
      height: '100%',
      padding: '0 10px',
      gap: '4px'
    }}>
      {usersSelected > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'transparent' ,
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '13px',
          color: style.color,
          fontWeight: '500',
          height: '24px'
        }}>
          <Users size={20} />
          {usersSelected}
        </div>
      )}
    </div>
  );
};
const QuestionBankAMCQ = ({
  editedQuestions,
  setEditedQuestions,
  assignmentId,
  onClose,
  questionStats,
  totalSubmissions
}) => {
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [showChoices, setShowChoices] = useState({});
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [hoveredChoice, setHoveredChoice] = useState(null);
  const [selectedExplanations, setSelectedExplanations] = useState(() => {
    // Initialize with correct answers selected
    const initialState = {};
    editedQuestions.forEach((question, index) => {
      initialState[index] = question.correctChoice;
    });
    return initialState;
  }); // Tracks selected choice per question for explanations
  const [searchTerm, setSearchTerm] = useState('');
  // Define choice styles
  const choiceStyles = {
    a: { background: '#B6C2FF', color: '#020CFF', variant: 'blue' },
    b: { background: '#B4F9BC', color: '#2BB514', variant: 'green' },
    c: { background: '#FFECAF', color: '#F4A700', variant: 'yellow' },
    d: { background: '#F6C0FF', color: '#E01FFF', variant: 'pink' },
    e: { background: '#ADFFFB', color: '#00AAB7', variant: 'teal' },
    f: { background: '#E0E0E0', color: '#000000', variant: 'clear' },
    g: { background: '#E0E0E0', color: '#000000', variant: 'clear' },
    h: { background: '#E0E0E0', color: '#000000', variant: 'clear' },
  };

  const getDifficultyStyle = (difficultyScore) => {
    const numDifficulty = parseFloat(difficultyScore);
    if (numDifficulty <= 0.9) return { background: '#D3FFCC', color: '#2BB514' };
    if (numDifficulty <= 1.9) return { background: '#FFE2AC', color: '#FF8800' };
    return { background: '#FFB6B6', color: '#FF2D2D' };
  };

  const DifficultyTooltip = ({ difficulty }) => {
  const numDifficulty = parseFloat(difficulty);
  const level = numDifficulty <= 0.9 ? 'Easy' : numDifficulty <= 1.9 ? 'Medium' : 'Hard';
  
  return (
    <div className="tooltip" style={{
      position: 'absolute',
      top: '50%',
      left: 'calc(100% + 15px)',
      transform: 'translateY(-50%)',
      backgroundColor: 'rgb(255,255,255,.6)', 
      backdropFilter: 'blur(5px)',
      padding: '12px 15px',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      width: '180px',
      zIndex: 1000,
      border: '1px solid #ddd'
    }}>
      <div style={{ 
        marginBottom: '12px', 
        fontSize: '12px', 
        fontWeight: '500',
        color: '#666'
      }}>
        {level} ({numDifficulty.toFixed(1)})
      </div>
      <div style={{ 
        position: 'relative',
        height: '3px',
        backgroundColor: '#f5f5f5',
        borderRadius: '2px',
        marginBottom: '15px'
      }}>
        {[0, 1, 2, 3].map(mark => (
          <div key={mark} style={{
            position: 'absolute',
            left: `${(mark / 3) * 100}%`,
            bottom: '-15px',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: '#999'
          }}>
            {mark}
          </div>
        ))}
        <div style={{
          position: 'absolute',
          left: '0',
          width: `${Math.min((numDifficulty / 3) * 100, 100)}%`,
          height: '100%',
          backgroundColor: getDifficultyColor(difficulty),
          borderRadius: '2px'
        }} />
      </div>
      <div style={{
        position: 'absolute',
        left: '-6px',
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)',
        width: '10px',
        height: '10px',
        backgroundColor: 'white',
        border: '1px solid #eee',
        borderRight: 'none',
        borderBottom: 'none'
      }} />
    </div>
  );
};

const getDifficultyLabel = (difficultyScore) => {
  const numDifficulty = parseFloat(difficultyScore);
  const level = numDifficulty <= 0.9 ? 'E' : numDifficulty <= 1.9 ? 'M' : 'H';
  return `${level}(${numDifficulty.toFixed(1)})`;
};

const getDifficultyColor = (difficulty) => {
  const numDifficulty = parseFloat(difficulty);
  if (numDifficulty <= 0.9) return '#2BB514';
  if (numDifficulty <= 1.9) return '#FF8800';
  return '#FF2D2D';
};

  // Handle difficulty click to cycle through levels
  const handleDifficultyClick = (questionIndex) => {
    if (editingQuestionIndex === questionIndex) {
      const currentScore = editedQuestions[questionIndex].difficultyScore;
      let nextScore;
      if (currentScore <= 0.9) nextScore = 1.5;
      else if (currentScore <= 1.9) nextScore = 2.5;
      else nextScore = 0.5;
      handleDifficultyChange(questionIndex, nextScore);
    }
  };

  // Get choice style based on choice key
  const getChoiceStyle = (choice) => {
    return (
      choiceStyles[choice.toLowerCase()] || { background: 'white', color: '#000000' }
    );
  };

  const getDifficultyDisplay = (difficulty) => {
    return difficulty === 'Medium' ? 'Med' : difficulty;
  };

  // Toggle editing mode for a question
  const handleEditQuestion = (index) => {
    setEditingQuestionIndex(index === editingQuestionIndex ? null : index);
  };

  // Handle changes to question text
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[index][field] = value;
    setEditedQuestions(updatedQuestions);
  };

  // Handle changes to a specific choice
  const handleChoiceChange = (questionIndex, choiceIndex, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].choices[choiceIndex] = value;
    setEditedQuestions(updatedQuestions);
  };

  // Handle changes to explanations for choices
  const handleExplanationChange = (questionIndex, choiceIndex, value) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].explanations[choiceIndex] = value;
    setEditedQuestions(updatedQuestions);
  };

  // Handle changes to the correct answer
  const handleCorrectAnswerChange = (questionIndex, newCorrectChoice) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].correctChoice = newCorrectChoice;
    setEditedQuestions(updatedQuestions);
  };

  // Handle changes to difficulty level
  const handleDifficultyChange = (questionIndex, newDifficultyScore) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].difficultyScore = newDifficultyScore;
    setEditedQuestions(updatedQuestions);
  };

  // Handle deletion of a choice
  const handleDeleteChoice = (questionIndex, choiceIndex) => {
    if (window.confirm('Are you sure you want to delete this choice?')) {
      const updatedQuestions = [...editedQuestions];
      const question = updatedQuestions[questionIndex];

      // Remove the choice and its explanation
      question.choices.splice(choiceIndex, 1);
      question.explanations.splice(choiceIndex, 1);

      // If the deleted choice was the correct answer, assign a new correct answer
      const deletedChoiceLetter = String.fromCharCode(97 + choiceIndex);
      if (question.correctChoice === deletedChoiceLetter) {
        if (question.choices.length > 0) {
          question.correctChoice = String.fromCharCode(97); // Set to 'a'
        } else {
          question.correctChoice = '';
        }
      }

      setEditedQuestions(updatedQuestions);
      saveChanges();
    }
  };
  const questionsWithIds = editedQuestions.map((q, index) => ({
    ...q,
    id: index
  }));

  // Calculate average score from questions
  const calculateAverageScore = () => {
    const scores = editedQuestions
      .map(q => q.averageScore)
      .filter(score => score !== undefined && score !== null);
    
    if (scores.length === 0) return null;
    
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(average);
  };

  // Handle search input changes
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // Filter questions based on search term
  const filteredQuestions = questionsWithIds.filter(question =>
    question.question.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Toggle visibility of choices
  const handleToggleChoices = (index) => {
    setShowChoices((prev) => {
      const newState = { ...prev, [index]: !prev[index] };
      // If we're opening the choices, set the correct choice as selected
      if (newState[index]) {
        setSelectedExplanations((prevExp) => ({ 
          ...prevExp, 
          [index]: editedQuestions[index].correctChoice 
        }));
      }
      return newState;
    });
  };

  // Toggle selected explanation in non-edit mode
  const handleSelectExplanation = (questionIndex, choiceKey) => {
    setSelectedExplanations((prev) => ({
      ...prev,
      [questionIndex]: prev[questionIndex] === choiceKey ? null : choiceKey,
    }));
  };
  // Filter questions based on search term

  // Save changes to Firebase
  const saveChanges = async () => {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      await updateDoc(assignmentRef, { questions: editedQuestions });
      console.log('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };
  const getSuccessRate = (question) => {
    const stats = questionStats[question.question];
    if (!stats || stats.totalAttempts === 0) {
      return null; // Will display as "-"
    }
    return stats.percentageCorrect || 0; // Will display as "0" if incorrect
  };
  useEffect(() => {
    if (editingQuestionIndex === null) {
      saveChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingQuestionIndex]);

  // Render choices
  const renderChoice = (question, questionIndex, choiceLetter, choiceIndex) => {
    const isSelected = selectedExplanations[questionIndex] === choiceLetter;
    const isCorrect = question.correctChoice === choiceLetter;
    const style = getChoiceStyle(choiceLetter);
    const choice = question.choices[choiceIndex];
    const explanation = question.explanations[choiceIndex];

    return (
      <div
        key={choiceLetter}
        style={{
          width: '100%',
          marginLeft: '-40px',
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          marginBottom: '10px',
        }}
      >
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
          {!editingQuestionIndex === questionIndex && (isCorrect ? <Check size={20} /> : <SquareX size={20} />)}
        </div>

        <div style={{  display: 'flex', alignItems: 'center', marginLeft: '4%', width: '830px' }}>
          {editingQuestionIndex === questionIndex ? (
            <div style={{ marginBottom: '10px'}}>
            <textarea
                              value={choice}
              onChange={(e) =>
                handleChoiceChange(questionIndex, choiceIndex, e.target.value)
              }
                              style={{
                  width: '800px',
                  fontWeight: '500',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'none',
                  background: 'white',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '10px 15px',
                  borderRadius: '100px',
                  overflow: 'hidden',
                  minHeight: '20px'
                }}
              rows="1"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
                           <textarea
               value={question.explanations[choiceIndex]}
               onChange={(e) =>
                 handleExplanationChange(questionIndex, choiceIndex, e.target.value)
               }
               placeholder="Add explanation for this choice..."
               style={{
                 width: '850px',
                 marginLeft: '50px',
                 marginTop: '10px',
                 fontWeight: '400',
                 fontSize: '0.9rem',
                 outline: 'none',
                 background: '#f9f9f9',
                 color: '#666',
                 border: 'none',
                 borderLeft: '3px solid #ddd',
                 padding: '10px 15px',
                 fontStyle: 'italic',
                 resize: 'none',
                 minHeight: '20px',
               }}
               onInput={(e) => {
                 e.target.style.height = 'auto';
                 e.target.style.height = e.target.scrollHeight + 'px';
               }}
             />
            </div>
          ) : (
            <div style={{ display: 'flex', width: '800px', height: '40px', alignItems: 'center' }}>
              {isSelected ? (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <GlassContainer
                    variant={style.variant}
                    size={0}
                    onClick={() => {
                      if (editingQuestionIndex === null) {
                        handleSelectExplanation(questionIndex, choiceLetter);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      width: '830px',
                      position: 'relative'
                    }}
                    contentStyle={{
                      padding: '8px 15px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      width: '100%'
                    }}>
                      <p style={{
                        margin: 0,
                        color: style.color,
                        fontSize: '0.9rem',
                        fontWeight: '400',
                        textAlign: 'left',
                        width: '100%'
                      }}>
                        {choice}
                      </p>
                    </div>
                  </GlassContainer>
                  {isCorrect && (
                    <div style={{ marginRight: '-30px', display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                      <Check size={20} color={style.color}  strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div
                    onClick={() => {
                      if (editingQuestionIndex === null) {
                        handleSelectExplanation(questionIndex, choiceLetter);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      width: '100%',
                      border: '1px solid #ddd',
                      borderRadius: '100px',
                      padding: '8px 15px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      fontWeight: '400'
                    }}>
                      {choice}
                    </span>
                  </div>
                  {isCorrect && (
                    <div style={{ marginRight: '-30px', display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                      <Check size={20} strokeWidth={1.5} color="#ddd" />
                    </div>
                  )}
                </div>
              )}
              <ChoiceStats 
                question={question}
                choice={choiceLetter}
                questionStats={questionStats}
                isCorrect={isCorrect}
                style={style}
              />
            </div>
          )}
        </div>

        {editingQuestionIndex === questionIndex && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px', justifyContent: 'space-between', width: '100%'}}>
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={() => handleCorrectAnswerChange(questionIndex, choiceLetter)}
              >
                {isCorrect ? (
                  <CircleCheckBig size={24} strokeWidth={1.5} color={'#20BF00'} />
                ) : (
                  <Circle size={24} strokeWidth={1.5} color={'#ddd'} />
                )}
              </div>
              <div
                style={{
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
                onClick={() => handleDeleteChoice(questionIndex, choiceIndex)}
              >
                <XCircle size={24} color={'red'} strokeWidth={1.5} />
              </div>
            </div>
           
          </div>
        )}
      </div>
    );
  };
   const getGradeColors = (grade) => {
    if (grade === undefined || grade === null ) return { color: '#858585', background: 'white' };
    if (grade < 50) return { color: '#FF0000', background: '#FFCBCB' };
    if (grade < 70) return { color: '#FF4400', background: '#FFC6A8' };
    if (grade < 80) return { color: '#EFAA14', background: '#FFF4DC' };
    if (grade < 90) return { color: '#9ED604', background: '#EDFFC1' };
    if (grade > 99) return { color: '#E01FFF', background: '#F7C7FF' };
    return { color: '#2BB514', background: '#D3FFCC' };
  };
  return (
    <>
    <div
      style={{
        zIndex: '10',
        marginTop: '-40px',
        width: '100%',
        position: 'relative',
      }}
    >
      <style>
        {`
          .tooltip-container {
            position: relative;
            display: inline-block;
          }
          .tooltip-container:hover .tooltip {
            display: block !important;
          }
          .tooltip {
            display: none;
          }
        `}
      </style>
      <QuestionBankHeader
        questionsCount={questionsWithIds.length}
        averageScore={calculateAverageScore()}
        onSearchChange={handleSearchChange}
        searchTerm={searchTerm}
        getGradeColors={getGradeColors}
        showChoices={showChoices}
        setShowChoices={setShowChoices}
        editedQuestions={editedQuestions}
        hasScrolled={hasScrolled}
      />
      {filteredQuestions.map((question, questionIndex) => {
        const successRate = getSuccessRate(question);
        
        return (
        <div
          key={questionIndex}
          style={{
            padding: '20px 0px',
            margin: '0px 2%',
            marginBottom: '10px',
            marginTop: '10px',

            borderBottom: '1px solid #ddd',
          }}
        >
          {/* Question Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              marginLeft: '2%',
              marginBottom: '10px',
            }}
          >
            {/* Difficulty Label */}
         

            {/* Question Text or Editable Textarea */}
            {editingQuestionIndex === questionIndex ? (
              <textarea
                value={question.question}
                onChange={(e) =>
                  handleQuestionChange(questionIndex, 'question', e.target.value)
                }
                style={{
                  flex: '1',
                  fontSize: '1.3rem',
                  fontWeight: '400',
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
                  margin: 0,
                  fontSize: '1.1rem',
                  color: '#333',
                  flex: 1,
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                 <div
              onClick={() => handleDifficultyClick(questionIndex)}
              className="tooltip-container"
              style={{
                fontSize: '0.9rem',
                color: '#666',
                cursor: editingQuestionIndex === questionIndex ? 'pointer' : 'help',
                marginRight: '8px',
                position: 'relative'
              }}
            >
              {getDifficultyLabel(question.difficultyScore)}
              {!editingQuestionIndex && <DifficultyTooltip difficulty={question.difficultyScore} />}
            </div>
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
                  <ChevronUp size={24} color="#757575" strokeWidth={1.5} />
                ) : (
                  <ChevronDown size={24} color="#757575" strokeWidth={1.5} />
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
                  <PencilOff size={24} color="#757575" strokeWidth={1.5} />
                ) : (
                  <Pencil strokeWidth={1.5} size={24} color="#757575" />
                )}
              </button>

              {/* Progress Indicator (Placeholder) */}
              <span style={{ marginRight: '10px', 

background:  getGradeColors(successRate).background ,
              color: getGradeColors(successRate).color ,
              fontSize: '16px', 
              padding: '5px',
              textAlign: 'center',
              width: "40px",

              borderRadius: '5px',
               }}>      {successRate !== null ? `${successRate}%` : '-'}</span>
           
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
                {question.choices.map((choice, choiceIndex) => {
                  const choiceLetter = String.fromCharCode(97 + choiceIndex);
                  return renderChoice(question, questionIndex, choiceLetter, choiceIndex);
                })}
              </div>

              {/* Common Explanation Area for Non-Edit Mode */}
              {editingQuestionIndex !== questionIndex && selectedExplanations[questionIndex] && (
                <div style={{
                  marginTop: '15px',
                  marginLeft: '20px',
                  width: '75%',
                  padding: '15px',
                  fontSize: '0.9rem',
                  color: getChoiceStyle(selectedExplanations[questionIndex].toLowerCase()).color,
                  fontStyle: 'italic',
                  borderLeft: `2px solid ${getChoiceStyle(selectedExplanations[questionIndex].toLowerCase()).color}`,
                  backgroundColor: `${getChoiceStyle(selectedExplanations[questionIndex].toLowerCase()).background}33`,
                  borderRadius: '0 8px 8px 0'
                }}>
                  {question.explanations[selectedExplanations[questionIndex].charCodeAt(0) - 97] ||
                    'No explanation provided.'}
                </div>
              )}
            </div>
                 )}
                 </div>
               );
             })}
           </div>
           
           </>
         );
       };

export default QuestionBankAMCQ;
