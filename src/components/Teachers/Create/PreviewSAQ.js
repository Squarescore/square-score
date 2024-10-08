import React, { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import axios from 'axios';
import { SquareX, CornerDownRight } from 'lucide-react';
const TeacherPreview = ({ questionsWithIds, setQuestionsWithIds, sourceText, questionCount, classId, teacherId }) => {
  const containerRef = useRef(null);
  const [showRegenerateDropdown, setShowRegenerateDropdown] = useState(false);
  const [regenerateInput, setRegenerateInput] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleDeleteQuestion = (indexToDelete) => {
    const newQuestions = questionsWithIds.filter((_, index) => index !== indexToDelete);
    setQuestionsWithIds(newQuestions);
  };

  const regenerateQuestionsFirebase = async (questions, additionalInstructions) => {
    setIsRegenerating(true);
    try {
      const response = await axios.post('https://us-central1-square-score-ai.cloudfunctions.net/RegenerateSAQ', {
        sourceText,
        questionCount,
        QuestionsPreviouslyGenerated: JSON.stringify(questions),
        instructions: additionalInstructions,
        classId,
        teacherId
      });
  
      // Preserve original questionIds
      const regeneratedQuestions = response.data.questions.map((newQuestion, index) => ({
        ...newQuestion,
        questionId: questions[index] ? questions[index].questionId : `newQuestion${index}`
      }));
  
      return regeneratedQuestions;
    } catch (error) {
      console.error('Error regenerating questions:', error);
      throw error;
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const handleRegenerateSubmit = async () => {
    try {
      const regeneratedQuestions = await regenerateQuestionsFirebase(questionsWithIds, regenerateInput);
      setQuestionsWithIds(regeneratedQuestions);
      setRegenerateInput('');
      setShowRegenerateDropdown(false);
    } catch (error) {
      console.error('Error regenerating questions:', error);
      // Optionally, show an error message to the user
    }
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
      const approximateQuestionHeight = 150;
      
      insertIndex = Math.floor((scrollPosition + containerHeight / 2) / approximateQuestionHeight);
      insertIndex = Math.min(insertIndex, questionsWithIds.length);
    }

    const newQuestions = [
      ...questionsWithIds.slice(0, insertIndex),
      newQuestion,
      ...questionsWithIds.slice(insertIndex)
    ];
    setQuestionsWithIds(newQuestions);

    setTimeout(() => {
      if (containerRef.current) {
        const newQuestionElement = containerRef.current.children[insertIndex];
        if (newQuestionElement) {
          newQuestionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 0);
  };


  const handleEditQuestion = (index, field, value) => {
    const newQuestions = [...questionsWithIds];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestionsWithIds(newQuestions);
  };

  const handleNevermind = () => {
    setShowRegenerateDropdown(false);
    setRegenerateInput('');
  };

  return (
    <div style={{
      width: '900px',
      height: '500px',
      marginTop: '-20px',
      border: '10px solid #f4f4f4',
      background: 'RGB(255,255,255,.95)',
      backdropFilter: 'blur(5px)',
      borderRadius: '20px',
      padding: '20px',
      marginLeft: 'auto',
      marginRight: 'auto',
      position: 'relative',
    }}>
      <div style={{
        width: '940px',
        backgroundColor: '#92A3FF',
        marginLeft: '-30px',
        display: 'flex',
        height: '70px',
        border: '10px solid #020CFF',
        borderTopRightRadius: '30px',
        borderTopLeftRadius: '30px',
        marginTop: '-30px'
      }}>
        <h1 style={{fontSize: '30px', fontFamily: "'montserrat', sans-serif", color: '#020CFF', marginLeft: '80px',marginTop: '15px', }}>Don't like these questions?</h1>
        <h1 
          style={{fontSize: '30px', fontFamily: "'montserrat', sans-serif", color: 'white', cursor: 'pointer', marginLeft: '20px', marginTop: '15px', marginRight: 'auto'}}
          onClick={() => setShowRegenerateDropdown(!showRegenerateDropdown)}
        >
          Regenerate
        </h1>
      </div>
      {showRegenerateDropdown && (
        <div style={{
          backgroundColor: '#A3F2ED',
          padding: '10px',
          position: 'absolute',
          zIndex:'100',
          width: 'calc(100% - 20px)',
          marginLeft: '-30px',
          marginTop: '-90px',
          border: '10px solid #48A49E',
          borderTop: '10px solid #48A49E',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
        }}>
          <input
            type="text"
            value={regenerateInput}
            onChange={(e) => setRegenerateInput(e.target.value)}
            placeholder="Enter general adjustments you want made to questions..."
            style={{
              width: '400px',
              marginLeft: '150px',
              marginRight: '40px',
              padding: '10px',
              fontFamily: "'montserrat', sans-serif",
              margin: '10px 0',
              borderRadius: '5px',
              border: '1px solid #48A49E',
            }}
          />
          <button
            onClick={handleRegenerateSubmit}
            disabled={isRegenerating}
            style={{
              padding: '10px 20px',
              backgroundColor: isRegenerating ? '#A0A0A0' : '#A3F2ED'
              ,
              color: isRegenerating ? 'white' : ' #48A49E',
              border: isRegenerating ? '#A0A0A0' : '4px solid #48A49E',
              borderRadius: '10px',
              cursor: isRegenerating ? 'not-allowed' : 'pointer',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: 'bold',
              marginRight: '10px',
            }}
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
          <button
            onClick={handleNevermind}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f4f4f4',
              border: '4px solid lightgrey',
              color: 'grey',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: 'bold',
            }}
          >
            Nevermind
          </button>
        </div>
      )}
      <h2 style={{color: 'lightgrey', fontSize: '16px', fontWeight: 'normal', width: '780px',marginLeft: 'auto', marginRight: 'auto', }}>Click on a question to edit. Possible answers indicate the most likely student responses; questions that have various answers should have etc at the end. Ex- cats, dogs, hamsters, etc.</h2>
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
                  fontFamily: "'montserrat', sans-serif",
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
                style={{position: 'absolute', right: '-10px', top: '-0px', fontSize: '20px', 
     
            
                  zIndex: '990',
                  height: '30px', 
                  width: '30px',
                  borderRadius: '6px',
                  background: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  
                }}
              >
                <div style={{marginTop: '-2px', marginLeft: '-4px', }}>
                <SquareX size={30} color="#e60000" strokeWidth={3} /></div>
          
              </button>
            </div>
            
            <div style={{display: 'flex', alignItems: 'center', marginLeft: '50px', position: 'relative', }}>
           
           <div style={{marginLeft: '100px'}}>

           <CornerDownRight size={40} color="#c9c9c9" strokeWidth={3} />
            </div>
              <TextareaAutosize
                style={{
                  width: '480px',
                  border: '2px solid lightgrey',
                  padding: '15px',
                  marginLeft: '30px',
                  borderRadius: '10px',
                  fontFamily: "'montserrat', sans-serif",
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
          bottom: '-90px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 40px',
          backgroundColor: '#A6FFAF',
          color: '#2BB514',
          width: '300px',
          border: '4px solid #2BB514',
          borderRadius: '10px',
          fontFamily: "'montserrat', sans-serif",
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