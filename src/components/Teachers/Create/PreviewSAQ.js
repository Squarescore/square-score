import React, { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import axios from 'axios';

import { v4 as uuidv4 } from 'uuid'; // Add this import at the top

import { SquareX, CornerDownRight, Repeat, SquarePlus, Clipboard, ClipboardMinus, ClipboardList, SquareArrowLeft } from 'lucide-react';
const TeacherPreview = ({ questionsWithIds, setQuestionsWithIds, sourceText, questionCount, classId, teacherId }) => {
  const containerRef = useRef(null);
  const [showRegenerateDropdown, setShowRegenerateDropdown] = useState(false);
  const [regenerateInput, setRegenerateInput] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleDeleteQuestion = (indexToDelete) => {
    const newQuestions = questionsWithIds.filter((_, index) => index !== indexToDelete);
    setQuestionsWithIds(newQuestions);
  };
  const [showRubrics, setShowRubrics] = useState({});

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
      questionId: uuidv4(),
      question: "New question",
      rubric: "New Rubric"
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
  const toggleRubric = (index) => {
    setShowRubrics(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
      height: '550px',
      marginTop: '80px',
      border: '10px solid white',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' ,
      background: 'RGB(255,255,255,)',
      backdropFilter: 'blur(5px)',
      borderRadius: '20px',
      padding: '20px',
      marginLeft: 'auto',
      marginRight: 'auto',
      position: 'relative',
    }}>
      <div style={{
        width: '940px',
        backgroundColor: '#FCD3FF',
        marginLeft: '-30px',
        display: 'flex',
        height: '60px',
        border: '10px solid #D800FB',
        borderTopRightRadius: '20px',
        borderTopLeftRadius: '20px',
        marginTop: '-30px'
      }}>
        <h1 style={{fontSize: '40px', fontFamily: "'montserrat', sans-serif", color: '#D800FB', marginLeft: '40px',marginTop: '5px', }}>Question Bank</h1>
       
      </div>
      {showRegenerateDropdown && (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          position: 'absolute',
          zIndex:'101',
          width: 'calc(100% - 20px)',
          marginLeft: '-30px',
          marginTop: '0px',
          border: '10px solid white',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' ,
          borderTop: '0px solid white',
          borderRadius: '0px 0px 20px 20px',
          height: '490px'
        }}>

          <h1 style={{marginLeft: '90px', marginTop:'60px'}}>Regenerate</h1>
          <TextareaAutosize
            type="text"
            value={regenerateInput}
            onChange={(e) => setRegenerateInput(e.target.value)}
            placeholder="Enter general adjustments you want made to questions"
            style={{
              width: '700px',
              marginLeft: '90px',
              height:'100px',
              marginRight: '40px',
              padding: '10px',
              fontFamily: "'montserrat', sans-serif",
            fontSize: '25px',
              borderRadius: '5px',
              fontWeight: '600',
              border: '2px solid lightgrey',
            }}
            minRows={4}
          />
          <button
            onClick={handleRegenerateSubmit}
            disabled={isRegenerating}
            style={{
             
              padding: '5px 20px',
                backgroundColor: '#FBD3FF',
                color: '#D800FB',
              marginLeft: '20px',
                marginTop: "5px",
                border: '4px solid #D800FB',
                lineHeight: '20px',
                borderRadius: '8px',
                height: '40px',
                fontFamily: "'montserrat', sans-serif",
                cursor: 'pointer',
                fontWeight: 'bold',
                display:'flex',
                fontSize: '16px',
              
              position: 'absolute', 
              top: '70px',
              left: '80px',
            }}
          >
               <Repeat style={{marginLeft: '-10px', marginRight: '10px', marginTop: '-2px'}}/>
       
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
          <button
            onClick={handleNevermind}
            style={{
              backgroundColor: 'white',
              border: '0px solid lightgrey',
              color: 'grey',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: "'montserrat', sans-serif",
              fontWeight: 'bold',
              position: 'absolute', 
              top: '220px',
              left: '10px', 
            }}
          >
            <SquareArrowLeft size={50}/>
          </button>
        </div>
      )}




<div style={{display: 'flex', width: '840px', marginLeft: '20px', marginRight: 'auto', marginTop: '20px',  marginBottom: '20px'}}>
      <h2 style={{color: 'lightgrey', fontSize: '16px', fontWeight: 'bold', width: '300px',  }}>Click to edit Questions and rubrics, </h2>
  
        <button
        onClick={handleAddQuestion}
        style={{
        
          padding: '5px 20px',
          backgroundColor: '#A6FFAF',
          color: '#2BB514',
          width: '190px',
          display: 'flex',
          marginLeft: 'auto',
          marginTop: "5px",
          border: '4px solid #2BB514',
          lineHeight: '24px',
          borderRadius: '8px',
          height: '40px',
          fontFamily: "'montserrat', sans-serif",
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        
        <SquarePlus style={{marginLeft: '-15px', marginRight: '10px', marginTop: '0px'}}/>
        Add Question
      </button>
      <div 
          style={{ padding: '5px 20px',
            backgroundColor: '#FBD3FF',
            color: '#D800FB',
          marginLeft: '20px',
            marginTop: "5px",
            border: '4px solid #D800FB',
            lineHeight: '20px',
            borderRadius: '8px',
            height: '20px',
            fontFamily: "'montserrat', sans-serif",
            cursor: 'pointer',
            fontWeight: 'bold',
            display:'flex',
            fontSize: '16px'}}
          
          
          
          onClick={() => setShowRegenerateDropdown(!showRegenerateDropdown)}
        >
          <Repeat style={{marginLeft: '-10px', marginRight: '10px', marginTop: '-3px'}}/>
          Regenerate
        </div>
        </div> 
      
      
        <div ref={containerRef} style={{ height: '400px', overflowY: 'auto', width: '930px', marginLeft: '-40px' }}>
        {questionsWithIds.map((question, index) => (
          <div key={index} style={{ 
            padding: '0px', 
            marginTop: '15px',
            marginBottom: '15px',
            borderBottom: '2px solid #f4f4f4', 
            width: '820px', 
            marginLeft: '50px', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              width: '820px', 
              borderRadius: '10px', 
              display: 'flex',
              fontSize: '12px',
              position: 'relative',
              marginBottom: '10px', 
            }}>
              <div style={{
                marginRight: '-4px',
                zIndex: '1',
                background: 'white',
                color: 'black',
                padding: '6px 8px',
                border: '4px solid white',
                borderRadius: '10px 0px 0px 10px',
                display: 'flex',
                alignItems: 'center',
                alignSelf: 'stretch',
              }}>
                <h1 style={{ margin: 'auto' }}>{index + 1}.</h1>
              </div>
              <TextareaAutosize
                style={{
                  border: '4px solid white',
                  padding: '15px',
                  paddingRight: '8%',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '600',
                  fontSize: '20px',
                  borderRadius: '0px 10px 10px 0px',
                  width: '580px',
                  resize: 'none',
                  lineHeight: '1.2', // Add this to control line height
                }}
                value={question.question}
                onChange={(e) => handleEditQuestion(index, 'question', e.target.value)}
                minRows={1}
              />

      <button
        onClick={() => toggleRubric(index)}
        style={{
          position: 'absolute',
          right: '70px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '20px', 
          background: '#f4f4f4',
          border: '0px solid lightgrey',
          borderRadius: '8px',
          height: '40px',
          width: '40px',
          color: 'grey'
        }}
      >
        {showRubrics[index] ? (
          <ClipboardMinus style={{marginLeft: '-2px', marginTop: '2px'}}/>
        ) : (
          <ClipboardList style={{marginLeft: '-2px', marginTop: '2px'}}/>
        )}
      </button>
      <button 
                onClick={() => handleDeleteQuestion(index)}
                style={{position: 'absolute', right: '0px', top: '15px', fontSize: '20px', 
     
            
                  zIndex: '10',
                  height: '30px', 
                  width: '30px',
                  borderRadius: '6px',
                  background: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  
                }}
              >
                <div style={{marginTop: '-2px', marginLeft: '-4px', }}>
                <SquareX size={30} color="#e60000" strokeWidth={2} /></div>
          
              </button>
            </div>
        
            
            {showRubrics[index] && (
              <div style={{display: 'flex', alignItems: 'center', marginLeft: '-80px', position: 'relative', marginBottom: '20px'}}>
                <div style={{marginLeft: '100px'}}>
                  <CornerDownRight size={40} color="#c9c9c9" strokeWidth={3} />
                </div>
                <div style={{  width: '30px', 
                padding: '8px', 
                background: '#f4f4f4', 
                border: '4px solid lightgrey', 
                color: 'grey', 
                zIndex: '10', 
                marginLeft: '20px',
                borderRadius: '10px 0px 0px 10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'stretch',
                }}> 

                  <ClipboardList style={{margin: 'auto'}}size={30}/>
                </div>
                <TextareaAutosize
                  style={{
                    width: '585px',
                    border: '4px solid #F4F4F4',
                    padding: '15px',
                    fontWeight: '600',
                    color: 'grey',
                    outline: 'none',
                    marginLeft: '-4px',
                    borderRadius: ' 0px 10px 10px 0px',
                    fontFamily: "'montserrat', sans-serif",
                    resize: 'none',
                  }}
                  value={`${question.rubric}`}
                  onChange={(e) => handleEditQuestion(index, 'rubric', e.target.value.replace('Probable answer: ', ''))}
                  minRows={1}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherPreview;