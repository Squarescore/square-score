import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PreviewAMCQ = ({ questions, onBack, onNext }) => {
  const [hoveredChoice, setHoveredChoice] = useState(null);

  const choiceStyles = {
    a: { background: '#A3F2ED', color: '#00645E' },
    b: { background: '#AEF2A3', color: '#006428' },
    c: { background: '#F8CFFF', color: '#E01FFF' },
    d: { background: '#FFECA8', color: '#CE7C00' },
    e: { background: '#FFD1D1', color: '#FF0000' },
  };

  const getChoiceStyle = (choice) => {
    return choiceStyles[choice.toLowerCase()] || { background: '#E0E0E0', color: '#000000' };
  };

  const getChoiceWidth = (choicesLength) => {
    switch (choicesLength) {
      case 2:
        return '45%';
      case 3:
        return '45%';
      case 4:
        return '45%';
      case 5:
        return '30%';
      default:
        return '100%';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'lightblue';
      case 'medium':
        return 'blue';
      case 'hard':
        return 'darkblue';
      default:
        return 'blue';
    }
  };

  return (
    <div style={{ marginTop: '100px', width: '1000px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'Radio Canada', sans-serif" }}>
      <h1 style={{ marginLeft: '40px', fontFamily: "'Radio Canada', sans-serif", color: 'black', fontSize: '60px', display: 'flex' }}>
        Preview (<h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '0px', color: '#009006', display: 'flex' }}> MCQ<h1 style={{ fontSize: '50px', marginTop: '-10px', marginLeft: '0px', color: '#FCCA18', display: 'flex' }}>*</h1> </h1>)
      </h1>
      <button
            onClick={onBack}
            style={{
              position: 'fixed',
              width: '75px',
              height: '75px',
              padding: '10px 20px',
              left: '5%',
              top: '460px',
              bottom: '20px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              border: 'none',
              fontSize: '30px',
              color: '#45B434',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontFamily: "'Radio Canada', sans-serif",
              transition: '.5s',
              transform: 'scale(1)',
              opacity: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            <img src='/LeftGreenArrow.png' style={{width: '75px', transition: '.5s'}} />
          </button>
      {questions.map((question, questionIndex) => (
        <div key={questionIndex} style={{ borderBottom: '10px solid lightgrey', padding: '20px', marginBottom: '30px' }}>
          <div style={{ width: '100%', display: 'flex', marginBottom: '30px' }}>
            <div style={{ 
              width: '20%', 
              border: `7px solid ${getDifficultyColor(question.difficulty)}`, 
              borderTopLeftRadius: '10px', 
              borderBottomLeftRadius: '10px', 
              position: "relative", 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h1 style={{ 
                fontSize: '22px', 
                color: 'white', 
                width: '120px', 
                textAlign: 'center', 
                background: getDifficultyColor(question.difficulty), 
                padding: '5px', 
                borderRadius: '10px', 
                position: 'absolute', 
                top: '-40px', 
                left: '30px' 
              }}>Difficulty</h1>
              <p style={{ 
                fontSize: '35px', 
                fontWeight: 'bold', 
                textAlign: 'center', 
                margin: 0 
              }}>{question.difficulty}</p>
            </div>
            <div style={{ width: '710px', border: '7px solid #E01FFF', marginLeft: 'auto', position: 'relative', borderTopRightRadius: '10px', borderBottomRightRadius: '10px' }}>
              <h1 style={{ fontSize: '25px', color: 'white', width: '160px', textAlign: 'center', background: '#E01FFF', padding: '5px', borderRadius: '10px', position: 'absolute', top: '-40px', left: '100px' }}>Question</h1>
              <p style={{ width: '90%', marginLeft: 'auto', marginRight: 'auto', fontSize: '25px', fontWeight: 'bold' }}>{question.question}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.keys(question).filter(key => key.match(/^[a-z]$/)).map((choice, index, array) => {
              const style = getChoiceStyle(choice);
              const width = getChoiceWidth(array.length);
              const isLastRow = array.length === 5 && index >= 3;
              const explanationKey = `explanation_${choice.toLowerCase()}`;
              const isHovered = hoveredChoice === `${questionIndex}-${choice}`;
              return (
                <div key={choice} style={{
                  width: width,
                  margin: '10px 1%',
                  padding: '10px',
                  background: style.background,
                  color: style.color,
                  borderRadius: isHovered ? '10px 10px 0 0' : '10px',
                  cursor: 'pointer',
                  boxShadow: question.correct.toLowerCase() === choice ? '0px 4px 4px 0px #1BC200' : '0px 4px 4px 0px transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  transition: 'border-radius 0.2s',
                  ...(isLastRow && { marginLeft: 'auto', marginRight: 'auto' })
                }}
                onMouseEnter={() => setHoveredChoice(`${questionIndex}-${choice}`)}
                onMouseLeave={() => setHoveredChoice(null)}
                >
                  <p style={{fontWeight: 'bold', fontSize: '20px', textAlign: 'center', margin: 0}}>{question[choice]}</p>
                  <AnimatePresence>
                    {isHovered && question[explanationKey] && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          width: '91.2%',
                          padding: '10px',
                          background: 'rgb(255,255,255,.9)',
                          border: `10px solid ${style.background}`,
                          borderRadius: '0 0 10px 10px',
                          zIndex: 1000,
                        }}
                      >
                        <p style={{color: 'black', fontWeight: 'bold', margin: 0}}>{question[explanationKey]}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
     
      </div>
    </div>
  );
};

export default PreviewAMCQ;