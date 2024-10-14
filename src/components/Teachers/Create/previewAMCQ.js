import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareArrowLeft} from 'lucide-react';
const PreviewAMCQ = ({ questions, onBack, onNext }) => {
  const [hoveredChoice, setHoveredChoice] = useState(null);

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

  
  return (
    <div style={{ marginTop: '100px', width: '1000px', marginLeft: 'auto', marginRight: 'auto', fontFamily: "'montserrat', sans-serif", zIndex: 100 }}>
      <h1 style={{ marginLeft: '40px', fontFamily: "'montserrat', sans-serif", color: 'black', fontSize: '60px', display: 'flex' }}>
        Preview  <h1 style={{ fontSize: '50px', marginTop: '10px', marginLeft: '30px', color: '#2BB514', display: 'flex' }}> MCQ<h1 style={{ fontSize: '50px', marginTop: '-10px', marginLeft: '0px', color: '#FCCA18', display: 'flex' }}>*</h1> </h1>
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
              fontFamily: "'montserrat', sans-serif",
              transition: '.5s',
              transform: 'scale(1)',
              opacity: '100%'
            }}
         
          >
         <SquareArrowLeft size={100} color="#2BB514" />
          </button>
      {questions.map((question, questionIndex) => (
        <div key={questionIndex} style={{ borderBottom: '4px solid #f4f4f4', padding: '20px', marginBottom: '30px' }}>
          <div style={{ width: '100%', display: 'flex', marginBottom: '30px' }}>
           
            <div style={{ width: '1000px', border: '4px solid #f4f4f4', marginLeft: 'auto', position: 'relative', borderRadius: '15px' , }}>
              <h1 style={{ fontSize: '25px', color: 'grey', width: '918px', textAlign: 'left', background: '#f4f4f4', padding: '5px',  paddingLeft: '30px',borderRadius: '15px 15px 0px 0px ', position: 'absolute', top: '-55px', left: '-4px',border: '4px solid lightgrey' }}>
                Question - {question.difficulty}</h1>
              <p style={{ width: '90%', marginLeft: '30px', fontSize: '25px', fontWeight: 'bold' }}>{question.question} </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Object.keys(question).filter(key => key.match(/^[a-z]$/)).map((choice, index, array) => {
              const style = getChoiceStyle(choice);
              const width = getChoiceWidth(array.length);
              const isLastRow = array.length === 5 && index >= 3;
              const explanationKey = `explanation_${choice.toLowerCase()}`;
              const isHovered = hoveredChoice === `${questionIndex}-${choice}`;
              const isCorrect = question.correct.toLowerCase() === choice;
              
              return (
                <div style={{
                  width: width,
                  margin: '10px 1%',
                  padding: '10px',
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
                  boxShadow: isCorrect ? `0 0 0 4px white, 0 0 0 8px #AEF2A3` : 'none',
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