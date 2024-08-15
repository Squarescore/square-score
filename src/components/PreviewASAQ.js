import React, { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

const TeacherPreviewASAQ = ({ questionsWithIds, setQuestionsWithIds, onRegenerate }) => {
  const containerRef = useRef(null);
  const [textareaHeight, setTextareaHeight] = useState({});

  const [showRegenerateDropdown, setShowRegenerateDropdown] = useState(false);
  const [regenerateInput, setRegenerateInput] = useState('');
  
  
  const updateTextareaHeight = (index, height) => {
    setTextareaHeight(prev => ({...prev, [index]: height}));
  };
  
  const handleDeleteQuestion = (indexToDelete) => {
    const newQuestions = questionsWithIds.filter((_, index) => index !== indexToDelete);
    setQuestionsWithIds(newQuestions);
  };
  const difficultyColors = {
    easy: 'lightblue',
    medium: 'blue',
    hard: 'darkblue'
  };
  const handleChangeDifficulty = (index) => {
    const difficulties = ['easy', 'medium', 'hard'];
    const currentDifficulty = questionsWithIds[index].difficulty;
    const currentIndex = difficulties.indexOf(currentDifficulty);
    const newDifficulty = difficulties[(currentIndex + 1) % 3];
    handleEditQuestion(index, 'difficulty', newDifficulty);
  };
  const handleAddQuestion = () => {
    const newQuestion = {
      questionId: `newQuestion${questionsWithIds.length}`,
      difficulty: 'easy',
      question: "New question",
      expectedResponse: "New expected response"
    };

    let insertIndex = questionsWithIds.length;
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const scrollPosition = containerRef.current.scrollTop;
      const approximateQuestionHeight = 150; // Adjust this value based on your average question height
      
      insertIndex = Math.floor((scrollPosition + containerHeight / 2) / approximateQuestionHeight);
      insertIndex = Math.min(insertIndex, questionsWithIds.length);
    }

    const newQuestions = [
      ...questionsWithIds.slice(0, insertIndex),
      newQuestion,
      ...questionsWithIds.slice(insertIndex)
    ];
    setQuestionsWithIds(newQuestions);

    // Scroll to the new question after it's added
    setTimeout(() => {
      if (containerRef.current) {
        const newQuestionElement = containerRef.current.children[insertIndex];
        if (newQuestionElement) {
          newQuestionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 0);
  };
  const handleRegenerateSubmit = () => {
    onRegenerate(regenerateInput);
    setShowRegenerateDropdown(false);
    setRegenerateInput('');
  };
  const handleEditQuestion = (index, field, value) => {
    const newQuestions = [...questionsWithIds];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestionsWithIds(newQuestions);
  };

  return (
    <div style={{
      width: '900px',
      height: '500px',
      marginTop: '-20px',
      border: '10px solid lightgrey',
      background: 'RGB(255,255,255,.95)',
      backdropFilter: 'blur(5px)',
      borderRadius: '30px',
      padding: '20px',
      marginLeft: 'auto',
      marginRight: 'auto',
      position: 'relative',
    }}>
      <div style={{
        width: '940px',
        backgroundColor: '#FFDE67',
        marginLeft: '-30px',
        display: 'flex',
        height: '50px',
        border: '10px solid #F5A200',
        borderTopRightRadius: '30px',
        borderTopLeftRadius: '30px',
        marginTop: '-30px'
      }}>
        <h1 style={{fontSize: '20px', fontFamily: "'Radio Canada', sans-serif", color: '#F5A200', marginLeft: 'auto'}}>Don't like these questions?</h1>
        <h1 
            style={{fontSize: '20px', fontFamily: "'Radio Canada', sans-serif", color: '#1421FF', cursor: 'pointer', marginLeft: '20px', marginRight: 'auto'}}
            onClick={() => setShowRegenerateDropdown(!showRegenerateDropdown)}
          >
            Regenerate
          </h1>
      </div>
      <h2 style={{color: 'lightgrey', fontSize: '16px', fontWeight: 'normal'}}>Click on a question to edit, Possible answers indicate the most likely student responses, questions that have various answers should have etc at the end. Ex- cats,dogs,hamsters, etc.</h2>
      <div ref={containerRef} style={{ height: '400px', overflowY: 'auto' , width: '880px', marginRight: 'auto', marginLeft: 'auto'}}>
        {questionsWithIds.map((question, index) => (
          <div key={index} style={{ 
            padding: '10px', 
            marginTop: '20px',
            border: '0px solid lightgrey', 
            borderRadius: '10px', 
            width: '700px', 
            marginLeft: '50px', 
            
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
           <div style={{
  width: '100%', 
  borderRadius: '10px', 
  display: 'flex',
  position: 'relative',
  alignItems: 'flex-start', // Changed to 'flex-start'
  marginBottom: '10px',
}}>
  <h1 style={{marginRight: '20px', marginTop: '15px'}}>{index + 1}.</h1>
  <div style={{display: 'flex', alignItems: 'stretch', marginLeft: '0px'}}>
    <button
      onClick={() => handleChangeDifficulty(index)}
      style={{
        background: difficultyColors[question.difficulty],
        border: '0px solid transparent',
        fontWeight: 'bold',
        color: 'white',
        zIndex: '100',
        fontSize: '25px',
        borderRadius: '10px',
        borderTopRightRadius: '0px',
        borderBottomRightRadius: '0px',
        padding: '15px',
        textAlign: 'center',
        width: '120px',
        fontFamily: "'Radio Canada', sans-serif",
        cursor: 'pointer',
        height: textareaHeight[index] ? `${parseInt(textareaHeight[index]) + 34}px` : 'auto', // Use the stored height
        minHeight: '56px', // Minimum height for single line
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {question.difficulty}
    </button>
  </div>

  <TextareaAutosize
    style={{
      border: `2px solid ${difficultyColors[question.difficulty]}`, 
      padding: '15px',
      fontFamily: "'Radio Canada', sans-serif",
      fontWeight: 'bold',
      fontSize: '18px',
      background: 'rgb(255,255,255,.01)',
      backdropFilter: 'blur(5px)',
      borderRadius: '10px',
      borderTopLeftRadius: '0px',
      borderBottomLeftRadius: '0px',
      width: '100%',
      resize: 'none',
      overflow: 'hidden',
      minRows: '1', // Adjust this value as needed
    }}
    value={question.question}
    onChange={(e) => handleEditQuestion(index, 'question', e.target.value)}
    onHeightChange={(height) => updateTextareaHeight(index, height)}
    minRows={1}
  />

              <button 
                onClick={() => handleDeleteQuestion(index)}
                style={{position: 'absolute', right: '-14px', top: '-10px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer'}}
              >
                <img style={{width: '30px'}} src='/redcirclex.png' alt="Delete"/>
              </button>
            </div>
            {showRegenerateDropdown && (
          <div style={{
            backgroundColor: '#A3F2ED',
            padding: '10px',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
          }}>
            <input
              type="text"
              value={regenerateInput}
              onChange={(e) => setRegenerateInput(e.target.value)}
              placeholder="Enter additional instructions..."
              style={{
                width: '80%',
                padding: '10px',
                margin: '10px 0',
                borderRadius: '5px',
                border: '1px solid #F5A200',
              }}
            />
            <button
              onClick={handleRegenerateSubmit}
              style={{
                padding: '10px 20px',
                backgroundColor: '#48A49E',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontFamily: "'Radio Canada', sans-serif",
                fontWeight: 'bold',
              }}
            >
              Regenerate
            </button>
          </div>
        )}



            <div style={{display: 'flex', alignItems: 'center', marginLeft: '50px', position: 'relative', }}>
              <img style={{width: '50px', height: '31px', marginRight: '20px',marginLeft: '100px', marginTop: '-10px'}} src='/greydownrightarrow.png' alt="Arrow"/>
              <TextareaAutosize
                style={{
                  width: '480px',
                  border: '2px solid lightgrey',
               
                  padding: '15px',
                  borderRadius: '10px',
                  fontFamily: "'Radio Canada', sans-serif",
                  resize: 'none',
                  overflow: 'hidden'
                }}
                value={`Probable answer: ${question.expectedResponse}`}
                onChange={(e) => handleEditQuestion(index, 'expectedResponse', e.target.value.replace('Probable answer: ', ''))}
                minRows={1}
              />
            </div>
            
          </div>
        ))}
      </div>
      <button
        onClick={handleAddQuestion}
        style={{
          position: 'fixed',
          bottom: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 40px',
          backgroundColor: '#A6FFAF',
          color: '#009006',
          width: '300px',
          border: '4px solid #009006',
          borderRadius: '10px',
          fontFamily: "'Radio Canada', sans-serif",
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '20px'
        }}
      >
        Add Question
      </button>
    </div>
  );
};

export default TeacherPreviewASAQ;