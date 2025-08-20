import React, { useState, useEffect, useRef } from 'react';
import { GlassContainer } from '../../../styles';
import { Eye, ChevronLeft, ChevronRight, Check, HelpCircle } from 'lucide-react';

const DifficultyTooltip = ({ difficulty }) => {
  const numDifficulty = parseFloat(difficulty);
  const level = numDifficulty <= 0.9 ? 'Easy' : numDifficulty <= 1.9 ? 'Medium' : 'Hard';
  
  return (
    <div className="tooltip" style={{
      position: 'absolute',
      top: '50%',
      left: 'calc(100% + 15px)', // Position to the right with some spacing
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
      {/* Arrow pointing left */}
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

const getDifficultyLabel = (difficulty) => {
  const numDifficulty = parseFloat(difficulty);
  const level = numDifficulty <= 0.9 ? 'E' : numDifficulty <= 1.9 ? 'M' : 'H';
  return `${level}(${numDifficulty.toFixed(1)})`;
};

const getDifficultyColor = (difficulty) => {
  const numDifficulty = parseFloat(difficulty);
  if (numDifficulty <= 0.9) return '#2BB514';
  if (numDifficulty <= 1.9) return '#FF8800';
  return '#FF2D2D';
};

const PreviewAMCQ = ({ questions, sectors, onBack, onSave, showCloseButton = true }) => {
  const [currentSector, setCurrentSector] = useState(1);
  const [currentDifficulty, setCurrentDifficulty] = useState('all');
  const [selectedChoices, setSelectedChoices] = useState(new Map());
  const containerRef = useRef(null);

  // Initialize selectedChoices with correct answers expanded
  useEffect(() => {
    const initialSelectedChoices = new Map();
    getAllQuestions().forEach(question => {
      initialSelectedChoices.set(question.question, question.correctChoice);
    });
    setSelectedChoices(initialSelectedChoices);
  }, [currentDifficulty]);

  const getQuestionsForSector = (sectorNumber) => {
    const sectorQuestions = questions.reduce((acc, question) => {
      if (question.sectorNumber === sectorNumber) {
        if (currentDifficulty === 'all' || 
            (currentDifficulty === 'easy' && question.difficultyScore <= 0.9) ||
            (currentDifficulty === 'medium' && question.difficultyScore > 0.9 && question.difficultyScore <= 1.9) ||
            (currentDifficulty === 'hard' && question.difficultyScore > 1.9)) {
          acc.push(question);
        }
      }
      return acc;
    }, []);
    return sectorQuestions;
  };

  const getAllQuestions = () => {
    return sectors.flatMap((sector, index) => 
      getQuestionsForSector(index + 1)
    );
  };

  const getChoiceStyle = (choice) => {
    const styles = {
      a: { background: '#B6C2FF', color: '#020CFF', variant: 'blue' },
      b: { background: '#B4F9BC', color: '#2BB514', variant: 'green' },
      c: { background: '#FFECAF', color: '#F4A700', variant: 'yellow' },
      d: { background: '#F6C0FF', color: '#E01FFF', variant: 'pink' },
      e: { background: '#ADFFFB', color: '#00AAB7', variant: 'teal' },
    };
    return styles[choice.toLowerCase()] || { background: '#E0E0E0', color: '#000000', variant: 'clear' };
  };

  const toggleChoiceExplanation = (questionId, choiceLetter) => {
    setSelectedChoices(prev => {
      const newMap = new Map(prev);
      if (newMap.get(questionId) === choiceLetter) {
        newMap.delete(questionId);
      } else {
        newMap.set(questionId, choiceLetter);
      }
      return newMap;
    });
  };

  return (
    <div style={{ zIndex: '10', position: 'absolute', top: '-220px', left: '50%', transform: 'translatex(-50%)' }}>
      <GlassContainer
        variant="clear"
        size={2}
        style={{
          width: '800px',
          marginTop: '20px'
        }}
        contentStyle={{
          padding: '30px'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Header with Preview text and filters */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Eye size={25} 
              strokeWidth={1.5} color="#666" />
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '400',
                color: '#333',
                fontFamily: "'Montserrat', sans-serif"
              }}>
                Question Preview
              </span>
            </div>

            {/* Difficulty Filter */}
            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              {['all', 'easy', 'medium', 'hard'].map(difficulty => {
                const isSelected = currentDifficulty === difficulty;
                
                return isSelected ? (
                  <div key={difficulty}>
                    <GlassContainer
                      variant="green"
                      size={0}
                      onClick={() => setCurrentDifficulty(difficulty)}
                      contentStyle={{
                        padding: '5px 15px',
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '0.9rem',
                        fontWeight: "500",
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {difficulty}
                    </GlassContainer>
                  </div>
                ) : (
                  <button
                    key={difficulty}
                    onClick={() => setCurrentDifficulty(difficulty)}
                    style={{
                      padding: '5px 15px',
                      borderRadius: '50px',
                      border: '1px solid #ddd',
                      background: 'white',
                      color: '#666',
                      cursor: 'pointer',
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '0.9rem',
                      textTransform: 'capitalize'
                    }}
                  >
                    {difficulty}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions Display */}
          <div 
            ref={containerRef}
            style={{ 
              maxHeight: '600px', 
              overflowY: 'auto',
              paddingRight: '10px'
            }}
          >
            {sectors.map((sector, sectorIndex) => {
              const sectorQuestions = getQuestionsForSector(sectorIndex + 1);
              if (sectorQuestions.length === 0) return null;

              const scrollToSection = (targetIndex) => {
                const sections = document.querySelectorAll('[data-section]');
                sections[targetIndex]?.scrollIntoView({ behavior: 'smooth' });
              };

              return (
                <div key={sectorIndex} style={{ marginBottom: '40px' }} data-section>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    margin: '0 0 20px',
                    padding: '10px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <button
                      onClick={() => scrollToSection(sectorIndex - 1)}
                      disabled={sectorIndex === 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: sectorIndex === 0 ? 'default' : 'pointer',
                        opacity: sectorIndex === 0 ? 0.5 : 1,
                        padding: '5px 10px'
                      }}
                    >
                      <ChevronLeft size={15} color="grey" />
                    </button>

                    <h3 style={{ 
                      margin: 0,
                      color: 'grey',
                      fontWeight: '400',
                      fontSize: '1rem',
                      flex: 1,
                      textAlign: 'center'
                    }}>
                      Module {sectorIndex + 1} of {sectors.length} : {sector.sectorName || `Sector ${sectorIndex + 1}`}
                    </h3>

                    <button
                      onClick={() => scrollToSection(sectorIndex + 1)}
                      disabled={sectorIndex === sectors.length - 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: sectorIndex === sectors.length - 1 ? 'default' : 'pointer',
                        opacity: sectorIndex === sectors.length - 1 ? 0.5 : 1,
                        padding: '5px 10px'
                      }}
                    >
                      <ChevronRight size={15} color="grey" />
                    </button>
                  </div>

                  {sectorQuestions.map((question, questionIndex) => (
                    <div key={questionIndex} style={{ marginTop: '40px ',}}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '35px'
                      }}>
                        <p style={{ 
                          margin: 0,
                          fontSize: '1.1rem',
                          color: '#333',
                          flex: 1,
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span 
                            className="tooltip-container"
                            style={{
                              fontSize: '0.9rem',
                              color: '#666',
                              cursor: 'help',
                            }}
                          >
                            {getDifficultyLabel(question.difficultyScore)}
                            <DifficultyTooltip difficulty={question.difficultyScore}/>
                          </span>  {question.question}
                        </p>
                      </div>

                      <div style={{ marginLeft: '20px' }}>
                        {question.choices.map((choice, choiceIndex) => {
                          const choiceLetter = String.fromCharCode(97 + choiceIndex);
                          const isCorrect = choiceLetter === question.correctChoice;
                          const style = getChoiceStyle(choiceLetter);
                          const isSelected = selectedChoices.get(question.question) === choiceLetter;
                          
                          return (
                            <div key={choiceIndex} style={{ marginBottom: '10px' }}>
                              {isSelected ? (
                                <GlassContainer
                                  variant={style.variant}
                                  size={0}
                                  onClick={() => toggleChoiceExplanation(question.question, choiceLetter)}
                                  style={{
                                    cursor: 'pointer',
                                    width: '100%',
                                    position: 'relative'
                                  }}
                                  contentStyle={{
                                    padding: '8px 15px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div
                                  style={{display: 'flex', width: '100%',
                                    justifyContent: 'space-between'
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
                                  {isCorrect && (
                                    <Check size={18} color={style.color} style={{ marginLeft: 'auto' }} />
                                  )}
                                  </div>
                                </GlassContainer>
                              ) : (
                                <div
                                  onClick={() => toggleChoiceExplanation(question.question, choiceLetter)}
                                  style={{
                                    cursor: 'pointer',
                                    width: 'calc(100% - 30px)',
                                    border: '1px solid #ddd',
                                    borderRadius: '100px',
                                    padding: '8px 15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span style={{ 
                                    color: '#666',
                                    fontSize: '0.9rem',
                                    fontWeight: '400'
                                  }}>
                                    {choice}
                                  </span>
                                  {isCorrect && <Check size={18} color="#666" />}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* Explanation section below all choices */}
                        {selectedChoices.has(question.question) && (
                          <div style={{
                            marginTop: '15px',
                            padding: '15px',
                            fontSize: '0.9rem',
                            color: getChoiceStyle(selectedChoices.get(question.question)).color,
                            fontStyle: 'italic',
                            borderLeft: `2px solid ${getChoiceStyle(selectedChoices.get(question.question)).color}`,
                            backgroundColor: `${getChoiceStyle(selectedChoices.get(question.question)).background}33`,
                            borderRadius: '0 8px 8px 0'
                          }}>
                            {question.explanations[selectedChoices.get(question.question).charCodeAt(0) - 97]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </GlassContainer>

      <style>
        {`
          .tooltip-container {
            position: relative;
          }
          .tooltip-container:hover .tooltip {
            display: block !important; /* Added !important to override inline styles */
          }
          .tooltip {
            display: none; /* This will be overridden on hover */
          }
        `}
      </style>
    </div>
  );
};

export default PreviewAMCQ;