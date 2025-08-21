import React, { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import axios from 'axios';
import ConfirmationModal from '../../Universal/ConfirmationModal';

import { v4 as uuidv4 } from 'uuid'; // Add this import at the top

import { SquareX, CornerDownRight, Repeat, SquarePlus, Clipboard, ClipboardMinus, ClipboardList, SquareArrowLeft, Eye, ArrowLeft, X } from 'lucide-react';
import { GlassContainer } from '../../../styles';
const TeacherPreview = ({ questionsWithIds, setQuestionsWithIds, sourceText, questionCount, classId, teacherId }) => {
  const containerRef = useRef(null);
  const [showRegenerateDropdown, setShowRegenerateDropdown] = useState(false);
  const [regenerateInput, setRegenerateInput] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, index: null });

  const handleDeleteQuestion = (index) => {
    setDeleteConfirmation({ show: true, index });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.index !== null) {
      const newQuestions = questionsWithIds.filter((_, index) => index !== deleteConfirmation.index);
      setQuestionsWithIds(newQuestions);
      setDeleteConfirmation({ show: false, index: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, index: null });
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
    <>

    <div style={{
  
      zIndex: '10',
      position: 'absolute',  top:'-120px',  left:' 50%', transform: 'translatex(-50%) ',fontFamily: "'montserrat', sans-serif",

    }}>
          {deleteConfirmation.show && (
      <ConfirmationModal
        title="Delete Question"
        message={`Are you sure you want to delete question ${deleteConfirmation.index + 1}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        confirmVariant="red"
      />
    )}
    <GlassContainer
    
    contentStyle={{    width: '700px',
      height: '500px',
      
      padding: '30px',
      
      }}>
        <div
        style={{
          display: 'flex',
          marginTop: '-20px',
          width: '760px',
          marginLeft:'-30px',
          position: 'relative',
        
        }}
      >

        <h1
          style={{
            marginLeft: '60px',
            fontFamily: "'montserrat', sans-serif",
            color: 'black',
            fontWeight: '400',
            fontSize: '1.5rem',
            display: 'flex',
            marginTop: '10px',
          }}
        >
         <Eye size={30} strokeWidth={1.5} style={{marginLeft: '-20px', marginRight: "20px", }}/> Question Preview{' '}
        </h1>
      </div>






      {showRegenerateDropdown && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          position: 'absolute',
          zIndex:'101',
          width: 'calc(100% - 40px)',
          marginLeft: '-30px',
          marginTop: '0px',
               boxShadow: '1px 1px 5px 1px rgb(0,0,155,.07)' ,
          borderTop: '0px solid white',
          borderRadius: '0px 0px 20px 20px',
          height: '420px'
        }}>

          <TextareaAutosize
            type="text"
            value={regenerateInput}
            onChange={(e) => setRegenerateInput(e.target.value)}
            placeholder="Enter general adjustments you want made to questions"
            style={{
              width: '600px',
              marginLeft: '50px',
              height:'200px',
              marginRight: '40px',marginTop:'40px',
              padding: '10px',
              fontFamily: "'montserrat', sans-serif",
            fontSize: '16px',
              borderRadius: '5px',
              fontWeight: '600',
              border: '1px solid lightgrey',
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
              marginLeft: '-10px',
                marginTop: "5px",
                border: '1px solid #D800FB',
                lineHeight: '30px',
                borderRadius: '8px',
                height: '40px',
                fontFamily: "'montserrat', sans-serif",
                cursor: 'pointer',
                fontWeight: 'bold',
                display:'flex',
                fontSize: '16px',
              
              position: 'absolute', 
              top: '300px',
              left: '80px',
            }}
          >
               <Repeat style={{marginLeft: '-10px', marginRight: '10px', marginTop: '3px'}}/>
       
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
              top: '40px',
              left: '10px', 
            }}
          >
            <ArrowLeft size={25}/>
          </button>
        </div>
      )}












<div style={{display: 'flex', position: 'absolute', right: '20px' , top: '20px',  marginBottom: '20px', }}>
    
        <button
        onClick={handleAddQuestion}
        style={{
        
          padding: '5px 15px',
          color: 'grey',
          background: 'white',
          display: 'flex',
          marginLeft: 'auto',
          marginTop: "5px",
          border: '1px solid lightgrey',
          lineHeight: '20px',
          borderRadius: '20px',
          height: '30px',
          fontFamily: "'montserrat', sans-serif",
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '.8rem'
        }}
      >
        
        Add Question +
      </button>
      <div 
          style={{ padding: '5px 20px',
            backgroundColor: 'white',
            color: 'grey',
          marginLeft: '20px',
            marginTop: "5px",
            border: '1px solid lightgrey',
            lineHeight: '20px',
            borderRadius: '20px',
            height: '20px',
            fontFamily: "'montserrat', sans-serif",
            cursor: 'pointer',
            fontWeight: '500',
            display:'flex',
            fontSize: '.8rem'}}
          
          
          
          onClick={() => setShowRegenerateDropdown(!showRegenerateDropdown)}
        >
          <Repeat size={15} style={{ marginRight: '10px', marginTop: '3px'}}/>
          Regenerate
        </div>


         

        </div> 
      
      
 <h2 style={{color: 'grey', fontSize: '.9rem', fontWeight: '400', width: '300px',  marginTop:'-5px' }}>Click to edit Questions and rubrics, </h2>




      
        <div ref={containerRef} style={{ height: '400px', overflowY: 'auto', width: '760px', marginLeft: '-40px' }}>
        {questionsWithIds.map((question, index) => (
          <div key={index} style={{ 
            padding: '0px', 
            marginTop: '15px',
            marginBottom: '15px',
            borderBottom: '2px solid #f4f4f4', 
            width: '670px', 
            marginLeft: '30px', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              width: '650px', 
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
                fontSize: '1rem',
                fontWeight: '400',
                alignSelf: 'stretch',
              }}>
             {index + 1}.
              </div>
              <TextareaAutosize
                style={{
                  border: '4px solid white',
                  padding: '15px',
                  paddingRight: '8%',
                  fontFamily: "'montserrat', sans-serif",
                  fontWeight: '500',
                  fontSize: '1rem',
                  outline: 'none',
                  borderRadius: '0px 10px 10px 0px',
                  width: '500px',
                  resize: 'none',
                  lineHeight: '1.2', // Add this to control line height
                }}
                value={question.question}
                onChange={(e) => handleEditQuestion(index, 'question', e.target.value)}
                minRows={1}
              />

      
      <button 
                onClick={() => handleDeleteQuestion(index)}
                style={{position: 'absolute', right: '-40px', 
                  top: '50%',
                  transform: 'translateY(-50%)', fontSize: '20px', 
     
            
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
                <X  color="#e60000" strokeWidth={2} size={20}/></div>
          
              </button>
            </div>
        
            
            {(
              <div style={{display: 'flex', alignItems: 'center', marginLeft: '-80px', position: 'relative', marginBottom: '20px'}}>
                <div style={{marginLeft: '100px'}}>
                  <CornerDownRight size={40} color="#c9c9c9" strokeWidth={1} />
                </div>
                <div style={{  width: '30px', 
                padding: ' 0px 10px', 
                borderRight: '1px solid #ddd', 
                color: 'grey', 
                zIndex: '10', 
                marginLeft: '20px',
                borderRadius: '10px 0px 0px 10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'stretch',
                }}> 

                  <ClipboardList style={{margin: 'auto'}} size={30} strokeWidth={1.5}/>
                </div>
                <TextareaAutosize
                  style={{
                    width: '500px',
                    border: 'none',
                    padding: '15px',
                    fontWeight: '400',
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
      
    </GlassContainer>
    </div>
    </>
  );
};

export default TeacherPreview;