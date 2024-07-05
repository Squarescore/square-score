import React, { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

const TeacherPreview = ({ questionsWithIds, setQuestionsWithIds, onRegenerate }) => {
  const containerRef = useRef(null);
  const [showRegenerateDropdown, setShowRegenerateDropdown] = useState(false);
  const [regenerateInput, setRegenerateInput] = useState('');
  const handleDeleteQuestion = (indexToDelete) => {
    const newQuestions = questionsWithIds.filter((_, index) => index !== indexToDelete);
    setQuestionsWithIds(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      questionId: `newQuestion${questionsWithIds.length}`,
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
        backgroundColor: '#A3F2ED',
        marginLeft: '-30px',
        display: 'flex',
        height: '50px',
        border: '10px solid #48A49E',
        borderTopRightRadius: '30px',
        borderTopLeftRadius: '30px',
        marginTop: '-30px'
      }}>
        <h1 style={{fontSize: '20px', fontFamily: "'Radio Canada', sans-serif", color: '#48A49E', marginLeft: 'auto'}}>Don't like these questions?</h1>
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
              alignItems: 'center',
              marginBottom: '10px',
            }}>
              <h1 style={{marginRight: '20px', marginTop: '15px'}}>{index + 1}.</h1>
              <TextareaAutosize
                style={{
                  border: '2px solid lightgrey',
                  padding: '15px',
                  fontFamily: "'Radio Canada', sans-serif",
                  fontWeight: 'bold',
                  fontSize: '18px',
                  background: 'rgb(255,255,255,.01)',
                  backdropFilter: 'blur(5px)',
                  borderRadius: '10px',
                  width: '100%',
                  resize: 'none',
                  overflow: 'hidden'
                }}
                value={question.question}
                onChange={(e) => handleEditQuestion(index, 'question', e.target.value)}
                minRows={1}
              />
              <button 
                onClick={() => handleDeleteQuestion(index)}
                style={{position: 'absolute', right: '-10px', top: '-5px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer'}}
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
                border: '1px solid #48A49E',
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

export default TeacherPreview;